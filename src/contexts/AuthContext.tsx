'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string;
  initials: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check for existing auth in localStorage
    const storedUser = localStorage.getItem('mockUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock auth - just create a user
    const mockUser: User = {
      id: '1',
      email,
      name: email.split('@')[0],
      initials: email.substring(0, 2).toUpperCase(),
    };

    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));

    // Redirect to intended page or analysis
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get('redirect') || '/analysis';
    router.push(redirect);
  };

  const signup = async (email: string, password: string, name: string) => {
    // Mock auth - just create a user
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const mockUser: User = {
      id: '1',
      email,
      name,
      initials,
    };

    setUser(mockUser);
    localStorage.setItem('mockUser', JSON.stringify(mockUser));

    // Redirect to analysis after signup
    router.push('/analysis');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('mockUser');
    router.push('/');
  };

  // Protected route logic
  useEffect(() => {
    if (!isLoading && !user) {
      const protectedPaths = ['/analysis', '/sessions', '/templates', '/attack-tree', '/pipeline-editor'];
      const isProtected = protectedPaths.some(path => pathname.startsWith(path));

      if (isProtected) {
        router.push(`/auth/login?redirect=${pathname}`);
      }
    }
  }, [pathname, user, isLoading, router]);

  // Auto-redirect from landing when authenticated
  useEffect(() => {
    if (!isLoading && user && pathname === '/') {
      router.push('/analysis');
    }
  }, [pathname, user, isLoading, router]);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      isLoading,
    }}>
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