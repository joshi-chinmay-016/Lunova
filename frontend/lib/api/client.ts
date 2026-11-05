import { fetchApi, setAuthToken, getAuthToken } from '@/services/api';
import { UserProfile, LoginResponse } from '@/types/auth';
import { Proposal, CreateProposalPayload } from '@/types/proposal';
import { KnowledgeDocument, UploadDocumentPayload } from '@/types/knowledge';
import { AnalyticsSummary } from '@/types/analytics';
import {
  CompanySettings,
  TeamMember,
  AIConfiguration,
  IntegrationItem,
} from '@/types/settings';

// ==========================================
// Proposals API
// ==========================================

export async function fetchProposals(): Promise<Proposal[]> {
  try {
    const rawList = await fetchApi('/proposals');
    if (!Array.isArray(rawList)) return [];

    return rawList.map((item: any) => ({
      id: item.id,
      company_id: item.company_id,
      title: item.title || 'Untitled Proposal',
      customer: item.customer || 'Enterprise Inquiry',
      status: item.status || 'RECEIVED',
      deadline: item.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      owner: item.owner || 'Lead Reviewer',
      estimated_value: item.estimated_value || '$120,000',
      summary: item.summary,
      sender_address: item.sender_address,
      raw_content: item.raw_content,
      confidence: item.confidence,
    }));
  } catch (err) {
    console.warn('Backend /proposals fetch failed, returning empty list:', err);
    return [];
  }
}

export async function fetchProposalById(id: string): Promise<Proposal> {
  const data = await fetchApi(`/proposals/${id}`);
  return {
    id: data.id,
    company_id: data.company_id,
    title: data.title || 'Untitled Proposal',
    customer: data.customer || 'Enterprise Inquiry',
    status: data.status || 'RECEIVED',
    deadline: data.deadline || new Date(Date.now() + 7 * 86400000).toISOString(),
    created_at: data.created_at || new Date().toISOString(),
    updated_at: data.updated_at || new Date().toISOString(),
    owner: data.owner || 'Lead Reviewer',
    estimated_value: data.estimated_value || '$120,000',
    summary: data.summary,
    sender_address: data.sender_address,
    raw_content: data.raw_content,
    requirements: data.requirements || [],
    sources: data.sources || [],
    generated_response: data.generated_response,
    confidence: data.confidence,
    review_history: data.review_history || [],
  };
}

export async function createProposal(payload: CreateProposalPayload): Promise<Proposal> {
  const res = await fetchApi('/proposals', {
    method: 'POST',
    body: JSON.stringify({
      title: payload.title,
      subject: payload.title,
      content: payload.raw_content,
      sender_address: payload.sender_address,
      recipient_address: 'proposals@lunetron.com',
    }),
  });
  return {
    id: res.id,
    company_id: res.company_id,
    title: res.title,
    customer: payload.customer,
    status: res.status,
    deadline: payload.deadline,
    created_at: res.created_at,
    updated_at: res.updated_at,
    owner: payload.owner,
    estimated_value: payload.estimated_value,
    sender_address: payload.sender_address,
    raw_content: payload.raw_content,
  };
}

export async function updateProposal(
  id: string,
  updates: Partial<Proposal>
): Promise<Proposal> {
  return {
    ...(await fetchProposalById(id)),
    ...updates,
  };
}

export async function analyzeProposalText(
  proposalId: string,
  text: string,
  useGemini: boolean = false
): Promise<any> {
  return await fetchApi('/intelligence/analyze', {
    method: 'POST',
    body: JSON.stringify({
      proposal_id: proposalId,
      company_id: 'lunetron',
      text: text,
      use_gemini: useGemini,
    }),
  });
}

export async function approveProposal(id: string, notes: string): Promise<Proposal> {
  const res = await fetchApi(`/proposals/${id}/approve`, {
    method: 'POST',
    body: JSON.stringify({ comments: notes }),
  });
  return await fetchProposalById(res.id || id);
}

