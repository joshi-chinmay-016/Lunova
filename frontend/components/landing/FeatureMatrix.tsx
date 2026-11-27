'use client';

import React from 'react';
import {
  FileSearch,
  BookMarked,
  Cpu,
  UserCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  Search,
  Database,
  Shield,
  FileCheck,
} from 'lucide-react';

const FEATURE_GROUPS = [
  {
    group: 'Understand',
    badge: 'Stage 01 — Analysis',
    title: 'Deconstruct complex RFPs into verified requirements.',
    features: [
      {
        name: 'Multi-Format Attachment Parsing',
        detail:
          'Ingests PDF (page-aware), DOCX (tables & headers), and TXT RFP specifications safely with size caps and magic byte validation.',
      },
      {
        name: 'Structured Requirement Classification',
        detail:
          'Categorizes technical, functional, security, timeline, and commercial requirements with explicit vs inferred distinctions.',
      },
      {
        name: 'Automated Gap & Ambiguity Detection',
        detail:
          'Detects absent submission deadlines, missing budget figures, or vague scope phrases ("deploy quickly") without guessing.',
      },
    ],
  },
  {
    group: 'Ground',
    badge: 'Stage 02 — Evidence',
    title: 'Anchor responses to your verified company truth.',
    features: [
      {
        name: 'Tenant-Partitioned Vector Storage',
        detail:
          'Embeds documents with Gemini 768-dim models and stores chunks strictly partitioned by company identifier in pgvector.',
      },
      {
        name: 'Semantic Relevance Thresholding',
        detail:
          'Filters low-confidence chunks and deduplicates redundant excerpts to ensure only high-affinity evidence is cited.',
      },
      {
        name: 'Verbatim Source Attribution',
        detail:
          'Every drafted paragraph records exact document IDs, section titles, and page numbers for effortless human auditing.',
      },
    ],
  },
  {
    group: 'Prepare',
    badge: 'Stage 03 — Drafting',
    title: 'Synthesize professional proposals with zero fabrication.',
    features: [
      {
        name: 'Anti-Hallucination Guardrails',
        detail:
          'Strictly prohibits inventing unrecorded past clients, unverified certifications, delivery dates, or unauthorized prices.',
      },
      {
        name: 'Grounded Email Response Drafting',
        detail:
          'Produces complete executive summaries and tailored client response drafts addressing each extracted requirement.',
      },
      {
        name: 'Factual Confidence Scoring',
        detail:
          'Deterministic evaluation flags ungrounded assertions, coverage shortfalls, or suspicious price quotes for human review.',
      },
    ],
  },
  {
    group: 'Control',
    badge: 'Stage 04 — Authority',
    title: 'Keep executive decision-makers firmly in the driver seat.',
    features: [
      {
        name: 'Human Review & Approval Workspace',
        detail:
          'Reviewers inspect requirement fulfillment, edit draft paragraphs, add internal notes, and approve or reject submissions.',
      },
      {
        name: 'Explicit Two-Step Dispatch',
        detail:
          'Responses are dispatched through connected corporate mailboxes only upon explicit human confirmation naming the recipient.',
      },
      {
        name: 'Tamper-Evident Audit Logging',
        detail:
          'All lifecycle events—intake, extraction, retrieval, review, and approval—are recorded with reviewer IDs and timestamps.',
      },
    ],
  },
];

export const FeatureMatrix: React.FC = () => {
  return (
    <section id="features" className="py-20 md:py-28 bg-canvas border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-ink border border-border-subtle text-[11px] font-semibold uppercase tracking-wider shadow-subtle">
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span>Capability Architecture</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Engineered for enterprise proposal operations.
          </h2>

          <p className="text-sm sm:text-base text-slate leading-relaxed">
            Every feature is organized around the four operational pillars of serious B2B proposal
            teams: Understanding, Grounding, Preparing, and Controlling.
          </p>
        </div>

        {/* 4 Feature Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {FEATURE_GROUPS.map((group) => (
            <div
              key={group.group}
              className="bg-white rounded-2xl p-6 sm:p-8 border border-border-subtle shadow-subtle flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-brand px-2.5 py-0.5 rounded-full bg-brand-subtle border border-brand-border">
                    {group.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-muted font-bold">
                    {group.group}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-ink mb-6">{group.title}</h3>

                <div className="space-y-4">
                  {group.features.map((feat) => (
                    <div key={feat.name} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-ink">{feat.name}</div>
                        <div className="text-xs text-slate mt-0.5 leading-relaxed">
                          {feat.detail}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-slate font-medium">
                <span>Enterprise SLA</span>
                <span className="text-brand font-semibold">Active in Workspace</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
