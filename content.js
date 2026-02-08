
(() => {
  // ---------------------------------------------------------
  // DEBUG SETTINGS (enable logs)
  const DEBUG_MODE = true; 

  // Helper function to handle logging
  const log = (...args) => {
    if (DEBUG_MODE) {
      console.log(...args);
    }
  };
  // ---------------------------------------------------------

  log('🕳️ Scroll Blackhole script loaded');

  const DEFAULTS = {
    gravitationalPull: 0.00008,
    singularityStrength: 0.999,
    hawkingRadiation: 2.5,
    eventHorizonEnabled: true,
    blockKeyboard: true,
    blockScrollbar: true,
    enableEasterEgg: true,
    easterEggThreshold: 140000,
    targetSites: [
      "*://*.x.com/*",
      "*://*.twitter.com/*",
      "*://*.instagram.com/*",
      "*://*.facebook.com/*",
      "*://*.youtube.com/*"
    ]
  };

  let settings = { ...DEFAULTS };
  let totalScrollDistance = 0;
  let easterEggTriggered = false;
  let isActive = false;

  // Check if current site matches target patterns
  function checkIfTargetSite() {
    const currentUrl = window.location.href;
    log('🔍 Checking URL:', currentUrl);
    
    const matches = settings.targetSites.some(pattern => {
      let regexPattern = pattern
        .replace(/\./g, '\\.')           
        .replace(/\*:\/\/\*\\\./g, '.*://([^/]*\\.)?')  
        .replace(/\*/g, '.*');            
      
      const regex = new RegExp('^' + regexPattern + '$');
      const isMatch = regex.test(currentUrl);
      return isMatch;
    });
    
    log('✅ Site matches:', matches);
    return matches;
  }

  // Block scrollbar dragging
  function applyScrollbarBlock() {
    if (!document.head) {
      setTimeout(applyScrollbarBlock, 10);
      return;
    }

    const style = document.getElementById('blackhole-scrollbar-block');
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
      style?.remove();
    }
  }

  // Block keyboard scrolling
  function blockKeyboardScroll(e) {
    if (!isActive || !settings.blockKeyboard) return;
    
    const scrollKeys = [
      'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 
      'End', 'Home', 'Space'
    ];
    
    if (scrollKeys.includes(e.key) || (e.key === ' ')) {
      e.preventDefault();
      log('⌨️ Blocked keyboard scroll:', e.key);
      
      const simulatedDelta = ['ArrowDown', 'PageDown', 'End', 'Space'].includes(e.key) ? 100 : -100;
      updateScrollDistance(simulatedDelta);
    }
  }

  // Update scroll distance and check easter egg
  function updateScrollDistance(delta) {
    const direction = Math.sign(delta);
    
    if (direction > 0) {
      totalScrollDistance += Math.abs(delta);
    } else if (direction < 0) {
      totalScrollDistance = Math.max(
        0,
        totalScrollDistance - Math.abs(delta) * settings.hawkingRadiation
      );
    }

    // Log every 10000 units
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
      log('🥚 EASTER EGG TRIGGERED!');
      triggerEasterEgg();
    }
  }

  // Easter egg
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

  // Main wheel event handler
  function handleWheel(e) {
    if (!isActive || !settings.eventHorizonEnabled) return;
    
    e.preventDefault();

    const rawScroll = e.deltaY;
    updateScrollDistance(rawScroll);

    // Calculate resistance
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

  // Initialize on load
  function init() {
    log('🚀 Initializing...');
    
    chrome.storage.sync.get(DEFAULTS, (stored) => {
      log('💾 Loaded settings:', stored);
      settings = stored;
      isActive = checkIfTargetSite() && settings.eventHorizonEnabled;
      
      log('⚡ Event Horizon Enabled:', settings.eventHorizonEnabled);
      log('🎯 Is Active:', isActive);
      
      if (isActive) {
        applyScrollbarBlock();
        
        // Add event listeners
        window.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('keydown', blockKeyboardScroll, { passive: false });
        
        log('✅ Scroll Blackhole ACTIVATED');
        log('   - Gravitational Pull:', settings.gravitationalPull);
        log('   - Singularity Strength:', settings.singularityStrength);
        log('   - Hawking Radiation:', settings.hawkingRadiation);
      } else {
        log('❌ Scroll Blackhole NOT activated (site not in target list or disabled)');
      }
    });

    // Listen for settings changes
    chrome.storage.onChanged.addListener((changes) => {
      log('🔄 Settings changed:', changes);
      
      for (let key in changes) {
        settings[key] = changes[key].newValue;
      }
      
      const wasActive = isActive;
      isActive = checkIfTargetSite() && settings.eventHorizonEnabled;
      
      // Re-apply scrollbar settings
      applyScrollbarBlock();
      
      // Add/remove listeners if activation state changed
      if (isActive && !wasActive) {
        window.addEventListener('wheel', handleWheel, { passive: false });
        document.addEventListener('keydown', blockKeyboardScroll, { passive: false });
        log('✅ Scroll Blackhole ACTIVATED (via settings change)');
      } else if (!isActive && wasActive) {
        window.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', blockKeyboardScroll);
        log('❌ Scroll Blackhole DEACTIVATED (via settings change)');
      }
    });
  }

  // Start immediately
  init();
})();