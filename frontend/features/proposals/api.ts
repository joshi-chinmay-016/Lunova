import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '../../services/api';

export interface Proposal {
  id: string;
  company_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  proposal_id: string;
  reviewer_id: string;
  comments: string;
  status: string;
  created_at: string;
}

export const useProposals = () => {
  return useQuery<Proposal[]>({
    queryKey: ['proposals'],
    queryFn: () => fetchApi('/proposals'),
  });
};

export const useProposal = (id: string) => {
  return useQuery<Proposal>({
    queryKey: ['proposals', id],
    queryFn: () => fetchApi(`/proposals/${id}`),
    enabled: !!id,
  });
};

export const useProcessProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi(`/proposals/${id}/process`, { method: 'POST' }),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposals', id] });
    },
  });
};

export const useProposalReviews = (id: string) => {
  return useQuery<Review[]>({
    queryKey: ['proposals', id, 'reviews'],
    queryFn: () => fetchApi(`/proposals/${id}/reviews`),
    enabled: !!id,
  });
};

export const useApproveProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      fetchApi(`/proposals/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ comments })
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals', id, 'reviews'] });
    },
  });
};

export const useRejectProposal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comments }: { id: string; comments: string }) =>
      fetchApi(`/proposals/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments })
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['proposals', id] });
      queryClient.invalidateQueries({ queryKey: ['proposals', id, 'reviews'] });
    },
  });
};
