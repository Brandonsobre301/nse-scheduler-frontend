import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ProjectDetailPage from './pages/ProjectDetailPage';
import './App.css';
import type { User } from './types/project';

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const userDataString = localStorage.getItem('user');
      if (token && userDataString) {
        setUser(JSON.parse(userDataString) as User);
      }
    } catch (error) {
      console.error('Failed to parse user data', error);
      localStorage.clear();
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData: User) => setUser(userData);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/projects/:id" element={user ? <ProjectDetailPage /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} />} />
      </Routes>
    </Router>
  );
};

export default App;