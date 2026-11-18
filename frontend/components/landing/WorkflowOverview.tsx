'use client';

import React from 'react';
import { Mail, Search, Database, FileText, CheckCircle2 } from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    name: 'Receive',
    heading: 'A proposal request enters the workflow',
    description:
      'Inbound RFPs and questionnaires arrive via email or document upload, captured into a secure tenant queue without manual rekeying.',
    details: 'Supports multi-page PDF, DOCX tables, and raw email attachments with format validation.',
    icon: Mail,
  },
  {
    step: '02',
    name: 'Understand',
    heading: 'The system identifies requirements and questions',
    description:
      'Lunova decomposes complex prose into discrete requirements, categorizing technical, operational, and commercial criteria.',
    details: 'Surfaces explicit vs. inferred requirements and highlights missing specifications upfront.',
    icon: Search,
  },
  {
    step: '03',
    name: 'Retrieve',
    heading: 'Relevant evidence is located in your knowledge base',
    description:
      'Semantic vector search retrieves verified paragraphs strictly from your company’s indexed documentation and past winning bids.',
    details: 'Enforces cosine thresholding and strict multi-tenant data boundaries.',
    icon: Database,
  },
  {
    step: '04',
    name: 'Draft',
    heading: 'A response is assembled using the available evidence',
    description:
      'Lunova generates complete proposal sections where every factual assertion is linked directly to an evidence citation.',
    details: 'If evidence is incomplete, gaps are highlighted rather than filled with generic filler.',
    icon: FileText,
  },
  {
    step: '05',
    name: 'Review',
    heading: 'A human checks the response, resolves gaps, and signs off',
    description:
      'Your team reviews the evidence citations, edits text where necessary, and provides explicit approval before dispatch.',
    details: 'No proposal response is ever transmitted autonomously without human authorization.',
    icon: CheckCircle2,
  },
];

export const WorkflowOverview: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-24 sm:py-28 lg:py-32 bg-gradient-to-b from-slate-50/20 via-blue-50/30 to-white border-b border-blue-100/70 overflow-hidden">
      {/* Crisp geometric grid (no blur) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(37,99,235,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(37,99,235,0.025)_1px,transparent_1px)] bg-[size:44px_44px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="max-w-2xl mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/90 text-xs font-semibold uppercase tracking-wider text-blue-700 mb-3 shadow-xs">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>System Architecture</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 leading-tight">
            The five-stage <span className="text-blue-600">proposal workflow</span>.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal">
            A controlled, repeatable sequence engineered for accuracy, evidence grounding, and human accountability.
          </p>
        </div>

        {/* Editorial Progressive Layout with Alive Cards */}
        <div className="space-y-4 sm:space-y-5">
          {WORKFLOW_STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group p-6 sm:p-7 rounded-2xl bg-white hover:border-blue-400/80 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Step Number & Indicator */}
                  <div className="md:col-span-2 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold font-mono text-sm shadow-xs group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      {item.step}
                    </div>
                    <span className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="md:col-span-6 space-y-1.5">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {item.heading}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Technical Sub-Detail */}
                  <div className="md:col-span-4 bg-slate-50 group-hover:bg-blue-50/50 p-4 rounded-xl border border-slate-200 group-hover:border-blue-200 text-xs text-slate-600 space-y-1 transition-colors">
                    <span className="font-mono text-[10px] uppercase text-blue-700 font-bold tracking-wider block">
                      Engineering Safeguard
                    </span>
                    <p className="leading-relaxed">{item.details}</p>
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
