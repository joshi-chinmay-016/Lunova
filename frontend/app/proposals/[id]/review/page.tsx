'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProposal, useProposalReviews, useApproveProposal, useRejectProposal } from '../../../../features/proposals/api';

export default function ProposalReviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: proposal, isLoading: isLoadingProposal } = useProposal(id);
  const { data: reviews, isLoading: isLoadingReviews } = useProposalReviews(id);

  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();

  const [comments, setComments] = useState('');

  const isLoading = isLoadingProposal || isLoadingReviews;

  if (isLoading) return <div className="p-8">Loading review data...</div>;
  if (!proposal) return <div className="p-8">Proposal not found</div>;

  const handleApprove = async () => {
    await approveMutation.mutateAsync({ id, comments });
    router.push(`/proposals/${id}`);
  };

  const handleReject = async () => {
    await rejectMutation.mutateAsync({ id, comments });
    router.push(`/proposals/${id}`);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href={`/proposals/${id}`} className="text-blue-600 hover:underline">&larr; Back to Proposal Details</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Review: {proposal.title}</h1>

        <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
          <h2 className="text-lg font-semibold mb-2">Draft AI Response</h2>
          {/* Usually we'd fetch the outgoing draft email body here. For MVP we'll just display a placeholder */}
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {"[AI Draft content would be displayed here from the generated response]"}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Review Comments</label>
          <textarea
            rows={4}
            className="w-full border border-gray-300 rounded p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any required revisions or comments before approving/rejecting..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleApprove}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="bg-green-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            Approve Draft
          </button>
          <button
            onClick={handleReject}
            disabled={approveMutation.isPending || rejectMutation.isPending}
            className="bg-red-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
          >
            Reject / Request Changes
          </button>
        </div>
      </div>

      {reviews && reviews.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden p-6">
          <h2 className="text-xl font-bold mb-4">Past Reviews</h2>
          <ul className="space-y-4">
            {reviews.map(review => (
              <li key={review.id} className="p-4 border rounded">
                <div className="flex justify-between mb-2">
                  <span className={`font-medium ${review.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'}`}>
                    {review.status}
                  </span>
                  <span className="text-sm text-gray-500">{new Date(review.created_at).toLocaleString()}</span>
                </div>
                <p className="text-gray-700">{review.comments || 'No comments provided.'}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
