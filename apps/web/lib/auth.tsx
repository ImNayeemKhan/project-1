'use client';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, bootstrapAuth, extractError, setAuthToken, setRefreshToken } from './api';

export type Role = 'admin' | 'reseller' | 'customer';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface AuthContextValue {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    bootstrapAuth();
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    if (!hasToken) {
      setLoading(false);
      return;
    }
    api
      .get('/api/auth/me')
      .then((res) => {
        const u = res.data.user;
        setUser({ id: u._id, email: u.email, name: u.name, role: u.role });
      })
      .catch(() => {
        setAuthToken(null);
        setRefreshToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      setAuthToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      const u: CurrentUser = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
      };
      setUser(u);
      return u;
    } catch (err) {
      throw new Error(extractError(err));
    }
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setRefreshToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
