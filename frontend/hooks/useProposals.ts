import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProposals,
  fetchProposalById,
  createProposal,
  updateProposal,
  analyzeProposalText,
  approveProposal,
  rejectProposal,
  sendProposal,
} from '@/lib/api/client';
import { Proposal, CreateProposalPayload } from '@/types/proposal';

export function useProposals() {
  return useQuery<Proposal[]>({
    queryKey: ['proposals'],
    queryFn: fetchProposals,
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useProposal(id: string) {
  return useQuery<Proposal>({
    queryKey: ['proposals', id],
    queryFn: () => fetchProposalById(id),
    enabled: !!id,
    staleTime: 1000 * 30,
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation<Proposal, Error, CreateProposalPayload>({
    mutationFn: (payload: CreateProposalPayload) => createProposal(payload),
    onSuccess: (newProposal: Proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.setQueryData(['proposals', newProposal.id], newProposal);
    },
  });
}

export function useUpdateProposal() {
  const queryClient = useQueryClient();
  return useMutation<Proposal, Error, { id: string; updates: Partial<Proposal> }>({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Proposal> }) =>
      updateProposal(id, updates),
    onSuccess: (updated: Proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.setQueryData(['proposals', updated.id], updated);
    },
  });
}

export function useAnalyzeProposal() {
  const queryClient = useQueryClient();
  return useMutation<
    any,
    Error,
    { proposalId: string; text: string; useGemini?: boolean }
  >({
    mutationFn: ({
      proposalId,
      text,
      useGemini = false,
    }: {
      proposalId: string;
      text: string;
      useGemini?: boolean;
    }) => analyzeProposalText(proposalId, text, useGemini),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals', variables.proposalId] });
    },
  });
}

export function useApproveProposal() {
  const queryClient = useQueryClient();
  return useMutation<Proposal, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      approveProposal(id, notes),
    onSuccess: (updated: Proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.setQueryData(['proposals', updated.id], updated);
    },
  });
}

export function useRejectProposal() {
  const queryClient = useQueryClient();
  return useMutation<Proposal, Error, { id: string; notes: string }>({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      rejectProposal(id, notes),
    onSuccess: (updated: Proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.setQueryData(['proposals', updated.id], updated);
    },
  });
}

export function useSendProposal() {
  const queryClient = useQueryClient();
  return useMutation<Proposal, Error, string>({
    mutationFn: (id: string) => sendProposal(id),
    onSuccess: (updated: Proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.setQueryData(['proposals', updated.id], updated);
    },
  });
}
