'use client';

import React from 'react';
import Link from 'next/link';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-white/80 border-t border-slate-200/90 py-16 text-xs text-slate-500 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-950 text-white flex items-center justify-center font-bold font-display text-sm shadow-md border border-slate-800">
                <span className="text-emerald-400">L</span>
              </div>
              <span className="text-2xl font-display tracking-tight text-slate-950 font-extrabold">
                Lunova
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800">
                v2.4 Core
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed max-w-sm font-sans text-xs sm:text-sm">
              Cryptographic proposal intelligence grounded in tenant knowledge, verified through vector similarity, and subject to unilateral human authorization.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-950 font-bold">
              System Architecture
            </span>
            <ul className="space-y-2.5 font-sans">
              <li>
                <a href="#how-it-works" className="hover:text-emerald-700 transition-colors">
                  Workflow Overview
                </a>
              </li>
              <li>
                <a href="#workflow-animation" className="hover:text-emerald-700 transition-colors">
                  Decomposition Lifecycle
                </a>
              </li>
              <li>
                <a href="#evidence" className="hover:text-emerald-700 transition-colors">
                  Vector Grounding Engine
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-emerald-700 transition-colors">
                  Core Capabilities
                </a>
              </li>
            </ul>
          </div>

          {/* Operational Application Links */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-950 font-bold">
              Operational Workspace
            </span>
            <ul className="space-y-2.5 font-sans">
              <li>
                <Link href="/dashboard" className="hover:text-emerald-700 transition-colors">
                  Operations Console
                </Link>
              </li>
              <li>
                <Link href="/proposals" className="hover:text-emerald-700 transition-colors">
                  Review &amp; Sign-Off Queue
                </Link>
              </li>
              <li>
                <Link href="/knowledge-base" className="hover:text-emerald-700 transition-colors">
                  Tenant Knowledge Vault
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-700 transition-colors">
                  Enterprise SSO Access
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Lunova Systems Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-5">
            <span className="text-emerald-700 font-bold">Air-Gapped Vector Isolation</span>
            <span>•</span>
            <span>Zero Foundation Model Training</span>
            <span>•</span>
            <span>Human Review Gate Enforced</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
