import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PencilIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';

export default function ManualAdjustment({ classes, members, onRefresh }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const searchAttendance = async () => {
    if (!selectedClass || !selectedDate) {
      toast.error('Please select both class and date');
      return;
    }

    setSearchLoading(true);
    try {
      const response = await axios.get(`/api/attendance/class/${selectedClass}/date/${selectedDate}`);
      setAttendanceRecords(response.data);
    } catch (error) {
      toast.error('Failed to load attendance records');
      console.error('Error loading attendance:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const startEditing = (record) => {
    setEditingRecord({
      ...record,
      original_status: record.status,
      original_hours: record.hours_attended,
      original_check_in: record.check_in_time,
      original_check_out: record.check_out_time
    });
    setAdjustmentReason('');
  };

  const cancelEditing = () => {
    setEditingRecord(null);
    setAdjustmentReason('');
  };

  const updateField = (field, value) => {
    setEditingRecord(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveAdjustment = async () => {
    if (!adjustmentReason.trim()) {
      toast.error('Please provide a reason for the adjustment');
      return;
    }

    setLoading(true);
    try {
      await axios.put(`/api/attendance/${editingRecord.id}`, {
        status: editingRecord.status,
        hours_attended: editingRecord.hours_attended,
        check_in_time: editingRecord.check_in_time,
        check_out_time: editingRecord.check_out_time,
        adjustment_reason: adjustmentReason,
        notes: editingRecord.notes
      });

      toast.success('Attendance record updated successfully');
      setEditingRecord(null);
      setAdjustmentReason('');
      searchAttendance(); // Refresh the list
      onRefresh();
    } catch (error) {
      toast.error('Failed to update attendance record');
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
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

  const hasChanges = () => {
    if (!editingRecord) return false;
    return (
      editingRecord.status !== editingRecord.original_status ||
      editingRecord.hours_attended !== editingRecord.original_hours ||
      editingRecord.check_in_time !== editingRecord.original_check_in ||
      editingRecord.check_out_time !== editingRecord.original_check_out
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Manual Attendance Adjustment</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a class...</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.day_of_week} {cls.start_time})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={searchAttendance}
              disabled={!selectedClass || !selectedDate || searchLoading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {searchLoading ? 'Searching...' : 'Search Records'}
            </button>
          </div>
        </div>
      </div>

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
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In/Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
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
                        'No times recorded'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAttendanceTypeColor(record.attendance_type)}`}>
                        {record.attendance_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEditing(record)}
                        className="text-blue-600 hover:text-blue-900 flex items-center"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {attendanceRecords.length === 0 && selectedClass && selectedDate && !searchLoading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found for this class and date.</p>
        </div>
      )}

      {/* Edit Modal */}
      {editingRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Attendance Record
              </h3>
              
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div className="text-sm text-blue-800">
                  <strong>{editingRecord.first_name} {editingRecord.last_name}</strong> - {selectedDate}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingRecord.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="late">Late</option>
                    <option value="left_early">Left Early</option>
                    <option value="excused">Excused</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Attended
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="24"
                    value={editingRecord.hours_attended}
                    onChange={(e) => updateField('hours_attended', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check In Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingRecord.check_in_time || ''}
                    onChange={(e) => updateField('check_in_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check Out Time
                  </label>
                  <input
                    type="datetime-local"
                    value={editingRecord.check_out_time || ''}
                    onChange={(e) => updateField('check_out_time', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={editingRecord.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Explain why you're making this adjustment..."
                  required
                />
              </div>

              {hasChanges() && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center text-sm text-yellow-800">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                    <span>Changes detected - this will create an audit trail</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAdjustment}
                  disabled={loading || !adjustmentReason.trim()}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}