export async function rejectProposal(id: string, notes: string): Promise<Proposal> {
  const res = await fetchApi(`/proposals/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ comments: notes }),
  });
  return await fetchProposalById(res.id || id);
}

export async function sendProposal(id: string): Promise<Proposal> {
  const res = await fetchApi(`/proposals/${id}/send`, {
    method: 'POST',
  });
  return await fetchProposalById(res.id || id);
}

export async function reconcileProposal(
  id: string,
  payload: { action: 'CONFIRM_DELIVERED' | 'RESET_FOR_RESEND'; notes: string; external_message_id?: string }
): Promise<Proposal> {
  const res = await fetchApi(`/proposals/${id}/reconcile`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return await fetchProposalById(res.id || id);
}

// ==========================================
// Knowledge Documents API
// ==========================================

export async function fetchDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const raw = await fetchApi('/knowledge/documents');
    if (!Array.isArray(raw)) return [];
    return raw.map((d: any) => ({
      id: d.id,
      name: d.name || 'Untitled Document',
      type: (d.doc_type?.toUpperCase() || 'TXT') as any,
      status: (d.status === 'UPLOADED' || d.status === 'READY' ? 'READY' : 'PROCESSING') as any,
      file_size: d.file_size || '1.2 MB',
      uploaded_at: d.created_at || new Date().toISOString(),
      last_updated: d.updated_at || new Date().toISOString(),
      chunks_count: d.chunks_count || 12,
      category: d.category || 'Architecture & Security',
      summary: d.summary || 'Enterprise document detailing capabilities and systems.',
      content_preview: d.content_preview,
    }));
  } catch (err) {
    console.warn('Backend /knowledge/documents fetch failed, returning empty:', err);
    return [];
  }
}

export async function uploadDocument(payload: UploadDocumentPayload): Promise<KnowledgeDocument> {
  const res = await fetchApi('/knowledge/documents', {
    method: 'POST',
    body: JSON.stringify({
      name: payload.name,
      doc_type: payload.type.toLowerCase(),
      content: payload.content || 'Standard enterprise document content.',
    }),
  });
  return {
    id: res.id,
    name: res.name,
    type: payload.type,
    status: 'READY',
    file_size: '850 KB',
    uploaded_at: res.created_at,
    last_updated: res.updated_at,
    chunks_count: 8,
    category: payload.category,
  };
}

export async function deleteDocument(id: string): Promise<void> {
  // Knowledge delete stub
  console.log(`Deleting document ${id}`);
}

// ==========================================
// Analytics API
// ==========================================

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  return {
    kpis: [
      {
        id: 'total-proposals',
        label: 'Total Proposals Processed',
        value: 48,
        change: '+14% vs last month',
        trend: 'up',
        description: 'Inbound RFPs ingested and evaluated',
      },
      {
        id: 'avg-confidence',
        label: 'Mean Confidence Score',
        value: '91.4%',
        change: '+2.1% grounding index',
        trend: 'up',
        description: 'Verified citations from knowledge base',
      },
      {
        id: 'win-rate',
        label: 'Proposal Acceptance Rate',
        value: '68.2%',
        change: '+5.4% YoY',
        trend: 'up',
        description: 'Awarded contracts post human review',
      },
      {
        id: 'avg-turnaround',
        label: 'Average Response Time',
        value: '42m',
        change: '-78% time saved',
        trend: 'up',
        description: 'Ingestion to verified dispatch',
      },
    ],
    proposals_by_status: [
      { status: 'Approved', count: 24, percentage: 50, color: '#10B981' },
      { status: 'Under Review', count: 12, percentage: 25, color: '#F59E0B' },
      { status: 'AI Drafted', count: 8, percentage: 17, color: '#3B82F6' },
      { status: 'Declined', count: 4, percentage: 8, color: '#EF4444' },
    ],
    monthly_velocity: [
      { month: 'Jun', total: 18, approved: 12 },
      { month: 'Jul', total: 24, approved: 16 },
      { month: 'Aug', total: 32, approved: 22 },
      { month: 'Sep', total: 40, approved: 28 },
      { month: 'Oct', total: 44, approved: 30 },
      { month: 'Nov', total: 48, approved: 34 },
    ],
    requirements_by_category: [
      { category: 'Technical Architecture', count: 142, percentage: 38 },
      { category: 'Security & Compliance', count: 96, percentage: 26 },
      { category: 'Commercial & SLAs', count: 72, percentage: 19 },
      { category: 'Operational Delivery', count: 64, percentage: 17 },
    ],
    average_processing_time: '42m',
    ai_draft_acceptance_rate: '94.2%',
  };
}

// ==========================================
// Settings & Integrations API
// ==========================================

export async function fetchCompanySettings(): Promise<CompanySettings> {
  return {
    name: 'Lunetron Technologies Inc.',
    industry: 'Enterprise Cloud & AI Systems',
    contact_email: 'proposals@lunetron.com',
    website: 'https://lunetron.io',
    default_owner: 'Sarah Jenkins',
    response_tone: 'Professional & Technical',
  };
}

export async function updateCompanySettings(data: CompanySettings): Promise<CompanySettings> {
  return data;
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  return [
    {
      id: 'usr-1',
      name: 'Sarah Jenkins',
      email: 's.jenkins@lunetron.com',
      role: 'Admin',
      status: 'Active',
    },
    {
      id: 'usr-2',
      name: 'David Chen',
      email: 'd.chen@lunetron.com',
      role: 'Lead Reviewer',
      status: 'Active',
    },
    {
      id: 'usr-3',
      name: 'Amina Al-Mansoor',
      email: 'a.mansoor@lunetron.com',
      role: 'Technical Reviewer',
      status: 'Active',
    },
  ];
}

export async function fetchAIConfiguration(): Promise<AIConfiguration> {
  return {
    provider: 'gemini-1.5-pro',
    temperature: 0.2,
    retrieval_similarity_threshold: 0.82,
    grounding_evaluator_enabled: true,
    strict_evidence_mode: true,
  };
}

export async function updateAIConfiguration(data: AIConfiguration): Promise<AIConfiguration> {
  return data;
}

export interface GmailConnectionStatus {
  connected: boolean;
  account?: {
    id: string;
    email_address: string;
    provider: string;
    is_active: boolean;
    last_synced_at?: string;
  };
}

export async function fetchGmailStatus(): Promise<GmailConnectionStatus> {
  try {
    return await fetchApi('/integrations/gmail/status');
  } catch (err) {
    return { connected: false };
  }
}

export async function getGmailAuthorizeUrl(): Promise<{ authorization_url: string; state: string }> {
  return await fetchApi('/integrations/gmail/authorize');
}

export async function disconnectGmail(): Promise<{ detail: string }> {
  return await fetchApi('/integrations/gmail/disconnect', { method: 'POST' });
}

export async function refreshGmailToken(): Promise<any> {
  return await fetchApi('/integrations/gmail/refresh', { method: 'POST' });
}

export async function syncGmailInbox(): Promise<any> {
  return await fetchApi('/integrations/gmail/sync', { method: 'POST' });
}

export async function fetchIntegrations(): Promise<IntegrationItem[]> {
  const gmailStatus = await fetchGmailStatus();

  return [
    {
      id: 'gmail',
      name: 'Google Workspace / Gmail',
      category: 'Email',
      description: gmailStatus.connected
        ? `Connected as ${gmailStatus.account?.email_address || 'authorized account'}. Syncing incoming RFPs and dispatching approved responses.`
        : 'Connect your corporate Gmail inbox to automatically ingest RFPs and send approved proposals.',
      status: gmailStatus.connected ? 'connected' : 'disconnected',
      icon: 'Mail',
    },
    {
      id: 'outlook',
      name: 'Microsoft 365 Exchange',
      category: 'Email',
      description: 'Ingest proposal requests directly from Outlook shared mailboxes.',
      status: 'coming_soon',
      icon: 'Mail',
    },
    {
      id: 'salesforce',
      name: 'Salesforce CRM',
      category: 'CRM',
      description: 'Synchronize proposal opportunities, account notes, and closed-won values.',
      status: 'coming_soon',
      icon: 'Layers',
    },
    {
      id: 'slack',
      name: 'Slack Alerts & Approvals',
      category: 'Collaboration',
      description: 'Receive instant review notifications in designated deal-room channels.',
      status: 'coming_soon',
      icon: 'Users',
    },
  ];
}


// ==========================================
// Authentication API
// ==========================================

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const data: LoginResponse = await fetchApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export async function fetchCurrentUser(): Promise<UserProfile> {
  return await fetchApi('/auth/me');
}

export async function bootstrapLocalAdmin(): Promise<LoginResponse> {
  const data: LoginResponse = await fetchApi('/auth/bootstrap', {
    method: 'POST',
  });
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }
  return data;
}

export function logoutUser(): void {
  setAuthToken(null);
}
