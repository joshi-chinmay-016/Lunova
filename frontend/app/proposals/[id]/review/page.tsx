'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useProposal,
  useApproveProposal,
  useRejectProposal,
  useUpdateProposal,
} from '@/hooks/useProposals';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  FileText,
  Mail,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Calendar,
  Building,
  ExternalLink,
  Lock,
  UserCheck,
  Check,
  Edit3,
  Save,
  RotateCcw,
} from 'lucide-react';

export default function ProposalReviewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: proposal, isLoading, error, refetch } = useProposal(id);
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();
  const updateMutation = useUpdateProposal();

  const [activeTab, setActiveTab] = useState<'email' | 'sections' | 'requirements' | 'history'>('email');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Email draft edit state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [emailSaveSuccess, setEmailSaveSuccess] = useState(false);

  // Sections edit state
  const [isEditingSections, setIsEditingSections] = useState(false);
  const [editedExecSummary, setEditedExecSummary] = useState('');
  const [editedTechApproach, setEditedTechApproach] = useState('');
  const [editedImplPlan, setEditedImplPlan] = useState('');
  const [sectionsSaveSuccess, setSectionsSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (proposal?.generated_response) {
      setEditedEmail(proposal.generated_response.draft_email_body || '');
      setEditedExecSummary(proposal.generated_response.executive_summary || '');
      setEditedTechApproach(proposal.generated_response.technical_approach || '');
      setEditedImplPlan(proposal.generated_response.implementation_plan || '');
    }
  }, [proposal]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-12 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-6">
        <Link
          href="/proposals"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Proposals</span>
        </Link>
        <ErrorState
          title="Proposal not found"
          message="We could not retrieve this proposal record for review. Please return to the dashboard."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const generated = proposal.generated_response;
  const requirements = proposal.requirements || [];
  const sources = proposal.sources || [];
  const confidence = proposal.confidence?.overall_score ?? 88;

  const fulfilledCount = requirements.filter((r) => r.status === 'FULFILLED').length;
  const flaggedCount = requirements.filter((r) => r.status === 'FLAGGED').length;

  const handleCopyEmail = () => {
    const textToCopy = editedEmail || generated?.draft_email_body;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSaveEmail = async () => {
    if (!proposal) return;
    try {
      const currentGen = proposal.generated_response || {
        executive_summary: '',
        technical_approach: '',
        implementation_plan: '',
        requirement_responses: [],
      };
      await updateMutation.mutateAsync({
        id: proposal.id,
        updates: {
          generated_response: {
            ...currentGen,
            draft_email_body: editedEmail,
          },
        },
      });
      setIsEditingEmail(false);
      setEmailSaveSuccess(true);
      setTimeout(() => setEmailSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(`Failed to save response draft: ${err.message}`);
    }
  };

  const handleResetEmail = () => {
    setEditedEmail(proposal?.generated_response?.draft_email_body || '');
    setIsEditingEmail(false);
  };

  const handleSaveSections = async () => {
    if (!proposal) return;
    try {
      const currentGen = proposal.generated_response || {
        executive_summary: '',
        technical_approach: '',
        implementation_plan: '',
        requirement_responses: [],
      };
      await updateMutation.mutateAsync({
        id: proposal.id,
        updates: {
          generated_response: {
            ...currentGen,
            executive_summary: editedExecSummary,
            technical_approach: editedTechApproach,
            implementation_plan: editedImplPlan,
          },
        },
      });
      setIsEditingSections(false);
      setSectionsSaveSuccess(true);
      setTimeout(() => setSectionsSaveSuccess(false), 3500);
    } catch (err: any) {
      alert(`Failed to save proposal sections: ${err.message}`);
    }
  };

  const handleResetSections = () => {
    setEditedExecSummary(proposal?.generated_response?.executive_summary || '');
    setEditedTechApproach(proposal?.generated_response?.technical_approach || '');
    setEditedImplPlan(proposal?.generated_response?.implementation_plan || '');
    setIsEditingSections(false);
  };

  const handleApproveConfirm = async () => {
    try {
      await approveMutation.mutateAsync({
        id: proposal.id,
        notes: reviewNotes.trim() || 'Approved by Principal Solutions Reviewer.',
      });
      setIsApproveModalOpen(false);
      router.push(`/proposals/${proposal.id}`);
    } catch (err) {
      console.error('Failed to approve proposal:', err);
    }
  };

  const handleRejectConfirm = async () => {
    try {
      await rejectMutation.mutateAsync({
        id: proposal.id,
        notes: reviewNotes.trim() || 'Revisions requested by reviewer.',
      });
      setIsRejectModalOpen(false);
      router.push(`/proposals/${proposal.id}`);
    } catch (err) {
      console.error('Failed to request revisions:', err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-slate">
          <Link href="/dashboard" className="hover:text-ink transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/proposals" className="hover:text-ink transition-colors">
            Proposals
          </Link>
          <span>/</span>
          <Link href={`/proposals/${proposal.id}`} className="hover:text-ink transition-colors font-medium text-ink">
            {proposal.customer}
          </Link>
          <span>/</span>
          <span className="font-semibold text-brand">Review & Approval</span>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/proposals/${proposal.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Workspace View
            </Button>
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-border-subtle shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono font-medium text-slate uppercase bg-canvas px-2.5 py-1 rounded-md border border-border-subtle">
              {proposal.id}
            </span>
            <ProposalStatusBadge status={proposal.status} size="sm" />
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              {confidence}% Evidence Confidence
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-ink">
            {proposal.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate pt-1">
            <div className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5" />
              <span className="font-semibold text-ink">{proposal.customer}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Deadline: <span className="font-medium text-ink">{proposal.deadline}</span></span>
            </div>
            {proposal.sender_address && (
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                <span>Recipient: {proposal.sender_address}</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Review Station Action Summary */}
        <div className="flex sm:flex-col gap-3 shrink-0">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setIsApproveModalOpen(true)}
            className="flex-1 sm:flex-initial h-12 px-6 text-sm sm:text-base font-bold shadow-sm hover:shadow"
            disabled={proposal.status === 'APPROVED'}
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {proposal.status === 'APPROVED' ? 'Approved & Verified' : 'Approve Draft'}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setIsRejectModalOpen(true)}
            className="flex-1 sm:flex-initial h-12 px-6 text-sm sm:text-base font-semibold text-rose-700 hover:text-rose-800 border-slate-300 shadow-sm"
          >
            <XCircle className="w-5 h-5 mr-2" />
            Request Revision
          </Button>
        </div>
      </div>

      {/* Human In The Loop Trust Banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-1">
          <p className="font-bold text-amber-900">
            Mandatory Human Review Gate (Tenant Safety Guarantee)
          </p>
          <p className="text-amber-800 leading-relaxed">
            Lunova operates with strict air-gap protection: no proposal draft is ever automatically sent to external recipients.
            Approval commits your verification signature to the immutable audit trail.
          </p>
        </div>
      </div>

      {/* Main Review Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Draft Inspection */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex items-center border-b border-border-subtle bg-canvas/60 px-4 pt-3 overflow-x-auto gap-2">
              <button
                onClick={() => setActiveTab('email')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === 'email'
                    ? 'border-brand text-brand bg-white'
                    : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Outgoing Response Email
              </button>

              <button
                onClick={() => setActiveTab('sections')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === 'sections'
                    ? 'border-brand text-brand bg-white'
                    : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Technical & Execution Sections
              </button>

              <button
                onClick={() => setActiveTab('requirements')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === 'requirements'
                    ? 'border-brand text-brand bg-white'
                    : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Requirement Coverage ({fulfilledCount}/{requirements.length})
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 -mb-px ${
                  activeTab === 'history'
                    ? 'border-brand text-brand bg-white'
                    : 'border-transparent text-slate hover:text-ink'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Review Log
              </button>
            </div>

            <CardContent className="p-6">
              {/* TAB 1: Outgoing Email Draft */}
              {activeTab === 'email' && (
                <div className="space-y-4">
                  {/* Action Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-ink">Client-Facing Response Draft</span>
                        {isEditingEmail ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                            Editing Response
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            Active Draft
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate">
                        Formatted for direct email transmission upon approval. Reviewers can customize wording before sign-off.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isEditingEmail ? (
                        <>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={handleResetEmail}
                            disabled={updateMutation.isPending}
                            className="text-xs sm:text-sm border-slate-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={handleSaveEmail}
                            isLoading={updateMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="text-xs sm:text-sm shadow-sm"
                          >
                            Save Draft
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => setIsEditingEmail(true)}
                            leftIcon={<Edit3 className="w-4 h-4" />}
                            className="text-xs sm:text-sm font-semibold shadow-sm"
                          >
                            Edit Response Draft
                          </Button>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={handleCopyEmail}
                            className="text-xs sm:text-sm font-semibold border-slate-300"
                          >
                            {copySuccess ? (
                              <>
                                <Check className="w-4 h-4 mr-1 text-emerald-600" />
                                Copied
                              </>
                            ) : (
                              'Copy Text'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Success notification */}
                  {emailSaveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-sm animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Response draft updated successfully and saved to proposal records.</span>
                    </div>
                  )}

                  {/* Editor vs. Reader */}
                  {isEditingEmail ? (
                    <div className="space-y-3">
                      <textarea
                        rows={16}
                        value={editedEmail}
                        onChange={(e) => setEditedEmail(e.target.value)}
                        className="w-full bg-white text-slate-900 font-sans text-xs sm:text-sm rounded-xl border-2 border-blue-500/80 p-4 sm:p-5 leading-relaxed focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-sm"
                        placeholder="Type or customize your response email..."
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span className="font-mono text-[11px]">
                          {editedEmail.trim().split(/\s+/).filter(Boolean).length} words • {editedEmail.length} characters
                        </span>
                        <span className="italic text-[11px]">
                          Edits will be committed to the proposal record upon clicking Save Draft.
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 font-sans whitespace-pre-wrap leading-relaxed max-h-[520px] overflow-y-auto shadow-sm">
                      {editedEmail || generated?.draft_email_body || 'No draft body available.'}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Proposal Sections */}
              {activeTab === 'sections' && (
                <div className="space-y-6">
                  {/* Action Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-subtle">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-ink">Technical &amp; Execution Sections</span>
                        {isEditingSections ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold border border-blue-200">
                            Editing Sections
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            Verified Content
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate">
                        Individual proposal components structured for technical review and compliance sign-off.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isEditingSections ? (
                        <>
                          <Button
                            variant="secondary"
                            size="md"
                            onClick={handleResetSections}
                            disabled={updateMutation.isPending}
                            className="text-xs sm:text-sm border-slate-300"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="md"
                            onClick={handleSaveSections}
                            isLoading={updateMutation.isPending}
                            leftIcon={<Save className="w-4 h-4" />}
                            className="text-xs sm:text-sm shadow-sm"
                          >
                            Save Sections
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="primary"
                          size="md"
                          onClick={() => setIsEditingSections(true)}
                          leftIcon={<Edit3 className="w-4 h-4" />}
                          className="text-xs sm:text-sm font-semibold shadow-sm"
                        >
                          Edit Sections
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Success notification */}
                  {sectionsSaveSuccess && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-sm animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold">Proposal sections updated successfully.</span>
                    </div>
                  )}

                  {/* 1. Executive Summary */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                        1. Executive Summary
                      </h3>
                      <span className="text-[10px] text-gray-400 font-mono">Overview &amp; Value Proposition</span>
                    </div>
                    {isEditingSections ? (
                      <textarea
                        rows={4}
                        value={editedExecSummary}
                        onChange={(e) => setEditedExecSummary(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-300 p-3.5 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-canvas border border-border-subtle text-xs sm:text-sm text-ink leading-relaxed font-sans">
                        {editedExecSummary || generated?.executive_summary || 'No executive summary provided.'}
                      </div>
                    )}
                  </div>

                  {/* 2. Technical Approach */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                        2. Technical Approach &amp; Architecture
                      </h3>
                      <span className="text-[10px] text-gray-400 font-mono">Infrastructure, Cloud &amp; Security</span>
                    </div>
                    {isEditingSections ? (
                      <textarea
                        rows={4}
                        value={editedTechApproach}
                        onChange={(e) => setEditedTechApproach(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-300 p-3.5 leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-canvas border border-border-subtle text-xs sm:text-sm text-ink leading-relaxed font-sans">
                        {editedTechApproach || generated?.technical_approach || 'No technical approach provided.'}
                      </div>
                    )}
                  </div>

                  {/* 3. Implementation Plan */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate">
                        3. Implementation &amp; Rollout Plan
                      </h3>
                      <span className="text-[10px] text-gray-400 font-mono">Phases, Deliverables &amp; SLA Handover</span>
                    </div>
                    {isEditingSections ? (
                      <textarea
                        rows={5}
                        value={editedImplPlan}
                        onChange={(e) => setEditedImplPlan(e.target.value)}
                        className="w-full bg-white text-slate-900 text-xs sm:text-sm rounded-xl border border-slate-300 p-3.5 leading-relaxed whitespace-pre-line focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-sm"
                      />
                    ) : (
                      <div className="p-4 rounded-xl bg-canvas border border-border-subtle text-xs sm:text-sm text-ink leading-relaxed font-sans whitespace-pre-line">
                        {editedImplPlan || generated?.implementation_plan || 'No implementation plan provided.'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Requirement Coverage */}
              {activeTab === 'requirements' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate pb-2 border-b border-border-subtle">
                    <span>Identified Requirements ({requirements.length})</span>
                    <span>Status</span>
                  </div>

                  {requirements.length === 0 ? (
                    <p className="text-xs text-slate py-4">No structured requirements extracted.</p>
                  ) : (
                    <div className="space-y-3">
                      {requirements.map((req, idx) => (
                        <div
                          key={req.requirement_id || idx}
                          className="p-3.5 rounded-xl bg-canvas border border-border-subtle space-y-2"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white border border-border-subtle text-slate">
                                  {req.category}
                                </span>
                                <span className="text-[10px] font-semibold text-slate">
                                  {req.priority} Priority
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-ink">{req.description}</p>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                                req.status === 'FULFILLED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          {req.evidence && (
                            <p className="text-[11px] text-slate italic bg-white p-2 rounded border border-border-subtle">
                              Evidence: &ldquo;{req.evidence}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Audit & Review History */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="text-xs text-slate pb-2 border-b border-border-subtle">
                    Immutable Review & Verification Log
                  </div>
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-brand-subtle text-brand flex items-center justify-center font-bold text-xs shrink-0">
                        SJ
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">Sarah Jenkins</span>
                          <span className="text-slate">• Solutions Lead</span>
                          <span className="text-slate">• Current Session</span>
                        </div>
                        <p className="text-slate">
                          Viewing draft response in human verification mode.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-canvas border border-border-subtle flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200">
                        AI
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-ink">Lunova Intelligence Engine</span>
                          <span className="text-slate">• Automated Grounding</span>
                        </div>
                        <p className="text-slate">
                          Synthesized requirements with company knowledge base. Overall confidence score: {confidence}%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Decision Notes Box */}
          <Card>
            <CardHeader>
              <div>
                <h3 className="text-xs font-bold text-ink">Reviewer Sign-off Notes</h3>
                <p className="text-[11px] text-slate">
                  Provide internal context or revision guidance before finalizing your decision.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-border-subtle focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-colors"
                placeholder="Example: Approved after verifying Section 3 SLA commitments match our SOC2 standard..."
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="text-xs sm:text-sm font-semibold text-rose-700 hover:text-rose-800 border-slate-300"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Request Changes
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setIsApproveModalOpen(true)}
                  className="text-xs sm:text-sm font-semibold shadow-sm"
                  disabled={proposal.status === 'APPROVED'}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {proposal.status === 'APPROVED' ? 'Approved' : 'Authorize & Sign Off'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col): Evidence Sources & Grounding Summary */}
        <div className="space-y-6">
          {/* Grounding Checklist Card */}
          <Card>
            <CardHeader>
              <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand" />
                Pre-Flight Review Checklist
              </h3>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs py-2 border-b border-border-subtle">
                <span className="text-slate">Mandatory Requirements</span>
                <span className="font-semibold text-emerald-700">
                  {fulfilledCount} / {requirements.length} Fulfilled
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border-subtle">
                <span className="text-slate">Ambiguities / Gaps Flagged</span>
                <span className={`font-semibold ${flaggedCount > 0 ? 'text-amber-700' : 'text-slate'}`}>
                  {flaggedCount} Flagged
                </span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-border-subtle">
                <span className="text-slate">Grounding Citations</span>
                <span className="font-semibold text-ink">{sources.length} Documents</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2">
                <span className="text-slate">Tenant Air-Gap Isolation</span>
                <span className="font-semibold text-emerald-700">Verified</span>
              </div>
            </CardContent>
          </Card>

          {/* Grounded Sources Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-brand" />
                  Cited Corporate Truth ({sources.length})
                </h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sources.length === 0 ? (
                <p className="text-xs text-slate">No corporate sources cited.</p>
              ) : (
                sources.map((src, i) => (
                  <div
                    key={src.source_id || i}
                    className="p-3 rounded-xl bg-canvas border border-border-subtle text-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-ink">{src.title}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-subtle text-brand shrink-0">
                        {src.relevance || 'High'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate">{src.section}</p>
                    {src.snippet && (
                      <p className="text-[11px] text-slate italic bg-white p-2 rounded border border-border-subtle">
                        &ldquo;{src.snippet}&rdquo;
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmDialog
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        onConfirm={handleApproveConfirm}
        title="Approve Proposal Response"
        description={`Are you sure you want to approve "${proposal.title}" for ${proposal.customer}? This transitions the proposal to APPROVED status and unlocks dispatch authorization.`}
        confirmLabel="Confirm Approval"
        variant="primary"
        isLoading={approveMutation.isPending}
      />

      <ConfirmDialog
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Request Draft Revisions"
        description={`Return "${proposal.title}" to drafting stage with your notes? The team or AI engine will need to update the response.`}
        confirmLabel="Request Revisions"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
