import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('algo_auth_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    const savedToken = localStorage.getItem('algo_auth_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }

    try {
      const userData = await getCurrentUser();
      setUser(userData);
      setToken(savedToken);
      setIsAuthenticated(true);
    } catch (err) {
      console.warn('Session verification failed, clearing token:', err);
      localStorage.removeItem('algo_auth_token');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data && data.token) {
      localStorage.setItem('algo_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data.user;
    }
    throw new Error('Login failed: Token not received');
  };

  const register = async (name, email, password) => {
    const data = await registerUser({ name, email, password });
    if (data && data.token) {
      localStorage.setItem('algo_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      return data.user;
    }
    throw new Error('Registration failed: Token not received');
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('algo_auth_token');
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        checkAuthSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
