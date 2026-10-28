/**
 * Google Sheets API v4 Service
 * Handles OAuth token acquisition and direct Sheets API calls
 */

import { MemberData } from '../types/types';

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

/**
 * Extract spreadsheet ID from a Google Sheets URL.
 */
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Extract the tab ID (gid) from a Google Sheets URL, if present.
 */
export function extractSheetGid(url: string): number | null {
  const match = url.match(/[#&?]gid=(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Get an OAuth2 token using chrome.identity.
 */
export async function getAuthToken(interactive: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!token) {
        reject(new Error('No token received'));
        return;
      }
      resolve(token);
    });
  });
}

/**
 * Remove cached auth token (for re-auth on 401).
 */
async function removeCachedToken(token: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

/**
 * Convert MemberData array to a 2D values array matching the 14-column template.
 * Order: Group Name, User ID, Facebook User Name, Joined Facebook,
 *        Q1, A1, Q2, A2, Q3, A3, Date Added, First Name, Last Name, City
 */
export function membersToRows(members: MemberData[]): string[][] {
  return members.map(m => [
    m.groupName || '',
    m.userId || '',
    m.fullName || '',
    m.joinedFacebook || '',
    m.question1 || '',
    m.answer1 || '',
    m.question2 || '',
    m.answer2 || '',
    m.question3 || '',
    m.answer3 || '',
    m.timestamp || new Date().toISOString(),
    m.firstName || '',
    m.lastName || '',
    m.city || ''
  ]);
}

/**
 * Fetch from the Sheets API with an OAuth token, retrying once on 401.
 */
async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  let token = await getAuthToken(true);
  const withAuth = (t: string): RequestInit => ({
    ...init,
    headers: { ...(init.headers || {}), 'Authorization': `Bearer ${t}` }
  });

  let response = await fetch(url, withAuth(token));

  // If 401, token may be expired — remove cached and retry once
  if (response.status === 401) {
    await removeCachedToken(token);
    token = await getAuthToken(true);
    response = await fetch(url, withAuth(token));
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let errorMessage = `Google Sheets API error (${response.status})`;
    try {
      const parsed = JSON.parse(errorBody);
      errorMessage = parsed.error?.message || errorMessage;
    } catch {
      // Use generic error message
    }
    throw new Error(errorMessage);
  }

  return response;
}

/**
 * Look up the tab title to write to: the tab matching gid if given, else the first tab.
 */
async function getSheetTitle(spreadsheetId: string, gid: number | null): Promise<string> {
  const url = `${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties(sheetId,title)`;
  const response = await authorizedFetch(url);
  const data = await response.json();
  const sheets: Array<{ properties: { sheetId: number; title: string } }> = data.sheets || [];

  if (sheets.length === 0) {
    throw new Error('Spreadsheet has no tabs');
  }

  const match = gid !== null ? sheets.find(s => s.properties.sheetId === gid) : undefined;
  return (match || sheets[0]).properties.title;
}

/**
 * Append rows to a Google Sheet using the Sheets API v4 values:append endpoint.
 */
export async function appendToSheet(
  spreadsheetId: string,
  rows: string[][],
  gid: number | null = null
): Promise<{ updatedRows: number }> {
  const title = await getSheetTitle(spreadsheetId, gid);
  // Quote the tab name so titles with spaces or symbols parse; escape embedded quotes
  const range = `'${title.replace(/'/g, "''")}'!A:N`;
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await authorizedFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ range, majorDimension: 'ROWS', values: rows })
  });

  const data = await response.json();
  const updatedRows = data.updates?.updatedRows || rows.length;

  return { updatedRows };
}
