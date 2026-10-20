'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  useProposal,
  useUpdateProposal,
  useAnalyzeProposal,
  useApproveProposal,
  useRejectProposal,
} from '@/hooks/useProposals';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProposalStatusBadge } from '@/components/proposals/ProposalStatusBadge';
import { ProposalOverviewCard } from '@/components/proposals/ProposalOverviewCard';
import { RequirementAnalysisCard } from '@/components/proposals/RequirementAnalysisCard';
import { SourcesPanel } from '@/components/proposals/SourcesPanel';
import { ResponseEditor } from '@/components/proposals/ResponseEditor';
import { HumanReviewBanner } from '@/components/proposals/HumanReviewBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { GeneratedProposalResponse } from '@/types/proposal';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  Loader2,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function ProposalWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: proposal, isLoading, error, refetch } = useProposal(id);
  const updateMutation = useUpdateProposal();
  const analyzeMutation = useAnalyzeProposal();
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();

  // Modals & confirmation dialog states
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="space-y-6">
        <Link href="/proposals" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Proposals</span>
        </Link>
        <ErrorState
          title="Proposal not found"
          message="We could not find the requested proposal or it may have been deleted."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const handleSaveDraft = async (updated: GeneratedProposalResponse) => {
    try {
      await updateMutation.mutateAsync({
        id: proposal.id,
        updates: {
          generated_response: updated,
          status: proposal.status === 'NEW' ? 'AI_DRAFTED' : proposal.status,
        },
      });
      showToast('Proposal response draft saved successfully.');
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      await analyzeMutation.mutateAsync({
        proposalId: proposal.id,
        text: proposal.raw_content || proposal.summary || proposal.title,
        useGemini: false,
      });
      showToast('AI analysis completed. Requirements & citations updated.');
    } catch (err: any) {
      alert(`Analysis failed: ${err.message}`);
    }
  };

  const handleConfirmApprove = async () => {
    try {
      await approveMutation.mutateAsync({
        id: proposal.id,
        notes: approvalNotes || 'Formally approved for client proposal submission.',
      });
      setIsApproveOpen(false);
      setApprovalNotes('');
      showToast('Proposal response formally approved.');
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleConfirmReject = async () => {
    try {
      await rejectMutation.mutateAsync({
        id: proposal.id,
        notes: rejectionNotes || 'Proposal declined by review team.',
      });
      setIsRejectOpen(false);
      setRejectionNotes('');
      showToast('Proposal marked as declined.');
    } catch (err: any) {
      alert(`Decline failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-clay-elevated border border-gray-700 text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header & Workspace Top Controls */}
      <PageHeader
        title={proposal.title}
        description={`Enterprise Proposal Workspace • Client: ${proposal.customer}`}
        breadcrumbs={[
          { label: 'Proposals', href: '/proposals' },
          { label: proposal.customer },
          { label: proposal.title },
        ]}
        badge={<ProposalStatusBadge status={proposal.status} size="md" />}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Run / Re-run AI Analysis button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRunAnalysis}
              isLoading={analyzeMutation.isPending}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
            >
              {analyzeMutation.isPending ? 'Analyzing...' : 'Run AI Analysis'}
            </Button>

            {proposal.status !== 'REJECTED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectOpen(true)}
                className="text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                Decline
              </Button>
            )}

            {proposal.status !== 'APPROVED' && (
              <Button
                variant="success"
                size="sm"
                onClick={() => setIsApproveOpen(true)}
                leftIcon={<CheckCircle className="w-3.5 h-3.5" />}
              >
                Approve
              </Button>
            )}
          </div>
        }
      />

      {/* Human Review Banner */}
      <HumanReviewBanner status={proposal.status} />

      {/* AI Processing Indeterminate State (Requirement 19) */}
      {analyzeMutation.isPending && (
        <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-clay-card flex items-center gap-4 animate-in fade-in duration-150">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900">
              Analyzing proposal...
            </p>
            <p className="text-xs text-gray-500">
              Extracting customer requirements, querying tenant knowledge base for evidence, and synthesizing structured response. This may take a few moments.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace Layout (Two Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (2 Cols): Document Response Editor & Extracted Requirements */}
        <div className="lg:col-span-2 space-y-6">
          {/* Editable Proposal Response Area */}
          <ResponseEditor
            initialResponse={proposal.generated_response}
            requirements={proposal.requirements}
            onSaveDraft={handleSaveDraft}
            onApprove={() => setIsApproveOpen(true)}
            onReject={() => setIsRejectOpen(true)}
            onRequestRegenerate={handleRunAnalysis}
            isSaving={updateMutation.isPending}
            status={proposal.status}
          />

          {/* Extracted Requirements Analysis Card */}
          <RequirementAnalysisCard requirements={proposal.requirements} />
        </div>

        {/* Right Column (1 Col): Proposal Overview & Grounded Sources Panel */}
        <div className="space-y-6">
          {/* Proposal Overview */}
          <ProposalOverviewCard proposal={proposal} />

          {/* Evidence / Sources Panel */}
          <SourcesPanel sources={proposal.sources} />

          {/* Audit & Review History */}
          {proposal.review_history && proposal.review_history.length > 0 && (
            <div className="p-5 rounded-2xl bg-white border border-[#E2E5E9] shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_24px_-4px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.95)] space-y-3">
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                <span>Review History Log</span>
              </h4>
              <ul className="divide-y divide-[#E2E5E9] text-xs">
                {proposal.review_history.map((rev) => (
                  <li key={rev.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-900">{rev.reviewer}</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(rev.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                      {rev.action}
                    </span>
                    <p className="text-xs text-gray-600 mt-1">{rev.notes}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Approve Confirmation Modal (Requirement 14) */}
      <ConfirmDialog
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onConfirm={handleConfirmApprove}
        title="Approve Proposal Response?"
        description="This will mark the AI-generated and verified response as formally approved. It confirms all technical approach sections and requirement responses have passed human review."
        confirmLabel="Approve Response"
        variant="success"
        isLoading={approveMutation.isPending}
      />

      {/* Reject Confirmation Modal (Requirement 14) */}
      <ConfirmDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleConfirmReject}
        title="Decline this Proposal?"
        description="This will record a negative determination (e.g. non-viable timeline, non-compliant technical constraints, or negative bid/no-bid determination)."
        confirmLabel="Decline Proposal"
        variant="danger"
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
}
