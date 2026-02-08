// background.js

const DEFAULT_SITES = [
  "*://*.x.com/*",
  "*://*.twitter.com/*",
  "*://*.instagram.com/*",
  "*://*.facebook.com/*",
  "*://*.youtube.com/*",
  "*://*.reddit.com/*",
  "*://*.tiktok.com/*"
];

// 1. Initialize Defaults on Install/First Load
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.sync.get(['targetSites']);
  if (!data.targetSites) {
    await chrome.storage.sync.set({ targetSites: DEFAULT_SITES });
    // console.log(' Default sites initialized');
  }
});

// 2. Helper: Match URL against patterns (Exact same logic as content.js)
function isMatch(url, pattern) {
  try {
    let regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*:\/\/\*\\\./g, '.*://([^/]*\\.)?')
      .replace(/\*/g, '.*');
    return new RegExp('^' + regexPattern + '$').test(url);
  } catch (e) {
    return false;
  }
}

// 3. Core Logic: Handle Tab Changes
async function handleTabChange() {
  const now = Date.now();
  
  // A. Retrieve the currently tracking session (if any)
  const sessionData = await chrome.storage.session.get(['trackingSession']);
  const previousSession = sessionData.trackingSession;

  // B. Save time for the previous session
  if (previousSession) {
    const duration = now - previousSession.startTime;
    
    // Get existing stats
    const statsData = await chrome.storage.local.get(['siteStats']);
    const stats = statsData.siteStats || {};
    
    // Add time
    stats[previousSession.pattern] = (stats[previousSession.pattern] || 0) + duration;
    
    // Save back to local storage
    await chrome.storage.local.set({ siteStats: stats });
    console.log(`💾 Saved ${duration}ms for ${previousSession.pattern}`);
    
    // Clear current session
    await chrome.storage.session.remove('trackingSession');
  }

  // C. Start new session if active tab matches a target site
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tabs.length || !tabs[0].url) return;
    
    const currentUrl = tabs[0].url;
    const settings = await chrome.storage.sync.get(['targetSites']);
    const targets = settings.targetSites || [];

    const matchedPattern = targets.find(pattern => isMatch(currentUrl, pattern));

    if (matchedPattern) {
      console.log(`⏱️ Starting timer for: ${matchedPattern}`);
      await chrome.storage.session.set({
        trackingSession: {
          pattern: matchedPattern,
          startTime: now
        }
      });
    }
  } catch (err) {
    console.error("Tab check failed:", err);
  }
}

// 4. Event Listeners
chrome.tabs.onActivated.addListener(handleTabChange);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    handleTabChange();
  }
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus - stop tracking
    handleTabChange(); // This will save current session and start nothing
  } else {
    // Browser gained focus - check active tab
    handleTabChange();
  }
});