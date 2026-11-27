'use client';

import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DemoScenario {
  id: string;
  title: string;
  client: string;
  deadline: string;
  status: string;
  requirements: Array<{
    id: string;
    text: string;
    category: string;
    priority: string;
    sourceId: string;
    isMissing?: boolean;
  }>;
  sources: Array<{
    id: string;
    title: string;
    section: string;
    page: number;
    score: string;
    content: string;
  }>;
  draftParagraphs: Array<{
    id: string;
    text: string;
    citedSourceIds: string[];
    isWarning?: boolean;
  }>;
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'scen-01',
    title: 'Enterprise Platform Implementation Proposal',
    client: 'Acme Global Commerce',
    deadline: '2026-10-25',
    status: 'UNDER_REVIEW',
    requirements: [
      {
        id: 'req-01',
        text: 'Multi-AZ AWS EKS deployment with automated Terraform infrastructure provisioning',
        category: 'TECHNICAL',
        priority: 'HIGH',
        sourceId: 'src-01',
      },
      {
        id: 'req-02',
        text: 'Attestation of SOC 2 Type II compliance and AES-256 encryption at rest and in transit',
        category: 'SECURITY',
        priority: 'HIGH',
        sourceId: 'src-02',
      },
      {
        id: 'req-03',
        text: '24/7 dedicated enterprise response SLA with under 15-minute Sev-1 turnaround',
        category: 'SUPPORT',
        priority: 'HIGH',
        sourceId: 'src-03',
      },
      {
        id: 'req-04',
        text: 'Target migration completion schedule and milestone calendar',
        category: 'TIMELINE',
        priority: 'MEDIUM',
        sourceId: '',
        isMissing: true,
      },
    ],
    sources: [
      {
        id: 'src-01',
        title: 'Cloud Architecture Whitepaper.pdf',
        section: 'Section 4.1 — Multi-AZ EKS Topologies',
        page: 12,
        score: '98.4%',
        content:
          'NovaCorp standard architectures deploy active-active Kubernetes clusters across 3 AWS Availability Zones with automated blue/green cutover via Route 53 and Crossplane modules.',
      },
      {
        id: 'src-02',
        title: 'SOC 2 Type II Attestation 2026.pdf',
        section: 'Section 7.3 — Data at Rest & In-Transit Cryptography',
        page: 8,
        score: '97.1%',
        content:
          'Independent auditor report confirms continuous enforcement of TLS 1.3 and hardware-accelerated AES-256-GCM encryption across all tenant data partitions with KMS envelope key rotation.',
      },
      {
        id: 'src-03',
        title: 'Enterprise Support SLA Agreement.pdf',
        section: 'Schedule A — Severity 1 Response Windows',
        page: 4,
        score: '95.8%',
        content:
          'Tier 1 Enterprise Support guarantees dedicated 24/7 technical incident managers with maximum 15-minute initial response SLA for Severity 1 production degradations.',
      },
    ],
    draftParagraphs: [
      {
        id: 'p-01',
        text: 'Dear Acme Global Procurement Team, thank you for inviting Lunetron to submit our response for your Cloud Infrastructure Modernization RFP. Based on our pre-validated infrastructure blueprints, we confirm full technical and operational capability to satisfy your requirements.',
        citedSourceIds: [],
      },
      {
        id: 'p-02',
        text: 'Our solution provides a dedicated multi-AZ AWS EKS architecture provisioned via automated Terraform blueprints with zero-downtime cutover procedures.',
        citedSourceIds: ['src-01'],
      },
      {
        id: 'p-03',
        text: 'Security and regulatory posture is strictly certified: our active SOC 2 Type II attestation report confirms continuous AES-256-GCM encryption across all data stores, supported by 24/7 enterprise response under our 15-minute Sev-1 SLA commitment.',
        citedSourceIds: ['src-02', 'src-03'],
      },
      {
        id: 'p-04',
        text: '[Human Reviewer Notice: The client RFP did not include a requested go-live date. A clarifying question has been formulated for your review before dispatch.]',
        citedSourceIds: [],
        isWarning: true,
      },
    ],
  },
  {
    id: 'scen-02',
    title: 'Healthcare Clinical Document Pipeline',
    client: 'HealthFirst Systems',
    deadline: '2026-11-01',
    status: 'UNDER_REVIEW',
    requirements: [
      {
        id: 'req-h1',
        text: 'Strict HIPAA BAA execution and automated PHI de-identification',
        category: 'COMPLIANCE',
        priority: 'HIGH',
        sourceId: 'src-h1',
      },
      {
        id: 'req-h2',
        text: 'HL7 and FHIR v4 API integration with EHR systems',
        category: 'INTEGRATION',
        priority: 'HIGH',
        sourceId: 'src-h2',
      },
    ],
    sources: [
      {
        id: 'src-h1',
        title: 'HIPAA Security Policy & BAA Template.pdf',
        section: 'Section 2 — PHI Redaction Controls',
        page: 5,
        score: '99.0%',
        content:
          'Lunetron executes standard HIPAA Business Associate Agreements (BAAs). All document ingestion stages pass through an on-premise PHI de-identification filter.',
      },
      {
        id: 'src-h2',
        title: 'Clinical Interoperability Guide.pdf',
        section: 'Section 3.4 — HL7 FHIR v4 Connectors',
        page: 19,
        score: '96.2%',
        content:
          'Bi-directional FHIR v4 REST APIs interface with Epic, Cerner, and SMART-on-FHIR clinical systems with end-to-end audit logging.',
      },
    ],
    draftParagraphs: [
      {
        id: 'ph-01',
        text: 'Thank you for your inquiry regarding our clinical data pipeline. We execute full HIPAA Business Associate Agreements and provide certified on-premise PHI redaction before any intelligence processing.',
        citedSourceIds: ['src-h1'],
      },
      {
        id: 'ph-02',
        text: 'Our interoperability engine integrates with HL7 FHIR v4 endpoints across Epic and Cerner EHR architectures with sub-second synchronization latency.',
        citedSourceIds: ['src-h2'],
      },
    ],
  },
];

