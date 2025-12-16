import React, { createContext, useContext, useState, useEffect } from 'react';

import api from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Initialize Auth state
  useEffect(() => {
    if (token) {
      // Set default header
      // Note: api instance usually handles this, but we can set explicit default too if using axios directly
      // Better to rely on interceptor, but we initialize user here
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const { data } = await api.get('/user');
      setUser(data);
      if (data._id) {
          localStorage.setItem('userId', data._id);
      }
    } catch (err) {
      console.error('Failed to load user', err);
      // If load fails (e.g. 401), invalid token
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (googleToken) => {
    try {
      const res = await api.post('/auth/google', { token: googleToken });
      const { token: newToken, user: userData } = res.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('userId', userData._id);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (err) {
      console.error('Login failed', err);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, loadUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
