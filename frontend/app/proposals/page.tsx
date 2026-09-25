'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProposals } from '../../features/proposals/api';
import { setAuthToken } from '../../services/api';
import { Sparkles, ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

export default function ProposalsPage() {
  const [tokenInput, setTokenInput] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const { data: proposals, isLoading, error } = useProposals();

  const handleSetToken = (token?: string) => {
    const val = token || tokenInput;
    setAuthToken(val);
    setHasToken(true);
  };

  const handleSetDemoToken = () => {
    // Generate a dev token structure
    const demoToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkZXYtdXNlciIsImNvbXBhbnlfaWQiOiJsdW5ldHJvbiIsInJvbGUiOiJhZG1pbiJ9.mock';
    setTokenInput(demoToken);
    handleSetToken(demoToken);
  };

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 p-6 cyber-grid">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation back to 3D Nexus */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-cyan-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to 3D Neural Nexus</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tenant: Lunetron</span>
          </div>
        </div>

        {!hasToken ? (
          <div className="glass-panel p-8 max-w-md mx-auto rounded-2xl text-center space-y-4 border border-indigo-500/30">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-cyan-400 mx-auto flex items-center justify-center">
              <KeyRound className="w-6 h-6" />
            </div>

            <h2 className="text-lg font-bold text-white">Database Authentication Token</h2>
            <p className="text-xs text-slate-400 font-mono">
              The proposal database table requires a verified JWT token. For automated demo simulation, visit the 3D Nexus or load a dev token below.
            </p>

            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 p-2.5 rounded-xl text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-400"
              placeholder="Paste Bearer JWT here..."
            />

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleSetToken()}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-mono font-semibold transition-colors"
              >
                Continue with Token
              </button>

              <button
                onClick={handleSetDemoToken}
                className="w-full bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 py-2 rounded-xl text-xs font-mono transition-colors"
              >
                Auto-fill Dev Token (Lunetron)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-white">Database Proposals</h1>

            {isLoading && <div className="p-8 text-xs font-mono text-slate-400">Querying PostgreSQL database...</div>}
            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
                Note: Relational DB query returned: {error.message}. (Use the 3D Nexus tab for live intelligence pipeline execution).
              </div>
            )}

            <div className="glass-panel rounded-2xl overflow-hidden">
              {proposals?.length === 0 || !proposals ? (
                <div className="p-8 text-center text-xs font-mono text-slate-500 space-y-3">
                  <p>No relational database rows found for current tenant.</p>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-mono hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Ingestion Pipeline on 3D Nexus</span>
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {proposals.map((proposal) => (
                    <li key={proposal.id}>
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="block hover:bg-slate-900/60 p-4 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-cyan-400">{proposal.title || 'Untitled Proposal'}</p>
                            <p className="text-xs text-slate-500 font-mono">{new Date(proposal.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {proposal.status}
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
