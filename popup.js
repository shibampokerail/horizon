document.addEventListener('DOMContentLoaded', () => {
  // --- UI Elements ---
  const tabButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const saveBtn = document.getElementById('save');
  const statusText = document.getElementById('statusText');
  const masterSwitch = document.getElementById('eventHorizonEnabled');
  const physicsCard = document.getElementById('physicsCard');


  const modal = document.getElementById('helpModal');
  const helpBtn = document.getElementById('helpBtn');
  const closeBtn = document.getElementById('closeHelpBtn');

  helpBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  const DEFAULTS = {
    gravitationalPull: 0.00008,
    singularityStrength: 0.999,
    hawkingRadiation: 2.5,
    eventHorizonEnabled: true,
    blockKeyboard: true,
    blockScrollbar: true,
    targetSites: []
  };

  let currentSettings = { ...DEFAULTS };
  let siteStats = {};

  // --- 1. Init ---
  loadData();

  function loadData() {
    chrome.storage.sync.get(DEFAULTS, (data) => {
      currentSettings = data;
      // Retry if defaults haven't loaded from bg yet
      if (!currentSettings.targetSites || currentSettings.targetSites.length === 0) {
        setTimeout(loadData, 500); 
        return;
      }
      updateSettingsUI();
      loadStats();
    });
  }

  function loadStats() {
    chrome.storage.local.get(['siteStats'], (data) => {
      siteStats = data.siteStats || {};
      renderSitesTable();
    });
  }

  // --- 2. Master Switch Logic ---
  masterSwitch.addEventListener('change', (e) => {
    updateStatusText(e.target.checked);
    // Dim physics controls if off
    physicsCard.style.opacity = e.target.checked ? '1' : '0.4';
    physicsCard.style.pointerEvents = e.target.checked ? 'all' : 'none';
  });

  function updateStatusText(isEnabled) {
    statusText.textContent = isEnabled ? 'System Operational' : 'Systems Offline';
    statusText.style.color = isEnabled ? 'var(--success)' : 'var(--text-muted)';
  }

  // --- 3. Tab Logic ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      if (btn.dataset.tab === 'sites') loadStats();
    });
  });

  // --- 4. Render Table (New Design) ---
  function renderSitesTable() {
    const tbody = document.getElementById('sitesTableBody');
    tbody.innerHTML = '';

    currentSettings.targetSites.forEach((pattern, index) => {
      const tr = document.createElement('tr');
      
      // Clean display
      let displayName = pattern.replace(/^\*:\/\/\*\./, '').replace(/\/\*$/, '');
      const ms = siteStats[pattern] || 0;
      
      tr.innerHTML = `
        <td width="60%">
          <span class="site-name">${displayName}</span>
          <span class="site-sub">${pattern}</span>
        </td>
        <td width="30%" style="text-align:right">
          <span class="time-badge">${formatTime(ms)}</span>
        </td>
        <td width="10%" style="text-align:right">
          <button class="delete-site" data-index="${index}">×</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delete listeners
    tbody.querySelectorAll('.delete-site').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        currentSettings.targetSites.splice(idx, 1);
        saveSettings();
        renderSitesTable();
      });
    });
  }

  function formatTime(ms) {
    if (!ms) return '0s';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  // --- 5. Inputs Logic (Same as before) ---
  document.getElementById('addSiteBtn').addEventListener('click', () => {
    const input = document.getElementById('newSiteInput');
    const rawDomain = input.value.trim();
    if (!rawDomain) return;
    let cleanDomain = rawDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    const pattern = `*://*.${cleanDomain}/*`;
    if (!currentSettings.targetSites.includes(pattern)) {
      currentSettings.targetSites.push(pattern);
      saveSettings();
      renderSitesTable();
      input.value = '';
    }
  });

  document.getElementById('addCurrentSiteBtn').addEventListener('click', () => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0]?.url) {
        const url = new URL(tabs[0].url);
        const domain = url.hostname.replace(/^www\./, '');
        const pattern = `*://*.${domain}/*`;
        if (!currentSettings.targetSites.includes(pattern)) {
          currentSettings.targetSites.push(pattern);
          saveSettings();
          renderSitesTable();
          const btn = document.getElementById('addCurrentSiteBtn');
          const originalText = btn.innerText;
          btn.innerText = "Target Acquired";
          btn.style.color = "var(--primary)";
          setTimeout(() => { 
            btn.innerText = originalText; 
            btn.style.color = "";
          }, 1000);
        }
      }
    });
  });

  function updateSettingsUI() {
    const els = {
      gravitationalPull: document.getElementById('gravitationalPull'),
      singularityStrength: document.getElementById('singularityStrength'),
      hawkingRadiation: document.getElementById('hawkingRadiation'),
      eventHorizonEnabled: document.getElementById('eventHorizonEnabled'),
      blockKeyboard: document.getElementById('blockKeyboard'),
      blockScrollbar: document.getElementById('blockScrollbar')
    };

    els.gravitationalPull.value = currentSettings.gravitationalPull;
    els.singularityStrength.value = currentSettings.singularityStrength;
    els.hawkingRadiation.value = currentSettings.hawkingRadiation;
    els.eventHorizonEnabled.checked = currentSettings.eventHorizonEnabled;
    els.blockKeyboard.checked = currentSettings.blockKeyboard;
    els.blockScrollbar.checked = currentSettings.blockScrollbar;
    
    updateDisplayValues();
    updateStatusText(currentSettings.eventHorizonEnabled);
    
    // Initial visual state
    physicsCard.style.opacity = currentSettings.eventHorizonEnabled ? '1' : '0.4';
    physicsCard.style.pointerEvents = currentSettings.eventHorizonEnabled ? 'all' : 'none';
  }

  function updateDisplayValues() {
    document.getElementById('gravitationalValue').textContent = parseFloat(document.getElementById('gravitationalPull').value).toFixed(5);
    document.getElementById('singularityValue').textContent = (document.getElementById('singularityStrength').value * 100).toFixed(1) + '%';
    document.getElementById('hawkingValue').textContent = document.getElementById('hawkingRadiation').value + 'x';
  }

  // Listeners
  document.querySelectorAll('input[type="range"]').forEach(el => {
    el.addEventListener('input', updateDisplayValues);
  });

  saveBtn.addEventListener('click', () => {
    currentSettings.gravitationalPull = parseFloat(document.getElementById('gravitationalPull').value);
    currentSettings.singularityStrength = parseFloat(document.getElementById('singularityStrength').value);
    currentSettings.hawkingRadiation = parseFloat(document.getElementById('hawkingRadiation').value);
    currentSettings.eventHorizonEnabled = document.getElementById('eventHorizonEnabled').checked;
    currentSettings.blockKeyboard = document.getElementById('blockKeyboard').checked;
    currentSettings.blockScrollbar = document.getElementById('blockScrollbar').checked;

    saveSettings();
    
    saveBtn.textContent = 'Configuration Saved';
    saveBtn.style.background = 'linear-gradient(135deg, #2ed573 0%, #1fab59 100%)';
    setTimeout(() => {
      saveBtn.textContent = 'Apply Changes';
      saveBtn.style.background = '';
    }, 1500);
  });

  function saveSettings() {
    chrome.storage.sync.set(currentSettings);
  }

  // Full Reset
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Initialize Factory Reset? This will purge all time dilation data.')) {
      chrome.storage.local.clear(() => {
        chrome.storage.sync.clear(() => {
          chrome.storage.session.clear(() => {
            chrome.runtime.reload();
            window.close();
          });
        });
      });
    }
  });
});