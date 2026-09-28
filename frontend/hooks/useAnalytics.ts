import { useQuery } from '@tanstack/react-query';
import { fetchAnalytics } from '@/lib/api/client';
import { AnalyticsSummary } from '@/types/analytics';

export function useAnalytics() {
  return useQuery<AnalyticsSummary>({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    staleTime: 1000 * 60,
  });
}
