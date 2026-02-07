import React, { useState, useEffect } from 'react';
import { MemberData, ExtensionSettings } from '../types/types';
import { extractSpreadsheetId } from '../services/sheetsApi';

const Popup: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'settings'>('home');
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [pushStatus, setPushStatus] = useState<'idle' | 'pushing' | 'success' | 'error'>('idle');
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'GET_DATA' }, (response) => {
      if (response?.success) {
        setMembers(response.data.members || []);
        setGoogleSheetUrl(response.data.settings?.googleSheetUrl || '');
      }
      setLoading(false);
    });
  };

  const handleSaveSettings = () => {
    setSaveStatus('saving');
    const settings: ExtensionSettings = { googleSheetUrl };

    chrome.runtime.sendMessage(
      { type: 'SAVE_SETTINGS', payload: settings },
      (response) => {
        if (response?.success) {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } else {
          setSaveStatus('idle');
          alert('Failed to save settings');
        }
      }
    );
  };

  const handleClearData = () => {
    if (confirm(`Are you sure you want to clear all ${members.length} captured members?`)) {
      chrome.runtime.sendMessage({ type: 'CLEAR_DATA' }, (response) => {
        if (response?.success) {
          setMembers([]);
        }
      });
    }
  };

  const handleExportCSV = () => {
    if (members.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = [
      'Group Name',
      'User ID',
      'Facebook User Name',
      'Joined Facebook',
      'Q1',
      'A1',
      'Q2',
      'A2',
      'Q3',
      'A3',
      'Date Added',
      'First Name',
      'Last Name',
      'City'
    ];

    const rows = members.map(m => [
      m.groupName || '',
      m.userId || '',
      m.fullName,
      m.joinedFacebook || '',
      m.question1 || '',
      m.answer1 || '',
      m.question2 || '',
      m.answer2 || '',
      m.question3 || '',
      m.answer3 || '',
      m.timestamp,
      m.firstName,
      m.lastName,
      m.city || ''
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `group-collect-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePushToSheet = async () => {
    if (members.length === 0) {
      alert('No data to push. Capture some members first.');
      return;
    }

    if (!googleSheetUrl || !googleSheetUrl.trim()) {
      alert('Please configure your Google Sheet URL in Settings first.');
      setActiveTab('settings');
      return;
    }

    const spreadsheetId = extractSpreadsheetId(googleSheetUrl);
    if (!spreadsheetId) {
      alert('Invalid Google Sheet URL. Please paste a URL like:\nhttps://docs.google.com/spreadsheets/d/.../edit');
      setActiveTab('settings');
      return;
    }

    setPushStatus('pushing');
    setPushMessage('Pushing data to Google Sheets...');

    chrome.runtime.sendMessage(
      {
        type: 'PUSH_TO_SHEET',
        payload: { spreadsheetId, members }
      },
      (response) => {
        if (response?.success) {
          setPushStatus('success');
          setPushMessage(`Successfully pushed ${response.data.rowsAppended} rows to Google Sheets!`);
          setTimeout(() => {
            setPushStatus('idle');
            setPushMessage('');
          }, 3000);
        } else {
          console.error('Push to sheet error:', response?.error);
          setPushStatus('error');
          setPushMessage(`Failed: ${response?.error || 'Unknown error'}`);
          setTimeout(() => {
            setPushStatus('idle');
            setPushMessage('');
          }, 5000);
        }
      }
    );
  };

  return (
    <div className="popup">
      <header className="popup-header">
        <div className="header-content">
          <div className="logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7V12C2 16.97 5.55 21.54 12 22C18.45 21.54 22 16.97 22 12V7L12 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h1 className="title">Group Collect</h1>
        </div>
      </header>

      <nav className="tabs">
        <button
          className={`tab ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="content">
        {activeTab === 'home' && (
          <div className="tab-content">
            <div className="stats-card">
              <div className="stat">
                <div className="stat-value">{members.length}</div>
                <div className="stat-label">Members Captured</div>
              </div>
            </div>

            {pushMessage && (
              <div className={`push-message ${pushStatus === 'success' ? 'success' : pushStatus === 'error' ? 'error' : ''}`}>
                {pushMessage}
              </div>
            )}

            <div className="section">
              <h2 className="section-title">Google Sheets</h2>
              <button
                className="btn btn-primary btn-full"
                onClick={handlePushToSheet}
                disabled={pushStatus === 'pushing' || members.length === 0}
              >
                {pushStatus === 'pushing' ? (
                  <>
                    <svg className="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="30" />
                    </svg>
                    Pushing to Sheet...
                  </>
                ) : pushStatus === 'success' ? (
                  <>✓ Pushed Successfully</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
                      <path d="M5 7H11M5 10H11" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Push to Google Sheet
                  </>
                )}
              </button>
              {!googleSheetUrl && (
                <p className="form-hint" style={{ marginTop: '8px' }}>
                  Configure your Google Sheet URL in Settings to enable this feature.
                </p>
              )}
            </div>

            <div className="section">
              <h2 className="section-title">Quick Actions</h2>
              <div className="button-group">
                <button className="btn btn-secondary" onClick={handleExportCSV}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 12L3 7H6V2H10V7H13L8 12Z" fill="currentColor" />
                    <path d="M2 14H14" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Export CSV
                </button>
                <button className="btn btn-secondary" onClick={loadData}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M13 8C13 10.76 10.76 13 8 13C5.24 13 3 10.76 3 8C3 5.24 5.24 3 8 3C9.66 3 11.13 3.87 12 5.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <path d="M12 2V5H9" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            {members.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2 className="section-title">Recent Captures</h2>
                  <button className="btn-text danger" onClick={handleClearData}>
                    Clear All
                  </button>
                </div>
                <div className="member-list">
                  {members.slice(0, 5).map((member) => (
                    <div key={member.id} className="member-item">
                      <div className="member-info">
                        <div className="member-name">{member.fullName}</div>
                        <div className="member-email">{member.groupName || 'No group'}</div>
                      </div>
                      <a
                        href={member.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="member-link"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M12 8V12H4V4H8"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                          />
                          <path d="M10 2H14V6" stroke="currentColor" strokeWidth="2" />
                          <path d="M14 2L7 9" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      </a>
                    </div>
                  ))}
                  {members.length > 5 && (
                    <div className="member-item-more">
                      +{members.length - 5} more members
                    </div>
                  )}
                </div>
              </div>
            )}

            {members.length === 0 && !loading && (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7V12C2 16.97 5.55 21.54 12 22C18.45 21.54 22 16.97 22 12V7L12 2Z"
                    fill="currentColor"
                    opacity="0.3"
                  />
                </svg>
                <h3>No Members Captured Yet</h3>
                <p>Go to your Facebook group's member requests page to start capturing data.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="tab-content">
            <div className="section">
              <h2 className="section-title">Google Sheets Integration</h2>
              <div className="form-group">
                <label htmlFor="sheet-url" className="form-label">
                  Google Sheet URL
                </label>
                <input
                  type="text"
                  id="sheet-url"
                  className="form-input"
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                />
                <p className="form-hint">
                  Paste your Google Sheet URL (e.g., https://docs.google.com/spreadsheets/d/.../edit).
                  You'll be prompted to sign in with Google the first time you push.
                </p>
                {googleSheetUrl && (
                  <p className={`form-hint ${extractSpreadsheetId(googleSheetUrl) ? 'valid-url' : 'invalid-url'}`}>
                    {extractSpreadsheetId(googleSheetUrl)
                      ? 'Valid Google Sheet URL detected.'
                      : 'Could not detect a valid Google Sheet ID from this URL.'}
                  </p>
                )}
              </div>
              <button
                className="btn btn-primary btn-full"
                onClick={handleSaveSettings}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'saved' && '✓ Saved'}
                {saveStatus === 'idle' && 'Save Settings'}
              </button>
            </div>

            <div className="section">
              <h2 className="section-title">About</h2>
              <div className="about-info">
                <div className="about-row">
                  <span className="about-label">Version</span>
                  <span className="about-value">1.0.0</span>
                </div>
                <div className="about-row">
                  <span className="about-label">Status</span>
                  <span className="about-value status-active">Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Popup;
