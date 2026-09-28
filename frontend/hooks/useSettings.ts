import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchCompanySettings,
  updateCompanySettings,
  fetchTeamMembers,
  fetchAIConfiguration,
  updateAIConfiguration,
  fetchIntegrations
} from '@/lib/api/client';
import { CompanySettings, TeamMember, AIConfiguration, IntegrationItem } from '@/types/settings';

export function useCompanySettings() {
  const queryClient = useQueryClient();
  const query = useQuery<CompanySettings>({
    queryKey: ['settings', 'company'],
    queryFn: fetchCompanySettings,
  });

  const mutation = useMutation({
    mutationFn: (data: CompanySettings) => updateCompanySettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'company'], updated);
    },
  });

  return { ...query, update: mutation.mutate, isUpdating: mutation.isPending };
}

export function useTeamMembers() {
  return useQuery<TeamMember[]>({
    queryKey: ['settings', 'team'],
    queryFn: fetchTeamMembers,
  });
}

export function useAIConfiguration() {
  const queryClient = useQueryClient();
  const query = useQuery<AIConfiguration>({
    queryKey: ['settings', 'ai'],
    queryFn: fetchAIConfiguration,
  });

  const mutation = useMutation({
    mutationFn: (data: AIConfiguration) => updateAIConfiguration(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings', 'ai'], updated);
    },
  });

  return { ...query, update: mutation.mutate, isUpdating: mutation.isPending };
}

export function useIntegrations() {
  return useQuery<IntegrationItem[]>({
    queryKey: ['settings', 'integrations'],
    queryFn: fetchIntegrations,
  });
}
