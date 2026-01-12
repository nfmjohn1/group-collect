import React, { useEffect, useState } from 'react';
import { useMemberStore } from '@/store/memberStore';

const Dashboard: React.FC = () => {
  const { members, loadMembers } = useMemberStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = members.filter((member) => {
    const query = searchQuery.toLowerCase();
    return (
      member.facebookUsername?.toLowerCase().includes(query) ||
      member.firstName?.toLowerCase().includes(query) ||
      member.lastName?.toLowerCase().includes(query) ||
      member.groupName?.toLowerCase().includes(query)
    );
  });

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    alert('CSV export coming soon!');
  };

  const handlePushToSheets = () => {
    // TODO: Implement Google Sheets push
    alert('Push to Google Sheets coming soon!');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      // TODO: Implement clear data
      alert('Clear data coming soon!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Group Collect</h1>
              <p className="text-sm text-gray-600 mt-1">
                Group collect helps to automate FB member requests
              </p>
              <p className="text-sm text-gray-600">
                Convert your group member requests into leads today!
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition-colors">
              Automate
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-primary-light text-white px-4 py-2 rounded hover:bg-primary transition-colors"
            >
              Download to CSV
            </button>
            <button
              onClick={handlePushToSheets}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
            >
              Push to Google Sheet
            </button>
            <button
              onClick={handleClearData}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Clear Data
            </button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
              Example Community
            </button>
            <button className="bg-primary-light text-white px-4 py-2 rounded hover:bg-primary transition-colors">
              Open Google Sheet
            </button>
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors">
              Automate Fbook
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facebook Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q1
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q2
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q3
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No member data available. Start collecting data from Facebook groups.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.groupName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.userId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.facebookUsername}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(member.joinedOn).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{member.q1 || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{member.q2 || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{member.q3 || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.firstName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {member.lastName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          member.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : member.status === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Members</h3>
            <p className="mt-2 text-3xl font-semibold text-primary">{members.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Pending</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">
              {members.filter((m) => m.status === 'pending').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Approved</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              {members.filter((m) => m.status === 'approved').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
