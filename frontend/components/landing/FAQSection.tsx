'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does Lunova prepare a proposal response?',
    a: 'When an inbound proposal or RFP is received, Lunova’s intelligence engine parses the text and attachments (PDF, DOCX, TXT), extracts structured requirements, and searches your company’s knowledge base using vector similarity. It then synthesizes an evidence-backed draft where every requirement response directly links to verified documents.',
  },
  {
    q: 'Where does the information in a generated draft come from?',
    a: 'All statements are strictly retrieved from your authorized company knowledge base (e.g. uploaded whitepapers, security attestations, rate sheets, and architectural blueprints). Lunova uses strict anti-hallucination guardrails and is prohibited from fabricating previous clients, certifications, or commitments.',
  },
  {
    q: 'What happens when the company knowledge base does not contain an answer?',
    a: 'If a client requirement is completely outside your documented capabilities, Lunova flags the item as "Insufficient Evidence" or "Missing Information". Rather than making assumptions or inventing answers, it surfaces the gap in the review workspace so a human subject-matter expert can decide how to respond.',
  },
  {
    q: 'Can Lunova send emails automatically?',
    a: 'No. Lunova will never send an email automatically. All generated drafts require explicit human review and approval. Sending requires an authorized user to confirm the recipient and draft content before transmission through the connected account.',
  },
  {
    q: 'How are company data boundaries enforced in multi-tenant environments?',
    a: 'Tenant isolation is enforced directly at the database query boundary. Every retrieval operation mandates a verified company identifier and filters chunks strictly within that company partition. One organization’s confidential knowledge documents are never accessible to another company.',
  },
  {
    q: 'Which document formats and integrations are currently supported?',
    a: 'Lunova currently supports PDF (page-aware text extraction), DOCX (paragraph and table extraction), and TXT document ingestion. Gmail OAuth mailbox integration is currently being implemented by the platform team; until active, documents can be uploaded directly via the web workspace.',
  },
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20 md:py-28 bg-canvas border-b border-border-subtle">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-ink border border-border-subtle text-[11px] font-semibold uppercase tracking-wider shadow-subtle">
            <HelpCircle className="w-3.5 h-3.5 text-brand" />
            <span>Frequently Asked Questions</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
            Clear answers about our architecture.
          </h2>

          <p className="text-sm sm:text-base text-slate leading-relaxed">
            Practical details on how evidence retrieval works, how data boundaries are protected,
            and how human review is maintained.
          </p>
        </div>

        {/* Accordion */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-border-subtle shadow-subtle overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-ink hover:text-brand transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
