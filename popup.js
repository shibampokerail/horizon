document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const tabButtons = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  const saveBtn = document.getElementById('save');
  
  // Default Config
  const DEFAULTS = {
    gravitationalPull: 0.00008,
    singularityStrength: 0.999,
    hawkingRadiation: 2.5,
    eventHorizonEnabled: true,
    blockKeyboard: true,
    blockScrollbar: true,
    targetSites: [] // Will load from storage
  };

  let currentSettings = { ...DEFAULTS };
  let siteStats = {};

  // --- 1. Initialization ---
  loadData();

  function loadData() {
    // Load Settings
    chrome.storage.sync.get(DEFAULTS, (data) => {
      currentSettings = data;
      // If targetSites is somehow empty (first run edge case), reload to get defaults from background
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

  // --- 2. Tab Navigation ---
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
      
      if (btn.dataset.tab === 'sites') {
        loadStats(); // Refresh stats when opening tab
      }
    });
  });

  // --- 3. Sites Management ---
  function renderSitesTable() {
    const tbody = document.getElementById('sitesTableBody');
    tbody.innerHTML = '';

    currentSettings.targetSites.forEach((pattern, index) => {
      const tr = document.createElement('tr');
      
      // Clean up pattern for display (remove *://*. and /*)
      let displayName = pattern
        .replace(/^\*:\/\/\*\./, '')  // Remove prefix
        .replace(/\/\*$/, '');         // Remove suffix
      
      const ms = siteStats[pattern] || 0;
      
      tr.innerHTML = `
        <td>
          <div style="font-weight:500;">${displayName}</div>
          <div style="font-size:10px; color:rgba(255,255,255,0.4);">${pattern}</div>
        </td>
        <td style="color: ${ms > 0 ? '#ff6b6b' : '#666'}; font-family:monospace;">
          ${formatTime(ms)}
        </td>
        <td>
          <button class="delete-btn" data-index="${index}">×</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Delete handlers
    tbody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index);
        currentSettings.targetSites.splice(idx, 1);
        saveSettings();
        // Don't remove stats for that site, just the target match
        renderSitesTable();
      });
    });
  }

  // Formatting Time
  function formatTime(ms) {
    if (!ms) return '0s';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  // Add Site Input Logic
  document.getElementById('addSiteBtn').addEventListener('click', () => {
    const input = document.getElementById('newSiteInput');
    const rawDomain = input.value.trim();
    
    if (!rawDomain) return;

    // Convert "reddit.com" -> "*://*.reddit.com/*"
    // 1. Remove http/https/www
    let cleanDomain = rawDomain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0];
    
    // 2. Wrap in wildcards
    const pattern = `*://*.${cleanDomain}/*`;

    if (!currentSettings.targetSites.includes(pattern)) {
      currentSettings.targetSites.push(pattern);
      saveSettings();
      renderSitesTable();
      input.value = '';
    }
  });

  // Add Active Tab Logic
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
          // Visual confirmation
          const btn = document.getElementById('addCurrentSiteBtn');
          const originalText = btn.innerText;
          btn.innerText = "Added!";
          setTimeout(() => btn.innerText = originalText, 1000);
        }
      }
    });
  });

  // --- 4. Settings Logic ---
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
  }

  function updateDisplayValues() {
    document.getElementById('gravitationalValue').textContent = parseFloat(document.getElementById('gravitationalPull').value).toFixed(5);
    document.getElementById('singularityValue').textContent = (document.getElementById('singularityStrength').value * 100).toFixed(1) + '%';
    document.getElementById('hawkingValue').textContent = document.getElementById('hawkingRadiation').value + 'x';
  }

  // Event Listeners for UI
  document.getElementById('eventHorizonToggle').addEventListener('click', () => {
    document.getElementById('eventHorizonContent').classList.toggle('open');
  });

  document.querySelectorAll('input[type="range"]').forEach(el => {
    el.addEventListener('input', updateDisplayValues);
  });

  saveBtn.addEventListener('click', () => {
    // Gather values
    currentSettings.gravitationalPull = parseFloat(document.getElementById('gravitationalPull').value);
    currentSettings.singularityStrength = parseFloat(document.getElementById('singularityStrength').value);
    currentSettings.hawkingRadiation = parseFloat(document.getElementById('hawkingRadiation').value);
    currentSettings.eventHorizonEnabled = document.getElementById('eventHorizonEnabled').checked;
    currentSettings.blockKeyboard = document.getElementById('blockKeyboard').checked;
    currentSettings.blockScrollbar = document.getElementById('blockScrollbar').checked;

    saveSettings();
    
    // Feedback
    saveBtn.textContent = 'Saved!';
    saveBtn.style.background = '#4ecdc4';
    saveBtn.style.color = '#000';
    setTimeout(() => {
      saveBtn.textContent = 'Apply';
      saveBtn.style.background = '';
      saveBtn.style.color = '';
    }, 1500);
  });

  function saveSettings() {
    chrome.storage.sync.set(currentSettings);
  }
});