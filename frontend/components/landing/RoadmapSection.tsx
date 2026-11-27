'use client';

import React from 'react';
import { Compass, Sparkles, Clock, ArrowUpRight } from 'lucide-react';

const ROADMAP_ITEMS = [
  {
    title: 'Spreadsheet & Deck Parsing (XLSX, PPTX)',
    category: 'Intake Channels',
    status: 'Planned',
    description:
      'Support pricing matrices in Excel and capability decks in PowerPoint alongside existing PDF, DOCX, and TXT parsing.',
  },
  {
    title: 'Automated Multi-SME Review Routing',
    category: 'Collaboration',
    status: 'Planned',
    description:
      'Assign specific proposal sections (e.g., Security, Pricing, Architecture) to designated team leads for parallel sign-off.',
  },
  {
    title: 'CRM & Deal Pipeline Integrations',
    category: 'Ecosystem',
    status: 'Exploring',
    description:
      'Bi-directional synchronization with Salesforce and HubSpot to associate proposal responses with active opportunities.',
  },
  {
    title: 'Knowledge Freshness & Expiration Alarms',
    category: 'Knowledge Governance',
    status: 'Exploring',
    description:
      'Automated alerts when SOC 2 attestations, rate cards, or SLA sheets exceed their validity date in your library.',
  },
];

export const RoadmapSection: React.FC = () => {
  return (
    <section id="roadmap" className="py-20 md:py-24 bg-white border-b border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-canvas text-slate border border-border-subtle text-[11px] font-semibold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-brand" />
            <span>Product Evolution</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Where Lunova is heading next.
          </h2>

          <p className="text-sm sm:text-base text-slate leading-relaxed">
            Our forward-looking roadmap items are deliberate extensions of our core grounding
            architecture. Items are clearly marked as Planned or Exploring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {ROADMAP_ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-canvas/60 rounded-2xl p-5 border border-border-subtle flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">
                    {item.category}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      item.status === 'Planned'
                        ? 'bg-blue-50 text-brand border-blue-200'
                        : 'bg-gray-100 text-slate border-gray-200'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink mb-1">{item.title}</h3>
                <p className="text-xs text-slate leading-relaxed">{item.description}</p>
              </div>

              <div className="pt-2 flex items-center gap-1 text-[11px] text-slate-muted font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Roadmap item — Not currently active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
