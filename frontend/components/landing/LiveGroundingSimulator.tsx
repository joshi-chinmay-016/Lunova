'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck,
  Database,
  ShieldCheck,
  Activity,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Fingerprint,
  Cpu,
  Layers,
} from 'lucide-react';
import { BorderBeam } from '@/components/ui/BorderBeam';

type SimulatorTab = 'extraction' | 'retrieval' | 'veracity';

export const LiveGroundingSimulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('retrieval');

  return (
    <div className="relative w-full">
      {/* Hanging Status Badge with subtle pendulum swing (ReactBits / Unicorn style) */}
      <div className="hidden sm:flex absolute -top-8 right-8 z-30 flex-col items-center animate-hang origin-top pointer-events-none">
        <div className="w-[1.5px] h-6 bg-gradient-to-b from-emerald-400 to-teal-500" />
        <div className="px-3.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-emerald-300 text-[10px] font-mono font-bold text-emerald-800 shadow-[0_4px_16px_rgba(16,185,129,0.2)] flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
          </span>
          <span>AIR-GAPPED RAG • LIVE</span>
        </div>
      </div>

      {/* Alive Floating Micro-card */}
      <div className="hidden sm:flex absolute -bottom-6 -left-6 z-30 p-3.5 rounded-2xl bg-white/95 backdrop-blur-md border border-emerald-200/90 shadow-[0_12px_30px_rgba(16,185,129,0.15)] items-center gap-3 animate-float transition-transform hover:scale-105">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-100 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200">
          <Sparkles className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="text-left">
          <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 font-bold">
            Veracity Assurance
          </div>
          <div className="text-xs font-display font-bold text-slate-900">
            0 Hallucinations Detected
          </div>
        </div>
      </div>

      {/* Main Glass Terminal Container with ReactBits BorderBeam */}
      <div className="relative rounded-3xl border-2 border-white/95 bg-white/92 backdrop-blur-xl p-6 sm:p-7 shadow-[0_24px_60px_rgba(8,112,184,0.08),inset_0_1px_1px_rgba(255,255,255,0.95)] overflow-hidden transition-all duration-300 hover:shadow-[0_32px_70px_rgba(16,185,129,0.15)]">
        {/* Animated Border Beam */}
        <BorderBeam size={250} duration={7} colorFrom="#10B981" colorTo="#06B6D4" />

        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-950 to-slate-800 text-emerald-400 flex items-center justify-center shadow-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-display font-bold text-slate-950 tracking-tight">
                  Lunova Grounding Engine
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  v2.6
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-500">
                Deterministic RAG Pipeline • RFP-2026-NW-894
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-mono font-semibold text-slate-700">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>VPC Isolated</span>
          </div>
        </div>

        {/* Interactive Mode Selector Tabs */}
        <div className="pt-3 pb-2 grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('extraction')}
            className={`py-2 px-2 rounded-lg text-xs font-display font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'extraction'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>01 Extraction</span>
          </button>

          <button
            onClick={() => setActiveTab('retrieval')}
            className={`py-2 px-2 rounded-lg text-xs font-display font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'retrieval'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>02 Vector RAG</span>
          </button>

          <button
            onClick={() => setActiveTab('veracity')}
            className={`py-2 px-2 rounded-lg text-xs font-display font-bold tracking-tight transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'veracity'
                ? 'bg-white text-slate-950 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>03 Veracity</span>
          </button>
        </div>

        {/* Dynamic Interactive Stage Content */}
        <div className="min-h-[220px] pt-1">
          <AnimatePresence mode="wait">
            {/* TAB 1: EXTRACTION */}
            {activeTab === 'extraction' && (
              <motion.div
                key="tab-extraction"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold">
                    <span>Inbound Client Clause #4</span>
                    <span className="text-emerald-700">Structured Decomp</span>
                  </div>
                  <p className="text-xs font-medium text-slate-800 leading-relaxed">
                    &ldquo;Vendor must verify whether customer encryption keys support automated rotation under AWS KMS, and cite compliance documentation.&rdquo;
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    Entity: AWS KMS
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Obligation: Key Auto-Rotation
                  </span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600" />
                    Proof: SOC 2 Type II
                  </span>
                </div>
              </motion.div>
            )}

            {/* TAB 2: VECTOR RAG RETRIEVAL */}
            {activeTab === 'retrieval' && (
              <motion.div
                key="tab-retrieval"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200/90 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-emerald-800 flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      Vector Semantic Match (Top-1)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                      0.948 Cosine Similarity
                    </span>
                  </div>

                  <p className="text-xs text-emerald-950 font-bold">
                    <strong className="text-emerald-700">[1]</strong> Lunetron_Cloud_Architecture_Whitepaper_v4.2.pdf (§4.2)
                  </p>

                  <p className="text-[11px] text-emerald-900 leading-relaxed italic bg-white/70 p-2.5 rounded-lg border border-emerald-200/60">
                    &ldquo;Customer master keys support automated annual key rotation natively enforced via AWS KMS Key Management Service, with immutable CloudTrail audit logging.&rdquo;
                  </p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
                  <span>Tokens: 142 • Chunk: #142</span>
                  <span className="text-emerald-700 font-bold">Deterministic Link Validated</span>
                </div>
              </motion.div>
            )}

            {/* TAB 3: VERACITY AUDIT */}
            {activeTab === 'veracity' && (
              <motion.div
                key="tab-veracity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="p-3.5 rounded-xl bg-teal-50/80 border border-teal-200/90 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-teal-900 flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
                      Cryptographic Audit Seal
                    </span>
                    <span className="text-teal-700">100% Traceable</span>
                  </div>

                  <div className="space-y-1 text-xs text-slate-800">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Zero Hallucinations Fabricated</span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>All 6 Inbound Obligations Supported</span>
                    </div>
                  </div>

                  <div className="pt-1 font-mono text-[10px] text-slate-500 truncate">
                    Hash: sha256:7f8a92...e41d8b (Immutable Audit Trail)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-900 flex items-center justify-between">
                  <span>Human Authority Gate:</span>
                  <span className="font-bold text-amber-800">Solutions Architect Sign-off Pending</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Terminal Footer Telemetry */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Response Latency: 118ms</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-700 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Model: Gemini Flash-Lite • Grounded</span>
          </div>
        </div>
      </div>
    </div>
  );
};
