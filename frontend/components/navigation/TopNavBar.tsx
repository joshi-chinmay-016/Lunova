'use client';

import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  FileText, 
  Database, 
  CheckCircle2, 
  Compass, 
  ShieldCheck, 
  Radio
} from 'lucide-react';

export type ActiveTab = 'nexus' | 'studio' | 'galaxy' | 'review' | 'roadmap';

interface TopNavBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isBackendConnected: boolean;
  selectedProvider: 'mock' | 'gemini';
  onToggleProvider: (provider: 'mock' | 'gemini') => void;
}

export default function TopNavBar({
  activeTab,
  onTabChange,
  isBackendConnected,
  selectedProvider,
  onToggleProvider,
}: TopNavBarProps) {
  const tabs = [
    { id: 'nexus', label: 'Neural Nexus', icon: Cpu, badge: '3D Core' },
    { id: 'studio', label: 'RFP Studio', icon: FileText, badge: 'Live Pipeline' },
    { id: 'galaxy', label: 'Vector Galaxy', icon: Database, badge: 'RAG 3D' },
    { id: 'review', label: 'Human Review', icon: CheckCircle2, badge: 'Guardrail' },
    { id: 'roadmap', label: 'Future Horizon', icon: Compass, badge: 'Roadmap' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-500/15 bg-[#070a13]/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-[1px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0a0f24] rounded-[11px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                  LUNOVA
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  v2.0 3D
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Autonomous Proposal Response Agent
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as ActiveTab)}
                  className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-cyan-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-cyan-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Operational Status Badges */}
          <div className="flex items-center gap-3">
            {/* LLM Engine Switcher */}
            <div className="hidden lg:flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-white/10 text-[11px] font-mono">
              <button
                onClick={() => onToggleProvider('gemini')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedProvider === 'gemini'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Gemini 3.5
              </button>
              <button
                onClick={() => onToggleProvider('mock')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  selectedProvider === 'mock'
                    ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mock LLM
              </button>
            </div>

            {/* Tenant Boundary Guard */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Tenant: <strong>Lunetron</strong></span>
            </div>

            {/* Live Backend Connection Indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
              isBackendConnected 
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' 
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              <Radio className={`w-3.5 h-3.5 ${isBackendConnected ? 'animate-pulse text-cyan-400' : 'text-rose-400'}`} />
              <span className="hidden sm:inline">
                {isBackendConnected ? 'FastAPI 8000' : 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
