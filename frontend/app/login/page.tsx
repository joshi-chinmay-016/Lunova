'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Sparkles, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight, Zap } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoggingIn, bootstrap, isBootstrapping, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('admin@lunetron.com');
  const [password, setPassword] = useState('lunetron2026!');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login({ email, password });
      router.push('/');
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your credentials.';
      if (msg.includes('500') || msg.includes('Failed to fetch') || msg.includes('Internal Server Error')) {
        setErrorMsg(
          'Database unreachable: PostgreSQL port 5432 is offline. Ensure PostgreSQL or Docker Desktop is running.'
        );
      } else {
        setErrorMsg(msg);
      }
    }
  };

  const handleBootstrap = async () => {
    setErrorMsg(null);
    try {
      await bootstrap();
      router.push('/');
    } catch (err: any) {
      const msg = err?.message || 'Bootstrap failed.';
      if (msg.includes('500') || msg.includes('Failed to fetch') || msg.includes('Internal Server Error')) {
        setErrorMsg(
          'Database unreachable: PostgreSQL port 5432 is offline. Ensure PostgreSQL or Docker Desktop is running.'
        );
      } else {
        setErrorMsg(msg);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 shadow-md text-white mb-2">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-gray-900">
          Lunova Enterprise
        </h2>
        <p className="text-xs text-gray-500 font-medium">
          AI Proposal Intelligence &amp; Human Review Station
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="p-6 sm:p-8 shadow-sm border-[#E2E5E9]">
          <CardHeader className="p-0 pb-6 border-b border-[#E2E5E9]">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-900">Sign in to workspace</h3>
              <p className="text-xs text-gray-500">
                Workspace tenant: <span className="font-semibold text-gray-800">Lunetron Technologies</span>
              </p>
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-6 space-y-5">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-red-900">Authentication Error</p>
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Work Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lunetron.com"
                leftIcon={<Mail className="w-4 h-4" />}
              />

              <Input
                label="Password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoggingIn}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In with Password
              </Button>
            </form>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-semibold tracking-wider text-[10px]">
                  Local Development Shortcut
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100/50 text-blue-700"
              isLoading={isBootstrapping}
              onClick={handleBootstrap}
              leftIcon={<Zap className="w-4 h-4 text-blue-600" />}
            >
              Quick Dev Admin Bootstrap (1-Click)
            </Button>

            <div className="pt-2 text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Local Development Credentials:</span>
              </div>
              <p>Email: <code className="font-mono text-gray-800">admin@lunetron.com</code></p>
              <p>Password: <code className="font-mono text-gray-800">lunetron2026!</code></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

