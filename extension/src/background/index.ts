/**
 * Background Service Worker
 * Handles extension lifecycle events, messaging, and background tasks
 */

import { generateId } from '../shared/utils';
import { sheetsService } from '../services/sheets';
import { storage } from '../services/storage';

console.log('Group Collect background service worker loaded');

// Type for scraped data from content script
interface ScrapedMember {
  id: string;
  facebookUsername: string;
  profileUrl: string;
  firstName?: string;
  lastName?: string;
  joinedOn: Date;
  answers: { question: string; answer: string }[];
  status: 'pending';
}

interface ScrapedData {
  groupName: string;
  groupId: string;
  members: ScrapedMember[];
}

/**
 * Transform scraped data to MemberRequest format for storage
 */
function transformScrapedData(data: ScrapedData) {
  return data.members.map((member) => {
    // Extract email from answers (for future use)
    const emailAnswer = member.answers.find(
      (a) => a.question.toLowerCase().includes('email') || a.answer.includes('@')
    );
    const email = emailAnswer?.answer || '';

    // Map up to 3 Q&A pairs to q1, q2, q3
    const q1 = member.answers[0]?.answer || '';
    const q2 = member.answers[1]?.answer || '';
    const q3 = member.answers[2]?.answer || '';

    return {
      id: member.id || generateId(),
      groupName: data.groupName,
      userId: member.id,
      facebookUsername: member.facebookUsername,
      joinedOn: new Date(member.joinedOn),
      q1,
      q2,
      q3,
      email,
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      city: '', // Not extracted yet
      country: '', // Not extracted yet
      status: 'pending' as const,
      dateAdded: new Date(),
    };
  });
}

/**
 * Save scraped data to Chrome storage
 */
async function saveScrapedData(data: ScrapedData): Promise<boolean> {
  try {
    // Get existing members from storage
    const result = await chrome.storage.local.get('members_data');
    const existingMembers = result.members_data || [];

    // Transform and add new members
    const newMembers = transformScrapedData(data);

    // Merge with existing, avoiding duplicates based on userId
    const memberMap = new Map();
    [...existingMembers, ...newMembers].forEach((member) => {
      memberMap.set(member.userId, member);
    });

    const allMembers = Array.from(memberMap.values());

    // Save back to storage
    await chrome.storage.local.set({ members_data: allMembers });

    console.log(`Saved ${newMembers.length} new members. Total: ${allMembers.length}`);

    // Update badge to show total count
    chrome.action.setBadgeText({ text: String(allMembers.length) });
    chrome.action.setBadgeBackgroundColor({ color: '#4A69BD' });

    return true;
  } catch (error) {
    console.error('Error saving scraped data:', error);
    return false;
  }
}

// Installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    // Initialize badge
    chrome.action.setBadgeText({ text: '0' });
    chrome.action.setBadgeBackgroundColor({ color: '#4A69BD' });
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('Message received:', message);

  switch (message.type) {
    case 'SAVE_SCRAPED_DATA':
      // Save data from content script
      saveScrapedData(message.data)
        .then((success) => {
          sendResponse({ success });
        })
        .catch((error) => {
          console.error('Error in SAVE_SCRAPED_DATA:', error);
          sendResponse({ success: false, error: String(error) });
        });
      return true; // Keep channel open for async response

    case 'GROUP_PAGE_DETECTED':
      // Content script detected a group page
      console.log('Group page detected:', message.url);
      // Could show a notification or update UI
      sendResponse({ success: true });
      break;

    case 'SCRAPE_MEMBERS':
      // Trigger scraping on current tab
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'SCRAPE_PAGE' },
            (response) => {
              if (response?.success && response.data) {
                // Save the scraped data
                saveScrapedData(response.data).then((success) => {
                  sendResponse({ success, data: response.data });
                });
              } else {
                sendResponse({ success: false, error: 'Failed to scrape' });
              }
            }
          );
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      return true; // Keep channel open for async response

    case 'GET_MEMBERS_COUNT':
      // Get current member count
      chrome.storage.local.get('members_data', (result) => {
        const count = result.members_data?.length || 0;
        sendResponse({ count });
      });
      return true;

    case 'SEND_MESSAGE':
      // TODO: Handle message sending
      sendResponse({ success: true });
      break;

    case 'DECLINE_MEMBER':
      // TODO: Handle member decline
      sendResponse({ success: true });
      break;

    case 'PUSH_TO_SHEET':
      // Push members to Google Sheet
      (async () => {
        try {
          const { sheetUrl } = message;
          if (!sheetUrl) {
            sendResponse({ success: false, error: 'Sheet URL is required' });
            return;
          }

          // Get members from storage
          const members = await storage.getMembers();
          if (members.length === 0) {
            sendResponse({ success: false, error: 'No members to push' });
            return;
          }

          // Authenticate and push to sheet
          const authenticated = await sheetsService.authenticate();
          if (!authenticated) {
            sendResponse({ success: false, error: 'Failed to authenticate with Google' });
            return;
          }

          await sheetsService.pushMembers(sheetUrl, members);
          sendResponse({ success: true, count: members.length });
        } catch (error) {
          console.error('Error pushing to sheet:', error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true; // Keep channel open for async response

    case 'UPDATE_SHEET':
      // Update existing members in Google Sheet
      (async () => {
        try {
          const { sheetUrl } = message;
          if (!sheetUrl) {
            sendResponse({ success: false, error: 'Sheet URL is required' });
            return;
          }

          const members = await storage.getMembers();
          if (members.length === 0) {
            sendResponse({ success: false, error: 'No members to update' });
            return;
          }

          const authenticated = await sheetsService.authenticate();
          if (!authenticated) {
            sendResponse({ success: false, error: 'Failed to authenticate with Google' });
            return;
          }

          await sheetsService.updateMembers(sheetUrl, members);
          sendResponse({ success: true, count: members.length });
        } catch (error) {
          console.error('Error updating sheet:', error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'SYNC_QUESTIONS_TO_SHEET':
      // Sync questions/answers mapping to sheet headers
      (async () => {
        try {
          const { sheetUrl } = message;
          if (!sheetUrl) {
            sendResponse({ success: false, error: 'Sheet URL is required' });
            return;
          }

          const members = await storage.getMembers();
          if (members.length === 0) {
            sendResponse({ success: false, error: 'No members available. Please scrape member data first.' });
            return;
          }

          const authenticated = await sheetsService.authenticate();
          if (!authenticated) {
            sendResponse({ success: false, error: 'Failed to authenticate with Google' });
            return;
          }

          await sheetsService.syncQuestionsMapping(sheetUrl, members);
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error syncing questions:', error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

// Handle browser action click
chrome.action.onClicked.addListener((_tab) => {
  console.log('Extension icon clicked');
});

// Periodic sync for member requests (every 30 minutes)
chrome.alarms.create('syncMembers', {
  periodInMinutes: 30,
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncMembers') {
    console.log('Periodic sync triggered');
    // TODO: Implement periodic sync logic
    // For now, just update the badge count
    chrome.storage.local.get('members_data', (result) => {
      const count = result.members_data?.length || 0;
      chrome.action.setBadgeText({ text: String(count) });
    });
  }
});

// Initialize badge on startup
chrome.storage.local.get('members_data', (result) => {
  const count = result.members_data?.length || 0;
  chrome.action.setBadgeText({ text: String(count) });
  chrome.action.setBadgeBackgroundColor({ color: '#4A69BD' });
});

export {};
