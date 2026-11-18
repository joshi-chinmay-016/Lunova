'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, Sparkles } from 'lucide-react';
import { MagneticButton } from '@/components/ui/MagneticButton';

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
          ? 'bg-white/95 border-b border-blue-100/90 py-3 shadow-[0_2px_16px_rgba(37,99,235,0.06)]'
          : 'bg-white/90 border-b border-blue-50 py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo / Wordmark */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/25 transition-all duration-200 group-hover:scale-105 group-hover:bg-blue-700">
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900 font-sans">
              Lunova
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Clean spacing with zero overlap */}
        <nav className="hidden xl:flex items-center gap-1.5 text-sm font-medium text-slate-600">
          <a
            href="#how-it-works"
            className="px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            How it works
          </a>
          <a
            href="#workflow-animation"
            className="px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Product Story
          </a>
          <a
            href="#evidence"
            className="px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Evidence Grounding
          </a>
          <a
            href="#trust"
            className="px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Human Control
          </a>
          <a
            href="#capabilities"
            className="px-3.5 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Capabilities
          </a>
        </nav>

        {/* Action CTAs - Generously sized buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/login">
            <button className="text-sm font-semibold text-slate-800 hover:text-blue-600 px-3.5 py-2.5 transition-colors cursor-pointer whitespace-nowrap">
              Sign In
            </button>
          </Link>
          <MagneticButton strength={0.2}>
            <Link href="/dashboard">
              <button className="inline-flex items-center justify-center gap-2.5 min-h-[46px] px-6 sm:px-7 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-sm shadow-blue-500/25 hover:shadow-md transition-all cursor-pointer whitespace-nowrap">
                <span>Explore Workspace</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </Link>
          </MagneticButton>

          {/* Mobile / Tablet Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors cursor-pointer ml-1"
            aria-label="Toggle Navigation"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white border-b border-blue-100 px-5 py-5 space-y-4 shadow-xl animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              How it works
            </a>
            <a
              href="#workflow-animation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Product Story
            </a>
            <a
              href="#evidence"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Evidence Grounding
            </a>
            <a
              href="#trust"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Human Control
            </a>
            <a
              href="#capabilities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Capabilities
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 text-sm font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors">
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
