import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  ClockIcon,
  PlusIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

export default function LiveAttendance({ classes, members, onRefresh }) {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeSession, setActiveSession] = useState(null);
  const [liveAttendance, setLiveAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const startSession = async () => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    setSessionLoading(true);
    try {
      const response = await axios.post('/api/attendance/sessions', {
        class_id: selectedClass,
        date: selectedDate,
        notes: `Live session for ${selectedDate}`
      });
      
      setActiveSession(response.data);
      toast.success('Session started successfully');
    } catch (error) {
      toast.error('Failed to start session');
      console.error('Error starting session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;

    setSessionLoading(true);
    try {
      await axios.put(`/api/attendance/sessions/${activeSession.id}/end`);
      setActiveSession(null);
      setLiveAttendance([]);
      toast.success('Session ended successfully');
    } catch (error) {
      toast.error('Failed to end session');
      console.error('Error ending session:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const finalizeSession = async () => {
    if (!activeSession) return;

    setSessionLoading(true);
    try {
      await axios.post(`/api/attendance/sessions/${activeSession.id}/finalize`);
      setActiveSession(null);
      setLiveAttendance([]);
      toast.success('Attendance finalized successfully');
      onRefresh();
    } catch (error) {
      toast.error('Failed to finalize attendance');
      console.error('Error finalizing attendance:', error);
    } finally {
      setSessionLoading(false);
    }
  };

  const checkInMember = async (memberId) => {
    if (!activeSession) return;

    setLoading(true);
    try {
      await axios.post('/api/attendance/live', {
        session_id: activeSession.id,
        member_id: memberId,
        action: 'check_in'
      });
      
      // Update local state
      const member = members.find(m => m.id === memberId);
      setLiveAttendance(prev => [...prev, {
        member_id: memberId,
        first_name: member.first_name,
        last_name: member.last_name,
        check_in_time: new Date().toISOString(),
        status: 'present'
      }]);
      
      toast.success(`${member.first_name} checked in`);
    } catch (error) {
      toast.error('Failed to check in member');
      console.error('Error checking in:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkOutMember = async (memberId) => {
    if (!activeSession) return;

    setLoading(true);
    try {
      await axios.post('/api/attendance/live', {
        session_id: activeSession.id,
        member_id: memberId,
        action: 'check_out'
      });
      
      // Update local state
      setLiveAttendance(prev => prev.map(att => 
        att.member_id === memberId 
          ? { ...att, check_out_time: new Date().toISOString(), status: 'left_early' }
          : att
      ));
      
      const member = members.find(m => m.id === memberId);
      toast.success(`${member.first_name} checked out`);
    } catch (error) {
      toast.error('Failed to check out member');
      console.error('Error checking out:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCheckedInMembers = () => {
    return liveAttendance.filter(att => !att.check_out_time);
  };

  const getCheckedOutMembers = () => {
    return liveAttendance.filter(att => att.check_out_time);
  };

  const getAvailableMembers = () => {
    const checkedInIds = liveAttendance.map(att => att.member_id);
    return members.filter(member => !checkedInIds.includes(member.id));
  };

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Live Session Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={activeSession}
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
              disabled={activeSession}
            />
          </div>
          
          <div className="flex items-end space-x-2">
            {!activeSession ? (
              <button
                onClick={startSession}
                disabled={!selectedClass || sessionLoading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlayIcon className="h-4 w-4 mr-2" />
                {sessionLoading ? 'Starting...' : 'Start Session'}
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={endSession}
                  disabled={sessionLoading}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  <StopIcon className="h-4 w-4 mr-2" />
                  End Session
                </button>
                <button
                  onClick={finalizeSession}
                  disabled={sessionLoading}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Finalize
                </button>
              </div>
            )}
          </div>
        </div>

        {activeSession && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center">
              <ClockIcon className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">
                Session Active - {liveAttendance.length} members checked in
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Attendance Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <UserIcon className="h-5 w-5 mr-2" />
            Available Members ({getAvailableMembers().length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getAvailableMembers().map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {member.current_grade || 'No grade'}
                  </div>
                </div>
                <button
                  onClick={() => checkInMember(member.id)}
                  disabled={loading || !activeSession}
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Check In
                </button>
              </div>
            ))}
            
            {getAvailableMembers().length === 0 && (
              <div className="text-center text-gray-500 py-8">
                All members are checked in
              </div>
            )}
          </div>
        </div>

        {/* Checked In Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-600" />
            Checked In ({getCheckedInMembers().length})
          </h3>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {getCheckedInMembers().map((attendance) => (
              <div
                key={attendance.member_id}
                className="flex items-center justify-between p-3 border border-green-200 rounded-md bg-green-50"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {attendance.first_name} {attendance.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Checked in at {format(new Date(attendance.check_in_time), 'HH:mm')}
                  </div>
                </div>
                <button
                  onClick={() => checkOutMember(attendance.member_id)}
                  disabled={loading}
                  className="flex items-center px-3 py-1 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                  <MinusIcon className="h-4 w-4 mr-1" />
                  Check Out
                </button>
              </div>
            ))}
            
            {getCheckedInMembers().length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No members checked in
              </div>
            )}
          </div>

          {/* Checked Out Members */}
          {getCheckedOutMembers().length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                <XCircleIcon className="h-4 w-4 mr-2 text-orange-600" />
                Checked Out ({getCheckedOutMembers().length})
              </h4>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {getCheckedOutMembers().map((attendance) => (
                  <div
                    key={attendance.member_id}
                    className="flex items-center justify-between p-2 border border-orange-200 rounded-md bg-orange-50"
                  >
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {attendance.first_name} {attendance.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(attendance.check_in_time), 'HH:mm')} - {format(new Date(attendance.check_out_time), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}