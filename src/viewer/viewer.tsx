import React, { useState, useEffect } from 'react';
import { MemberData } from '../types/types';

const Viewer: React.FC = () => {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'GET_DATA' }, (response) => {
      if (response?.success) {
        setMembers(response.data.members || []);
      }
      setLoading(false);
    });
  };

  const handleClearAll = () => {
    const count = members.length;
    if (confirm('Are you sure you want to clear all captured members?')) {
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

    const headers = ['Group Name', 'User ID', 'Facebook User Name', 'Joined Facebook', 'Q1', 'A1', 'Q2', 'A2', 'Q3', 'A3', 'Date Added', 'First Name', 'Last Name', 'City'];
    const rows = members.map(m => [m.groupName || '', m.userId || '', m.fullName, m.joinedFacebook || '', m.question1 || '', m.answer1 || '', m.question2 || '', m.answer2 || '', m.question3 || '', m.answer3 || '', m.timestamp, m.firstName, m.lastName, m.city || '']);
    const csv = [headers, ...rows].map(row => row.map(cell => '"' + cell + '"').join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'group-collect.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredMembers = members.filter(member => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      member.fullName.toLowerCase().includes(query) ||
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.userId?.toLowerCase().includes(query) ||
      member.groupName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="viewer">
      <header className="viewer-header">
        <div className="header-content">
          <div className="header-left">
            <div className="logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7V12C2 16.97 5.55 21.54 12 22C18.45 21.54 22 16.97 22 12V7L12 2Z" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h1 className="title">Group Collect</h1>
              <p className="subtitle">{members.length} members captured</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={loadData}>Refresh</button>
            <button className="btn btn-primary" onClick={handleExportCSV}>Export CSV</button>
          </div>
        </div>
      </header>

      <div className="viewer-controls">
        <input type="text" className="search-input" placeholder="Search members..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        {members.length > 0 && <button className="btn-text danger" onClick={handleClearAll}>Clear All Data</button>}
      </div>

      <main className="viewer-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="empty-state">
            <h2>No Members Found</h2>
            <p>{searchQuery ? 'No members match your search query.' : 'Go to your Facebook group member requests page to start capturing data.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Group Name</th>
                  <th>User ID</th>
                  <th>Facebook User Name</th>
                  <th>Joined Facebook</th>
                  <th>Q1</th>
                  <th>A1</th>
                  <th>Q2</th>
                  <th>A2</th>
                  <th>Q3</th>
                  <th>A3</th>
                  <th>Date Added</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>City</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.groupName || ''}</td>
                    <td>{member.userId || ''}</td>
                    <td className="name-cell">{member.fullName}</td>
                    <td>{member.joinedFacebook || ''}</td>
                    <td>{member.question1 || ''}</td>
                    <td>{member.answer1 || ''}</td>
                    <td>{member.question2 || ''}</td>
                    <td>{member.answer2 || ''}</td>
                    <td>{member.question3 || ''}</td>
                    <td>{member.answer3 || ''}</td>
                    <td className="date-cell">{new Date(member.timestamp).toLocaleDateString()}</td>
                    <td>{member.firstName}</td>
                    <td>{member.lastName}</td>
                    <td>{member.city || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default Viewer;
