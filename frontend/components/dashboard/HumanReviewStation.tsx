'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Send, 
  ShieldCheck, 
  History, 
  Sparkles, 
  Mail, 
  AlertTriangle,
  Lock,
  ThumbsUp,
  FileCheck
} from 'lucide-react';

interface HumanReviewStationProps {
  initialDraft?: string;
  proposalId?: string;
  senderEmail?: string;
  overallConfidence?: number;
}

export default function HumanReviewStation({
  initialDraft = `Dear Architecture & Procurement Lead,\n\nThank you for sharing your enterprise RFP specification with Lunetron. Our solutions architecture team has evaluated your technical and governance criteria against our verified platform capabilities.\n\nOur system delivers standards-compliant REST endpoints secured via OAuth2 bearer tokens, guarantees strict PostgreSQL 16 relational integrity with tenant vector isolation, and provides tamper-evident audit logging.\n\nWe welcome the opportunity to conduct an architectural demonstration at your convenience.\n\nSincerely,\nLunetron Proposal Team`,
  proposalId = 'prop-sample-0001',
  senderEmail = 'procurement@example-enterprise.com',
  overallConfidence = 0.96,
}: HumanReviewStationProps) {
  const [draftContent, setDraftContent] = useState(initialDraft);
  const [reviewStatus, setReviewStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISIONS'>('PENDING');
  const [auditLog, setAuditLog] = useState<Array<{ time: string; event: string; actor: string; hash: string }>>([
    {
      time: '2026-09-25 21:55:00',
      event: 'AI Intelligence pipeline synthesized grounded draft',
      actor: 'Lunova Gemini Agent',
      hash: 'sha256:7f83b1657ff1...b84',
    },
    {
      time: '2026-09-25 21:55:02',
      event: 'Anti-hallucination guardrail passed (Grounding: 98%)',
      actor: 'Guardrail Service',
      hash: 'sha256:912ef38902ba...d19',
    },
  ]);

  const [reviewerNotes, setReviewerNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleApprove = () => {
    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#6366f1', '#10b981', '#ffffff'],
      });
    } catch {
      // safe fallback
    }

    setReviewStatus('APPROVED');
    const newEvent = {
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event: `Proposal APPROVED by Human Reviewer. Response dispatched to ${senderEmail}`,
      actor: 'Human Reviewer (Admin)',
      hash: `sha256:${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setAuditLog((prev) => [newEvent, ...prev]);
  };

  const handleReject = () => {
    setReviewStatus('REJECTED');
    const newEvent = {
      time: new Date().toISOString().replace('T', ' ').substring(0, 19),
      event: `Proposal REJECTED: ${reviewerNotes || 'Does not match Lunetron target profile'}`,
      actor: 'Human Reviewer (Admin)',
      hash: `sha256:${Math.random().toString(16).substring(2, 14)}...${Math.random().toString(16).substring(2, 6)}`,
    };
    setAuditLog((prev) => [newEvent, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Reviewer Invariant Alert */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-cyan-400">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Mandatory Human-in-the-Loop Review Station
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Rule 4 Enforced
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              No proposal email can be dispatched without explicit human sign-off and tamper-evident audit recording.
            </p>
          </div>
        </div>

        {/* Current Review Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
            reviewStatus === 'APPROVED'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : reviewStatus === 'REJECTED'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
          }`}>
            REVIEW STATUS: {reviewStatus}
          </span>
        </div>
      </div>

      {/* Main Review Workspace: Draft Editor & Verification Checks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Editable Response Draft */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold">
                Synthesized Response Body (Recipient: {senderEmail})
              </span>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-mono text-cyan-300 border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Edit Response'}</span>
            </button>
          </div>

          {/* Text Area */}
          <div>
            <textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              disabled={!isEditing}
              rows={11}
              className={`w-full p-4 rounded-xl text-xs font-mono leading-relaxed transition-all ${
                isEditing
                  ? 'bg-slate-950 border border-cyan-400/80 text-white focus:outline-none'
                  : 'bg-slate-950/70 border border-white/5 text-slate-300'
              }`}
            />
          </div>

          {/* Action Row */}
          {reviewStatus === 'PENDING' ? (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <input
                type="text"
                placeholder="Optional reviewer notes / decision rationale..."
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="flex-1 bg-slate-900/80 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              />

              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  className="px-4 py-2 rounded-xl text-xs font-mono font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>

                <button
                  onClick={handleApprove}
                  className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 hover:brightness-110 shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-[0.98]"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Dispatch Email</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Decision recorded at {auditLog[0]?.time}. Email transmission simulated.
              </span>
              <button
                onClick={() => setReviewStatus('PENDING')}
                className="text-cyan-400 hover:underline"
              >
                Re-open for Review
              </button>
            </div>
          )}
        </div>

        {/* Right Column: AI Confidence & Audit Trail */}
        <div className="lg:col-span-4 space-y-4">
          {/* AI Grounding Score Card */}
          <div className="glass-panel p-4 rounded-2xl space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
              Grounding Verification
            </span>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {Math.round(overallConfidence * 100)}%
                </span>
                <span className="text-xs text-slate-400 block">Factual Grounding Score</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-400/30 border-t-emerald-400 flex items-center justify-center font-mono text-xs text-white">
                ✓
              </div>
            </div>

            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Tenant Isolation: Passed</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Zero Hallucinated Claims</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Cited in Lunetron Knowledge Base</span>
              </div>
            </div>
          </div>

          {/* Immutable Audit Log */}
          <div className="glass-panel p-4 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase text-indigo-400 font-semibold">
              <History className="w-4 h-4" />
              <span>Immutable Audit Trail</span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {auditLog.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] font-mono space-y-1"
                >
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>{entry.time}</span>
                    <span className="text-indigo-300">{entry.actor}</span>
                  </div>
                  <p className="text-slate-200">{entry.event}</p>
                  <span className="text-[9px] text-slate-500 truncate block font-mono">
                    {entry.hash}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
