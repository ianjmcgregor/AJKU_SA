import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  UserIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentTextIcon,
  FunnelIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function AttendanceHistory({ classes, members }) {
  const [filters, setFilters] = useState({
    member_id: '',
    class_id: '',
    date_from: '',
    date_to: '',
    status: '',
    attendance_type: ''
  });
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (filters.member_id || filters.class_id || filters.date_from || filters.date_to) {
      fetchAttendanceHistory();
    }
  }, [filters]);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await axios.get(`/api/attendance?${params.toString()}&limit=1000`);
      setAttendanceRecords(response.data);
      calculateStats(response.data);
    } catch (error) {
      toast.error('Failed to load attendance history');
      console.error('Error loading attendance history:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (records) => {
    const totalRecords = records.length;
    const presentCount = records.filter(r => r.status === 'present').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const excusedCount = records.filter(r => r.status === 'excused').length;
    const totalHours = records.reduce((sum, r) => sum + (r.hours_attended || 0), 0);
    const attendanceRate = totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : 0;

    setStats({
      totalRecords,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      totalHours: totalHours.toFixed(1),
      attendanceRate
    });
  };

  const updateFilter = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      member_id: '',
      class_id: '',
      date_from: '',
      date_to: '',
      status: '',
      attendance_type: ''
    });
    setAttendanceRecords([]);
    setStats({});
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-orange-600 bg-orange-100';
      case 'left_early': return 'text-yellow-600 bg-yellow-100';
      case 'excused': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAttendanceTypeColor = (type) => {
    switch (type) {
      case 'regular': return 'text-gray-600 bg-gray-100';
      case 'backdated': return 'text-purple-600 bg-purple-100';
      case 'manual_adjustment': return 'text-orange-600 bg-orange-100';
      case 'live_update': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const exportToCSV = () => {
    if (attendanceRecords.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Date', 'Member', 'Class', 'Status', 'Hours', 'Check In', 'Check Out', 'Type', 'Notes'];
    const csvContent = [
      headers.join(','),
      ...attendanceRecords.map(record => [
        record.date,
        `${record.first_name} ${record.last_name}`,
        record.class_name,
        record.status,
        record.hours_attended,
        record.check_in_time ? format(new Date(record.check_in_time), 'yyyy-MM-dd HH:mm') : '',
        record.check_out_time ? format(new Date(record.check_out_time), 'yyyy-MM-dd HH:mm') : '',
        record.attendance_type,
        record.notes || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_history_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Attendance History & Analytics
          </h3>
          <button
            onClick={exportToCSV}
            disabled={attendanceRecords.length === 0}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Member
            </label>
            <select
              value={filters.member_id}
              onChange={(e) => updateFilter('member_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Members</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.first_name} {member.last_name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Class
            </label>
            <select
              value={filters.class_id}
              onChange={(e) => updateFilter('class_id', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => updateFilter('status', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="left_early">Left Early</option>
              <option value="excused">Excused</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => updateFilter('date_from', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => updateFilter('date_to', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={filters.attendance_type}
              onChange={(e) => updateFilter('attendance_type', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="backdated">Backdated</option>
              <option value="manual_adjustment">Manual Adjustment</option>
              <option value="live_update">Live Update</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Statistics */}
      {Object.keys(stats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalRecords}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.attendanceRate}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Hours</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalHours}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Present</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.presentCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Records */}
      {attendanceRecords.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Attendance Records ({attendanceRecords.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Times
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {record.first_name} {record.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.grade_name || 'No grade'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.class_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.hours_attended} hrs
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.check_in_time ? (
                        <div>
                          <div>In: {format(new Date(record.check_in_time), 'HH:mm')}</div>
                          {record.check_out_time && (
                            <div>Out: {format(new Date(record.check_out_time), 'HH:mm')}</div>
                          )}
                        </div>
                      ) : (
                        'No times'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceTypeColor(record.attendance_type)}`}>
                        {record.attendance_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && attendanceRecords.length === 0 && Object.keys(filters).some(key => filters[key]) && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found with the current filters.</p>
        </div>
      )}
    </div>
  );
}