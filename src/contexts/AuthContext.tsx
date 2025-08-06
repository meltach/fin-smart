"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';
import type { AuthTokens } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string, confirmPassword: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth API functions
const authApi = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  },

  async register(email: string, name: string, password: string, confirmPassword: string): Promise<AuthTokens> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
      body: JSON.stringify({ email, name, password, confirmPassword }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    return response.json();
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Token refresh failed');
    }

    return response.json();
  },

  async logout(refreshToken: string): Promise<void> {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies
    });
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token management - now using cookies only for better security
  const storeTokens = (tokens: AuthTokens) => {
    // Tokens will be stored as HTTP-only cookies by the server
    // We just need to store user info
    setUser(tokens.user);
  };

  const clearTokens = () => {
    setUser(null);
    // Cookies will be cleared by the logout API endpoint
  };

  // Auto-refresh token when it's about to expire
  const refreshTokenSilently = async (): Promise<boolean> => {
    try {
      const newTokens = await authApi.refreshToken(''); // Cookie-based refresh
      storeTokens(newTokens);
      return true;
    } catch (error) {
      console.error('Silent token refresh failed:', error);
      clearTokens();
      return false;
    }
  };

  useEffect(() => {
    // Check if user is already logged in on app start
    const initAuth = async () => {
      try {
        // Try to get user profile to verify authentication
        const response = await fetch('/api/user/profile', {
          credentials: 'include', // Include cookies
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else if (response.status === 401) {
          // Try to refresh token
          const refreshSuccess = await refreshTokenSilently();
          if (!refreshSuccess) {
            clearTokens();
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Set up automatic token refresh - check every 5 minutes
    const interval = setInterval(() => {
      // Try to refresh token periodically
      refreshTokenSilently();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const tokens = await authApi.login(email, password);
      storeTokens(tokens);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, name: string, password: string, confirmPassword: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const tokens = await authApi.register(email, name, password, confirmPassword);
      storeTokens(tokens);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout(''); // Cookie-based logout
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      clearTokens();
      window.location.href = '/login';
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    return refreshTokenSilently();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
