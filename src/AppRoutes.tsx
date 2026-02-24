import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        window.location.reload();
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        Loading...
      </div>
    );
  }
  return (
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/signup" 
          element={!user ? <Signup /> : <Navigate to="/dashboard" replace />} 
        />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route 
            path="/dashboard" 
            element={<Dashboard user={user!} onLogout={logout} />} 
          />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/" element={<Navigate to="/projects" replace />} />
        </Route>

        {/* Catch-all */}
        <Route 
          path="*" 
          element={<Navigate to={user ? '/dashboard' : '/login'} replace />} 
        />
      </Routes>
  );
};

export default AppRoutes;