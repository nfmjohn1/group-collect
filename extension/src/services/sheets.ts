import { extractSheetId } from '@/shared/utils';
import type { MemberRequest } from '@/shared/types';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

interface GoogleAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

class GoogleSheetsService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  /**
   * Authenticate with Google OAuth 2.0 using Chrome Identity API
   */
  async authenticate(): Promise<boolean> {
    try {
      // Check if token is still valid
      if (this.accessToken && Date.now() < this.tokenExpiresAt) {
        return true;
      }

      // Get new token using Chrome Identity API
      const token = await new Promise<string>((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else if (token) {
            resolve(token);
          } else {
            reject(new Error('Failed to get auth token'));
          }
        });
      });

      this.accessToken = token;
      // Set expiration to 55 minutes (tokens typically last 1 hour)
      this.tokenExpiresAt = Date.now() + 55 * 60 * 1000;

      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Remove cached auth token and sign out
   */
  async signOut(): Promise<void> {
    if (this.accessToken) {
      return new Promise((resolve) => {
        chrome.identity.removeCachedAuthToken(
          { token: this.accessToken! },
          () => {
            this.accessToken = null;
            this.tokenExpiresAt = 0;
            resolve();
          }
        );
      });
    }
  }

  /**
   * Get the current access token
   */
  private async getAccessToken(): Promise<string> {
    await this.authenticate();
    if (!this.accessToken) {
      throw new Error('Not authenticated with Google');
    }
    return this.accessToken;
  }

  /**
   * Make an authenticated request to Google Sheets API
   */
  private async makeRequest(
    method: string,
    url: string,
    body?: any
  ): Promise<any> {
    const token = await this.getAccessToken();

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error?.message || `API request failed: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Get spreadsheet metadata
   */
  async getSpreadsheet(sheetUrl: string): Promise<any> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    return this.makeRequest('GET', url);
  }

  /**
   * Read data from a spreadsheet range
   */
  async readRange(sheetUrl: string, range: string): Promise<any[][]> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}`;
    const response = await this.makeRequest('GET', url);
    return response.values || [];
  }

  /**
   * Write data to a spreadsheet range
   */
  async writeRange(
    sheetUrl: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}?valueInputOption=RAW`;

    await this.makeRequest('PUT', url, {
      range,
      values,
    });
  }

  /**
   * Append data to a spreadsheet (adds to the end)
   */
  async appendData(
    sheetUrl: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;

    await this.makeRequest('POST', url, {
      range,
      values,
    });
  }

  /**
   * Batch update multiple ranges at once
   */
  async batchUpdate(
    sheetUrl: string,
    data: Array<{ range: string; values: any[][] }>
  ): Promise<void> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

    await this.makeRequest('POST', url, {
      valueInputOption: 'RAW',
      data: data.map((item) => ({
        range: item.range,
        values: item.values,
      })),
    });
  }

  /**
   * Clear a range in the spreadsheet
   */
  async clearRange(sheetUrl: string, range: string): Promise<void> {
    const spreadsheetId = extractSheetId(sheetUrl);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      range
    )}:clear`;

    await this.makeRequest('POST', url, {});
  }

  /**
   * Convert member data to sheet rows
   */
  memberToSheetRow(member: MemberRequest): any[] {
    return [
      member.groupName || '',
      member.userId || '',
      member.facebookUsername || '',
      member.joinedOn ? new Date(member.joinedOn).toLocaleDateString() : '',
      member.q1 || '',
      member.q2 || '',
      member.q3 || '',
      member.dateAdded ? new Date(member.dateAdded).toLocaleDateString() : '',
      member.firstName || '',
      member.lastName || '',
      member.city || '',
      member.country || '',
      member.status || 'pending',
    ];
  }

  /**
   * Get the header row for member data
   */
  getHeaderRow(): string[] {
    return [
      'Group Name',
      'User ID',
      'Facebook Username',
      'Joined On',
      'Q1',
      'Q2',
      'Q3',
      'Date Added',
      'First Name',
      'Last Name',
      'City',
      'Country',
      'Status',
    ];
  }

  /**
   * Push member data to Google Sheets
   */
  async pushMembers(
    sheetUrl: string,
    members: MemberRequest[],
    sheetName: string = 'Sheet1'
  ): Promise<void> {
    if (members.length === 0) {
      throw new Error('No members to push');
    }

    // Check if sheet has headers
    let hasHeaders = false;
    try {
      const existingData = await this.readRange(sheetUrl, `${sheetName}!A1:M1`);
      hasHeaders = existingData.length > 0 && existingData[0].length > 0;
    } catch (error) {
      // Sheet might be empty or not exist
      hasHeaders = false;
    }

    // Prepare data rows
    const dataRows = members.map((member) => this.memberToSheetRow(member));

    // If no headers, add them
    if (!hasHeaders) {
      const headerRow = this.getHeaderRow();
      await this.writeRange(sheetUrl, `${sheetName}!A1:M1`, [headerRow]);
    }

    // Append member data
    await this.appendData(sheetUrl, `${sheetName}!A:M`, dataRows);
  }

  /**
   * Update existing members in the sheet (find and replace)
   */
  async updateMembers(
    sheetUrl: string,
    members: MemberRequest[],
    sheetName: string = 'Sheet1'
  ): Promise<void> {
    // Read all existing data
    const existingData = await this.readRange(sheetUrl, `${sheetName}!A:M`);

    if (existingData.length === 0) {
      // No data exists, just push new members
      await this.pushMembers(sheetUrl, members, sheetName);
      return;
    }

    // Create a map of existing members by User ID (column B, index 1)
    const existingMap = new Map<string, number>();
    for (let i = 1; i < existingData.length; i++) {
      const userId = existingData[i][1]; // Column B
      if (userId) {
        existingMap.set(userId, i);
      }
    }

    // Separate members into updates and new additions
    const updates: Array<{ range: string; values: any[][] }> = [];
    const newMembers: MemberRequest[] = [];

    members.forEach((member) => {
      const rowIndex = existingMap.get(member.userId);
      if (rowIndex !== undefined) {
        // Update existing row
        const range = `${sheetName}!A${rowIndex + 1}:M${rowIndex + 1}`;
        updates.push({
          range,
          values: [this.memberToSheetRow(member)],
        });
      } else {
        // New member to add
        newMembers.push(member);
      }
    });

    // Perform batch update for existing members
    if (updates.length > 0) {
      await this.batchUpdate(sheetUrl, updates);
    }

    // Append new members
    if (newMembers.length > 0) {
      const dataRows = newMembers.map((member) => this.memberToSheetRow(member));
      await this.appendData(sheetUrl, `${sheetName}!A:M`, dataRows);
    }
  }

  /**
   * Sync questions/answers mapping - reads the first member and updates header
   */
  async syncQuestionsMapping(
    sheetUrl: string,
    members: MemberRequest[],
    sheetName: string = 'Sheet1'
  ): Promise<void> {
    if (members.length === 0) {
      throw new Error('No members available to sync questions');
    }

    // Get the first member with questions
    const memberWithQuestions = members.find((m) => m.q1 || m.q2 || m.q3);
    if (!memberWithQuestions) {
      throw new Error('No approval questions found in member data');
    }

    // Create custom header with actual questions
    const headerRow = [
      'Group Name',
      'User ID',
      'Facebook Username',
      'Joined On',
      memberWithQuestions.q1 ? 'Q1: ' + memberWithQuestions.q1.substring(0, 50) : 'Q1',
      memberWithQuestions.q2 ? 'Q2: ' + memberWithQuestions.q2.substring(0, 50) : 'Q2',
      memberWithQuestions.q3 ? 'Q3: ' + memberWithQuestions.q3.substring(0, 50) : 'Q3',
      'Date Added',
      'First Name',
      'Last Name',
      'City',
      'Country',
      'Status',
    ];

    // Update the header row
    await this.writeRange(sheetUrl, `${sheetName}!A1:M1`, [headerRow]);
  }
}

// Export singleton instance
export const sheetsService = new GoogleSheetsService();
