'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  bootstrapLocalAdmin,
  logoutUser,
} from '@/lib/api/client';
import { getAuthToken } from '@/services/api';
import { UserProfile, LoginResponse, RegisterPayload } from '@/types/auth';

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  login: (credentials: { email: string; password: string }) => Promise<LoginResponse>;
  isLoggingIn: boolean;
  register: (payload: RegisterPayload) => Promise<LoginResponse>;
  isRegistering: boolean;
  bootstrap: () => Promise<LoginResponse>;
  isBootstrapping: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const stored = getAuthToken();
    setTokenState(stored);
    setIsInitialized(true);

    const handleAuthExpired = () => {
      setTokenState(null);
      queryClient.removeQueries({ queryKey: ['auth'] });
    };

    window.addEventListener('lunova_auth_expired', handleAuthExpired);
    return () => {
      window.removeEventListener('lunova_auth_expired', handleAuthExpired);
    };
  }, [queryClient]);

  const userQuery = useQuery<UserProfile, Error>({
    queryKey: ['auth', 'me', token],
    queryFn: fetchCurrentUser,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const loginMutation = useMutation<LoginResponse, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginUser(email, password),
    onSuccess: (data) => {
      setTokenState(data.access_token);
      queryClient.setQueryData(['auth', 'me', data.access_token], data.user);
      queryClient.invalidateQueries();
    },
  });

  const registerMutation = useMutation<LoginResponse, Error, RegisterPayload>({
    mutationFn: (payload) => registerUser(payload),
    onSuccess: (data) => {
      setTokenState(data.access_token);
      queryClient.setQueryData(['auth', 'me', data.access_token], data.user);
      queryClient.invalidateQueries();
    },
  });

  const bootstrapMutation = useMutation<LoginResponse, Error, void>({
    mutationFn: bootstrapLocalAdmin,
    onSuccess: (data) => {
      setTokenState(data.access_token);
      queryClient.setQueryData(['auth', 'me', data.access_token], data.user);
      queryClient.invalidateQueries();
    },
  });

  const logout = useCallback(() => {
    logoutUser();
    setTokenState(null);
    queryClient.removeQueries({ queryKey: ['auth'] });
    queryClient.invalidateQueries();
  }, [queryClient]);

  const value: AuthContextType = {
    token,
    user: userQuery.data || null,
    isLoading: !isInitialized || (!!token && userQuery.isLoading),
    isAuthenticated: !!token && !userQuery.isError,
    error: (userQuery.error || loginMutation.error || registerMutation.error || bootstrapMutation.error) as Error | null,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    bootstrap: bootstrapMutation.mutateAsync,
    isBootstrapping: bootstrapMutation.isPending,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
