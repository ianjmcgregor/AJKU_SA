import React, { useState } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

export default function BackdateAttendance({ classes, members, onRefresh }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(false);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

  const handleMemberSelection = (memberId, checked) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
      setAttendanceData(prev => ({
        ...prev,
        [memberId]: {
          status: 'present',
          hours_attended: classes.find(c => c.id === parseInt(selectedClass))?.duration_hours || 1.0,
          check_in_time: '',
          check_out_time: '',
          notes: ''
        }
      }));
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
      const newData = { ...attendanceData };
      delete newData[memberId];
      setAttendanceData(newData);
    }
  };

  const updateAttendanceData = (memberId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
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

  const submitAttendance = async () => {
    if (!selectedClass || !selectedDate || selectedMembers.length === 0) {
      toast.error('Please select class, date, and at least one member');
      return;
    }

    if (!adjustmentReason.trim()) {
      toast.error('Please provide a reason for backdating');
      return;
    }

    setLoading(true);
    const promises = selectedMembers.map(memberId => {
      const data = attendanceData[memberId];
      return axios.post('/api/attendance/backdate', {
        member_id: memberId,
        class_id: selectedClass,
        date: selectedDate,
        status: data.status,
        hours_attended: data.hours_attended,
        check_in_time: data.check_in_time || null,
        check_out_time: data.check_out_time || null,
        adjustment_reason: adjustmentReason,
        notes: data.notes
      });
    });

    try {
      await Promise.all(promises);
      toast.success(`Attendance recorded for ${selectedMembers.length} members`);
      
      // Reset form
      setSelectedMembers([]);
      setAttendanceData({});
      setAdjustmentReason('');
      onRefresh();
    } catch (error) {
      toast.error('Failed to record attendance');
      console.error('Error recording attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedClassInfo = classes.find(c => c.id === parseInt(selectedClass));

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Backdate Attendance</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Reason for Backdating
          </label>
          <textarea
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="Explain why you're backdating this attendance..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="2"
          />
        </div>

        {selectedClassInfo && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center text-sm text-blue-800">
              <ClockIcon className="h-4 w-4 mr-2" />
              <span>
                Class Duration: {selectedClassInfo.duration_hours} hours 
                ({selectedClassInfo.start_time} - {selectedClassInfo.end_time})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Member Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <UserIcon className="h-5 w-5 mr-2" />
          Select Members ({selectedMembers.length} selected)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {members.map((member) => {
            const isSelected = selectedMembers.includes(member.id);
            return (
              <div
                key={member.id}
                className={`p-3 border rounded-md cursor-pointer transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleMemberSelection(member.id, !isSelected)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {member.current_grade || 'No grade'}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleMemberSelection(member.id, e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance Details */}
      {selectedMembers.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Details</h3>
          
          <div className="space-y-4">
            {selectedMembers.map((memberId) => {
              const member = members.find(m => m.id === memberId);
              const data = attendanceData[memberId] || {};
              
              return (
                <div key={memberId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">
                      {member.first_name} {member.last_name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(data.status)}`}>
                      {data.status || 'present'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={data.status || 'present'}
                        onChange={(e) => updateAttendanceData(memberId, 'status', e.target.value)}
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
                        value={data.hours_attended || ''}
                        onChange={(e) => updateAttendanceData(memberId, 'hours_attended', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={selectedClassInfo?.duration_hours || '1.0'}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check In Time
                      </label>
                      <input
                        type="datetime-local"
                        value={data.check_in_time || ''}
                        onChange={(e) => updateAttendanceData(memberId, 'check_in_time', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Check Out Time
                      </label>
                      <input
                        type="datetime-local"
                        value={data.check_out_time || ''}
                        onChange={(e) => updateAttendanceData(memberId, 'check_out_time', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={data.notes || ''}
                      onChange={(e) => updateAttendanceData(memberId, 'notes', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows="2"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={submitAttendance}
              disabled={loading || !adjustmentReason.trim()}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {loading ? 'Recording...' : 'Record Attendance'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}