export const InteractiveProductDemo: React.FC = () => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const scenario = DEMO_SCENARIOS[selectedScenarioIndex];

  const [highlightedReqId, setHighlightedReqId] = useState<string>('req-01');
  const [activeSourceId, setActiveSourceId] = useState<string>('src-01');
  const [reviewState, setReviewState] = useState<'PENDING' | 'APPROVED' | 'REVISION'>('PENDING');

  // Find active requirement
  const activeReq = scenario.requirements.find((r) => r.id === highlightedReqId);

  // When a requirement is selected, automatically highlight its corresponding source
  const handleSelectReq = (reqId: string, srcId?: string) => {
    setHighlightedReqId(reqId);
    if (srcId) {
      setActiveSourceId(srcId);
    }
  };

  const handleSelectSource = (srcId: string) => {
    setActiveSourceId(srcId);
    const matchingReq = scenario.requirements.find((r) => r.sourceId === srcId);
    if (matchingReq) {
      setHighlightedReqId(matchingReq.id);
    }
  };

  const activeSource = scenario.sources.find((s) => s.id === activeSourceId) || scenario.sources[0];

  return (
    <section id="interactive-demo" className="py-20 md:py-28 bg-canvas border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-ink border border-border-subtle text-[11px] font-semibold uppercase tracking-wider shadow-subtle">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            <span>Interactive Workspace Preview</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Experience evidence-grounded drafting.
          </h2>

          <p className="text-sm sm:text-base text-slate leading-relaxed">
            Select extracted requirements to trace their verified citations, inspect source
            whitepapers, and simulate the human approval workflow.
          </p>

          {/* Scenario Selector Pills */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-xs text-slate font-medium mr-1">Demo Case:</span>
            {DEMO_SCENARIOS.map((scen, idx) => (
              <button
                key={scen.id}
                onClick={() => {
                  setSelectedScenarioIndex(idx);
                  setHighlightedReqId(scen.requirements[0].id);
                  setActiveSourceId(scen.sources[0]?.id || '');
                  setReviewState('PENDING');
                }}
                className={`text-xs sm:text-sm font-semibold px-4.5 py-2 min-h-[38px] rounded-xl border transition-all cursor-pointer inline-flex items-center justify-center whitespace-nowrap ${
                  selectedScenarioIndex === idx
                    ? 'bg-white text-brand border-brand shadow-sm font-bold'
                    : 'bg-white/60 text-slate border-border-subtle hover:bg-white'
                }`}
              >
                {scen.client}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive 3-Panel Workspace */}
        <div className="bg-white rounded-2xl border border-border-subtle shadow-premium overflow-hidden max-w-6xl mx-auto">
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-canvas border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-subtle text-brand border border-brand-border">
                  Synthetic Demonstration
                </span>
                <span className="text-xs text-slate">Client: {scenario.client}</span>
              </div>
              <h3 className="text-base font-bold text-ink">{scenario.title}</h3>
            </div>

            {/* Approval Decision Control */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {reviewState === 'PENDING' ? (
                <>
                  <button
                    onClick={() => setReviewState('REVISION')}
                    className="text-xs sm:text-sm font-semibold px-5 py-2.5 min-h-[40px] rounded-xl border border-border-subtle bg-white text-slate hover:text-ink transition-colors inline-flex items-center justify-center whitespace-nowrap cursor-pointer"
                  >
                    Request Revision
                  </button>
                  <Button
                    size="sm"
                    onClick={() => setReviewState('APPROVED')}
                    className="text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm min-h-[40px] px-5"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    <span>Approve Draft</span>
                  </Button>
                </>
              ) : reviewState === 'APPROVED' ? (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Approved by Human Reviewer
                  </span>
                  <button
                    onClick={() => setReviewState('PENDING')}
                    className="text-xs text-slate hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Changes Requested
                  </span>
                  <button
                    onClick={() => setReviewState('PENDING')}
                    className="text-xs text-slate hover:underline font-medium"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3-Column Interactive Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
            {/* Panel 1: Extracted Requirements (4 cols) */}
            <div className="lg:col-span-4 p-4 sm:p-5 bg-canvas/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                  Extracted Requirements
                </span>
                <span className="text-[10px] text-slate-muted font-medium">Click to inspect</span>
              </div>

              <div className="space-y-2">
                {scenario.requirements.map((req) => {
                  const isSelected = highlightedReqId === req.id;
                  return (
                    <button
                      key={req.id}
                      onClick={() => handleSelectReq(req.id, req.sourceId)}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'bg-white border-brand shadow-sm ring-1 ring-brand'
                          : 'bg-white/80 border-border-subtle hover:bg-white hover:border-border-strong'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            req.isMissing
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {req.category}
                        </span>
                        {req.isMissing ? (
                          <span className="text-[10px] text-amber-700 font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Absent in RFP
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Grounded
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-ink leading-snug">{req.text}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Panel 2: Grounded Response Workspace (5 cols) */}
            <div className="lg:col-span-5 p-4 sm:p-5 bg-white space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                  Grounded Proposal Draft
                </span>
                <span className="text-[10px] font-semibold text-brand px-2 py-0.5 bg-brand-subtle rounded-md">
                  Evidence Mapped
                </span>
              </div>

              <div className="space-y-3 text-xs text-ink leading-relaxed font-sans">
                {scenario.draftParagraphs.map((para) => {
                  const hasActiveCitation =
                    activeSourceId && para.citedSourceIds.includes(activeSourceId);

                  if (para.isWarning) {
                    return (
                      <div
                        key={para.id}
                        className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>{para.text}</div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={para.id}
                      className={`p-2.5 rounded-xl transition-all ${
                        hasActiveCitation
                          ? 'bg-blue-50/80 border border-blue-200/90 shadow-sm'
                          : 'bg-transparent'
                      }`}
                    >
                      <p>{para.text}</p>
                      {para.citedSourceIds.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {para.citedSourceIds.map((srcId) => {
                            const isSourceActive = activeSourceId === srcId;
                            return (
                              <button
                                key={srcId}
                                onClick={() => handleSelectSource(srcId)}
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                                  isSourceActive
                                    ? 'bg-brand text-white border-brand'
                                    : 'bg-canvas text-brand border-brand-border hover:bg-brand-subtle'
                                }`}
                              >
                                Source: {srcId}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel 3: Verified Company Knowledge Source (3 cols) */}
            <div className="lg:col-span-3 p-4 sm:p-5 bg-canvas/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate">
                  Verified Evidence
                </span>
                <span className="text-[10px] font-mono text-emerald-700 font-bold">
                  {activeSource.score}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-border-subtle shadow-subtle space-y-2.5">
                <div className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-ink leading-tight">
                      {activeSource.title}
                    </h4>
                    <span className="text-[10px] text-slate block mt-0.5">
                      {activeSource.section} • Page {activeSource.page}
                    </span>
                  </div>
                </div>

                <div className="bg-canvas p-2.5 rounded-lg border border-border-subtle text-[11px] font-mono text-ink leading-relaxed">
                  &ldquo;{activeSource.content}&rdquo;
                </div>

                <div className="pt-1 flex items-center justify-between text-[10px] text-slate">
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Verified Document
                  </span>
                  <span>Tenant: Lunetron</span>
                </div>
              </div>

              {/* Instructions guide */}
              <div className="text-[11px] text-slate-muted bg-white/60 p-3 rounded-xl border border-border-subtle/60 leading-relaxed">
                <span className="font-semibold text-ink">How it works:</span> Click any requirement on the left to trace its verified citation. The draft highlights supporting evidence directly from company records.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
