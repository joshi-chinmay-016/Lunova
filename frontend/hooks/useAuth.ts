'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  fetchCurrentUser,
  bootstrapLocalAdmin,
  logoutUser,
} from '@/lib/api/client';
import { getAuthToken } from '@/services/api';
import { UserProfile, LoginResponse } from '@/types/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(null);

  useEffect(() => {
    setTokenState(getAuthToken());
  }, []);

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

  return {
    token,
    user: userQuery.data || null,
    isLoading: userQuery.isLoading,
    isAuthenticated: !!token && !userQuery.isError,
    error: userQuery.error || loginMutation.error || bootstrapMutation.error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    bootstrap: bootstrapMutation.mutateAsync,
    isBootstrapping: bootstrapMutation.isPending,
    logout,
  };
}

