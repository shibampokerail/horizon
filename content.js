(() => {
  // ---------------------------------------------------------
  // DEBUG SETTINGS
  const DEBUG_MODE = false; 
  const log = (...args) => DEBUG_MODE && console.log(...args);
  // ---------------------------------------------------------

  log('Horizon: Script loaded');

  const DEFAULTS = {
    gravitationalPull: 0.00008,
    singularityStrength: 0.999,
    hawkingRadiation: 2.5,
    eventHorizonEnabled: true,
    blockKeyboard: true,
    blockScrollbar: true,
    enableEasterEgg: true,
    easterEggThreshold: 140000,
    targetSites: []
  };

  let settings = { ...DEFAULTS };
  let totalScrollDistance = 0;
  let easterEggTriggered = false;
  
  // State flags to manage listeners cleanly
  let isActive = false;
  let isListenersAttached = false;

  // --- 1. CORE CHECKS ---

  function checkIfTargetSite() {
    const currentUrl = window.location.href;
    log('Checking URL:', currentUrl);
    
    if (!settings.targetSites || settings.targetSites.length === 0) return false;

    const matches = settings.targetSites.some(pattern => {
      let regexPattern = pattern
        .replace(/\./g, '\\.')           
        .replace(/\*:\/\/\*\\\./g, '.*://([^/]*\\.)?')  
        .replace(/\*/g, '.*');            
      
      const regex = new RegExp('^' + regexPattern + '$');
      return regex.test(currentUrl);
    });
    
    log('Site match result:', matches);
    return matches;
  }

  // --- 2. ENGINE STATE MANAGEMENT (The Instant Toggle Fix) ---

  function updateEngineState() {
    // 1. Determine if we SHOULD be running
    const isTarget = checkIfTargetSite();
    const shouldBeActive = isTarget && settings.eventHorizonEnabled;

    log(`Engine State Update. Target: ${isTarget}, Enabled: ${settings.eventHorizonEnabled} -> Should Active: ${shouldBeActive}`);

    // 2. Update Global State
    isActive = shouldBeActive;

    // 3. Attach or Detach based on decision
    if (isActive) {
      applyScrollbarBlock();
      attachListeners();
      log('Physics Engine ENGAGED');
    } else {
      removeScrollbarBlock();
      detachListeners();
      log('Physics Engine DISENGAGED');
    }
  }

  function attachListeners() {
    if (isListenersAttached) return; // Prevent double binding
    window.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('keydown', blockKeyboardScroll, { passive: false });
    isListenersAttached = true;
  }

  function detachListeners() {
    if (!isListenersAttached) return;
    window.removeEventListener('wheel', handleWheel);
    document.removeEventListener('keydown', blockKeyboardScroll);
    isListenersAttached = false;
  }

  // --- 3. UI & DOM MANIPULATION ---

  function applyScrollbarBlock() {
    if (!document.head) {
      setTimeout(applyScrollbarBlock, 10);
      return;
    }

    const style = document.getElementById('blackhole-scrollbar-block');
    // Only apply if setting is ON and Engine is ACTIVE
    if (settings.blockScrollbar && isActive) {
      if (!style) {
        const styleEl = document.createElement('style');
        styleEl.id = 'blackhole-scrollbar-block';
        styleEl.textContent = `
          html::-webkit-scrollbar { width: 0px !important; }
          html { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        `;
        document.head.appendChild(styleEl);
        log('🚫 Scrollbar hidden');
      }
    } else {
      // If setting is off OR engine is inactive, remove it
      style?.remove();
    }
  }

  function removeScrollbarBlock() {
    const style = document.getElementById('blackhole-scrollbar-block');
    style?.remove();
  }

  // --- 4. PHYSICS LOGIC ---

  function blockKeyboardScroll(e) {
    if (!settings.blockKeyboard) return;
    
    const scrollKeys = [
      'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 
      'End', 'Home', 'Space'
    ];
    
    if (scrollKeys.includes(e.key) || (e.key === ' ')) {
      e.preventDefault();
      log('Blocked keyboard scroll:', e.key);
      
      const simulatedDelta = ['ArrowDown', 'PageDown', 'End', 'Space'].includes(e.key) ? 100 : -100;
      updateScrollDistance(simulatedDelta);
    }
  }

  function updateScrollDistance(delta) {
    const direction = Math.sign(delta);
    
    if (direction > 0) {
      // Scrolling DOWN: Increase distance (add gravity)
      totalScrollDistance += Math.abs(delta);
    } else if (direction < 0) {
      // Scrolling UP: Decrease distance (Hawking radiation recovery)
      totalScrollDistance = Math.max(
        0,
        totalScrollDistance - Math.abs(delta) * settings.hawkingRadiation
      );
    }

    // Log every 10k units
    if (Math.floor(totalScrollDistance / 10000) > Math.floor((totalScrollDistance - Math.abs(delta)) / 10000)) {
      log('📏 Scroll distance:', totalScrollDistance.toFixed(0));
    }

    // Easter egg check
    if (
      settings.enableEasterEgg &&
      !easterEggTriggered &&
      totalScrollDistance > settings.easterEggThreshold
    ) {
      easterEggTriggered = true;
      log('EASTER EGG TRIGGERED!');
      triggerEasterEgg();
    }
  }

  function handleWheel(e) {
    // Safety check: if listeners weren't removed fast enough
    if (!isActive) return;
    
    e.preventDefault();

    const rawScroll = e.deltaY;
    updateScrollDistance(rawScroll);

    // Calculate resistance (The Event Horizon Formula)
    const resistance = Math.min(
      settings.singularityStrength,
      1 - Math.exp(-totalScrollDistance * settings.gravitationalPull)
    );

    const effectiveScroll = rawScroll * (1 - resistance);

    if (Math.abs(effectiveScroll) > 0.1) {
      window.scrollBy({
        top: effectiveScroll,
        behavior: "auto"
      });
    }
  }

  function triggerEasterEgg() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: black;
      z-index: 999999;
      opacity: 0;
      transition: opacity 2s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
      font-family: system-ui;
      text-align: center;
    `;
    overlay.innerHTML = `
      <div>
        <div style="font-size: 48px; margin-bottom: 20px;">🕳️</div>
        <div>Bruh, stop...</div>
        <div style="font-size: 16px; margin-top: 10px; opacity: 0.7;">Let me help you out...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    setTimeout(() => overlay.style.opacity = '1', 10);

    setTimeout(() => {
      window.location.href = 'https://chatgpt.com/?q=hi%20what%20can%20i%20do%20to%20improve%20my%20life';
    }, 3000);
  }

  // --- 5. INITIALIZATION ---

  function init() {
    log('Initializing...');
    
    // 1. Get Settings
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      log('Loaded settings:', stored);
      settings = stored;
      
      // 2. Decide State immediately
      updateEngineState();
    });

    // 3. Listen for changes (Instant Update Logic)
    chrome.storage.onChanged.addListener((changes) => {
      log('Settings changed:', changes);
      
      // Update our local settings copy
      for (let key in changes) {
        settings[key] = changes[key].newValue;
      }
      
      // Re-run the decision logic
      updateEngineState();
    });
  }

  // Start immediately
  init();
})();
