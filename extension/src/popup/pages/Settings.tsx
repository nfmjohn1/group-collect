import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { isValidGoogleSheetUrl } from '@/shared/utils';

const Settings: React.FC = () => {
  const { settings, loadSettings, updateSettings } = useSettingsStore();
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [activeDecline, setActiveDecline] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Decline rules
  const [declineIfEmailMissing, setDeclineIfEmailMissing] = useState(false);
  const [declineIfQ1Missing, setDeclineIfQ1Missing] = useState(false);
  const [declineIfQ2Missing, setDeclineIfQ2Missing] = useState(false);
  const [declineIfQ3Missing, setDeclineIfQ3Missing] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    setSheetUrl(settings.googleSheetUrl || '');
    setSelectedGroup(settings.selectedGroupId || '');
    setActiveDecline(settings.activeDeclineFeature);

    // Load decline rules
    setDeclineIfEmailMissing(settings.declineRules?.declineIfEmailMissing || false);
    setDeclineIfQ1Missing(settings.declineRules?.requiredQuestions?.includes('q1') || false);
    setDeclineIfQ2Missing(settings.declineRules?.requiredQuestions?.includes('q2') || false);
    setDeclineIfQ3Missing(settings.declineRules?.requiredQuestions?.includes('q3') || false);
  }, [settings]);

  const handleSaveSheetUrl = async () => {
    if (!isValidGoogleSheetUrl(sheetUrl)) {
      alert('Please enter a valid Google Sheets URL');
      return;
    }

    try {
      await updateSettings({ googleSheetUrl: sheetUrl });
      alert('Google Sheet URL saved successfully!');
    } catch (error) {
      console.error('Error saving sheet URL:', error);
      alert('Failed to save Google Sheet URL');
    }
  };

  const handleSyncQuestions = async () => {
    if (!sheetUrl || !isValidGoogleSheetUrl(sheetUrl)) {
      alert('Please save a valid Google Sheet URL first');
      return;
    }

    try {
      // Send message to background script to sync questions with Google Sheets
      const response = await chrome.runtime.sendMessage({
        type: 'SYNC_QUESTIONS_TO_SHEET',
        sheetUrl
      });

      if (response?.success) {
        setLastSync(new Date());
        alert('Questions/Answers mapping synced successfully!');
      } else {
        alert(response?.error || 'Failed to sync questions. Please try again.');
      }
    } catch (error) {
      console.error('Error syncing questions:', error);
      alert('Error syncing questions. Please ensure you have granted permissions to access Google Sheets.');
    }
  };

  const handleOpenSheet = () => {
    if (!sheetUrl || !isValidGoogleSheetUrl(sheetUrl)) {
      alert('Please save a valid Google Sheet URL first');
      return;
    }
    chrome.tabs.create({ url: sheetUrl });
  };

  const handleToggleDecline = async () => {
    if (!activeDecline) {
      // Turning ON - show confirmation
      const confirmed = confirm(
        'WARNING: The Auto-Decline feature will automatically decline member requests that don\'t meet your criteria. ' +
        'This action cannot be undone. Are you sure you want to enable this feature?'
      );
      if (!confirmed) return;
    }

    try {
      await updateSettings({ activeDeclineFeature: !activeDecline });
      setActiveDecline(!activeDecline);
    } catch (error) {
      console.error('Error toggling decline feature:', error);
    }
  };

  const handleSaveDeclineRules = async () => {
    try {
      const requiredQuestions: string[] = [];
      if (declineIfQ1Missing) requiredQuestions.push('q1');
      if (declineIfQ2Missing) requiredQuestions.push('q2');
      if (declineIfQ3Missing) requiredQuestions.push('q3');

      const declineRules = {
        declineIfEmailMissing,
        requiredQuestions,
      };

      await updateSettings({ declineRules });
      alert('Decline rules saved successfully!');
    } catch (error) {
      console.error('Error saving decline rules:', error);
      alert('Failed to save decline rules');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">Extension Settings</h2>

      <div className="space-y-6 max-w-2xl">
        {/* Active Decline Feature */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold mb-1">Auto-Decline Feature</h3>
              <p className="text-sm text-gray-600">
                Automatically decline members who don't meet criteria
              </p>
            </div>
            <button
              onClick={handleToggleDecline}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${activeDecline ? 'bg-primary' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${activeDecline ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          {/* Decline Rules Configuration */}
          {activeDecline && (
            <div className="mt-4 pt-4 border-t border-gray-300">
              <h4 className="font-medium text-sm mb-3">Decline Rules</h4>
              <div className="space-y-3">
                {/* Email Required */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={declineIfEmailMissing}
                    onChange={(e) => setDeclineIfEmailMissing(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Decline if email is missing</span>
                    <p className="text-xs text-gray-500">Automatically decline members who don't provide an email address</p>
                  </div>
                </label>

                {/* Q1 Required */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={declineIfQ1Missing}
                    onChange={(e) => setDeclineIfQ1Missing(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Decline if Question 1 is unanswered</span>
                    <p className="text-xs text-gray-500">Require answer to the first approval question</p>
                  </div>
                </label>

                {/* Q2 Required */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={declineIfQ2Missing}
                    onChange={(e) => setDeclineIfQ2Missing(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Decline if Question 2 is unanswered</span>
                    <p className="text-xs text-gray-500">Require answer to the second approval question</p>
                  </div>
                </label>

                {/* Q3 Required */}
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={declineIfQ3Missing}
                    onChange={(e) => setDeclineIfQ3Missing(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">Decline if Question 3 is unanswered</span>
                    <p className="text-xs text-gray-500">Require answer to the third approval question</p>
                  </div>
                </label>

                {/* Save Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSaveDeclineRules}
                    className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                  >
                    Save Decline Rules
                  </button>
                </div>
              </div>

              {/* Warning Message */}
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-xs text-yellow-800">
                  <strong>⚠️ Warning:</strong> Auto-declined members will be permanently declined and cannot be easily restored. Make sure your rules are configured correctly before enabling this feature.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* FB Group Setting */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-4">FB Group Setting</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please select group to customize
              </label>
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Select</option>
                {/* TODO: Populate with actual groups */}
                <option value="group1">My Facebook Group 1</option>
                <option value="group2">My Facebook Group 2</option>
              </select>
            </div>

            {/* Google Sheet URL */}
            <div>
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold mr-2">
                  1
                </span>
                <label className="text-sm font-medium text-gray-700">
                  Please enter the URL of your Google Sheet
                </label>
              </div>
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveSheetUrl}
                  className="text-sm text-primary hover:underline"
                >
                  Save URL
                </button>
                {sheetUrl && isValidGoogleSheetUrl(sheetUrl) && (
                  <button
                    onClick={handleOpenSheet}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Open Google Sheet
                  </button>
                )}
              </div>
            </div>

            {/* Sync Questions */}
            <div>
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold mr-2">
                  2
                </span>
                <label className="text-sm font-medium text-gray-700">
                  Sync Question and Answers Mapping (Approval Questions)
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSyncQuestions}
                  className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark transition-colors"
                >
                  SYNC QUESTIONS/ANSWERS
                </button>
                {lastSync && (
                  <button className="border border-gray-300 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors">
                    Last Sync at {lastSync.toLocaleTimeString()}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
