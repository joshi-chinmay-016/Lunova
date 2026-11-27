'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchProposals,
  fetchProposalDetail,
  fetchResponseCenterMetrics,
  updateProposalDraft,
  regenerateProposal,
  approveProposal,
  rejectProposal,
  sendProposalToClient,
  syncGmailInbox,
  fetchGmailStatus,
  ProposalDetail,
} from '@/lib/api/client';
import { Proposal } from '@/types/proposal';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Inbox,
  Mail,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
  Paperclip,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Database,
  HelpCircle,
} from 'lucide-react';

export default function ResponseCenterPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'review' | 'approved' | 'sent' | 'needs_info'>('all');
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [reviewTab, setReviewTab] = useState<'email' | 'intelligence' | 'draft'>('draft');

  // Draft editing state
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftDirty, setDraftDirty] = useState(false);
  const [statusNotification, setStatusNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Send Confirmation Dialog
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  // Queries
  const { data: proposals = [], isLoading: isLoadingProposals, refetch: refetchProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: fetchProposals,
    refetchInterval: 10000,
  });

  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['responseCenterMetrics'],
    queryFn: fetchResponseCenterMetrics,
    refetchInterval: 10000,
  });

  const { data: gmailStatus } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: fetchGmailStatus,
  });

  // Selected proposal detail query
  const { data: proposalDetail, isLoading: isLoadingDetail } = useQuery<ProposalDetail>({
    queryKey: ['proposalDetail', selectedProposalId],
    queryFn: () => fetchProposalDetail(selectedProposalId!),
    enabled: !!selectedProposalId,
  });

  // Select first proposal by default when loaded
  useEffect(() => {
    if (!selectedProposalId && proposals.length > 0) {
      setSelectedProposalId(proposals[0].id);
    }
  }, [proposals, selectedProposalId]);

  // Sync draft state with selected proposal
  useEffect(() => {
    if (proposalDetail) {
      const currentDraftBody =
        proposalDetail.outgoing_email?.body ||
        proposalDetail.generated_response?.draft_email_body ||
        (typeof proposalDetail.generated_response === 'string' ? proposalDetail.generated_response : '') ||
        '';
      const currentDraftSubject =
        proposalDetail.outgoing_email?.subject ||
        proposalDetail.generated_response?.subject_line ||
        (proposalDetail.incoming_email?.subject ? `Re: ${proposalDetail.incoming_email.subject}` : 'Proposal Response');

      setDraftBody(currentDraftBody);
      setDraftSubject(currentDraftSubject);
      setDraftDirty(false);
    }
  }, [proposalDetail]);

  // Mutations
  const syncMutation = useMutation({
    mutationFn: () => syncGmailInbox(),
    onSuccess: (data) => {
      setStatusNotification({
        type: 'success',
        text: `Inbox sync completed: ${data.new_emails_count} new email(s), ${data.proposals_created_count} proposal(s) ingested.`,
      });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['responseCenterMetrics'] });
    },
    onError: (err: any) => {
      setStatusNotification({
        type: 'error',
        text: err?.message || 'Inbox synchronization failed. Check Gmail connection.',
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: () => updateProposalDraft(selectedProposalId!, { subject: draftSubject, body: draftBody }),
    onSuccess: () => {
      setDraftDirty(false);
      setStatusNotification({
        type: 'success',
        text: 'Draft updated successfully. Prior approval status (if any) was reset for re-review.',
      });
      queryClient.invalidateQueries({ queryKey: ['proposalDetail', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['responseCenterMetrics'] });
    },
    onError: (err: any) => {
      setStatusNotification({ type: 'error', text: err?.message || 'Failed to save draft.' });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateProposal(selectedProposalId!),
    onSuccess: () => {
      setStatusNotification({
        type: 'info',
        text: 'AI response regeneration started. Grounding with knowledge base...',
      });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (err: any) => {
      setStatusNotification({ type: 'error', text: err?.message || 'Regeneration failed.' });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveProposal(selectedProposalId!, 'Explicit admin approval via Response Center'),
    onSuccess: () => {
      setStatusNotification({
        type: 'success',
        text: 'Proposal approved! You may now dispatch the reply to the customer.',
      });
      queryClient.invalidateQueries({ queryKey: ['proposalDetail', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['responseCenterMetrics'] });
    },
    onError: (err: any) => {
      setStatusNotification({ type: 'error', text: err?.message || 'Approval failed.' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectProposal(selectedProposalId!, 'Rejected via Response Center'),
    onSuccess: () => {
      setStatusNotification({ type: 'info', text: 'Proposal response marked as REJECTED.' });
      queryClient.invalidateQueries({ queryKey: ['proposalDetail', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['responseCenterMetrics'] });
    },
    onError: (err: any) => {
      setStatusNotification({ type: 'error', text: err?.message || 'Rejection failed.' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      // 1. If draft has unsaved changes or proposal was in FAILED state, ensure current editor content is saved
      if (draftDirty || proposalDetail?.status === 'FAILED') {
        await updateProposalDraft(selectedProposalId!, { subject: draftSubject, body: draftBody });
      }
      // 2. Ensure proposal is in APPROVED state before sending (updateProposalDraft resets to REVIEW_REQUIRED)
      if (proposalDetail?.status !== 'APPROVED' || draftDirty) {
        await approveProposal(selectedProposalId!, 'Approved for immediate dispatch');
      }
      // 3. Dispatch to client via Gmail API
      return await sendProposalToClient(selectedProposalId!);
    },
    onSuccess: () => {
      setDraftDirty(false);
      setIsSendDialogOpen(false);
      setStatusNotification({
        type: 'success',
        text: 'Response email dispatched successfully to customer via connected Gmail inbox.',
      });
      queryClient.invalidateQueries({ queryKey: ['proposalDetail', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['responseCenterMetrics'] });
    },
    onError: (err: any) => {
      setIsSendDialogOpen(false);
      setStatusNotification({
        type: 'error',
        text: err?.message || 'Dispatch failed. Check Gmail API connection.',
      });
    },
  });

  // Filter proposals
  const filteredProposals = proposals.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'review') return p.status === 'REVIEW_REQUIRED' || p.status === 'NEEDS_ADMIN_REVIEW' || p.status === 'DRAFT_GENERATED';
    if (activeTab === 'approved') return p.status === 'APPROVED';
    if (activeTab === 'sent') return p.status === 'SENT';
    if (activeTab === 'needs_info') return p.status === 'NEEDS_INFORMATION';
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success" dot>Approved</Badge>;
      case 'SENT':
        return <Badge variant="info" dot>Dispatched / Sent</Badge>;
      case 'SENDING':
        return <Badge variant="warning" dot>Sending...</Badge>;
      case 'REVIEW_REQUIRED':
      case 'NEEDS_ADMIN_REVIEW':
        return <Badge variant="warning" dot>Awaiting Review</Badge>;
      case 'NEEDS_INFORMATION':
        return <Badge variant="danger" dot>Needs Information</Badge>;
      case 'REJECTED':
        return <Badge variant="neutral" dot>Rejected</Badge>;
      case 'PROCESSING':
        return <Badge variant="primary" dot>AI Processing</Badge>;
      case 'RECEIVED':
        return <Badge variant="neutral" dot>Received</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getClassificationBadge = (cls?: string) => {
    switch (cls) {
      case 'CUSTOMER_REQUEST':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">Customer Request</span>;
      case 'FOLLOW_UP':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">Follow-up</span>;
      case 'GENERAL_INQUIRY':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Inquiry</span>;
      case 'AUTOMATED_NOTIFICATION':
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">Notification</span>;
      default:
        return <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">{cls || 'Request'}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sync Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Inbox className="w-7 h-7 text-blue-600" />
            Email Response Center
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Incoming Customer Email Ingestion → RAG Retrieval → AI Response Generation → Review &amp; Dispatch
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-600 shadow-sm">
            <span className={`w-2 h-2 rounded-full ${gmailStatus?.connected ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            <span>Gmail: <strong>{gmailStatus?.connected ? gmailStatus?.account?.email_address : 'Disconnected'}</strong></span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => syncMutation.mutate()}
            isLoading={syncMutation.isPending}
            leftIcon={<RefreshCw className={`w-4 h-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />}
          >
            Sync Inbox Now
          </Button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {statusNotification && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm border ${
            statusNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : statusNotification.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : statusNotification.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            ) : (
              <Sparkles className="w-5 h-5 text-blue-600 shrink-0" />
            )}
            <span>{statusNotification.text}</span>
          </div>
          <button
            onClick={() => setStatusNotification(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Ingested</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{metrics?.total_inbox ?? proposals.length}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Customer Requests</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{metrics?.customer_requests ?? proposals.length}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Drafts Generated</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">{metrics?.drafts_generated ?? 0}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Awaiting Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{metrics?.awaiting_review ?? 0}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approved</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{metrics?.approved ?? 0}</p>
        </Card>
        <Card className="p-4 bg-white border-gray-200 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent / Replied</p>
          <p className="text-2xl font-bold text-sky-600 mt-1">{metrics?.sent ?? 0}</p>
        </Card>
      </div>

      {/* Filter Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          All Messages ({proposals.length})
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'review' ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Awaiting Review ({proposals.filter((p) => p.status === 'REVIEW_REQUIRED' || p.status === 'NEEDS_ADMIN_REVIEW' || p.status === 'DRAFT_GENERATED').length})
        </button>
        <button
          onClick={() => setActiveTab('needs_info')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'needs_info' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Needs Info ({proposals.filter((p) => p.status === 'NEEDS_INFORMATION').length})
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'approved' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Approved ({proposals.filter((p) => p.status === 'APPROVED').length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`pb-3 font-semibold transition-colors border-b-2 ${
            activeTab === 'sent' ? 'border-sky-600 text-sky-600' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Dispatched ({proposals.filter((p) => p.status === 'SENT').length})
        </button>
      </div>

      {/* Main Two-Column Workflow Station */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Proposals & Emails List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
            Inquiries ({filteredProposals.length})
          </div>

          {isLoadingProposals ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </Card>
              ))}
            </div>
          ) : filteredProposals.length === 0 ? (
            <Card className="p-8 text-center bg-gray-50 border-dashed border-gray-300">
              <Mail className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No proposals in this view</p>
              <p className="text-xs text-gray-500 mt-1">Sync your inbox or change filter tabs.</p>
            </Card>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {filteredProposals.map((item) => {
                const isSelected = item.id === selectedProposalId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedProposalId(item.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-sm ring-1 ring-blue-400'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getClassificationBadge(item.classification)}
                        {getStatusBadge(item.status)}
                      </div>
                      <span className="text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{item.title}</h3>

                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span className="truncate max-w-[200px]">
                        From: {item.sender_address || item.customer || 'Customer'}
                      </span>
                      {item.confidence && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {Math.round((item.confidence.overall_score || 0.85) * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Review, Understanding & Response Station (7 cols) */}
        <div className="lg:col-span-7">
          {isLoadingDetail ? (
            <Card className="p-6 space-y-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-48 w-full" />
            </Card>
          ) : !proposalDetail ? (
            <Card className="p-12 text-center bg-gray-50 border-dashed border-gray-300">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Select an inquiry to review</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                Choose an incoming customer email from the left to inspect requirements, knowledge grounding, and draft response.
              </p>
            </Card>
          ) : (
            <Card className="shadow-sm border-gray-200">
              {/* Proposal Header Bar */}
              <CardHeader className="p-5 border-b border-gray-200 bg-gray-50/60 rounded-t-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getClassificationBadge(proposalDetail.classification)}
                      {getStatusBadge(proposalDetail.status)}
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">{proposalDetail.title}</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sender: <strong className="text-gray-700">{proposalDetail.incoming_email?.sender_address || proposalDetail.sender_address || 'Customer'}</strong> •{' '}
                      Received: {new Date(proposalDetail.created_at).toLocaleString()}
                    </p>
                  </div>

                  {/* Top Action Shortcut */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => regenerateMutation.mutate()}
                      isLoading={regenerateMutation.isPending}
                      leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${regenerateMutation.isPending ? 'animate-spin' : ''}`} />}
                    >
                      Regenerate
                    </Button>
                  </div>
                </div>

                {/* Sub-tabs for Review Workspace */}
                <div className="flex border-b border-gray-200 mt-4 -mb-5 gap-6 text-xs font-semibold">
                  <button
                    onClick={() => setReviewTab('draft')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                      reviewTab === 'draft' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Response Draft &amp; Editor
                  </button>
                  <button
                    onClick={() => setReviewTab('intelligence')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                      reviewTab === 'intelligence' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    RAG Grounding &amp; Requirements (
                    {Array.isArray(proposalDetail.requirements) ? proposalDetail.requirements.length : 0})
                  </button>
                  <button
                    onClick={() => setReviewTab('email')}
                    className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 ${
                      reviewTab === 'email' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Customer Inquiry
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-5">
                {/* 1. DRAFT & EDITOR TAB */}
                {reviewTab === 'draft' && (
                  <div className="space-y-4">
                    {/* Approval Notice / Modification Warning */}
                    {proposalDetail.status === 'APPROVED' && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Approved and ready for Gmail dispatch</p>
                          <p className="text-emerald-700">
                            This response is locked and ready. Any edits made below will automatically invalidate prior approval and require re-approval before sending.
                          </p>
                        </div>
                      </div>
                    )}

                    {proposalDetail.status === 'SENT' && (
                      <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-800 flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-sky-600 shrink-0" />
                        <span>This response has been dispatched to the customer in the original thread.</span>
                      </div>
                    )}

                    {/* Subject Line */}
                    <Input
                      label="Response Subject Line"
                      value={draftSubject}
                      onChange={(e) => {
                        setDraftSubject(e.target.value);
                        setDraftDirty(true);
                      }}
                      placeholder="Re: Proposal Response..."
                    />

                    {/* Draft Body Editor */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                        <span>Email Response Body</span>
                        {draftDirty && (
                          <span className="text-amber-600 font-normal italic">Unsaved changes</span>
                        )}
                      </div>
                      <textarea
                        rows={12}
                        value={draftBody}
                        onChange={(e) => {
                          setDraftBody(e.target.value);
                          setDraftDirty(true);
                        }}
                        placeholder="Draft response content..."
                        className="w-full p-4 rounded-xl border border-gray-300 font-mono text-xs text-gray-800 leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-inner"
                      />
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="pt-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => saveDraftMutation.mutate()}
                          isLoading={saveDraftMutation.isPending}
                          disabled={!draftDirty}
                        >
                          Save Draft Edits
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        {proposalDetail.status !== 'APPROVED' && proposalDetail.status !== 'SENT' && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => rejectMutation.mutate()}
                              isLoading={rejectMutation.isPending}
                            >
                              Reject
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => approveMutation.mutate()}
                              isLoading={approveMutation.isPending}
                              leftIcon={<Check className="w-4 h-4" />}
                            >
                              Approve Draft
                            </Button>
                          </>
                        )}

                        <Button
                          variant="primary"
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          onClick={() => setIsSendDialogOpen(true)}
                          disabled={proposalDetail.status === 'SENT' || proposalDetail.status === 'SENDING'}
                          leftIcon={<Send className="w-4 h-4" />}
                        >
                          {proposalDetail.status === 'APPROVED' ? 'Send Reply to Client' : 'Approve & Send Reply'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. RAG GROUNDING & REQUIREMENTS TAB */}
                {reviewTab === 'intelligence' && (
                  <div className="space-y-6">
                    {/* Missing Information / Clarifications Alert */}
                    {Array.isArray(proposalDetail.missing_information) && proposalDetail.missing_information.length > 0 && (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-amber-950">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          Missing Information Detected ({proposalDetail.missing_information.length})
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-amber-800">
                          {proposalDetail.missing_information.map((item: any, idx: number) => (
                            <li key={idx}>
                              <strong>{item.field || item.category || 'Missing'}:</strong> {item.description || item.reason || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Extracted Requirements */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Extracted Customer Requirements
                      </h4>
                      {Array.isArray(proposalDetail.requirements) && proposalDetail.requirements.length > 0 ? (
                        <div className="space-y-2">
                          {proposalDetail.requirements.map((req: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-white text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-800">{req.title || req.category || `Requirement ${idx + 1}`}</span>
                                {req.importance && (
                                  <Badge variant={req.importance === 'HIGH' ? 'danger' : 'neutral'}>
                                    {req.importance}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600">{req.description || req.text || JSON.stringify(req)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No structured requirements extracted.</p>
                      )}
                    </div>

                    {/* Retrieved Sources */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Grounded Knowledge Base Sources
                      </h4>
                      {Array.isArray(proposalDetail.sources) && proposalDetail.sources.length > 0 ? (
                        <div className="space-y-2">
                          {proposalDetail.sources.map((src: any, idx: number) => (
                            <div key={idx} className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  {src.title || src.document_name || `Source Document ${idx + 1}`}
                                </span>
                                {src.similarity && (
                                  <span className="text-[11px] text-gray-500 font-mono">
                                    score: {Number(src.similarity).toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-[11px] leading-relaxed line-clamp-3">
                                {src.content || src.text_preview || JSON.stringify(src)}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No knowledge base documents retrieved.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. CUSTOMER INQUIRY TAB */}
                {reviewTab === 'email' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">
                          From: {proposalDetail.incoming_email?.sender_address || proposalDetail.sender_address}
                        </span>
                        <span className="text-gray-400">
                          {proposalDetail.incoming_email?.created_at && new Date(proposalDetail.incoming_email.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-gray-600">
                        <strong>Subject:</strong> {proposalDetail.incoming_email?.subject || proposalDetail.title}
                      </div>
                    </div>

                    {/* Full Email Body */}
                    <div className="p-4 rounded-xl border border-gray-200 bg-white text-xs text-gray-800 font-sans whitespace-pre-wrap leading-relaxed max-h-[400px] overflow-y-auto">
                      {proposalDetail.incoming_email?.body || proposalDetail.raw_content || 'No text content available.'}
                    </div>

                    {/* Attachments */}
                    {Array.isArray(proposalDetail.attachments) && proposalDetail.attachments.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5" />
                          Attachments ({proposalDetail.attachments.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {proposalDetail.attachments.map((att) => (
                            <div
                              key={att.id}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs text-gray-700 flex items-center gap-2"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span className="font-medium truncate max-w-[180px]">{att.filename}</span>
                              <Badge variant={att.parsing_status === 'SUCCESS' ? 'success' : 'neutral'} size="sm">
                                {att.parsing_status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Gmail Dispatch */}
      <ConfirmDialog
        isOpen={isSendDialogOpen}
        onClose={() => setIsSendDialogOpen(false)}
        onConfirm={() => sendMutation.mutate()}
        title="Approve & Dispatch Gmail Reply"
        description={`Are you sure you want to send this response directly to ${
          proposalDetail?.incoming_email?.sender_address || proposalDetail?.sender_address || 'the customer'
        }? This will send an authenticated email from your connected Gmail workspace and cannot be undone.`}
        confirmLabel="Send Reply via Gmail"
        variant="primary"
        isLoading={sendMutation.isPending}
      />
    </div>
  );
}
