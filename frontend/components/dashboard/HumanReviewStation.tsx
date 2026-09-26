'use client';

import React, { useState } from 'react';
import { Proposal } from '@/features/proposals/api';

interface HumanReviewStationProps {
  initialDraft?: string;
  proposalId?: string;
  proposal?: Proposal;
  onApprove?: (comments: string) => Promise<void>;
  onReject?: (comments: string) => Promise<void>;
}

export default function HumanReviewStation({ initialDraft, proposalId, proposal, onApprove, onReject }: HumanReviewStationProps) {
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      if (onApprove) await onApprove(comments);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    try {
      if (onReject) await onReject(comments);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100 flex flex-col h-full relative">
      <div className="bg-gradient-to-r from-slate-800 to-indigo-900 p-6 text-white shrink-0">
        <h2 className="text-2xl font-bold tracking-tight">Human Review Station</h2>
        <p className="text-indigo-200">Terminal Authorization Required for Intelligence Artifact</p>
      </div>
      <div className="p-6 flex-grow overflow-y-auto bg-slate-50 space-y-6">
        <textarea
          className="w-full h-32 p-3 bg-slate-50 border border-slate-300 rounded-md"
          placeholder="Enter your review comments..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>
      <div className="p-6 bg-white border-t border-gray-100 flex justify-end space-x-4">
        <button
          onClick={handleReject}
          disabled={isSubmitting || !comments}
          className="px-6 py-2.5 bg-white border-2 border-rose-100 text-rose-600 rounded-lg hover:bg-rose-50"
        >
          Reject Draft
        </button>
        <button
          onClick={handleApprove}
          disabled={isSubmitting}
          className="px-8 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          {isSubmitting ? 'Processing...' : 'Authorize & Approve'}
        </button>
      </div>
    </div>
  );
}
