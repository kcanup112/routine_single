import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (oldPassword, newPassword) => {
    const response = await api.post('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const userService = {
  getAll: async () => {
    const response = await api.get('/api/users/');
    return response.data;
  },

  create: async (userData) => {
    const response = await api.post('/api/users/', userData);
    return response.data;
  },

  update: async (userId, userData) => {
    const response = await api.put(`/api/users/${userId}`, userData);
    return response.data;
  },

  delete: async (userId) => {
    const response = await api.delete(`/api/users/${userId}`);
    return response.data;
  },

  resetPassword: async (userId, newPassword) => {
    const response = await api.post(`/api/users/${userId}/reset-password`, null, {
      params: { new_password: newPassword },
    });
    return response.data;
  },
};
