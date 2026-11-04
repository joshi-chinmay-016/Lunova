export interface ActivityItem {
  id: string;
  type: 'analysis' | 'edit' | 'approval' | 'ingest' | 'knowledge' | 'dispatch';
  event: string;
  target: string;
  timestamp: string;
}

export const RECENT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-001',
    type: 'analysis',
    event: 'AI Intelligence Analysis completed',
    target: 'Global Defense Cloud Infrastructure RFP',
    timestamp: '12m ago',
  },
  {
    id: 'act-002',
    type: 'approval',
    event: 'Proposal approved by Lead Reviewer',
    target: 'Fintech Automated Security Audit Proposal',
    timestamp: '45m ago',
  },
  {
    id: 'act-003',
    type: 'ingest',
    event: 'New document ingested & vector indexed',
    target: 'Lunetron Security & Compliance Architecture v3.2',
    timestamp: '2h ago',
  },
  {
    id: 'act-004',
    type: 'edit',
    event: 'Human draft revision saved',
    target: 'Enterprise Healthcare Migration Proposal',
    timestamp: '3h ago',
  },
  {
    id: 'act-005',
    type: 'knowledge',
    event: 'Knowledge base similarity re-indexed',
    target: 'Lunetron Case Studies 2026',
    timestamp: '5h ago',
  },
];
