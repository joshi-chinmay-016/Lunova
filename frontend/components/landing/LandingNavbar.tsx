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
          ? 'bg-white/90 backdrop-blur-md border-b border-blue-100/80 py-3 shadow-[0_2px_16px_rgba(37,99,235,0.06)]'
          : 'bg-white/60 backdrop-blur-sm border-b border-blue-50/50 py-4.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Logo / Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-blue-500/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
            L
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xl tracking-tight text-slate-900">
              Lunova
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700">
              Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation - Responsive & Non-overlapping */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-[13px] xl:text-sm font-medium text-slate-600">
          <a
            href="#how-it-works"
            className="px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            How it works
          </a>
          <a
            href="#workflow-animation"
            className="px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Product Story
          </a>
          <a
            href="#evidence"
            className="px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Evidence Grounding
          </a>
          <a
            href="#trust"
            className="px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Human Control
          </a>
          <a
            href="#capabilities"
            className="px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            Capabilities
          </a>
        </nav>

        {/* Action CTAs */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <Link href="/login">
            <button className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors cursor-pointer">
              Sign In
            </button>
          </Link>
          <MagneticButton strength={0.25}>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-blue-500/20 hover:shadow-md transition-all cursor-pointer">
                <span>Explore Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </MagneticButton>
        </div>

        {/* Mobile / Tablet Menu Toggle Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition-colors"
          aria-label="Toggle Navigation"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile / Tablet Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-blue-100 px-5 py-5 space-y-4 shadow-lg animate-in fade-in duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-medium text-slate-700">
            <a
              href="#how-it-works"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              How it works
            </a>
            <a
              href="#workflow-animation"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Product Story
            </a>
            <a
              href="#evidence"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Evidence Grounding
            </a>
            <a
              href="#trust"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Human Control
            </a>
            <a
              href="#capabilities"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              Capabilities
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 transition-colors">
                Sign In
              </button>
            </Link>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors">
                <span>Explore Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
