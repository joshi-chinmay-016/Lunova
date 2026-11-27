'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Sparkles, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { ShinyButton } from '@/components/ui/ShinyButton';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && rawRedirect.startsWith('/') && rawRedirect !== '/login' ? rawRedirect : '/dashboard';

  const { login, isLoggingIn, bootstrap, isBootstrapping, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('admin@lunetron.com');
  const [password, setPassword] = useState('lunetron2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, immediately redirect to dashboard or intended route
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login({ email, password });
      router.replace(redirectPath);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleBootstrap = async () => {
    setErrorMsg(null);
    try {
      await bootstrap();
      router.replace(redirectPath);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Bootstrap initialization failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* High-tech dot matrix */}
      <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.06] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2 relative z-10">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-2 group">
          <div className="w-10 h-10 rounded-xl bg-slate-950 text-white flex items-center justify-center font-display font-bold text-base shadow-md group-hover:scale-105 transition-transform">
            <span className="text-emerald-400">L</span>
          </div>
          <span className="text-2xl font-display font-extrabold tracking-tight text-slate-950">
            Lunova
          </span>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300">
            v2.4
          </span>
        </Link>
        <h2 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-slate-900">
          Sign In to Workspace Console
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 font-sans">
          Proposal Intelligence &amp; Human Verification Station
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="relative glass-card rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/90 bg-white/95">
          <BorderBeam size={180} duration={8} colorFrom="#10B981" colorTo="#06B6D4" borderWidth={1.5} />

          <div className="pb-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold text-slate-900">Enterprise Credentials</h3>
              <p className="text-xs text-slate-500 font-mono">
                Tenant: <span className="font-bold text-slate-800">Lunetron Technologies</span>
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              JWT Authenticated
            </span>
          </div>

          <div className="pt-5 space-y-4 font-sans">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-rose-900 font-display">Authentication Notice</p>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Enterprise Work Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lunetron.com"
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full min-h-[48px] font-display font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md"
                isLoading={isLoggingIn}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In with Credentials
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2.5 text-slate-400 font-mono font-bold tracking-wider text-[10px]">
                  Local Development Shortcut
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full min-h-[46px] border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-800 font-display font-bold text-xs sm:text-sm"
              isLoading={isBootstrapping}
              onClick={handleBootstrap}
              leftIcon={<Zap className="w-4 h-4 text-emerald-600" />}
            >
              1-Click Admin Access (Instant JWT)
            </Button>

            <div className="pt-2 text-[11px] text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1 font-mono">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 font-display">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Default Administrator Session:</span>
              </div>
              <p>Email: <code className="text-slate-900 font-bold">admin@lunetron.com</code></p>
              <p>Password: <code className="text-slate-900 font-bold">lunetron2026!</code></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
