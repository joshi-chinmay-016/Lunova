export type MoonPhase =
  | 'new'
  | 'extracting'
  | 'drafting'
  | 'in_review'
  | 'approved'
  | 'blocked';

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'reconcile';

export interface Chunk {
  id: string;
  documentId: string;
  documentName: string;
  section: string;
  page?: number;
  content: string;
  highlightedText?: string;
  similarity: number; // 0.0 to 1.0
  embeddingCoord?: [number, number, number]; // for 3D constellation
}

export interface EvidenceSource {
  id: string;
  chunkId: string;
  docName: string;
  section: string;
  page?: number;
  similarity: number;
  snippet: string;
  verified: boolean;
}

export interface Requirement {
  id: string;
  proposalId: string;
  index: number;
  text: string;
  category: 'Security' | 'Architecture' | 'Compliance' | 'Operations' | 'Pricing' | 'Support';
  mandatory: boolean;
  owner?: string;
  confidence: number; // 0 to 100
  status: 'pending' | 'drafted' | 'verified' | 'flagged';
  draftAnswer: string;
  unsupportedClauses?: string[];
  sources: EvidenceSource[];
  missingInfoNote?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: 'PDF' | 'DOCX' | 'TXT' | 'MARKDOWN';
  sizeBytes: number;
  uploadedAt: string;
  status: 'uploaded' | 'extracted' | 'chunked' | 'embedded' | 'indexed';
  chunkCount: number;
  usedInProposalsCount: number;
  freshness: string;
  owner: string;
  topics: string[];
}

export interface ProposalContext {
  id: string;
  title: string;
  customer: string;
  rfpNumber: string;
  receivedAt: string;
  dueDate: string;
  phase: MoonPhase;
  confidence: number; // 0 to 100
  requirementsCount: number;
  answeredCount: number;
  missingCount: number;
  requirements: Requirement[];
  sources: EvidenceSource[];
  assignedTo: string;
  isPriority?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Lead Architect' | 'Reviewer' | 'Admin';
  tenant: string;
  avatarInitials: string;
}

export interface ThemeSettings {
  theme: 'night' | 'day';
  reducedMotion: boolean;
  disable3D: boolean;
  soundEnabled: boolean;
}
