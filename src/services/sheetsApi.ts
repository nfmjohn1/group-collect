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
 * Append rows to a Google Sheet using the Sheets API v4 values:append endpoint.
 */
export async function appendToSheet(
  spreadsheetId: string,
  rows: string[][]
): Promise<{ updatedRows: number }> {
  let token = await getAuthToken(true);

  const range = 'Sheet1!A:N';
  const url = `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const body = {
    range: range,
    majorDimension: 'ROWS',
    values: rows
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  // If 401, token may be expired — remove cached and retry once
  if (response.status === 401) {
    await removeCachedToken(token);
    token = await getAuthToken(true);

    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
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

  const data = await response.json();
  const updatedRows = data.updates?.updatedRows || rows.length;

  return { updatedRows };
}
