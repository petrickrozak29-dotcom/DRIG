"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson, getApiBaseUrl } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
  role?: string;
}

interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateProfile: (payload: { name: string; bio?: string; avatar?: string }) => Promise<User>;
  changePassword: (payload: { currentPassword: string; newPassword: string }) => Promise<void>;
  refreshSession: () => Promise<string | null>;
  isAuthenticated: boolean;
  loading: boolean;
  apiBaseUrl: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_TOKEN_KEY = 'authToken';
const AUTH_USER_KEY = 'authUser';
const REFRESH_TOKEN_KEY = 'refreshToken';

function readStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    return null;
  }
}

function getNetworkErrorMessage() {
  return 'API login belum bisa dijangkau. Set NEXT_PUBLIC_API_URL ke backend HTTPS, atau jalankan backend pada host yang bisa diakses HP.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const persistSession = (data: AuthResponse) => {
    localStorage.setItem(AUTH_TOKEN_KEY, data.token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);

    setToken(data.token);
    setUser(data.user);
  };

  const clearSession = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const syncLocation = async (nextToken: string) => {
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        await fetch(`${getApiBaseUrl()}/api/locations/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${nextToken}`
          },
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          })
        });
      } catch {
        // Location sync should not block login on mobile networks.
      }
    });
  };

  const refreshSession = async () => {
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefreshToken) return null;

    try {
      const data = await apiJson<{ token: string; expiresIn: number }>('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      setToken(data.token);
      return data.token;
    } catch {
      clearSession();
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedToken = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = readStoredUser();

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);

        try {
          const profile = await apiJson<{ user: User }>('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` }
          });

          if (mounted) {
            setUser(profile.user);
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile.user));
          }
        } catch (error) {
          if (!(error instanceof TypeError)) {
            await refreshSession();
          }
        }
      }

      if (mounted) setLoading(false);
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiJson<AuthResponse>('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      persistSession(data);
      syncLocation(data.token);
      return data.user;
    } catch (error: any) {
      if (error instanceof TypeError) {
        throw new Error(getNetworkErrorMessage());
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const data = await apiJson<AuthResponse>('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      persistSession(data);
      syncLocation(data.token);
      return data.user;
    } catch (error: any) {
      if (error instanceof TypeError) {
        throw new Error(getNetworkErrorMessage());
      }
      throw error;
    }
  };

  const updateProfile = async (payload: { name: string; bio?: string; avatar?: string }) => {
    if (!token || !user) {
      throw new Error('Anda harus login untuk mengubah profil.');
    }

    try {
      const result = await apiJson<{ user: User }>('/api/auth/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.user));
      setUser(result.user);
      return result.user;
    } catch (error: any) {
      if (error instanceof TypeError) {
        const offlineUser = { ...user, ...payload };
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(offlineUser));
        setUser(offlineUser);
        return offlineUser;
      }
      throw error;
    }
  };

  const changePassword = async (payload: { currentPassword: string; newPassword: string }) => {
    if (!token) {
      throw new Error('Anda harus login untuk mengubah password.');
    }

    try {
      await apiJson('/api/auth/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    } catch (error: any) {
      if (error instanceof TypeError) {
        throw new Error(getNetworkErrorMessage());
      }
      throw error;
    }
  };

  const logout = () => {
    clearSession();
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshSession,
        isAuthenticated: !!token,
        loading,
        apiBaseUrl: getApiBaseUrl()
      }}
    >
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
