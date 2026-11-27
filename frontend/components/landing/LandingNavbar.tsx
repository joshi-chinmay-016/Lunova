'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sparkles, Cpu } from 'lucide-react';
import { ShinyButton } from '@/components/ui/ShinyButton';

export const LandingNavbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200/90 py-3 shadow-[0_4px_20px_rgba(8,112,184,0.06)]'
          : 'bg-white/85 backdrop-blur-md border-b border-white/60 py-4.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo / Wordmark */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-emerald-400 flex items-center justify-center font-display font-extrabold text-lg shadow-[0_4px_16px_rgba(5,150,105,0.25)] border border-emerald-500/40 transition-all duration-300 group-hover:scale-105 group-hover:border-emerald-400">
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-xl tracking-tight text-slate-950">
              Lunova
            </span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200/90 text-emerald-800 shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1.5 text-sm font-display font-semibold text-slate-700">
          <a
            href="#how-it-works"
            className="px-3.5 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            How it works
          </a>
          <a
            href="#workflow-animation"
            className="px-3.5 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            Product Story
          </a>
          <a
            href="#evidence"
            className="px-3.5 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            Evidence Grounding
          </a>
          <a
            href="#trust"
            className="px-3.5 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            Human Control
          </a>
          <a
            href="#capabilities"
            className="px-3.5 py-2 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-800 transition-colors whitespace-nowrap"
          >
            Capabilities
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/login">
            <button className="text-sm font-display font-bold text-slate-800 hover:text-emerald-700 px-5 py-2.5 min-h-[44px] inline-flex items-center justify-center transition-colors cursor-pointer whitespace-nowrap rounded-xl">
              Sign In
            </button>
          </Link>

          <Link href="/dashboard">
            <button className="relative inline-flex items-center justify-center gap-2.5 min-h-[46px] px-7 py-2.5 rounded-xl font-display font-bold text-sm text-white overflow-hidden shadow-[0_4px_16px_rgba(5,150,105,0.25)] hover:shadow-[0_8px_24px_rgba(5,150,105,0.35)] transition-all duration-300 group cursor-pointer border border-emerald-400/30 active:scale-[0.98]">
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 transition-transform duration-300 group-hover:scale-105" />
              <span className="absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent group-hover:animate-shine pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                <span>Explore Workspace</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-colors cursor-pointer ml-1"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white/98 backdrop-blur-xl border-b border-emerald-100 px-5 py-5 space-y-4 shadow-2xl animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-display font-bold text-slate-800">
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              How it works
            </a>
            <a
              href="#workflow-animation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Product Story
            </a>
            <a
              href="#evidence"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Evidence Grounding
            </a>
            <a
              href="#trust"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Human Control
            </a>
            <a
              href="#capabilities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
            >
              Capabilities
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 text-sm font-display font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-emerald-50 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 text-sm font-display font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
                <span>Explore Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
