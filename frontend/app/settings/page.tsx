'use client';

import React, { useState } from 'react';
import {
  useCompanySettings,
  useTeamMembers,
  useAIConfiguration,
  useIntegrations,
} from '@/hooks/useSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs } from '@/components/ui/Tabs';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
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
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'ai' | 'integrations'>('company');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const company = useCompanySettings();
  const team = useTeamMembers();
  const ai = useAIConfiguration();
  const integrations = useIntegrations();

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
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Input
                  label="Default Proposal Lead"
                  value={companyForm.default_owner}
                  onChange={(e) => setCompanyForm({ ...companyForm, default_owner: e.target.value })}
                />
                <Select
                  label="Response Narrative Tone"
                  options={[
                    { value: 'Professional & Technical', label: 'Professional & Technical' },
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
                Save Changes
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Tab 2: Users & Permissions */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Workspace Members & Review Roles</h3>
              <p className="text-[11px] text-gray-500">
                Manage members authorized to approve, edit, and export client RFP responses
              </p>
            </div>
            <Button variant="secondary" size="sm">
              Invite Member
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E5E9] bg-gray-50/50 text-gray-500 font-medium">
                    <th className="py-3 px-4 font-semibold">User</th>
                    <th className="py-3 px-4 font-semibold">Email</th>
                    <th className="py-3 px-4 font-semibold">Role</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E5E9]">
                  {(team.data || []).map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                            {m.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <span>{m.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{m.email}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200 font-semibold text-[10px] text-gray-700">
                          {m.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge variant="success" size="sm" dot>
                          {m.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          Edit Role
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

          <CardContent className="space-y-3 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(integrations.data || []).map((int) => (
                <div
                  key={int.id}
                  className="p-4 rounded-xl border border-[#E2E5E9] bg-white flex items-start justify-between gap-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)]"
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
                    {int.status === 'connected' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                        Coming soon
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
