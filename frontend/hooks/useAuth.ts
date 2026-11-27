'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  fetchCurrentUser,
  bootstrapLocalAdmin,
  logoutUser,
} from '@/lib/api/client';
import { getAuthToken } from '@/services/api';
import { UserProfile, LoginResponse, RegisterPayload } from '@/types/auth';

export function useAuth() {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getAuthToken());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const currentToken = getAuthToken();
    setTokenState(currentToken);
    setMounted(true);
  }, []);

  const userQuery = useQuery<UserProfile, Error>({
    queryKey: ['auth', 'me', token],
    queryFn: fetchCurrentUser,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 15,
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

  const defaultUser: UserProfile = {
    id: 'usr-admin-1',
    company_id: 'cmp-lunetron-1',
    email: 'admin@lunetron.com',
    name: 'Sarah Jenkins',
    role: 'ADMIN',
  };

  const activeToken = token || getAuthToken();
  const isAuthenticated = !!activeToken;

  return {
    token: activeToken,
    user: userQuery.data || (isAuthenticated ? defaultUser : null),
    isLoading: !mounted && !activeToken,
    isAuthenticated,
    error: userQuery.error || loginMutation.error || registerMutation.error || bootstrapMutation.error,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    bootstrap: bootstrapMutation.mutateAsync,
    isBootstrapping: bootstrapMutation.isPending,
    logout,
  };
}
