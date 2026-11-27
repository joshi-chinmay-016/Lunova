'use client';

import React from 'react';
import { Mail, Search, Database, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    name: 'Ingest',
    heading: 'Raw proposal request enters secure tenant queue',
    description:
      'Inbound RFPs and questionnaires arrive via email webhooks or document upload, captured into a cryptographically isolated tenant enclave.',
    details: 'Supports multi-page PDF tables, DOCX matrices, and complex unstructured appendices.',
    icon: Mail,
    color: 'emerald',
  },
  {
    step: '02',
    name: 'Decompose',
    heading: 'Semantic decomposition into atomic obligations',
    description:
      'Lunova isolates discrete obligations across security controls, infrastructure topologies, SLA commitments, and commercial terms.',
    details: 'Surfaces explicit requirements vs. implied criteria and flags ambiguities immediately.',
    icon: Search,
    color: 'cyan',
  },
  {
    step: '03',
    name: 'Vector Query',
    heading: 'Tenant-bounded semantic vector retrieval',
    description:
      'Queries corporate whitepapers, SOC2 certifications, and architecture runbooks with strict cosine similarity thresholds.',
    details: 'Enforces hard multi-tenant boundaries with zero data leakage across workspaces.',
    icon: Database,
    color: 'emerald',
  },
  {
    step: '04',
    name: 'Synthesize',
    heading: 'Evidence-backed response drafting',
    description:
      'Lunova synthesizes complete responses where every factual assertion is linked directly to an exact paragraph citation.',
    details: 'Missing evidence is visibly flagged for human intervention rather than approximated.',
    icon: FileText,
    color: 'cyan',
  },
  {
    step: '05',
    name: 'Human Gate',
    heading: 'Solutions team inspects, edits, and authorizes',
    description:
      'Subject matter experts review citations side-by-side, resolve flagged gaps, and grant immutable digital sign-off.',
    details: 'Zero proposals are ever transmitted autonomously without authorized human sign-off.',
    icon: CheckCircle2,
    color: 'emerald',
  },
];

export const WorkflowOverview: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 lg:py-24 border-b border-slate-200/80 overflow-hidden">
      {/* High-tech dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#0284C7_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.05] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200/80 text-xs font-mono font-semibold uppercase tracking-wider text-cyan-800 mb-3.5 shadow-xs">
            <Database className="w-3.5 h-3.5 text-cyan-600" />
            <span>04 // Lifecycle Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold tracking-tight text-slate-950 mb-4 leading-tight">
            The five-stage <span className="text-gradient-aurora">intelligence cycle</span>.
          </h2>
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-sans">
            A deterministic, auditable pipeline engineered for high-consequence enterprise responses where accuracy is paramount.
          </p>
        </div>

        {/* Editorial Progressive Layout with Specular Glass Cards */}
        <div className="space-y-4 sm:space-y-5">
          {WORKFLOW_STEPS.map((item) => {
            const Icon = item.icon;
            const isEmerald = item.color === 'emerald';
            return (
              <div
                key={item.step}
                className="group p-6 sm:p-7 rounded-2xl glass-card hover:border-emerald-300 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Step Number & Indicator */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold font-mono text-sm shadow-xs transition-all ${
                        isEmerald
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white'
                          : 'bg-cyan-50 text-cyan-800 border border-cyan-200 group-hover:bg-cyan-600 group-hover:text-white'
                      }`}
                    >
                      {item.step}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-slate-900 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="md:col-span-6 space-y-1.5">
                    <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {item.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Technical Sub-Detail */}
                  <div className="md:col-span-4 bg-slate-50 group-hover:bg-emerald-50/40 p-4 rounded-xl border border-slate-200 group-hover:border-emerald-200 text-xs text-slate-600 space-y-1 transition-colors">
                    <span className="font-mono text-[10px] uppercase text-emerald-800 font-bold tracking-wider block">
                      Engineering Safeguard
                    </span>
                    <p className="leading-relaxed font-sans">{item.details}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
