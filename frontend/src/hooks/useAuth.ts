import React, { useState, useContext, createContext, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import * as authService from '../services/auth';

// Crear el contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider del contexto
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // Check for existing user on mount
  useEffect(() => {
    const existingUser = authService.getUser();
    if (existingUser) {
      setUser(existingUser);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await authService.login(email, password);
      if (error) {
        throw new Error(error);
      }
      if (authUser) {
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(authUser));
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const { user: authUser, error } = await authService.register(username, email, password);
      if (error) {
        throw new Error(error);
      }
      if (authUser) {
        setUser(authUser);
        localStorage.setItem('user', JSON.stringify(authUser));
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading
  };

  return React.createElement(AuthContext.Provider, { value }, children);
};

// Hook para usar el contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};