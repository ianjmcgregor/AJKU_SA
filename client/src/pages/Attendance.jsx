import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  PencilIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

import LiveAttendance from '../components/attendance/LiveAttendance';
import BackdateAttendance from '../components/attendance/BackdateAttendance';
import ManualAdjustment from '../components/attendance/ManualAdjustment';
import AttendanceHistory from '../components/attendance/AttendanceHistory';

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('live');
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [classesResponse, membersResponse] = await Promise.all([
        axios.get('/api/classes?active=true'),
        axios.get('/api/members?status=active')
      ]);
      setClasses(classesResponse.data);
      setMembers(membersResponse.data);
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'live', name: 'Live Tracking', icon: ClockIcon },
    { id: 'backdate', name: 'Back Date', icon: CalendarIcon },
    { id: 'adjust', name: 'Manual Adjust', icon: PencilIcon },
    { id: 'history', name: 'History', icon: EyeIcon }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="text-gray-600 mt-1">
              Track student attendance with live updates, back dating, and manual adjustments.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <UserGroupIcon className="h-5 w-5" />
            <span>{members.length} Active Members</span>
            <span>•</span>
            <span>{classes.length} Classes</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'live' && (
            <LiveAttendance classes={classes} members={members} onRefresh={fetchData} />
          )}
          {activeTab === 'backdate' && (
            <BackdateAttendance classes={classes} members={members} onRefresh={fetchData} />
          )}
          {activeTab === 'adjust' && (
            <ManualAdjustment classes={classes} members={members} onRefresh={fetchData} />
          )}
          {activeTab === 'history' && (
            <AttendanceHistory classes={classes} members={members} />
          )}
        </div>
      </div>
    </div>
  );
}