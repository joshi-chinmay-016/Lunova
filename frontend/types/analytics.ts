export interface MetricKpi {
  id: string;
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  description: string;
}

export interface ProposalVelocityItem {
  month: string;
  total: number;
  approved: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
  color: string;
}

export interface RequirementDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  kpis: MetricKpi[];
  proposals_by_status: StatusDistribution[];
  monthly_velocity: ProposalVelocityItem[];
  requirements_by_category: RequirementDistribution[];
  average_processing_time: string;
  ai_draft_acceptance_rate: string;
}
