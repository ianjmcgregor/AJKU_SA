import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  CalendarIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);
  const { user, isInstructor } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, membersResponse, attendanceResponse, paymentsResponse] = await Promise.all([
        axios.get('/api/dashboard/stats'),
        axios.get('/api/members?limit=5'),
        axios.get('/api/attendance?limit=5'),
        axios.get('/api/payments?limit=5')
      ]);

      setStats(statsResponse.data);
      
      // Combine recent activity
      const activity = [
        ...membersResponse.data.map(member => ({
          type: 'member',
          description: `New member: ${member.first_name} ${member.last_name}`,
          date: member.join_date,
          icon: UsersIcon
        })),
        ...attendanceResponse.data.map(attendance => ({
          type: 'attendance',
          description: `${attendance.first_name} ${attendance.last_name} attended ${attendance.class_name}`,
          date: attendance.date,
          icon: CalendarIcon
        })),
        ...paymentsResponse.data.map(payment => ({
          type: 'payment',
          description: `Payment of $${payment.amount} from ${payment.first_name} ${payment.last_name}`,
          date: payment.payment_date,
          icon: CreditCardIcon
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Members',
      value: stats?.members?.active || 0,
      change: '+12%',
      changeType: 'increase',
      icon: UsersIcon,
      color: 'blue',
      link: '/members'
    },
    {
      title: 'Monthly Attendance',
      value: stats?.attendance_this_month || 0,
      change: '+8%',
      changeType: 'increase',
      icon: CalendarIcon,
      color: 'green',
      link: '/attendance'
    },
    {
      title: 'Monthly Revenue',
      value: `$${stats?.revenue_this_month || 0}`,
      change: '+23%',
      changeType: 'increase',
      icon: CreditCardIcon,
      color: 'purple',
      link: '/payments'
    },
    {
      title: 'Overdue Payments',
      value: stats?.overdue_payments || 0,
      change: '-5%',
      changeType: 'decrease',
      icon: ExclamationTriangleIcon,
      color: 'red',
      link: '/payments?status=overdue'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.username}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening at your dojo today.
        </p>
      </div>

      {/* Stats Grid */}
      {isInstructor() && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-${stat.color}-100`}>
                  <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {stat.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ml-1 ${
                  stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        {isInstructor() && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {isInstructor() && (
                <>
                  <Link
                    to="/members"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <UsersIcon className="h-6 w-6 text-blue-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Manage Members</p>
                      <p className="text-sm text-gray-500">Add, edit, or view member profiles</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/attendance"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CalendarIcon className="h-6 w-6 text-green-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Record Attendance</p>
                      <p className="text-sm text-gray-500">Mark student attendance for today</p>
                    </div>
                  </Link>
                  
                  <Link
                    to="/payments"
                    className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <CreditCardIcon className="h-6 w-6 text-purple-600 mr-3" />
                    <div>
                      <p className="font-medium text-gray-900">Process Payment</p>
                      <p className="text-sm text-gray-500">Record new payment or view history</p>
                    </div>
                  </Link>
                </>
              )}
              
              <Link
                to="/grades"
                className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="h-6 w-6 text-yellow-600 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">View Grades</p>
                  <p className="text-sm text-gray-500">Check belt requirements and progress</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Member Stats Summary */}
      {isInstructor() && stats?.members && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Membership Overview</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.members).map(([status, count]) => (
                <div key={status} className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{count}</div>
                  <div className="text-sm text-gray-500 capitalize">{status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}