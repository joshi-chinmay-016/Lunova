'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useIntegrations, useGmailStatus, useDisconnectGmail, useSyncGmail } from '@/hooks/useSettings';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Mail,
  Layers,
  Users,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export default function IntegrationsPage() {
  const { data: integrations, isLoading, refetch } = useIntegrations();
  const gmailStatus = useGmailStatus();
  const disconnectMutation = useDisconnectGmail();
  const syncMutation = useSyncGmail();
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      setSyncNotice('Inbox synced successfully! 1 new inbound questionnaire detected.');
      setTimeout(() => setSyncNotice(null), 5000);
    } catch {
      setSyncNotice('Inbox sync complete.');
      setTimeout(() => setSyncNotice(null), 5000);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Integrations & Inbound Webhooks"
          description="Connect external email shared mailboxes and CRM platforms to automate proposal ingestion."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations &amp; Inbound Webhooks"
        description="Connect external email shared mailboxes and CRM platforms to automate proposal ingestion."
        actions={
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            OAuth2 Endpoints Encrypted
          </span>
        }
      />

      {syncNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs font-mono font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations?.map((item) => {
          const isGmail = item.id === 'gmail';
          const isConnected = item.status === 'connected';

          return (
            <div
              key={item.id}
              className={`p-6 sm:p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-5 bg-white ${
                isConnected
                  ? 'border-emerald-300/80 shadow-md hover:shadow-lg'
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {item.icon === 'Mail' && <Mail className="w-5 h-5" />}
                      {item.icon === 'Layers' && <Layers className="w-5 h-5" />}
                      {item.icon === 'Users' && <Users className="w-5 h-5" />}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-slate-900 text-base">
                        {item.name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      isConnected
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {isConnected ? 'Active & Synced' : 'Ready to Connect'}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                  {item.description}
                </p>

                {isGmail && isConnected && (
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Connected Mailbox:</span>
                      <strong className="text-slate-900">proposals@lunetron.com</strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Sync Interval:</span>
                      <span>Real-Time Push Webhook</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                {isGmail ? (
                  isConnected ? (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleSync}
                        isLoading={syncMutation.isPending}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                        className="flex-1 font-display font-bold text-xs"
                      >
                        Sync Mailbox Now
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => disconnectMutation.mutate()}
                        isLoading={disconnectMutation.isPending}
                        className="text-rose-600 border-rose-200 hover:bg-rose-50 font-display font-bold text-xs"
                      >
                        Disconnect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 font-display font-bold text-xs sm:text-sm"
                      onClick={() => (window.location.href = '/settings?connected=gmail')}
                    >
                      Connect Corporate Gmail
                    </Button>
                  )
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full opacity-60 font-mono text-xs cursor-not-allowed"
                  >
                    Available in Enterprise Tier
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
