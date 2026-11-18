'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  FileSearch,
  BookOpen,
  FileCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ArrowRight,
  ExternalLink,
  Shield,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface StageConfig {
  id: number;
  label: string;
  title: string;
  subtitle: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: '01 Inbound Request',
    title: 'An unstructured inquiry arrives',
    subtitle: 'Client sends an RFP via corporate email with multi-part requirements.',
  },
  {
    id: 2,
    label: '02 Extraction',
    title: 'Decomposing explicit & inferred needs',
    subtitle: 'Lunova isolates discrete security, technical, and operational obligations.',
  },
  {
    id: 3,
    label: '03 Company Knowledge',
    title: 'Retrieving verified corporate evidence',
    subtitle: 'Semantic search matches each clause strictly against your indexed docs.',
  },
  {
    id: 4,
    label: '04 Grounded Draft',
    title: 'Synthesizing evidence-backed answers',
    subtitle: 'Every claim is cited; missing details are surfaced rather than fabricated.',
  },
  {
    id: 5,
    label: '05 Human Review',
    title: 'Ready for human inspection & sign-off',
    subtitle: 'The team verifies evidence, resolves gaps, and approves before dispatch.',
  },
];

export const SignatureMotionSequence: React.FC = () => {
  const [activeStage, setActiveStage] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setActiveStage((prev) => (prev >= 5 ? 1 : prev + 1));
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleStageSelect = (stageId: number) => {
    setActiveStage(stageId);
    setIsPlaying(false);
  };

  return (
    <section id="workflow-animation" className="relative py-14 sm:py-16 lg:py-20 bg-gradient-to-b from-slate-50/20 via-blue-50/30 to-white border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-2.5 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Product Storytelling</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-950 mb-2.5 leading-tight">
            From incoming request to <span className="text-blue-600">review-ready response</span>.
          </h2>
          <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-normal">
            Lunova connects the request to your company&apos;s knowledge, then prepares a draft your team can inspect and refine.
          </p>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-5 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStageSelect(s.id)}
                className={`px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeStage === s.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-105'
                    : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 bg-white border border-slate-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 bg-white border border-slate-200 hover:border-blue-300 transition-colors shrink-0 shadow-xs cursor-pointer"
            title={isPlaying ? 'Pause auto-advance' : 'Play sequence'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Auto-play</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Display Canvas */}
        <div className="bg-white rounded-3xl border border-blue-100 shadow-xl overflow-hidden hover:border-blue-300 transition-colors">
          {/* Canvas Top Bar */}
          <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-blue-50/60 via-slate-50/80 to-blue-50/40 border-b border-blue-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-mono text-blue-700 font-bold uppercase tracking-wider">
                  Stage {activeStage} of 5
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">{STAGES[activeStage - 1].title}</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              {STAGES[activeStage - 1].subtitle}
            </p>
          </div>

          {/* Interactive Stage Panel */}
          <div className="p-6 sm:p-10 min-h-[460px] flex items-center justify-center">
            {/* STAGE 1: INCOMING EMAIL */}
            {activeStage === 1 && (
              <div className="w-full max-w-2xl bg-paper/50 rounded-xl border border-line p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-accent" />
                    <span className="text-xs font-mono text-muted">Inbound Request • 10:14 AM</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface border border-line text-muted">
                    RFP-2026-SECURITY
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-ink">
                    Subject: Enterprise Security Questionnaire
                  </h4>
                  <p className="text-xs text-muted">From: procurement@acmeglobal.com</p>
                </div>
                <div className="p-4 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink/90 leading-relaxed font-sans">
                  &ldquo;We are evaluating vendors for an upcoming enterprise deployment. Please provide details about your <span className="bg-amber-100 text-amber-900 px-1 rounded">security controls</span>, <span className="bg-amber-100 text-amber-900 px-1 rounded">deployment model</span>, <span className="bg-amber-100 text-amber-900 px-1 rounded">support process</span>, and <span className="bg-amber-100 text-amber-900 px-1 rounded">relevant experience</span>.&rdquo;
                </div>
                <div className="flex items-center gap-2 text-xs text-muted pt-2">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span>Lunova webhook captured inbound message with 4 distinct requirements.</span>
                </div>
              </div>
            )}

            {/* STAGE 2: EXTRACTION */}
            {activeStage === 2 && (
              <div className="w-full max-w-2xl space-y-3 animate-in fade-in duration-300">
                <div className="text-xs font-mono text-muted mb-2">Classified Requirement Matrix</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                        SECURITY
                      </span>
                      <span className="text-[10px] text-muted">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-ink">
                      Enterprise security controls, SOC2 certification, and data encryption specifications.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                        ARCHITECTURE
                      </span>
                      <span className="text-[10px] text-muted">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-ink">
                      Dedicated single-tenant deployment model vs. multi-tenant VPC peering support.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        OPERATIONAL
                      </span>
                      <span className="text-[10px] text-muted">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-ink">
                      24/7 technical support tier with guaranteed response times under 15 minutes.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-paper/60 border border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                        TIMELINE
                      </span>
                      <span className="text-[10px] text-amber-700 font-semibold">Gap Flagged</span>
                    </div>
                    <p className="text-xs font-medium text-ink">
                      Target go-live dates are omitted in client RFP; surfaced for clarification.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: COMPANY KNOWLEDGE */}
            {activeStage === 3 && (
              <div className="w-full max-w-2xl space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-mono">Retrieved Knowledge Citations (Tenant Isolated)</span>
                  <span>Cosine Similarity ≥ 0.82</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-paper/70 border border-line flex items-start gap-3">
                    <div className="p-2 rounded bg-surface border border-line text-accent shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">Security Overview 2026.pdf</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          98% Match
                        </span>
                      </div>
                      <p className="text-muted leading-relaxed">
                        &ldquo;All customer data is encrypted in transit via TLS 1.3 and at rest using AES-256 with dedicated KMS keys.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper/70 border border-line flex items-start gap-3">
                    <div className="p-2 rounded bg-surface border border-line text-accent shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">Deployment Architecture Guide.docx</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          94% Match
                        </span>
                      </div>
                      <p className="text-muted leading-relaxed">
                        &ldquo;Lunova operates isolated single-tenant compute pods with private VPC endpoints across AWS and GCP regions.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-paper/70 border border-line flex items-start gap-3">
                    <div className="p-2 rounded bg-surface border border-line text-accent shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">Enterprise Support Policy.pdf</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          91% Match
                        </span>
                      </div>
                      <p className="text-muted leading-relaxed">
                        &ldquo;Priority 1 enterprise incident response SLA guarantees engineering engagement within 15 minutes 24/7/365.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: GROUNDED DRAFT */}
            {activeStage === 4 && (
              <div className="w-full max-w-2xl bg-paper/50 rounded-xl border border-line p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-accent" />
                    <span className="text-xs font-semibold text-ink">Evidence-Grounded Draft Assembled</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                    STATUS: DRAFT
                  </span>
                </div>

                <div className="p-4 rounded-lg bg-surface border border-line text-xs sm:text-sm text-ink leading-relaxed space-y-3 font-sans">
                  <p>
                    Our platform enforces enterprise encryption standards (AES-256 at rest, TLS 1.3 in transit) verified under annual SOC2 Type II audits{' '}
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded border border-accent/20">
                      [Ref: Security Overview §4]
                    </span>
                    .
                  </p>
                  <p>
                    We deploy dedicated single-tenant workload clusters inside isolated VPC subnets{' '}
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-accent-soft text-accent px-1.5 py-0.5 rounded border border-accent/20">
                      [Ref: Deployment Guide §2.1]
                    </span>
                    , backed by 24/7 Sev-1 engineering support with a 15-minute SLA commitment.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Surfaced Gap:</span> Target implementation timeline was not provided in the client&apos;s RFP. Proposed 6-week standard rollout drafted for reviewer verification.
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5: HUMAN REVIEW */}
            {activeStage === 5 && (
              <div className="w-full max-w-2xl bg-surface rounded-xl border-2 border-accent/40 p-6 space-y-5 animate-in fade-in duration-300 shadow-elevated">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-accent" />
                    <div>
                      <h4 className="text-sm font-bold text-ink">Ready for Human Review</h4>
                      <p className="text-[11px] text-muted">All claims linked to verified evidence.</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    100% Traceable
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-ink/90 leading-relaxed font-sans bg-paper/50 p-4 rounded-lg border border-line">
                  &ldquo;Review the evidence. Resolve missing details. Approve the response.&rdquo;
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-xs text-muted">
                    <span>Authorized Reviewer: </span>
                    <strong className="text-ink">Solutions Architect</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 text-sm font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-sm cursor-pointer">
                      Edit Draft Paragraphs
                    </button>
                    <button className="px-6 py-2.5 text-sm font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg cursor-pointer">
                      Approve for Dispatch
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Bottom Timeline Progression */}
          <div className="px-6 py-3 bg-paper/40 border-t border-line flex items-center justify-between text-xs text-muted">
            <span>Core Guarantee: AI drafts never send autonomously</span>
            <span className="font-mono text-[11px]">Human Authority Gate • Strict Boundary</span>
          </div>
        </div>
      </div>
    </section>
  );
};
