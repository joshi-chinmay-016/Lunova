'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useProposals } from '../../features/proposals/api';
import { setAuthToken } from '../../services/api';

export default function ProposalsPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const { data: proposals, isLoading, error } = useProposals();

  // Simple token setter for manual testing phase
  const handleSetToken = () => {
    setAuthToken(tokenInput);
    setHasToken(true);
  };

  if (!hasToken) {
    return (
      <div className="p-8 max-w-md mx-auto mt-20 bg-white rounded shadow text-center">
        <h2 className="text-xl font-bold mb-4">Set Auth Token</h2>
        <input
          type="text"
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="border p-2 w-full mb-4 rounded"
          placeholder="Paste JWT here..."
        />
        <button onClick={handleSetToken} className="bg-blue-600 text-white px-4 py-2 rounded font-medium">Continue</button>
      </div>
    );
  }

  if (isLoading) return <div className="p-8">Loading proposals...</div>;
  if (error) return <div className="p-8 text-red-600">Error loading proposals: {error.message}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Proposals</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {proposals?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No proposals found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {proposals?.map((proposal) => (
              <li key={proposal.id}>
                <Link href={`/proposals/${proposal.id}`} className="block hover:bg-gray-50 p-4 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 truncate">{proposal.title || 'Untitled Proposal'}</p>
                      <p className="text-sm text-gray-500">{new Date(proposal.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        proposal.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        proposal.status === 'REVIEW_REQUIRED' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
