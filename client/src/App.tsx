import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import axios from 'axios';

// Providers
import { ThemeProvider } from './providers/ThemeProvider';
import { SocketProvider } from './providers/SocketProvider';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatLayout from './components/layout/ChatLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useStore();
  
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useStore();
  
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, token, setUser, logout } = useStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize authentication state on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const persistedToken = useStore.getState().token;
      const persistedUser = useStore.getState().user;
      
      if (persistedToken && persistedUser) {
        try {
          // Validate token by checking user profile
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${persistedToken}`
            }
          });
          
          if (response.data.success) {
            // Token is valid, update user data
            setUser(response.data.data.user);
          } else {
            // Token is invalid
            logout();
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token is invalid or expired
          logout();
        }
      } else if (persistedToken && !persistedUser) {
        // We have token but no user, try to fetch user
        try {
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
          const response = await axios.get(`${API_URL}/users/me`, {
            headers: {
              Authorization: `Bearer ${persistedToken}`
            }
          });
          
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            logout();
          }
        } catch (error) {
          console.error('User fetch failed:', error);
          logout();
        }
      }
      
      setIsInitializing(false);
    };

    initializeAuth();
  }, [setUser, logout]);

  // Show loading spinner while initializing
  if (isInitializing) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <Router>
        <SocketProvider>
          <div className="h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/register" 
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } 
              />
              
              {/* Protected Routes */}
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <ChatLayout />
                  </ProtectedRoute>
                } 
              />
              
              {/* Default route */}
              <Route 
                path="/" 
                element={
                  user && token ? (
                    // Stay on the layout root; ChatLayout will show empty state
                    <ChatLayout />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                } 
              />
            </Routes>
          </div>
        </SocketProvider>

        {/* Global Toast Notifications */}
        <Toaster
            position="top-right"
            toastOptions={{
              className: 'dark:bg-gray-800 dark:text-white',
              duration: 4000,
              style: {
                background: 'var(--toast-bg)',
                color: 'var(--toast-color)',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                fontWeight: '500',
                boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#FFFFFF',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#FFFFFF',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3B82F6',
                  secondary: '#FFFFFF',
                },
              },
            }}
        />
      </Router>
    </ThemeProvider>
  );
};

export default App;