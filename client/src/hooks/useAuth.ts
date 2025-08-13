import { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/useStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RegisterData {
  username: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login: storeLogin, logout: storeLogout, setUser, user } = useStore();

  // Configure axios defaults
  axios.defaults.baseURL = API_BASE_URL;

  // Add request interceptor to include auth token
  axios.interceptors.request.use((config) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Add response interceptor to handle auth errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        storeLogout();
      }
      return Promise.reject(error);
    }
  );

  const login = async (login: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/login', { login, password });
      const { user, token } = response.data.data;
      
      storeLogin(user, token);
      
      return { user, token };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const response = await axios.post('/auth/register', data);
      const { user, token } = response.data.data;
      
      storeLogin(user, token);
      
      return { user, token };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storeLogout();
      setIsLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    const token = useStore.getState().token;
    if (!token) return false;

    try {
      const response = await axios.get('/users/me');
      const user = response.data.data.user;
      setUser(user);
      return true;
    } catch (error) {
      storeLogout();
      return false;
    }
  };

  const updateProfile = async (updates: Partial<RegisterData>) => {
    setIsLoading(true);
    try {
      const response = await axios.put('/users/me', updates);
      const updatedUser = response.data.data.user;
      setUser(updatedUser);
      return updatedUser;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Profile update failed';
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
    checkAuthStatus,
    updateProfile
  };
};