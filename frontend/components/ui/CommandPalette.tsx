'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLunovaStore } from '@/lib/lunovaStore';
import { PhaseGlyph } from './PhaseGlyph';
import {
  Search,
  FileText,
  BookOpen,
  Sun,
  Moon,
  Plus,
  ArrowRight,
  X,
  Compass,
} from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const router = useRouter();
  const {
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    proposals,
    documents,
    setActiveProposalId,
    settings,
    toggleTheme,
    addToast,
  } = useLunovaStore();

  const [query, setQuery] = useState('');

  // Global ⌘K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!isCommandPaletteOpen);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const filteredProposals = proposals.filter(
    (p: any) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.customer.toLowerCase().includes(query.toLowerCase()) ||
      p.rfpNumber.toLowerCase().includes(query.toLowerCase())
  );

  const filteredDocs = documents.filter(
    (d: any) =>
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      d.topics.some((t: string) => t.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectProposal = (id: string) => {
    setActiveProposalId(id);
    setCommandPaletteOpen(false);
    router.push(`/proposals/${id}`);
  };

  const handleSelectDoc = () => {
    setCommandPaletteOpen(false);
    router.push('/knowledge-base');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div
        className="fixed inset-0"
        onClick={() => setCommandPaletteOpen(false)}
      />

      <div className="relative w-full max-w-xl rounded-card bg-surface-1 border border-line shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-line">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search proposals, documents, requirements, or type a command..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono text-text-muted bg-surface-2 border border-line">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="px-3 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-text-muted">
              Quick Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push('/dashboard');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-surface-2 text-sm text-text font-medium transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Compass className="w-4.5 h-4.5 text-accent" />
                  <span>Go to Observatory Dashboard</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </button>

              <button
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push('/proposals');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-surface-2 text-sm text-text font-medium transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4.5 h-4.5 text-accent" />
                  <span>View All Proposals</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </button>

              <button
                onClick={() => {
                  setCommandPaletteOpen(false);
                  router.push('/knowledge-base');
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl hover:bg-surface-2 text-sm text-text font-medium transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4.5 h-4.5 text-accent" />
                  <span>Explore Company Knowledge Base</span>
                </div>
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </button>
            </div>
          </div>

          {/* Proposals */}
          {filteredProposals.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Proposals</span>
                <span>{filteredProposals.length}</span>
              </div>
              <div className="space-y-0.5">
                {filteredProposals.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectProposal(p.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-2 text-xs text-text transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <PhaseGlyph phase={p.phase} size="xs" />
                      <div className="truncate">
                        <span className="font-medium text-text">{p.customer}: </span>
                        <span className="text-text-muted truncate">{p.title}</span>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-accent shrink-0 ml-2">
                      {p.confidence}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Documents */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-wider text-text-muted flex items-center justify-between">
                <span>Knowledge Base Documents</span>
                <span>{filteredDocs.length}</span>
              </div>
              <div className="space-y-0.5">
                {filteredDocs.map((d) => (
                  <button
                    key={d.id}
                    onClick={handleSelectDoc}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-surface-2 text-xs text-text transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <BookOpen className="w-3.5 h-3.5 text-evidence shrink-0" />
                      <span className="truncate text-text">{d.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-text-muted shrink-0 ml-2">
                      {d.chunkCount} chunks
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-line bg-surface-2 flex items-center justify-between text-[11px] text-text-muted">
          <span>Navigate with ↑ ↓ • Select with ↵</span>
          <span>Lunova Command Hub</span>
        </div>
      </div>
    </div>
  );
};
