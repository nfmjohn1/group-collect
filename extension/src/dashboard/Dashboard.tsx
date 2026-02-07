import React, { useEffect, useState, useMemo } from 'react';
import { useMemberStore } from '@/store/memberStore';
import { useSettingsStore } from '@/store/settingsStore';
import { sheetsService } from '@/services/sheets';
import { downloadCSV } from '@/shared/utils';
import type { MemberRequest } from '@/shared/types';

const Dashboard: React.FC = () => {
  const { members, loadMembers, clearMembers } = useMemberStore();
  const { settings, loadSettings } = useSettingsStore();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof MemberRequest>('joinedOn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load data on mount
  useEffect(() => {
    loadMembers();
    loadSettings();
    setLastRefresh(new Date());
  }, [loadMembers, loadSettings]);

  // Get unique group names for filter
  const groupNames = useMemo(() => {
    const names = new Set(members.map(m => m.groupName).filter(Boolean));
    return Array.from(names);
  }, [members]);

  // Filter and sort members
  const filteredAndSortedMembers = useMemo(() => {
    let filtered = members.filter((member) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        member.facebookUsername?.toLowerCase().includes(query) ||
        member.firstName?.toLowerCase().includes(query) ||
        member.lastName?.toLowerCase().includes(query) ||
        member.groupName?.toLowerCase().includes(query) ||
        member.q1?.toLowerCase().includes(query) ||
        member.q2?.toLowerCase().includes(query) ||
        member.q3?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
      const matchesGroup = groupFilter === 'all' || member.groupName === groupFilter;

      return matchesSearch && matchesStatus && matchesGroup;
    });

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [members, searchQuery, statusFilter, groupFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedMembers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMembers = filteredAndSortedMembers.slice(startIndex, endIndex);

  // Statistics
  const stats = useMemo(() => {
    const pending = members.filter(m => m.status === 'pending').length;
    const approved = members.filter(m => m.status === 'approved').length;
    const declined = members.filter(m => m.status === 'declined').length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const addedToday = members.filter(m => {
      const dateAdded = new Date(m.dateAdded);
      dateAdded.setHours(0, 0, 0, 0);
      return dateAdded.getTime() === today.getTime();
    }).length;

    return { pending, approved, declined, addedToday };
  }, [members]);

  // Handlers
  const handleSort = (field: keyof MemberRequest) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === paginatedMembers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(paginatedMembers.map(m => m.id)));
    }
  };

  const handleSelectMember = (id: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMembers(newSelected);
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    await loadMembers();
    setLastRefresh(new Date());
    setIsLoading(false);
  };

  const handleExportCSV = () => {
    const membersToExport = selectedMembers.size > 0
      ? members.filter(m => selectedMembers.has(m.id))
      : filteredAndSortedMembers;

    if (membersToExport.length === 0) {
      alert('No members to export');
      return;
    }

    try {
      const headers = sheetsService.getHeaderRow();
      const rows = membersToExport.map(member => sheetsService.memberToSheetRow(member));

      const csvRows = [headers, ...rows];
      const csvContent = csvRows.map(row =>
        row.map(cell => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ).join('\n');

      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `group-collect-members-${timestamp}.csv`;
      downloadCSV(filename, csvContent);

      alert(`Successfully exported ${membersToExport.length} members to CSV!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  const handlePushToSheets = async () => {
    if (!settings.googleSheetUrl) {
      alert('Please configure your Google Sheet URL in Settings first');
      return;
    }

    if (members.length === 0) {
      alert('No members to push');
      return;
    }

    setIsLoading(true);
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
      alert('Failed to push to Google Sheet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSheet = () => {
    if (!settings.googleSheetUrl) {
      alert('Please configure your Google Sheet URL in Settings first');
      return;
    }
    chrome.tabs.create({ url: settings.googleSheetUrl });
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all member data? This cannot be undone.')) {
      return;
    }

    try {
      await clearMembers();
      setSelectedMembers(new Set());
      setCurrentPage(1);
      alert('All member data has been cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear data');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setGroupFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Group Collect Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Group collect helps to automate FB member requests
              </p>
              <p className="text-sm text-gray-600">
                Convert your group member requests into leads today!
              </p>
            </div>
            <div className="text-right">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark transition-colors disabled:bg-gray-400"
              >
                {isLoading ? 'Refreshing...' : 'Refresh Data'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Action Buttons */}
      <div className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              Download to CSV {selectedMembers.size > 0 && `(${selectedMembers.size})`}
            </button>
            <button
              onClick={handlePushToSheets}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              Push to Google Sheet
            </button>
            <button
              onClick={handleOpenSheet}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
            >
              Open Google Sheet
            </button>
            {selectedMembers.size > 0 && (
              <button
                onClick={() => setSelectedMembers(new Set())}
                className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors"
              >
                Clear Selection ({selectedMembers.size})
              </button>
            )}
            <button
              onClick={handleClearData}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Total Members</h3>
            <p className="mt-1 text-2xl font-semibold text-primary">{members.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Pending</h3>
            <p className="mt-1 text-2xl font-semibold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Approved</h3>
            <p className="mt-1 text-2xl font-semibold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xs font-medium text-gray-500 uppercase">Declined</h3>
            <p className="mt-1 text-2xl font-semibold text-red-600">{stats.declined}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Groups</option>
                {groupNames.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={paginatedMembers.length > 0 && selectedMembers.size === paginatedMembers.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th
                  onClick={() => handleSort('groupName')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Group Name {sortField === 'groupName' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('facebookUsername')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Username {sortField === 'facebookUsername' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => handleSort('joinedOn')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Joined On {sortField === 'joinedOn' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q1
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q2
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Q3
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                >
                  Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    {members.length === 0
                      ? 'No member data available. Start collecting data from Facebook groups.'
                      : 'No members match your current filters.'}
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`hover:bg-gray-50 ${selectedMembers.has(member.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedMembers.has(member.id)}
                        onChange={() => handleSelectMember(member.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.groupName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.facebookUsername}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {new Date(member.joinedOn).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{member.q1 || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{member.q2 || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">{member.q3 || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
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

        {/* Pagination */}
        {filteredAndSortedMembers.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedMembers.length)} of{' '}
                {filteredAndSortedMembers.length} members
              </div>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-primary text-white border-primary'
                          : 'border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
