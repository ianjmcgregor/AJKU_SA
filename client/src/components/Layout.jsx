import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  CreditCardIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  XMarkIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useOffline } from '../contexts/OfflineContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Members', href: '/members', icon: UsersIcon },
  { name: 'Attendance', href: '/attendance', icon: ClipboardDocumentListIcon },
  { name: 'Classes', href: '/classes', icon: CalendarIcon },
  { name: 'Payments', href: '/payments', icon: CreditCardIcon },
  { name: 'Grades', href: '/grades', icon: AcademicCapIcon },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isInstructor } = useAuth();
  const { isOnline, pendingSyncItems, syncing, syncPendingData } = useOffline();
  const location = useLocation();

  const filteredNavigation = navigation.filter(item => {
    // Members can only see dashboard and their own info
    if (!isInstructor() && item.href !== '/dashboard') {
      return false;
    }
    return true;
  });

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>
            <Sidebar navigation={filteredNavigation} location={location} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
          <Sidebar navigation={filteredNavigation} location={location} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden -ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-dojo-primary"
                onClick={() => setSidebarOpen(true)}
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              {/* Connection status */}
              <div className="flex items-center ml-4">
                {isOnline ? (
                  <div className="flex items-center text-green-600">
                    <WifiIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Online</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="h-5 w-5 mr-1" />
                    <span className="text-sm font-medium">Offline</span>
                  </div>
                )}
                
                {pendingSyncItems.length > 0 && (
                  <div className="ml-4 flex items-center">
                    <button
                      onClick={syncPendingData}
                      disabled={syncing}
                      className="flex items-center text-sm text-dojo-warning hover:text-yellow-600"
                    >
                      <ArrowPathIcon className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                      {pendingSyncItems.length} pending
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-700 mr-2">
                  {user?.username}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto focus:outline-none" tabIndex={0}>
          <div className="py-6">
            <div className="mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Sidebar({ navigation, location }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 bg-dojo-primary">
        <h1 className="text-xl font-bold text-white">Karate Dojo</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-dojo-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                }`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}