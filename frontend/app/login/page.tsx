'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ShieldCheck, ArrowRight, Lock, Mail, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('sarah.jenkins@lunetron.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 450);
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center font-bold shadow-clay-button border border-brand">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-ink">Lunova</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-ink">
          Sign in to your proposal workspace
        </h1>
        <p className="mt-1.5 text-xs text-slate">
          Proposal response intelligence with strict tenant data isolation
        </p>
      </div>

      <div className="mt-7 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-border-subtle shadow-card">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Work Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-border-subtle pl-9 pr-3 py-2.5 bg-canvas focus:bg-white focus:outline-none focus:border-brand"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-muted absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full text-xs rounded-xl border border-border-subtle pl-9 pr-3 py-2.5 bg-canvas focus:bg-white focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-slate">Tenant: Lunetron Corp</span>
              <span className="text-[11px] text-brand font-medium">SSO Enabled</span>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm sm:text-base mt-2 shadow-sm cursor-pointer"
            >
              {isLoading ? 'Authenticating...' : 'Sign In to Workspace'}
            </Button>
          </form>

          {/* Quick Demo Access Station */}
          <div className="mt-6 pt-5 border-t border-border-subtle">
            <div className="text-[11px] font-semibold text-slate uppercase tracking-wider mb-2.5 text-center">
              Demonstration Access
            </div>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => router.push('/dashboard'), 300);
              }}
              className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/70 transition-all text-left cursor-pointer shadow-sm hover:shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                  SJ
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-ink">Enter as Sarah Jenkins</div>
                  <div className="text-[11px] text-slate">Principal Solutions Architect (Admin)</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Tenant data isolated at PostgreSQL query boundary</span>
        </div>
      </div>
    </div>
  );
}
