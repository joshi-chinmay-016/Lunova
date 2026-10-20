export interface CompanySettings {
  name: string;
  industry: string;
  contact_email: string;
  website: string;
  default_owner: string;
  response_tone: 'Professional & Technical' | 'Executive & Formal' | 'Concise & Direct';
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Lead Reviewer' | 'Technical Reviewer' | 'Viewer';
  avatar_url?: string;
  status: 'Active' | 'Invited';
}

export interface AIConfiguration {
  provider: 'gemini-1.5-pro' | 'mock-enterprise' | 'custom-azure-openai';
  temperature: number;
  retrieval_similarity_threshold: number;
  grounding_evaluator_enabled: boolean;
  strict_evidence_mode: boolean;
}

export interface IntegrationItem {
  id: string;
  name: string;
  category: 'Email' | 'CRM' | 'Collaboration' | 'Storage';
  description: string;
  status: 'connected' | 'disconnected' | 'coming_soon';
  icon: string;
}
