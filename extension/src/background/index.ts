/**
 * Background Service Worker
 * Handles extension lifecycle events, messaging, and background tasks
 */

console.log('Group Collect background service worker loaded');

// Installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Open welcome page or onboarding
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/popup/index.html'),
    });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Message received:', message);

  switch (message.type) {
    case 'SCRAPE_MEMBERS':
      // TODO: Handle member scraping request
      sendResponse({ success: true });
      break;

    case 'SEND_MESSAGE':
      // TODO: Handle message sending
      sendResponse({ success: true });
      break;

    case 'DECLINE_MEMBER':
      // TODO: Handle member decline
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

// Handle browser action click
chrome.action.onClicked.addListener((_tab) => {
  console.log('Extension icon clicked');
});

// Periodic sync for member requests (every 5 minutes)
chrome.alarms.create('syncMembers', {
  periodInMinutes: 5,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncMembers') {
    console.log('Syncing members...');
    // TODO: Implement periodic sync logic
  }
});

export {};
