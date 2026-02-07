import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useMemberStore } from '@/store/memberStore';
import { useSettingsStore } from '@/store/settingsStore';
import { downloadCSV } from '@/shared/utils';
import { sheetsService } from '@/services/sheets';

const Home: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const { members, loadMembers } = useMemberStore();
  const { settings, loadSettings } = useSettingsStore();
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadMembers();
    loadSettings();
  }, [loadMembers, loadSettings]);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const openViewData = () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/dashboard/index.html'),
    });
  };

  const handlePushToSheet = async () => {
    if (!settings.googleSheetUrl) {
      alert('Please configure your Google Sheet URL in Settings first');
      return;
    }

    if (members.length === 0) {
      alert('No member data to export. Please scrape member data first.');
      return;
    }

    setIsExporting(true);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'PUSH_TO_SHEET',
        sheetUrl: settings.googleSheetUrl,
      });

      if (response?.success) {
        alert(`Successfully pushed ${response.count} members to Google Sheet!`);
      } else {
        alert(response?.error || 'Failed to push to Google Sheet');
      }
    } catch (error) {
      console.error('Error pushing to sheet:', error);
      alert('Error: Failed to push to Google Sheet. Please ensure you have granted permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadCSV = () => {
    if (members.length === 0) {
      alert('No member data to export. Please scrape member data first.');
      return;
    }

    try {
      // Get headers from sheetsService
      const headers = sheetsService.getHeaderRow();

      // Convert members to rows
      const rows = members.map(member => sheetsService.memberToSheetRow(member));

      // Create CSV content
      const csvRows = [headers, ...rows];
      const csvContent = csvRows.map(row =>
        row.map(cell => {
          const str = String(cell || '');
          // Escape quotes and wrap in quotes if contains comma, quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ).join('\n');

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `group-collect-members-${timestamp}.csv`;

      downloadCSV(filename, csvContent);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Error: Failed to download CSV file');
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl">
        {/* Welcome Header */}
        <h2 className="text-2xl font-bold mb-2">Welcome to Group Collect!</h2>
        <p className="text-gray-600 mb-6">
          Grow a group, capture a lead, sell your products.
        </p>

        {/* Tagline */}
        <p className="text-lg mb-4">
          Group collect is ready to save you time and make you money!
        </p>

        {/* Active Email */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-1">Active Email:</p>
          <p className="text-lg font-semibold text-primary">
            {user?.email || 'Not logged in'}
          </p>
        </div>

        {/* Member Count */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-1">Total Members Collected:</p>
          <p className="text-2xl font-bold text-primary">{members.length}</p>
        </div>

        {/* Export Actions */}
        <div className="space-y-3 mb-6">
          <button
            onClick={handlePushToSheet}
            disabled={isExporting || members.length === 0}
            className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isExporting ? 'Pushing to Sheet...' : 'PUSH TO GOOGLE SHEET'}
          </button>
          <button
            onClick={handleDownloadCSV}
            disabled={members.length === 0}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            DOWNLOAD CSV
          </button>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors mb-8"
        >
          LOGOUT
        </button>

        {/* Quick Links */}
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={openViewData}
              className="text-primary hover:underline"
            >
              View Data
            </button>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Log In functionality
              }}
            >
              Log In
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Get Support
              }}
            >
              Get Support
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Upgrade or Purchase
              }}
            >
              Upgrade or Purchase Installation
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement Update Card
              }}
            >
              Update Card
            </a>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement automate functionality
              }}
            >
              Want to automate and monetize your Facebook Group?
            </a>
            <span>|</span>
            <a
              href="#"
              className="text-primary hover:underline"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Implement affiliate signup
              }}
            >
              Sign up to be an affiliate
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
