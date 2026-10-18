import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('civicpulse_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('civicpulse_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const savedToken = localStorage.getItem('civicpulse_token');
      if (savedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('civicpulse_user', JSON.stringify(res.data));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('civicpulse_token', access_token);
    localStorage.setItem('civicpulse_user', JSON.stringify(userData));
    return userData;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    const { access_token, user: newUser } = res.data;
    setToken(access_token);
    setUser(newUser);
    localStorage.setItem('civicpulse_token', access_token);
    localStorage.setItem('civicpulse_user', JSON.stringify(newUser));
    return newUser;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('civicpulse_token');
    localStorage.removeItem('civicpulse_user');
  };

  const quickLoginAs = async (role) => {
    if (role === 'admin') {
      return await login('admin@civicpulse.local', 'AdminSecurePass2026!');
    } else if (role === 'officer') {
      return await login('officer.verma@civicpulse.local', 'OfficerPass2026!');
    } else {
      return await login('citizen.priya@civicpulse.local', 'CitizenPass2026!');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        quickLoginAs,
        isAdmin: user?.role === 'admin',
        isOfficer: user?.role === 'officer' || user?.role === 'admin',
        isCitizen: user?.role === 'citizen',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
