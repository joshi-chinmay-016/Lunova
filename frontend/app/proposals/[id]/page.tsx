'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useProposal, useProcessProposal } from '../../../features/proposals/api';

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: proposal, isLoading, error } = useProposal(id);
  const processMutation = useProcessProposal();

  if (isLoading) return <div className="p-8">Loading proposal details...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error.message}</div>;
  if (!proposal) return <div className="p-8">Proposal not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-4">
        <Link href="/proposals" className="text-blue-600 hover:underline">&larr; Back to Proposals</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden p-6 mb-6">
        <h1 className="text-2xl font-bold mb-2">{proposal.title || 'Untitled Proposal'}</h1>
        <div className="flex space-x-4 text-sm text-gray-500 mb-6">
          <span>Status: <strong className="text-gray-900">{proposal.status}</strong></span>
          <span>Created: {new Date(proposal.created_at).toLocaleString()}</span>
        </div>

        <div className="prose max-w-none">
          <h3>Information</h3>
          <p>ID: {proposal.id}</p>
        </div>

        <div className="mt-8 flex space-x-4">
          {proposal.status === 'RECEIVED' && (
            <button
              onClick={() => processMutation.mutate(proposal.id)}
              disabled={processMutation.isPending}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {processMutation.isPending ? 'Processing...' : 'Process with AI'}
            </button>
          )}

          {proposal.status === 'REVIEW_REQUIRED' && (
            <button
              onClick={() => router.push(`/proposals/${proposal.id}/review`)}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Review Draft Response
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
