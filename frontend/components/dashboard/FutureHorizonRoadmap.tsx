'use client';

import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Layers, 
  Bot, 
  Server, 
  Radio, 
  ShieldCheck, 
  ArrowUpRight,
  Database,
  Building2,
  Workflow,
  Cpu
} from 'lucide-react';

export default function FutureHorizonRoadmap() {
  const [selectedPhase, setSelectedPhase] = useState<number>(3);

  const roadmapPhases = [
    {
      phase: 3,
      title: 'Knowledge Ingestion & Gemini Vector Embeddings',
      status: 'NEXT UP',
      statusColor: 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10',
      icon: Database,
      timeline: 'Phase 3 (Post-Phase 2 Review)',
      lead: 'Chinmay (AI Intelligence)',
      description: 'End-to-end vector pipeline utilizing Gemini embeddings, pgvector tables in PostgreSQL 16, HNSW indexing, and tenant-scoped similarity search.',
      deliverables: [
        'Real Gemini text-embedding-004 integration with dimension 1536/3072',
        'pgvector PostgreSQL tables with tenant isolation triggers',
        'Dynamic semantic chunking with metadata citation preservation',
        'Company-scoped similarity query optimization under 25ms',
      ],
      adr: 'ADR 0007 / Intelligence Foundation',
    },
    {
      phase: 4,
      title: 'Multi-Company Onboarding & Tenant Switcher',
      status: 'ARCHITECTED',
      statusColor: 'text-indigo-400 border-indigo-400/30 bg-indigo-400/10',
      icon: Building2,
      timeline: 'Phase 4',
      lead: 'Lokesh & Chinmay',
      description: 'Expand Lunova from Lunetron-exclusive to multi-tenant SaaS architecture where arbitrary enterprises can onboard their brand voice, documents, and credentials.',
      deliverables: [
        'Dynamic company tenant creation & isolation sandbox',
        'Tenant-specific brand voice prompts and styling guidelines',
        'Per-tenant Gmail and OAuth2 integration credentials',
        'Strict row-level security (RLS) policies in PostgreSQL',
      ],
      adr: 'README Section 2 & 9',
    },
    {
      phase: 5,
      title: 'Multi-Channel Ingestion (Slack, Webhooks, Portals)',
      status: 'PLANNED',
      statusColor: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      icon: Workflow,
      timeline: 'Phase 5',
      lead: 'Platform Team',
      description: 'Extend proposal ingestion beyond normalized email to include direct Slack channel listeners, enterprise supplier portals (Coupa, SAP Ariba), and webhook APIs.',
      deliverables: [
        'Slack Bot for instant RFP triage and notification alerts',
        'Supplier Portal web scrapers & automated PDF downloaders',
        'Public Webhook Ingestion API with cryptographic signatures',
        'Unified attachment OCR & multi-modal document understanding',
      ],
      adr: 'Architecture Blueprint v2',
    },
    {
      phase: 6,
      title: 'Distributed Asynchronous Execution Mesh',
      status: 'CONCEPTUAL',
      statusColor: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
      icon: Server,
      timeline: 'Phase 6',
      lead: 'DevOps & Backend',
      description: 'Transition from in-process background tasks to distributed Celery/Redis worker queues as RFP ingestion volume scales to thousands per day.',
      deliverables: [
        'Redis task broker with priority proposal queueing',
        'Auto-scaling worker pool with Docker & Kubernetes',
        'Dead-letter queues and automated retry semantics',
        'Distributed tracing with OpenTelemetry',
      ],
      adr: 'Rule 5: Scaled Infrastructure Transition',
    },
    {
      phase: 7,
      title: 'Live Real-Time Gemini Co-Pilot & Voice Reviewer',
      status: 'INNOVATION',
      statusColor: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
      icon: Radio,
      timeline: 'Phase 7',
      lead: 'AI Intelligence Lab',
      description: 'Live interactive conversational co-pilot allowing human reviewers to verbally command refinements, query sources in real-time, and auto-dispatch proposals.',
      deliverables: [
        'WebSocket bidirectional audio stream with Gemini Multimodal Live API',
        'Voice-driven draft editing ("Make section 2 more assertive")',
        'Real-time streaming token response rendering',
        '3D Audio visualizer wave synchronized with neural core',
      ],
      adr: 'Next-Gen Research',
    },
  ];

  const current = roadmapPhases.find((p) => p.phase === selectedPhase) || roadmapPhases[0];
  const CurrentIcon = current.icon;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-500 text-slate-950 font-bold">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Future Architectural Horizon & Capability Roadmap
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Designed in full compliance with the 7 Architectural Invariants & ADR contracts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Architecture: Modular Monolith</span>
        </div>
      </div>

      {/* Horizontal Phase Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {roadmapPhases.map((phase) => {
          const Icon = phase.icon;
          const isSelected = selectedPhase === phase.phase;
          return (
            <button
              key={phase.phase}
              onClick={() => setSelectedPhase(phase.phase)}
              className={`p-3 rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/30 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-900/90'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold ${phase.statusColor}`}>
                  {phase.status}
                </span>
                <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              <h4 className="text-xs font-bold text-white mb-0.5 truncate">
                Phase {phase.phase}
              </h4>
              <p className="text-[11px] text-slate-400 truncate">
                {phase.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Deep-Dive Card on Selected Phase */}
      <div className="glass-panel p-6 rounded-2xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-cyan-400 border border-indigo-500/30">
              <CurrentIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold block">
                ROADMAP SPECIFICATION // PHASE {current.phase}
              </span>
              <h3 className="text-lg font-bold text-white">
                {current.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10">
              <span className="text-slate-400">Lead: </span>
              <strong className="text-indigo-300">{current.lead}</strong>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10">
              <span className="text-slate-400">Target: </span>
              <strong className="text-emerald-300">{current.timeline}</strong>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-300 font-mono leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-white/5">
          {current.description}
        </p>

        <div>
          <span className="text-xs font-mono uppercase text-cyan-400 font-semibold block mb-3">
            Key Architectural Deliverables & Invariants
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {current.deliverables.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-start gap-2.5 text-xs text-slate-200"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-500 border-t border-white/5">
          <span>Reference: {current.adr}</span>
          <span className="flex items-center gap-1 text-cyan-400 hover:underline cursor-pointer">
            Explore Contracts & Docs <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
