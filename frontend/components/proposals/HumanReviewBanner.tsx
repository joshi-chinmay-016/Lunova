import React from 'react';
import { ProposalStatus } from '@/types/proposal';
import { ShieldCheck, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface HumanReviewBannerProps {
  status: ProposalStatus;
  reviewerNotes?: string;
}

export const HumanReviewBanner: React.FC<HumanReviewBannerProps> = ({
  status,
  reviewerNotes,
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
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3 text-xs shadow-sm">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-blue-900">
              Human Review Station Required
            </p>
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-semibold">
              Quality Gate
            </span>
          </div>
          <p className="text-blue-700 leading-relaxed">
            AI synthesis extracted customer requirements and drafted initial response sections. Please inspect citations in the Sources panel, refine technical commitments, and formally approve before submission.
          </p>
        </div>
      </div>
    );
  }

  return null;
};
