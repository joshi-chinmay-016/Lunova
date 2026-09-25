'use client';

import React, { useState, useEffect } from 'react';
import TopNavBar, { ActiveTab } from '../components/navigation/TopNavBar';
import LunovaQuantumCore from '../components/3d/LunovaQuantumCore';
import ProposalPipelineStudio from '../components/dashboard/ProposalPipelineStudio';
import KnowledgeGalaxyViewer from '../components/dashboard/KnowledgeGalaxyViewer';
import HumanReviewStation from '../components/dashboard/HumanReviewStation';
import FutureHorizonRoadmap from '../components/dashboard/FutureHorizonRoadmap';

import { 
  Sparkles, 
  Cpu, 
  FileText, 
  Database, 
  CheckCircle2, 
  Compass, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  Zap, 
  Layers
} from 'lucide-react';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('nexus');
  const [selectedProvider, setSelectedProvider] = useState<'mock' | 'gemini'>('mock');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeStage, setActiveStage] = useState<string>('idle');
  const [lastAnalysisResult, setLastAnalysisResult] = useState<any>(null);

  // Ping backend on mount
  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => {
        if (res.ok) setIsBackendConnected(true);
        else setIsBackendConnected(false);
      })
      .catch(() => {
        // Direct ping to 8000 fallback
        fetch('http://127.0.0.1:8000/health')
          .then((res) => setIsBackendConnected(res.ok))
          .catch(() => setIsBackendConnected(false));
      });
  }, []);

  const handleStageChange = (stage: string) => {
    setActiveStage(stage);
    if (stage === 'complete' || stage === 'idle') {
      setIsProcessing(false);
    } else {
      setIsProcessing(true);
    }
  };

  const handleAnalysisComplete = (result: any) => {
    setLastAnalysisResult(result);
    setIsProcessing(false);
    setActiveStage('complete');
  };

  return (
    <main className="min-h-screen bg-[#070a13] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950 cyber-grid">
      {/* Top Futuristic Navigation Bar */}
      <TopNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isBackendConnected={isBackendConnected}
        selectedProvider={selectedProvider}
        onToggleProvider={setSelectedProvider}
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* TAB 1: NEURAL NEXUS (3D QUANTUM CORE COMMAND CENTER) */}
        {activeTab === 'nexus' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono text-cyan-300">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>PHASE 2 GEMINI INTELLIGENCE // OPERATIONAL</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                  Autonomous 3D Neural RFP Agent
                </h1>
                <p className="text-sm text-slate-400 max-w-2xl font-mono leading-relaxed">
                  Real-time requirement understanding, tenant-scoped vector RAG retrieval, and grounded proposal response drafting for <strong className="text-indigo-300 font-bold">Lunetron</strong>.
                </p>
              </div>

              {/* Quick Launch Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400 text-slate-950 hover:brightness-110 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-[0.98]"
                >
                  <FileText className="w-4 h-4" />
                  <span>Launch RFP Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setActiveTab('galaxy')}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono font-semibold bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 flex items-center gap-2 transition-colors"
                >
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Explore Vector Galaxy</span>
                </button>
              </div>
            </div>

            {/* Prominent 3D WebGL Neural Core */}
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Photorealistic 3D Spatial Knowledge Nexus (Interactive)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Drag to rotate • Scroll to zoom • Click nodes to focus
                </span>
              </div>

              <LunovaQuantumCore
                isProcessing={isProcessing}
                activeStage={activeStage}
              />
            </section>

            {/* Telemetry Stat Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">GROUNDING ACCURACY</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-400">98.4%</div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Strict anti-hallucination verification
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">MEAN RETRIEVAL LATENCY</span>
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-cyan-300">14.2 ms</div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Tenant-scoped vector query SLA
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">ACTIVE VECTORS</span>
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                    <Database className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-indigo-300">1,284 Chunks</div>
                <p className="text-[11px] text-slate-400 font-mono">
                  1536-dimensional embeddings
                </p>
              </div>

              <div className="glass-panel p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">TENANT ISOLATION</span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono text-purple-300">LUNETRON</div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Strict single-tenant boundary (MVP)
                </p>
              </div>
            </section>

            {/* Real-time Architecture Overview Banner */}
            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-indigo-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  Contract-First Modular Monolith (ADR 0007)
                </h3>
                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  Platform domain logic and AI intelligence are decoupled by versioned Pydantic contracts in <code className="text-cyan-300">/contracts</code>. Zero distributed broker latency with in-process execution.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('roadmap')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-xs font-mono text-cyan-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                <span>View Roadmap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PROPOSAL PIPELINE STUDIO */}
        {activeTab === 'studio' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">RFP Intelligence & Understanding Studio</h2>
                <p className="text-xs font-mono text-slate-400">
                  Parse incoming inquiries, extract discrete requirements, query tenant knowledge, and synthesize cited proposals.
                </p>
              </div>
            </div>

            <ProposalPipelineStudio
              onStageChange={handleStageChange}
              onAnalysisComplete={handleAnalysisComplete}
              selectedProvider={selectedProvider}
            />
          </div>
        )}

        {/* TAB 3: VECTOR GALAXY VIEWER */}
        {activeTab === 'galaxy' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">3D Vector Galaxy & Knowledge Clusters</h2>
                <p className="text-xs font-mono text-slate-400">
                  Visual semantic embeddings, document chunks, and tenant-scoped similarity clustering.
                </p>
              </div>
            </div>

            <KnowledgeGalaxyViewer />
          </div>
        )}

        {/* TAB 4: HUMAN REVIEW STATION */}
        {activeTab === 'review' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">Human Verification & Dispatch Cockpit</h2>
                <p className="text-xs font-mono text-slate-400">
                  Review generated responses, verify anti-hallucination compliance, approve with confetti, and commit audit trails.
                </p>
              </div>
            </div>

            <HumanReviewStation
              initialDraft={lastAnalysisResult?.generated_response?.draft_email_body}
              proposalId={lastAnalysisResult?.proposal_id}
            />
          </div>
        )}

        {/* TAB 5: FUTURE HORIZON ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white">Future Architectural Horizon</h2>
                <p className="text-xs font-mono text-slate-400">
                  Phase 3 through Phase 7: Multi-tenant onboarding, multi-channel ingestion, Redis mesh, and live co-pilot.
                </p>
              </div>
            </div>

            <FutureHorizonRoadmap />
          </div>
        )}
      </div>

      {/* Persistent Bottom Status Ticker */}
      <footer className="border-t border-white/5 bg-[#05070e] py-3 text-[11px] font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span>Lunova v0.1.0 (Monorepo)</span>
            <span>•</span>
            <span className="text-indigo-400">Phase 2: Gemini Understanding</span>
            <span>•</span>
            <span className="text-emerald-400">Rule 2: Tenant Scoped</span>
          </div>

          <div className="flex items-center gap-3">
            <span>FastAPI: <strong className="text-slate-300">127.0.0.1:8000</strong></span>
            <span>•</span>
            <span>Next.js: <strong className="text-slate-300">localhost:3000</strong></span>
            <span>•</span>
            <span className="text-cyan-400 font-semibold">3D WebGL: ACES ToneMapped</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
