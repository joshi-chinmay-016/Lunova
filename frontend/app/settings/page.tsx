'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  useCompanySettings,
  useTeamMembers,
  useAIConfiguration,
  useIntegrations,
  useGmailStatus,
  useDisconnectGmail,
  useSyncGmail,
} from '@/hooks/useSettings';
import { getGmailAuthorizeUrl } from '@/lib/api/client';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  Building2,
  Users,
  Sparkles,
  Layers,
  Save,
  CheckCircle2,
  Mail,
  Sliders,
  ShieldCheck,
  RefreshCw,
  LogOut,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'company';

  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'ai' | 'integrations'>(
    ['company', 'users', 'ai', 'integrations'].includes(initialTab) ? initialTab : 'company'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDisconnectOpen, setIsDisconnectOpen] = useState(false);
  const [isConnectingGmail, setIsConnectingGmail] = useState(false);
  const [gmailActionMsg, setGmailActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(() => {
    if (searchParams.get('connected') === 'gmail') {
      return { type: 'success', text: 'Gmail account connected and authorized successfully!' };
    }
    const err = searchParams.get('error');
    if (err) {
      return { type: 'error', text: decodeURIComponent(err) };
    }
    return null;
  });

  const company = useCompanySettings();
  const team = useTeamMembers();
  const ai = useAIConfiguration();
  const integrations = useIntegrations();
  const gmailStatus = useGmailStatus();
  const disconnectMutation = useDisconnectGmail();
  const syncMutation = useSyncGmail();

  // Local form state for Company
  const [companyForm, setCompanyForm] = useState({
    name: 'Lunetron Technologies Inc.',
    industry: 'Enterprise Cloud & AI Systems',
    contact_email: 'proposals@lunetron.com',
    website: 'https://lunetron.io',
    default_owner: 'Sarah Jenkins',
    response_tone: 'Professional & Technical',
  });

  // Local form state for AI Config
  const [aiForm, setAiForm] = useState({
    provider: 'gemini-1.5-pro',
    temperature: 0.2,
    retrieval_similarity_threshold: 0.82,
    grounding_evaluator_enabled: true,
    strict_evidence_mode: true,
  });

  React.useEffect(() => {
    if (company.data) {
      setCompanyForm(company.data as any);
    }
  }, [company.data]);

  React.useEffect(() => {
    if (ai.data) {
      setAiForm(ai.data as any);
    }
  }, [ai.data]);

  const refetchGmail = gmailStatus.refetch;
  const refetchIntegrations = integrations.refetch;

  // Handle OAuth callback parameters (connected=gmail or error=...)
  React.useEffect(() => {
    const connected = searchParams.get('connected');
    const err = searchParams.get('error');

    if (connected === 'gmail') {
      setActiveTab('integrations');
      setGmailActionMsg({
        type: 'success',
        text: 'Gmail account connected and authorized successfully!',
      });
      refetchGmail();
      refetchIntegrations();

      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname + '?tab=integrations';
        window.history.replaceState({}, '', cleanUrl);
      }
    } else if (err) {
      setActiveTab('integrations');
      let friendlyError = 'Gmail connection failed. Please check your credentials and try again.';
      if (err === 'access_denied') {
        friendlyError = 'Gmail connection cancelled: Permissions were not granted by the user.';
      } else if (err === 'missing_code') {
        friendlyError = 'Gmail connection failed: Authorization code was missing.';
      } else if (err === 'invalid_state') {
        friendlyError = 'Gmail connection failed: Authorization session expired or was invalid.';
      } else if (err === 'token_exchange_failed') {
        friendlyError = 'Gmail connection failed: Google token exchange could not be completed.';
      } else {
        friendlyError = `Gmail connection failed (${decodeURIComponent(err)}). Please try again.`;
      }

      setGmailActionMsg({
        type: 'error',
        text: friendlyError,
      });

      if (typeof window !== 'undefined') {
        const cleanUrl = window.location.pathname + '?tab=integrations';
        window.history.replaceState({}, '', cleanUrl);
      }
    }
  }, [searchParams, refetchGmail, refetchIntegrations]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    company.update(companyForm as any);
    triggerSuccess();
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    ai.update(aiForm as any);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleConnectGmail = async () => {
    try {
      setIsConnectingGmail(true);
      setGmailActionMsg(null);
      const res = await getGmailAuthorizeUrl();
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        throw new Error('No authorization URL returned from server.');
      }
    } catch (err: any) {
      setIsConnectingGmail(false);
      setGmailActionMsg({
        type: 'error',
        text: err.message || 'Failed to initiate Gmail authorization flow.',
      });
    }
  };

  const handleConfirmDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setIsDisconnectOpen(false);
      setGmailActionMsg({
        type: 'success',
        text: 'Gmail account disconnected successfully.',
      });
    } catch (err: any) {
      setIsDisconnectOpen(false);
      setGmailActionMsg({
        type: 'error',
        text: err.message || 'Failed to disconnect Gmail account.',
      });
    }
  };

  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const handleSyncInbox = async () => {
    try {
      setGmailActionMsg(null);
      setLastSyncResult(null);
      const res = await syncMutation.mutateAsync();
      setLastSyncResult(res);

      const newEmails = res?.new_emails_count ?? 0;
      const newProps = res?.proposals_created_count ?? 0;
      const skipped = res?.skipped_duplicates_count ?? 0;
      const failed = res?.failed_messages_count ?? 0;
      const latency = res?.durations?.total_duration_ms ? `${Math.round(res.durations.total_duration_ms)}ms` : '';
      const strat = res?.sync_strategy === 'history' ? 'Incremental History' : 'Full Inbox Scan';

      let msg = `Inbox synchronized in ${latency || '<1s'} (${strat}): ${newEmails} new email(s) ingested, ${newProps} inquiry(ies) created, ${skipped} duplicate(s) skipped.`;
      if (failed > 0) {
        msg += ` ${failed} message(s) failed.`;
      }
      setGmailActionMsg({
        type: 'success',
        text: msg,
      });
    } catch (err: any) {
      setGmailActionMsg({
        type: 'error',
        text: err.message || 'Inbox synchronization failed.',
      });
    }
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: <Building2 className="w-3.5 h-3.5" /> },
    { id: 'users', label: 'Team & Permissions', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'AI Configuration', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'integrations', label: 'Integrations', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Workspace Configuration"
        description="Manage workspace identity, user permissions, generative parameters, and external data feeds."
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Settings' },
        ]}
      />

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {gmailActionMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
            gmailActionMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {gmailActionMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{gmailActionMsg.text}</span>
          </div>
          <button
            onClick={() => setGmailActionMsg(null)}
            className="text-[11px] font-semibold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Switcher */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={(id) => setActiveTab(id as any)} />

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && (
        <Card>
          <form onSubmit={handleSaveCompany}>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Company Identity & Proposal Defaults</h3>
                <p className="text-[11px] text-gray-500">
                  Global organization details referenced in auto-generated proposal introductions
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Company Name"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                />
                <Input
                  label="Industry Vertical"
                  value={companyForm.industry}
                  onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                  required
                />
                <Input
                  label="Proposal Ingestion Email"
                  type="email"
                  value={companyForm.contact_email}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact_email: e.target.value })}
                  required
                />
                <Input
                  label="Corporate Website"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  required
                />
                <Input
                  label="Default Proposal Owner"
                  value={companyForm.default_owner}
                  onChange={(e) => setCompanyForm({ ...companyForm, default_owner: e.target.value })}
                  required
                />
                <Select
                  label="Default Response Tone"
                  options={[
                    { value: 'Professional & Technical', label: 'Professional & Technical (Recommended)' },
                    { value: 'Executive & Formal', label: 'Executive & Formal' },
                    { value: 'Concise & Direct', label: 'Concise & Direct' },
                  ]}
                  value={companyForm.response_tone}
                  onChange={(e) => setCompanyForm({ ...companyForm, response_tone: e.target.value as any })}
                />
              </div>
            </CardContent>

            <CardFooter className="justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={company.isUpdating}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Profile
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 2: Team Members & Roles */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Team Members & Access Control</h3>
              <p className="text-[11px] text-gray-500">
                Manage user permissions and proposal review authorizations (RBAC)
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {team.isLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] border-y border-[#E2E5E9] text-gray-500 uppercase tracking-wider font-semibold text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E5E9]">
                    {(team.data || []).map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{member.name}</p>
                              <p className="text-[11px] text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-700">{member.role}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={member.status === 'Active' ? 'success' : 'neutral'} size="sm">
                            {member.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm">
                            Edit Permissions
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 3: AI Configuration */}
      {activeTab === 'ai' && (
        <Card>
          <form onSubmit={handleSaveAI}>
            <CardHeader>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Intelligence Engine Parameters</h3>
                <p className="text-[11px] text-gray-500">
                  Configure underlying LLM models, vector search thresholds, and grounding guardrails
                </p>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="LLM Provider / Model"
                  options={[
                    { value: 'gemini-1.5-pro', label: 'Google Gemini 1.5 Pro (Configured)' },
                    { value: 'mock-enterprise', label: 'Local Deterministic Provider (Offline Mode)' },
                    { value: 'custom-azure-openai', label: 'Azure OpenAI Enterprise (Private Endpoint)' },
                  ]}
                  value={aiForm.provider}
                  onChange={(e) => setAiForm({ ...aiForm, provider: e.target.value as any })}
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700">
                      Temperature ({aiForm.temperature})
                    </label>
                    <span className="text-[10px] text-gray-400">Strict &lt;--&gt; Creative</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={aiForm.temperature}
                    onChange={(e) => setAiForm({ ...aiForm, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-500">
                    Lower values (0.1 - 0.3) produce strictly grounded factual responses for enterprise RFPs.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E5E9] space-y-3">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Grounding &amp; Anti-Hallucination Guardrails
                </h4>

                <div className="space-y-2.5">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiForm.grounding_evaluator_enabled}
                      onChange={(e) =>
                        setAiForm({ ...aiForm, grounding_evaluator_enabled: e.target.checked })
                      }
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-900">
                        Enable Grounding Evaluator
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Automatically scores generated sentences against retrieved knowledge chunks and flags ungrounded statements.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50/80 border border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={aiForm.strict_evidence_mode}
                      onChange={(e) =>
                        setAiForm({ ...aiForm, strict_evidence_mode: e.target.checked })
                      }
                      className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-gray-900">
                        Strict Evidence Citation Mode
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Mandates that every requirement answer specifies at least one verified document reference.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                isLoading={ai.isUpdating}
                leftIcon={<Save className="w-3.5 h-3.5" />}
              >
                Save Configuration
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 4: Integrations */}
      {activeTab === 'integrations' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Connected Enterprise Integrations</h3>
              <p className="text-[11px] text-gray-500">
                Connect external communication tools, CRMs, and email inboxes
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 p-6">
            {/* Real Gmail Integration Card */}
            <div className="p-5 rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">Google Workspace / Gmail</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">
                        Email &amp; Ingestion
                      </span>
                    </div>
                    {gmailStatus.data?.connected && gmailStatus.data.account ? (
                      <p className="text-xs text-gray-600 font-mono mt-0.5">
                        Connected: <span className="font-semibold text-gray-900">{gmailStatus.data.account.email_address}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Connect your company Gmail inbox to automatically ingest RFP inquiries and dispatch human-approved responses.
                      </p>
                    )}
                  </div>
                </div>

                {gmailStatus.data?.connected && (
                  <p className="text-[11px] text-gray-500 pl-10.5">
                    Last synchronized: {gmailStatus.data.account?.last_synced_at ? new Date(gmailStatus.data.account.last_synced_at).toLocaleString() : 'Not yet synchronized'}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 pl-10 md:pl-0">
                {gmailStatus.data?.connected ? (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSyncInbox}
                      isLoading={syncMutation.isPending}
                      disabled={syncMutation.isPending}
                      leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />}
                    >
                      {syncMutation.isPending ? 'Syncing Inbox...' : 'Sync Inbox'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsDisconnectOpen(true)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      leftIcon={<LogOut className="w-3.5 h-3.5" />}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConnectGmail}
                    isLoading={isConnectingGmail}
                    leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  >
                    Connect Gmail
                  </Button>
                )}
              </div>
            </div>

            {syncMutation.isPending && (
              <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-center gap-2.5 text-xs text-blue-800 animate-pulse">
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-blue-900">Synchronizing Gmail inbox...</p>
                  <p className="text-[11px] text-blue-600">
                    Ingesting incoming emails incrementally, extracting attachments, and identifying actionable RFP inquiries.
                  </p>
                </div>
              </div>
            )}

            {lastSyncResult && !syncMutation.isPending && (
              <div className="p-3.5 bg-gray-50/80 border border-gray-200/90 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Last Sync Breakdown
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    {lastSyncResult.durations?.total_duration_ms ? `${Math.round(lastSyncResult.durations.total_duration_ms)}ms total` : ''}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="p-2 rounded-lg bg-white border border-gray-200/60">
                    <p className="text-gray-400">Examined</p>
                    <p className="font-bold text-gray-800">{lastSyncResult.messages_examined}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-gray-200/60">
                    <p className="text-gray-400">New Ingested</p>
                    <p className="font-bold text-emerald-600">+{lastSyncResult.new_emails_count}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-gray-200/60">
                    <p className="text-gray-400">Inquiries Created</p>
                    <p className="font-bold text-blue-600">{lastSyncResult.proposals_created_count}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-gray-200/60">
                    <p className="text-gray-400">Duplicates Skipped</p>
                    <p className="font-bold text-gray-600">{lastSyncResult.skipped_duplicates_count}</p>
                  </div>
                </div>
                {lastSyncResult.durations && (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400 font-mono pt-1">
                    <span>API Fetch: {Math.round(lastSyncResult.durations.gmail_api_fetch_ms)}ms</span>
                    <span>•</span>
                    <span>Normalize: {Math.round(lastSyncResult.durations.message_normalization_ms)}ms</span>
                    <span>•</span>
                    <span>DB Persistence: {Math.round(lastSyncResult.durations.database_persistence_ms)}ms</span>
                    <span>•</span>
                    <span>Strategy: {lastSyncResult.sync_strategy}</span>
                  </div>
                )}
              </div>
            )}

            {/* Other Coming Soon Integrations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {(integrations.data || [])
                .filter((int) => int.id !== 'gmail')
                .map((int) => (
                  <div
                    key={int.id}
                    className="p-4 rounded-xl border border-[#E2E5E9] bg-white flex items-start justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] opacity-80"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-900">{int.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-100 text-gray-500 border border-gray-200">
                          {int.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{int.description}</p>
                    </div>

                    <div className="shrink-0">
                      <span className="inline-flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        Coming soon
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Disconnect Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDisconnectOpen}
        onClose={() => setIsDisconnectOpen(false)}
        onConfirm={handleConfirmDisconnect}
        title="Disconnect Gmail Account?"
        description="Disconnecting will deactivate automatic proposal ingestion and email dispatch. You will need to re-authorize the account to resume syncing."
        confirmLabel="Disconnect Account"
        variant="danger"
        isLoading={disconnectMutation.isPending}
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<div className="p-8">Loading settings...</div>}>
      <SettingsContent />
    </React.Suspense>
  );
}
