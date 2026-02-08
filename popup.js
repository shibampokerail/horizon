const DEFAULTS = {
  resistanceGrowth: 0.00008,
  maxResistance: 0.999,
  recoveryRate: 2.5,
  blockKeyboard: true,
  blockScrollbar: true,
  enableEasterEgg: true,
  easterEggThreshold: 120000
};

// Load current settings
chrome.storage.sync.get(DEFAULTS, (settings) => {
  document.getElementById('resistanceGrowth').value = settings.resistanceGrowth;
  document.getElementById('maxResistance').value = settings.maxResistance;
  document.getElementById('recoveryRate').value = settings.recoveryRate;
  document.getElementById('blockKeyboard').checked = settings.blockKeyboard;
  document.getElementById('blockScrollbar').checked = settings.blockScrollbar;
  document.getElementById('enableEasterEgg').checked = settings.enableEasterEgg;
  
  updateDisplayValues();
});

// Update displayed values
function updateDisplayValues() {
  const resistance = document.getElementById('resistanceGrowth').value;
  const maxResist = document.getElementById('maxResistance').value;
  const recovery = document.getElementById('recoveryRate').value;
  
  document.getElementById('resistanceValue').textContent = parseFloat(resistance).toFixed(5);
  document.getElementById('maxResistanceValue').textContent = (maxResist * 100).toFixed(1) + '%';
  document.getElementById('recoveryValue').textContent = recovery + 'x';
}

// Live updates
document.querySelectorAll('input[type="range"]').forEach(input => {
  input.addEventListener('input', updateDisplayValues);
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    resistanceGrowth: parseFloat(document.getElementById('resistanceGrowth').value),
    maxResistance: parseFloat(document.getElementById('maxResistance').value),
    recoveryRate: parseFloat(document.getElementById('recoveryRate').value),
    blockKeyboard: document.getElementById('blockKeyboard').checked,
    blockScrollbar: document.getElementById('blockScrollbar').checked,
    enableEasterEgg: document.getElementById('enableEasterEgg').checked,
    easterEggThreshold: 1200000
  };
  
  chrome.storage.sync.set(settings, () => {
    const btn = document.getElementById('save');
    btn.textContent = '✓ Saved!';
    btn.style.background = '#5cb85c';
    setTimeout(() => {
      btn.textContent = 'Save Settings';
      btn.style.background = '';
    }, 1500);
  });
});

// Reset to defaults
document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.set(DEFAULTS, () => {
    location.reload();
  });
});