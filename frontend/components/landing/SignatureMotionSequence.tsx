'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  BookOpen,
  FileCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Layers,
  Sparkles,
  Zap,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { ShinyButton } from '@/components/ui/ShinyButton';

interface StageConfig {
  id: number;
  label: string;
  title: string;
  subtitle: string;
}

const STAGES: StageConfig[] = [
  {
    id: 1,
    label: '01 Inbound RFP',
    title: 'An unstructured client RFP arrives',
    subtitle: 'Client sends an enterprise RFP via corporate email with multi-part compliance requirements.',
  },
  {
    id: 2,
    label: '02 Decomposition',
    title: 'Decomposing explicit & inferred obligations',
    subtitle: 'Lunova isolates discrete security, architecture, SLA, and commercial requirements.',
  },
  {
    id: 3,
    label: '03 Vector Retrieval',
    title: 'Matching against verified corporate evidence',
    subtitle: 'Semantic search queries isolated tenant embeddings to find exact supporting paragraphs.',
  },
  {
    id: 4,
    label: '04 Grounded Synthesis',
    title: 'Synthesizing evidence-backed answers',
    subtitle: 'Every claim is cited; missing details are surfaced upfront rather than fabricated.',
  },
  {
    id: 5,
    label: '05 Human Sign-Off',
    title: 'Ready for human inspection & sign-off',
    subtitle: 'The solutions team inspects sources, resolves flags, and approves before dispatch.',
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
    <section id="workflow-animation" className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* Subtle crisp dot grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284C7_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-800 mb-3.5 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-cyan-600" />
            <span>02 // Execution Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            From raw email inquiry to{' '}
            <span className="text-gradient-aurora">audit-grade response</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            Follow the automated lifecycle as Lunova transforms an unstructured request into a cited, verified draft ready for executive sign-off.
          </p>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200/90 pb-5 mb-8 overflow-x-auto">
          <div className="flex items-center gap-2.5">
            {STAGES.map((s) => {
              const isActive = activeStage === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStageSelect(s.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-md shadow-emerald-500/25 scale-[1.03]'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 bg-white/80 border border-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:border-slate-300 transition-colors shrink-0 shadow-xs cursor-pointer"
            title={isPlaying ? 'Pause auto-advance' : 'Play sequence'}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Auto-play</span>
              </>
            )}
          </button>
        </div>

        {/* Dynamic Display Canvas */}
        <div className="relative glass-card rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden">
          <BorderBeam size={220} duration={10} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />

          {/* Canvas Top Bar */}
          <div className="px-6 sm:px-8 py-5 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-cyan-50/20 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono text-emerald-700 font-bold uppercase tracking-wider">
                  Stage {activeStage} of 5 • {STAGES[activeStage - 1].label}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                {STAGES[activeStage - 1].title}
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md font-sans">
              {STAGES[activeStage - 1].subtitle}
            </p>
          </div>

          {/* Interactive Stage Panel */}
          <div className="p-6 sm:p-10 min-h-[440px] flex items-center justify-center bg-white/60">
            {/* STAGE 1: INCOMING EMAIL */}
            {activeStage === 1 && (
              <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 space-y-4 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Mail className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono text-slate-500">Inbound Webhook Capture • 10:14:02 UTC</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-bold">
                    RFP-2026-CLOUD-SEC
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-display font-bold text-slate-900">
                    Subject: Enterprise Security &amp; Compliance Questionnaire (Acme Corp)
                  </h4>
                  <p className="text-xs font-mono text-slate-500">From: procurement-rfp@acmeglobal.com</p>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  &ldquo;We are evaluating prospective SaaS infrastructure providers for an enterprise migration. Please provide verified specifications regarding your <span className="bg-emerald-100 text-emerald-900 font-medium px-1 rounded">customer encryption key rotation</span>, <span className="bg-emerald-100 text-emerald-900 font-medium px-1 rounded">SOC2 Type II audit boundaries</span>, <span className="bg-emerald-100 text-emerald-900 font-medium px-1 rounded">24/7 Sev-1 SLA guarantees</span>, and <span className="bg-amber-100 text-amber-900 font-medium px-1 rounded">5,000-seat onboarding timeline</span>.&rdquo;
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 pt-1">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lunova parser captured payload with 4 extractable obligations.</span>
                </div>
              </div>
            )}

            {/* STAGE 2: EXTRACTION */}
            {activeStage === 2 && (
              <div className="w-full max-w-2xl space-y-3.5 animate-in fade-in duration-300">
                <div className="text-xs font-mono text-slate-500 mb-1 flex items-center justify-between">
                  <span>Classified Requirement Matrix</span>
                  <span className="text-emerald-700 font-bold">Parsed in 0.42s</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        SECURITY
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">
                      Customer key rotation cadence under AWS KMS and SOC2 Type II cert report.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-cyan-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-50 text-cyan-800 font-bold border border-cyan-200">
                        ARCHITECTURE
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">
                      Dedicated single-tenant compute pods with automated cross-region failover.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-emerald-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        OPERATIONAL
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Explicit</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">
                      24/7 priority enterprise support with 15-minute Sev-1 engineering response.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-xs space-y-1.5 hover:border-amber-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        TIMELINE GAP
                      </span>
                      <span className="text-[10px] font-mono text-amber-700 font-bold">Flagged</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900">
                      Target onboarding milestones omitted by client; flagged for solutions review.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3: COMPANY KNOWLEDGE */}
            {activeStage === 3 && (
              <div className="w-full max-w-2xl space-y-3.5 animate-in fade-in duration-300">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                  <span>Isolated Tenant Embeddings (Cosine &ge; 0.90)</span>
                  <span className="text-emerald-700 font-bold">Strict Air-Gap Enforced</span>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-slate-900">Security_Whitepaper_2026.pdf</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                          99.2% Match
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        &ldquo;Data encrypted in transit via TLS 1.3 and at rest using AES-256 with tenant KMS customer-managed keys rotated every 90 days.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-slate-900">Disaster_Recovery_Plan.md</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 border border-cyan-300 font-bold">
                          96.8% Match
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        &ldquo;Single-tenant compute pods with private VPC peering and automated active-passive failover across AWS availability zones.&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-start gap-3 shadow-xs">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-slate-900">Enterprise_Support_SLA.pdf</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold">
                          94.4% Match
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-sans">
                        &ldquo;Sev-1 incident response guarantees senior engineering engagement in under 15 minutes 24/7/365.&rdquo;
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 4: GROUNDED DRAFT */}
            {activeStage === 4 && (
              <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm animate-in fade-in duration-300">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-mono font-bold text-slate-900">Verified Evidence-Grounded Draft</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                    CONFIDENCE: 98.4%
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs sm:text-sm text-slate-800 leading-relaxed space-y-2.5 font-sans">
                  <p>
                    Lunova operates dedicated single-tenant VPC deployments with automated active-passive failover{' '}
                    <span className="inline-flex items-center font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                      [DR Plan §3.1]
                    </span>
                    .
                  </p>
                  <p>
                    Customer data is isolated via KMS-managed customer keys with 90-day auto-rotation under SOC2 Type II certs{' '}
                    <span className="inline-flex items-center font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                      [Security Whitepaper §4.2]
                    </span>
                    , supported by 24/7 Sev-1 response under 15 minutes.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 font-sans">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Reviewer Flag:</span> Client requested 5,000-seat timeline. Standard 6-week rollout drafted for Solutions Architect sign-off.
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 5: HUMAN REVIEW */}
            {activeStage === 5 && (
              <div className="w-full max-w-2xl bg-white rounded-2xl border-2 border-emerald-400 p-6 sm:p-7 space-y-5 animate-in fade-in duration-300 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-display font-bold text-slate-900">Human Authorization Gate</h4>
                      <p className="text-[11px] font-mono text-slate-500">Every response requires explicit sign-off</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    100% Traceable
                  </span>
                </div>

                <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
                  &ldquo;Review all cited sources alongside generated paragraphs. Verify flagged timeline constraints. Authorize dispatch.&rdquo;
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <div className="text-xs font-mono text-slate-500">
                    <span>Authorized Reviewer: </span>
                    <strong className="text-slate-900 font-display">Solutions Lead</strong>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-5 py-2.5 text-xs sm:text-sm font-display font-bold rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 transition-colors shadow-xs cursor-pointer">
                      Edit Draft
                    </button>
                    <ShinyButton
                      href="/dashboard"
                      className="min-h-[46px] px-6 py-2.5 text-xs sm:text-sm font-display"
                    >
                      <span>Approve Response</span>
                    </ShinyButton>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Bottom Timeline Progression */}
          <div className="px-6 sm:px-8 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono text-slate-600">
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-emerald-600" /> AI drafts never send autonomously
            </span>
            <span className="text-emerald-700 font-bold">Strict Boundary Isolation Active</span>
          </div>
        </div>
      </div>
    </section>
  );
};
