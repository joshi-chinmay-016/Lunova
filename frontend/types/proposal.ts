export type ProposalStatus =
  | 'NEW'
  | 'ANALYZING'
  | 'AI_DRAFTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED';

export type RequirementCategory =
  | 'TECHNICAL'
  | 'SECURITY'
  | 'COMPLIANCE'
  | 'OPERATIONAL'
  | 'COMMERCIAL';

export type RequirementPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ProposalRequirement {
  requirement_id: string;
  category: RequirementCategory;
  description: string;
  priority: RequirementPriority;
  evidence?: string;
  is_explicit?: boolean;
  status: 'FULFILLED' | 'PARTIAL' | 'FLAGGED';
  notes?: string;
}

export interface RetrievedSource {
  source_id: string;
  title: string;
  section: string;
  relevance: 'High' | 'Medium' | 'Low';
  relevance_score?: number;
  supporting_info: string;
  page?: number;
  snippet?: string;
}

export interface RequirementResponseItem {
  requirement_id: string;
  response: string;
  grounded_in: string[];
}

export interface GeneratedProposalResponse {
  executive_summary: string;
  technical_approach: string;
  implementation_plan: string;
  draft_email_body?: string;
  requirement_responses: RequirementResponseItem[];
}

export interface ReviewHistoryItem {
  id: string;
  reviewer: string;
  action: 'APPROVED' | 'REJECTED' | 'EDITED' | 'REQUESTED_REVISION';
  timestamp: string;
  notes: string;
}

export interface Proposal {
  id: string;
  company_id: string;
  title: string;
  customer: string;
  status: ProposalStatus;
  deadline: string;
  created_at: string;
  updated_at: string;
  owner: string;
  estimated_value?: string;
  summary?: string;
  sender_address?: string;
  raw_content?: string;
  requirements?: ProposalRequirement[];
  sources?: RetrievedSource[];
  generated_response?: GeneratedProposalResponse;
  confidence?: {
    overall_score: number;
    grounding_score: number;
    requires_human_attention: boolean;
  };
  review_history?: ReviewHistoryItem[];
}

export interface CreateProposalPayload {
  title: string;
  customer: string;
  deadline: string;
  owner: string;
  sender_address: string;
  raw_content: string;
  estimated_value?: string;
}
