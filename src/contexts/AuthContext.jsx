import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('petrol_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('petrol_token'));
  const [loading, setLoading] = useState(true);
  const [pumpSettings, setPumpSettings] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('petrol_token');
      if (storedToken) {
        try {
          const { data } = await api.get('/auth/me');
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('petrol_user', JSON.stringify(data.user));
            if (data.pump) setPumpSettings(data.pump);
          }
        } catch (err) {
          console.error('Session expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Fetch pump settings if authenticated and not superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      api.get('/settings')
        .then((res) => {
          if (res.data?.success && res.data?.data) {
            setPumpSettings(res.data.data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const login = async (identifier, password) => {
    const { data } = await api.post('/auth/login', {
      identifier,
      username: identifier,
      password,
    });
    if (data.success) {
      localStorage.setItem('petrol_token', data.token);
      localStorage.setItem('petrol_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      if (data.pump) setPumpSettings(data.pump);
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.removeItem('petrol_token');
    localStorage.removeItem('petrol_user');
    setToken(null);
    setUser(null);
    setPumpSettings(null);
  };

  const isSuperAdmin = user?.role === 'superadmin';
  const isOwner = user?.role === 'owner';
  const isEmployee = user?.role === 'employee';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        isSuperAdmin,
        isOwner,
        isEmployee,
        pumpSettings,
        setPumpSettings,
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
