import { Message, MessageResponse, MemberData, StorageData, ExtensionSettings } from '../types/types';
import { membersToRows, appendToSheet } from '../services/sheetsApi';

// Storage keys
const STORAGE_KEYS = {
  MEMBERS: 'captured_members',
  SETTINGS: 'extension_settings'
};

// Message listener
chrome.runtime.onMessage.addListener((
  message: Message,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
) => {
  console.log('[Background] Received message:', message.type);

  switch (message.type) {
    case 'CAPTURE_MEMBER':
      handleCaptureMember(message.payload, sendResponse);
      break;

    case 'GET_DATA':
      handleGetData(sendResponse);
      break;

    case 'CLEAR_DATA':
      handleClearData(sendResponse);
      break;

    case 'SAVE_SETTINGS':
      handleSaveSettings(message.payload, sendResponse);
      break;

    case 'GET_SETTINGS':
      handleGetSettings(sendResponse);
      break;

    case 'PAGE_DETECTED':
      console.log('[Background] Facebook member requests page detected');
      sendResponse({ success: true });
      break;

    case 'PUSH_TO_SHEET':
      handlePushToSheet(message.payload, sendResponse);
      break;

    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

// Handle capturing a new member
async function handleCaptureMember(
  memberData: MemberData,
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.MEMBERS);
    const existingMembers: MemberData[] = result[STORAGE_KEYS.MEMBERS] || [];

    // Check for duplicates by profile URL
    const isDuplicate = existingMembers.some(m => m.profileUrl === memberData.profileUrl);

    if (!isDuplicate) {
      existingMembers.push(memberData);
      await chrome.storage.local.set({ [STORAGE_KEYS.MEMBERS]: existingMembers });
      console.log('[Background] Member captured:', memberData.fullName);
      sendResponse({ success: true, data: { count: existingMembers.length } });
    } else {
      console.log('[Background] Duplicate member skipped:', memberData.fullName);
      sendResponse({ success: true, data: { count: existingMembers.length, duplicate: true } });
    }
  } catch (error) {
    console.error('[Background] Error capturing member:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Handle getting all captured data
async function handleGetData(sendResponse: (response: MessageResponse) => void) {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.MEMBERS, STORAGE_KEYS.SETTINGS]);
    const members: MemberData[] = result[STORAGE_KEYS.MEMBERS] || [];
    const settings: ExtensionSettings = result[STORAGE_KEYS.SETTINGS] || {};

    sendResponse({
      success: true,
      data: { members, settings, count: members.length }
    });
  } catch (error) {
    console.error('[Background] Error getting data:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Handle clearing all captured data
async function handleClearData(sendResponse: (response: MessageResponse) => void) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.MEMBERS]: [] });
    console.log('[Background] All data cleared');
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error clearing data:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Handle saving settings
async function handleSaveSettings(
  settings: ExtensionSettings,
  sendResponse: (response: MessageResponse) => void
) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
    console.log('[Background] Settings saved');
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Error saving settings:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Handle getting settings
async function handleGetSettings(sendResponse: (response: MessageResponse) => void) {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
    const settings: ExtensionSettings = result[STORAGE_KEYS.SETTINGS] || {};
    sendResponse({ success: true, data: settings });
  } catch (error) {
    console.error('[Background] Error getting settings:', error);
    sendResponse({ success: false, error: String(error) });
  }
}

// Handle pushing data to Google Sheets
async function handlePushToSheet(
  payload: { spreadsheetId: string; sheetGid?: number | null; members: MemberData[] },
  sendResponse: (response: MessageResponse) => void
) {
  try {
    const { spreadsheetId, sheetGid, members } = payload;

    if (!spreadsheetId) {
      sendResponse({ success: false, error: 'No spreadsheet ID provided' });
      return;
    }

    if (!members || members.length === 0) {
      sendResponse({ success: false, error: 'No members to push' });
      return;
    }

    const rows = membersToRows(members);
    const result = await appendToSheet(spreadsheetId, rows, sheetGid ?? null);

    console.log(`[Background] Pushed ${result.updatedRows} rows to sheet`);
    sendResponse({
      success: true,
      data: { rowsAppended: result.updatedRows }
    });
  } catch (error) {
    console.error('[Background] Push to sheet error:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// Extension installed/updated
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // Initialize storage on first install
    chrome.storage.local.set({
      [STORAGE_KEYS.MEMBERS]: [],
      [STORAGE_KEYS.SETTINGS]: {}
    });
  }
});

console.log('[Background] Service worker loaded');
