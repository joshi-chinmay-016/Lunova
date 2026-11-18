'use client';

import React from 'react';
import { BookOpenCheck, AlertTriangle, Building2, UserCheck2, ShieldCheck } from 'lucide-react';

const PRINCIPLES = [
  {
    icon: BookOpenCheck,
    title: 'Evidence before assertions',
    summary: 'Every response claim links to verified company documents.',
    description:
      'Lunova never fabricates past client names, certifications, SLA windows, or pricing. If an assertion is not substantiated in your company knowledge library, the draft either omits the claim or marks it for human review.',
    tag: 'Factual Grounding',
  },
  {
    icon: AlertTriangle,
    title: 'Visible uncertainty',
    summary: 'Missing requirements and ambiguities are surfaced, never guessed.',
    description:
      'When an inbound RFP lacks a concrete budget, timeline, or scope specification, Lunova flags the absence in an actionable review station rather than making assumptions.',
    tag: 'Transparent Gaps',
  },
  {
    icon: Building2,
    title: 'Company boundaries',
    summary: 'Strict tenant data isolation enforced at the database query boundary.',
    description:
      'Multi-tenant vector retrieval strictly filters by company identifier. One organization’s confidential knowledge documents, client proposals, and case studies are never accessible to another company.',
    tag: 'Multi-Tenant Isolation',
  },
  {
    icon: UserCheck2,
    title: 'Human authority',
    summary: 'AI prepares the draft. Your team decides whether it sends.',
    description:
      'Generated proposals are never transmitted automatically. A designated human reviewer must inspect the draft, examine cited sources, edit language if desired, and provide explicit confirmation.',
    tag: 'Guaranteed Human Sign-off',
  },
];

export const TrustSection: React.FC = () => {
  return (
    <section id="trust" className="py-20 md:py-28 bg-white border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Responsible AI Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            AI that shows its work.
          </h2>

          <p className="text-sm sm:text-base text-slate leading-relaxed">
            Four foundational engineering principles designed to protect enterprise accuracy, maintain
            strict tenant boundaries, and keep human judgment at the center of every proposal.
          </p>
        </div>

        {/* 4 Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {PRINCIPLES.map((principle) => {
            const Icon = principle.icon;
            return (
              <div
                key={principle.title}
                className="bg-canvas/50 hover:bg-canvas rounded-2xl p-6 sm:p-7 border border-border-subtle hover:border-border-strong hover:shadow-card transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-border-subtle text-brand flex items-center justify-center shadow-subtle">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-muted uppercase tracking-wider px-2 py-0.5 rounded bg-white border border-border-subtle">
                      {principle.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-ink mb-1.5">{principle.title}</h3>
                  <div className="text-xs font-semibold text-brand mb-3">
                    {principle.summary}
                  </div>
                  <p className="text-xs text-slate leading-relaxed">{principle.description}</p>
                </div>

                <div className="mt-6 pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] text-slate-muted">
                  <span>Enforced by design</span>
                  <span className="text-emerald-700 font-medium">Verified Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
