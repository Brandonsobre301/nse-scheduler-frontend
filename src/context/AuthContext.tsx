import React, { createContext, useState, useContext, useEffect } from 'react';
import type { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthProvider: Checking for stored auth...');
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Restored user:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('❌ Failed to parse user:', error);
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Attempting login for:', email);
    
    try {
      // ✅ FIXED: Correct URL based on your server.ts mounting
      const res = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      console.log('📡 Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('❌ Login failed:', errorData);
        throw new Error(errorData.error || 'Login failed');
      }
      
      const data = await res.json();
      console.log('✅ Login response:', data);
      
      // Normalize user object to match User type
      const normalizedUser: User = {
        _id: data.user._id || data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || 'viewer',
        createdAt: data.user.createdAt
      };
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      setUser(normalizedUser);
      
      console.log('✅ User state updated:', normalizedUser);
    } catch (error) {
      console.error('❌ Login error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      throw error;
    }
  };

  const logout = () => {
    console.log('🚪 Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
