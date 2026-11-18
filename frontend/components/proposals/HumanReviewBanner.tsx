import React from 'react';
import { ProposalStatus } from '@/types/proposal';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface HumanReviewBannerProps {
  status: ProposalStatus;
  reviewerNotes?: string;
  proposalId?: string;
}

export const HumanReviewBanner: React.FC<HumanReviewBannerProps> = ({
  status,
  reviewerNotes,
  proposalId,
}) => {
  if (status === 'APPROVED') {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 flex items-start gap-3 text-xs shadow-sm">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-emerald-900">
            Proposal Approved & Verified
          </p>
          <p className="text-emerald-700 leading-relaxed">
            This AI-generated response has been formally reviewed, verified against enterprise evidence, and approved for commercial RFP delivery.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'REJECTED') {
    return (
      <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 flex items-start gap-3 text-xs shadow-sm">
        <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-red-900">Proposal Declined / Rejected</p>
          <p className="text-red-700 leading-relaxed">
            This proposal has been marked as rejected by human review (e.g. non-viable timeline, non-compliant technical constraints, or negative bid/no-bid determination).
          </p>
        </div>
      </div>
    );
  }

  if (status === 'UNDER_REVIEW' || status === 'AI_DRAFTED') {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/90 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-sm">
        <div className="flex items-start gap-3.5">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-blue-900 text-sm">
                Human Review Station Required
              </p>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-semibold">
                Quality Gate
              </span>
            </div>
            <p className="text-blue-700 leading-relaxed max-w-2xl text-xs sm:text-sm">
              AI synthesis extracted customer requirements and drafted initial response sections. Please inspect citations, verify commitments, and formally authorize before delivery.
            </p>
          </div>
        </div>

        {proposalId && (
          <a
            href={`/proposals/${proposalId}/review`}
            className="inline-flex items-center justify-center gap-2 h-10 px-4.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all shrink-0 cursor-pointer"
          >
            <span>Review &amp; Sign Off</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        )}
      </div>
    );
  }

  return null;
};
