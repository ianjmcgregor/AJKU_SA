import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import MemberDetail from './pages/MemberDetail';
import Attendance from './pages/Attendance';
import Payments from './pages/Payments';
import Classes from './pages/Classes';
import Grades from './pages/Grades';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/members/:id" element={<MemberDetail />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;