(() => {
  // Default settings
  const DEFAULTS = {
  resistanceGrowth: 0.00008,
  maxResistance: 0.999,
  recoveryRate: 2.5,
  blockKeyboard: true,
  blockScrollbar: true,
  enableEasterEgg: true,
  easterEggThreshold: 120000 // ← Changed from 50000
};

  let settings = { ...DEFAULTS };
  let totalScrollDistance = 0;
  let easterEggTriggered = false;

  // Load settings from storage
  chrome.storage.sync.get(DEFAULTS, (stored) => {
    settings = stored;
    applyScrollbarBlock();
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    for (let key in changes) {
      settings[key] = changes[key].newValue;
    }
    applyScrollbarBlock();
  });

  // Block scrollbar dragging
  function applyScrollbarBlock() {
    const style = document.getElementById('blackhole-scrollbar-block');
    if (settings.blockScrollbar) {
      if (!style) {
        const styleEl = document.createElement('style');
        styleEl.id = 'blackhole-scrollbar-block';
        styleEl.textContent = `
          html::-webkit-scrollbar { width: 0px !important; }
          html { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        `;
        document.head.appendChild(styleEl);
      }
    } else {
      style?.remove();
    }
  }

  // Block keyboard scrolling
  function blockKeyboardScroll(e) {
    if (!settings.blockKeyboard) return;
    
    const scrollKeys = [
      'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 
      'End', 'Home', 'Space'
    ];
    
    if (scrollKeys.includes(e.key) || (e.key === ' ')) {
      e.preventDefault();
      
      // Still apply black hole physics to keyboard attempts
      const simulatedDelta = ['ArrowDown', 'PageDown', 'End', 'Space'].includes(e.key) ? 100 : -100;
      updateScrollDistance(simulatedDelta);
    }
  }

  document.addEventListener('keydown', blockKeyboardScroll, { passive: false });

  // Update scroll distance and check easter egg
  function updateScrollDistance(delta) {
    const direction = Math.sign(delta);
    
    if (direction > 0) {
      totalScrollDistance += Math.abs(delta);
    } else if (direction < 0) {
      totalScrollDistance = Math.max(
        0,
        totalScrollDistance - Math.abs(delta) * settings.recoveryRate
      );
    }

    // Easter egg: redirect after extreme scrolling
    if (
      settings.enableEasterEgg &&
      !easterEggTriggered &&
      totalScrollDistance > settings.easterEggThreshold
    ) {
      easterEggTriggered = true;
      triggerEasterEgg();
    }
  }

  function triggerEasterEgg() {
    // Create dramatic fade overlay
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
        <div>C'mon, don't you have better things to do...</div>
        <div style="font-size: 16px; margin-top: 10px; opacity: 0.7;">Let me help you out...</div>
      </div>
    `;
    document.body.appendChild(overlay);

    // Fade in
    setTimeout(() => overlay.style.opacity = '1', 10);

    // Redirect after dramatic pause
    setTimeout(() => {
      window.location.href = 'https://chatgpt.com/?prompt=Generate+a+schedule+for+a+productive+day.+Here+are+the+things+I+need+to+get+done';
    }, 3000);
  }

  // Main wheel event handler
  window.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      const rawScroll = e.deltaY;
      updateScrollDistance(rawScroll);

      // Calculate resistance
      const resistance = Math.min(
        settings.maxResistance,
        1 - Math.exp(-totalScrollDistance * settings.resistanceGrowth)
      );

      // Apply resistance
      const effectiveScroll = rawScroll * (1 - resistance);

      if (Math.abs(effectiveScroll) > 0.1) {
        window.scrollBy({
          top: effectiveScroll,
          behavior: "auto"
        });
      }
    },
    { passive: false }
  );
})();