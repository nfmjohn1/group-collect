/**
 * Background Service Worker
 * Handles extension lifecycle events, messaging, and background tasks
 */

import { generateId } from '../shared/utils';
import { sheetsService } from '../services/sheets';
import { storage } from '../services/storage';

console.log('Group Collect background service worker loaded');

// ============================================================================
// ERROR LOGGING & MONITORING
// ============================================================================

interface ErrorLog {
  id: string;
  timestamp: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  context?: string;
  stack?: string;
}

/**
 * Log error with context
 */
async function logError(type: ErrorLog['type'], message: string, context?: string, error?: Error): Promise<void> {
  try {
    const result = await chrome.storage.local.get('error_log');
    const errorLog: ErrorLog[] = result.error_log || [];

    errorLog.push({
      id: generateId(),
      timestamp: new Date().toISOString(),
      type,
      message,
      context,
      stack: error?.stack,
    });

    // Keep last 500 errors
    await chrome.storage.local.set({
      error_log: errorLog.slice(-500),
    });

    // Log to console as well
    if (type === 'error') {
      console.error(`[${context || 'Background'}] ${message}`, error);
    } else if (type === 'warning') {
      console.warn(`[${context || 'Background'}] ${message}`);
    } else {
      console.log(`[${context || 'Background'}] ${message}`);
    }
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Show browser notification
 */
export async function showNotification(title: string, message: string, type: 'basic' | 'progress' = 'basic'): Promise<void> {
  try {
    await chrome.notifications.create({
      type,
      iconUrl: '/icon128.png',
      title,
      message,
    });
  } catch (error) {
    await logError('warning', 'Failed to show notification', 'Notification', error as Error);
  }
}

/**
 * Update badge with pending member count
 */
async function updateBadge(): Promise<void> {
  try {
    const members = await storage.getMembers();
    const pendingCount = members.filter((m) => m.status === 'pending').length;

    if (pendingCount > 0) {
      chrome.action.setBadgeText({ text: String(pendingCount) });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' }); // Yellow for pending
    } else {
      chrome.action.setBadgeText({ text: '' });
    }

    await logError('info', `Badge updated: ${pendingCount} pending members`, 'Badge');
  } catch (error) {
    await logError('error', 'Failed to update badge', 'Badge', error as Error);
  }
}

// ============================================================================
// DATA BACKUP & RESTORE
// ============================================================================

interface BackupData {
  version: string;
  timestamp: string;
  members: any[];
  settings: any;
  declineLog: any[];
}

/**
 * Create data backup
 */
async function createBackup(): Promise<BackupData> {
  try {
    const [members, settingsData, declineLogData] = await Promise.all([
      storage.getMembers(),
      chrome.storage.local.get('settings'),
      chrome.storage.local.get('decline_log'),
    ]);

    const backup: BackupData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      members,
      settings: settingsData.settings || {},
      declineLog: declineLogData.decline_log || [],
    };

    await logError('info', `Backup created: ${members.length} members`, 'Backup');
    return backup;
  } catch (error) {
    await logError('error', 'Failed to create backup', 'Backup', error as Error);
    throw error;
  }
}

/**
 * Restore data from backup
 */
async function restoreBackup(backup: BackupData): Promise<boolean> {
  try {
    // Validate backup structure
    if (!backup.version || !backup.timestamp || !backup.members) {
      throw new Error('Invalid backup format');
    }

    // Restore data
    await chrome.storage.local.set({
      members_data: backup.members,
      settings: backup.settings,
      decline_log: backup.declineLog || [],
    });

    await updateBadge();
    await logError('info', `Backup restored: ${backup.members.length} members from ${backup.timestamp}`, 'Backup');

    return true;
  } catch (error) {
    await logError('error', 'Failed to restore backup', 'Backup', error as Error);
    return false;
  }
}

/**
 * Auto-backup data (daily)
 */
async function autoBackup(): Promise<void> {
  try {
    const backup = await createBackup();

    // Save to local storage with date key
    const backupKey = `backup_${new Date().toISOString().split('T')[0]}`;
    await chrome.storage.local.set({ [backupKey]: backup });

    // Clean old backups (keep last 7 days)
    const result = await chrome.storage.local.get(null);
    const backupKeys = Object.keys(result).filter((key) => key.startsWith('backup_'));

    if (backupKeys.length > 7) {
      // Sort by date and remove oldest
      const sortedKeys = backupKeys.sort().slice(0, backupKeys.length - 7);
      for (const key of sortedKeys) {
        await chrome.storage.local.remove(key);
      }
    }

    await logError('info', 'Auto-backup completed', 'Backup');
  } catch (error) {
    await logError('error', 'Auto-backup failed', 'Backup', error as Error);
  }
}

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

    await logError('info', `Saved ${newMembers.length} new members. Total: ${allMembers.length}`, 'Scraper');

    // Update badge with pending count
    await updateBadge();

    // Show notification if new members were added
    if (newMembers.length > 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon128.png',
        title: 'New Members Collected',
        message: `Added ${newMembers.length} new member${newMembers.length > 1 ? 's' : ''} from ${data.groupName}`,
      });
    }

    return true;
  } catch (error) {
    await logError('error', 'Failed to save scraped data', 'Scraper', error as Error);
    return false;
  }
}

