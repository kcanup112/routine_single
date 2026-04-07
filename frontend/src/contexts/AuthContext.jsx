import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

const getCurrentSubdomain = () => {
  const host = window.location.hostname || '';
  const parts = host.split('.');
  if (parts.length >= 2) {
    const candidate = parts[0];
    if (!['www', 'api', 'localhost', '127'].includes(candidate)) {
      return candidate;
    }
  }
  return null;
};

const clearAuthStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const currentSubdomain = getCurrentSubdomain();

        // Prevent cross-tenant session reuse when switching subdomains.
        if (
          currentSubdomain &&
          parsed?.tenant_subdomain &&
          parsed.tenant_subdomain !== currentSubdomain
        ) {
          clearAuthStorage();
          setUser(null);
        } else {
          setUser(parsed);
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        clearAuthStorage();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { access_token, user: userData } = response.data;

      const currentSubdomain = getCurrentSubdomain();
      if (
        currentSubdomain &&
        userData?.tenant_subdomain &&
        userData.tenant_subdomain !== currentSubdomain
      ) {
        throw new Error('Tenant mismatch. Please login from your tenant subdomain.');
      }
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  };

  const isSuperAdmin = () => hasRole('super_admin');
  const isAdmin = () => hasRole(['super_admin', 'admin']);
  const isTeacher = () => hasRole('teacher');
  const isSchool = () => user?.institution_type === 'school';

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    isSuperAdmin,
    isAdmin,
    isTeacher,
    isSchool,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
