import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient, type ApiResponse } from '../api/client';

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface AuthUser {
  id: string;
  _id?: string;
  fullName: string;
  email: string;
  uid: string;
  role: UserRole;
  department: string;
  isVerified: boolean;
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
  profile?: any;
}

export function isStudentProfileComplete(user: AuthUser | null): boolean {
  if (!user) return false;
  if (user.role !== 'STUDENT') return true;

  const p = user.profile;
  if (!p) return false;
  if (p.isOnboardingCompleted === true) return true;

  const hasBio = Boolean(p.bio && p.bio.trim().length >= 10);
  const hasSkills = Boolean(Array.isArray(p.skills) && p.skills.length > 0);
  const hasGithub = Boolean(p.socialLinks?.github && p.socialLinks.github.trim().length > 0);
  const hasLinkedin = Boolean(p.socialLinks?.linkedin && p.socialLinks.linkedin.trim().length > 0);
  const hasPersonalEmail = Boolean(p.personalEmail && p.personalEmail.trim().length > 0);

  return hasBio && hasSkills && hasGithub && hasLinkedin && hasPersonalEmail;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboardingCompleted: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (payload: any) => Promise<AuthUser>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updatedUser: AuthUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore current session from server HttpOnly cookie on application load
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<ApiResponse<{ user: AuthUser }>>('/auth/me');
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (identifier: string, password: string): Promise<AuthUser> => {
    const res = await apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/login', {
      identifier,
      password,
    });

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }

    throw new Error(res.message || 'Login failed.');
  };

  const register = async (payload: any): Promise<AuthUser> => {
    const res = await apiClient.post<ApiResponse<{ user: AuthUser }>>('/auth/register', payload);

    if (res.success && res.data?.user) {
      setUser(res.data.user);
      return res.data.user;
    }

    throw new Error(res.message || 'Registration failed.');
  };

  const logout = async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
    }
  };

  const updateUser = (updatedUser: AuthUser) => {
    setUser(updatedUser);
  };

  const isOnboardingCompleted = isStudentProfileComplete(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isOnboardingCompleted,
        login,
        register,
        logout,
        checkAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
