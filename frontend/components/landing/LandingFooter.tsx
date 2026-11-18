'use client';

import React from 'react';
import Link from 'next/link';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-slate-50/90 border-t border-blue-100 py-16 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                L
              </div>
              <span className="text-xl tracking-tight text-slate-900 font-extrabold">
                Lunova
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
                Intelligence
              </span>
            </div>
            <p className="text-slate-500 leading-relaxed max-w-sm font-sans">
              Proposal response intelligence grounded in company knowledge and subject to human authorization.
            </p>
          </div>

          {/* Product Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-900 font-bold">
              Product Architecture
            </span>
            <ul className="space-y-2">
              <li>
                <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
                  Workflow Overview
                </a>
              </li>
              <li>
                <a href="#workflow-animation" className="hover:text-blue-600 transition-colors">
                  Product Story
                </a>
              </li>
              <li>
                <a href="#evidence" className="hover:text-blue-600 transition-colors">
                  Evidence Grounding
                </a>
              </li>
              <li>
                <a href="#capabilities" className="hover:text-blue-600 transition-colors">
                  Core Capabilities
                </a>
              </li>
            </ul>
          </div>

          {/* Operational Application Links */}
          <div className="md:col-span-4 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-slate-900 font-bold">
              Workspace Access
            </span>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                  Operations Dashboard
                </Link>
              </li>
              <li>
                <Link href="/proposals" className="hover:text-blue-600 transition-colors">
                  Proposal Requests &amp; Review Queue
                </Link>
              </li>
              <li>
                <Link href="/knowledge-base" className="hover:text-blue-600 transition-colors">
                  Company Knowledge Base
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-600 transition-colors">
                  Single Sign-On (SSO) Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            &copy; {new Date().getFullYear()} Lunova Intelligence Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <span>Tenant Boundary Enforced</span>
            <span>Zero Public Model Training</span>
            <span>Human Review Required</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