// Installation
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await logError('info', 'Extension installed', 'Install');
    // Initialize badge
    await updateBadge();
    // Open onboarding page
    chrome.tabs.create({
      url: chrome.runtime.getURL('onboarding.html'),
    });
    // Create initial backup
    await autoBackup();
  } else if (details.reason === 'update') {
    await logError('info', `Extension updated to version ${chrome.runtime.getManifest().version}`, 'Update');
    await updateBadge();
    // Show update notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icon128.png',
      title: 'Group Collect Updated',
      message: `Updated to version ${chrome.runtime.getManifest().version}`,
    });
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
          await logError('info', 'Questions synced to Google Sheet', 'Sheets');
          sendResponse({ success: true });
        } catch (error) {
          await logError('error', 'Failed to sync questions', 'Sheets', error as Error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'CREATE_BACKUP':
      // Create manual backup
      (async () => {
        try {
          const backup = await createBackup();
          const backupJson = JSON.stringify(backup, null, 2);
          const blob = new Blob([backupJson], { type: 'application/json' });
          const url = URL.createObjectURL(blob);

          // Download backup file
          const filename = `group-collect-backup-${new Date().toISOString().split('T')[0]}.json`;
          await chrome.downloads.download({
            url,
            filename,
            saveAs: true,
          });

          sendResponse({ success: true, filename });
        } catch (error) {
          await logError('error', 'Failed to create backup', 'Backup', error as Error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'RESTORE_BACKUP':
      // Restore from backup
      (async () => {
        try {
          const { backup } = message;
          if (!backup) {
            sendResponse({ success: false, error: 'Backup data is required' });
            return;
          }

          const success = await restoreBackup(backup);
          if (success) {
            chrome.notifications.create({
              type: 'basic',
              iconUrl: '/icon128.png',
              title: 'Backup Restored',
              message: `Successfully restored ${backup.members.length} members`,
            });
          }
          sendResponse({ success });
        } catch (error) {
          await logError('error', 'Failed to restore backup', 'Backup', error as Error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'GET_ERROR_LOG':
      // Get error log
      (async () => {
        try {
          const result = await chrome.storage.local.get('error_log');
          sendResponse({ success: true, log: result.error_log || [] });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'CLEAR_ERROR_LOG':
      // Clear error log
      (async () => {
        try {
          await chrome.storage.local.set({ error_log: [] });
          await logError('info', 'Error log cleared', 'System');
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'UPDATE_BADGE':
      // Manually update badge
      (async () => {
        try {
          await updateBadge();
          sendResponse({ success: true });
        } catch (error) {
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'PUSH_TO_SHEETS':
      // Push members to Google Sheets (from content script)
      (async () => {
        try {
          // Get settings for sheet URL
          const settings = await storage.getSettings();
          const sheetUrl = settings?.googleSheetUrl;
          
          if (!sheetUrl) {
            sendResponse({ success: false, error: 'No Google Sheet URL configured' });
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
          await logError('info', `Pushed ${members.length} members to Google Sheets`, 'Sheets');
          
          // Show notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: '/icon128.png',
            title: 'Data Pushed to Sheets',
            message: `Successfully pushed ${members.length} member${members.length > 1 ? 's' : ''} to Google Sheets`,
          });
          
          sendResponse({ success: true, count: members.length });
        } catch (error) {
          await logError('error', 'Failed to push to sheets', 'Sheets', error as Error);
          sendResponse({ success: false, error: String(error) });
        }
      })();
      return true;

    case 'RUN_AUTO_DECLINE':
      // Trigger auto-decline in content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { type: 'RUN_AUTO_DECLINE' },
            (response) => {
              sendResponse(response || { success: false, error: 'No response from content script' });
            }
          );
        } else {
          sendResponse({ success: false, error: 'No active tab' });
        }
      });
      return true;

    case 'AUTO_DECLINE_COMPLETE':
      // Auto-decline process completed (notification from content script)
      (async () => {
        try {
          const { count } = message;
          await logError('info', `Auto-decline completed: ${count} members declined`, 'AutoDecline');
          
          // Update badge
          await updateBadge();
          
          sendResponse({ success: true });
        } catch (error) {
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

// ============================================================================
// PERIODIC SYNC & ALARMS
// ============================================================================

/**
 * Check for new pending members and notify
 */
async function checkForNewMembers(): Promise<void> {
  try {
    const members = await storage.getMembers();
    const pendingMembers = members.filter((m) => m.status === 'pending');

    // Get last notified count
    const result = await chrome.storage.local.get('last_notified_count');
    const lastCount = result.last_notified_count || 0;

    if (pendingMembers.length > lastCount) {
      const newCount = pendingMembers.length - lastCount;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon128.png',
        title: 'New Member Requests',
        message: `You have ${newCount} new member request${newCount > 1 ? 's' : ''} pending review`,
      });

      // Update last notified count
      await chrome.storage.local.set({ last_notified_count: pendingMembers.length });
      await logError('info', `Notified about ${newCount} new pending members`, 'Notification');
    }

    // Update badge
    await updateBadge();
  } catch (error) {
    await logError('error', 'Failed to check for new members', 'Sync', error as Error);
  }
}

/**
 * Periodic sync handler
 */
async function periodicSync(): Promise<void> {
  try {
    await logError('info', 'Periodic sync started', 'Sync');

    // Check for new members and notify
    await checkForNewMembers();

    await logError('info', 'Periodic sync completed', 'Sync');
  } catch (error) {
    await logError('error', 'Periodic sync failed', 'Sync', error as Error);
  }
}

// Create alarms for periodic tasks
chrome.alarms.create('syncMembers', {
  periodInMinutes: 30, // Check every 30 minutes
});

chrome.alarms.create('autoBackup', {
  periodInMinutes: 1440, // Daily backup (24 hours)
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncMembers') {
    await periodicSync();
  } else if (alarm.name === 'autoBackup') {
    await autoBackup();
  }
});

// Initialize badge on startup
(async () => {
  await updateBadge();
  await logError('info', 'Background service worker initialized', 'System');
})();

export {};
