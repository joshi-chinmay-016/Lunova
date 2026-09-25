'use client';

import React, { useEffect, useState } from 'react';
import { 
  Database, 
  Layers, 
  Search, 
  Upload, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Cpu, 
  Hash, 
  Zap,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface KnowledgeNode {
  id: string;
  name: string;
  group: string;
  val: number;
  color: string;
  desc: string;
}

interface GraphMetrics {
  total_documents: number;
  embedded_vectors: number;
  index_dimension: number;
  mean_retrieval_latency_ms: number;
  grounding_accuracy: number;
}

export default function KnowledgeGalaxyViewer() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [metrics, setMetrics] = useState<GraphMetrics>({
    total_documents: 48,
    embedded_vectors: 1284,
    index_dimension: 1536,
    mean_retrieval_latency_ms: 14.2,
    grounding_accuracy: 0.984,
  });
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [simulatedUpload, setSimulatedUpload] = useState(false);

  useEffect(() => {
    fetch('/api/v1/intelligence/knowledge-graph')
      .then((res) => res.json())
      .then((data) => {
        if (data.nodes) setNodes(data.nodes);
        if (data.metrics) setMetrics(data.metrics);
        if (data.nodes && data.nodes.length > 1) {
          setSelectedNode(data.nodes[1]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load knowledge-graph, using default fallback:', err);
        const fallbackNodes: KnowledgeNode[] = [
          { id: 'kb-arch', name: 'System Architecture Specs', group: 'knowledge', val: 25, color: '#06b6d4', desc: 'Microservices, Async Event Bus, Latency SLA <100ms' },
          { id: 'kb-sec', name: 'Enterprise Security & RBAC', group: 'knowledge', val: 25, color: '#10b981', desc: 'TLS 1.3, AES-256 GCM, OAuth2 / OIDC, SOC2 Type II' },
          { id: 'kb-data', name: 'Multi-Tenant Data Isolation', group: 'knowledge', val: 25, color: '#3b82f6', desc: 'Row-level tenant isolation, pgvector company partitioning' },
          { id: 'kb-compliance', name: 'Regulatory & SLA Guarantees', group: 'knowledge', val: 20, color: '#8b5cf6', desc: '99.95% Uptime, GDPR, HIPAA, Tamper-Evident Audit Trails' },
          { id: 'vec-chunk-01', name: 'Chunk: OAuth2 JWT Token Flow', group: 'chunk', val: 12, color: '#38bdf8', desc: 'Dim 1536 cosine similarity 0.96' },
          { id: 'vec-chunk-02', name: 'Chunk: Tenant SQL Scoping Filter', group: 'chunk', val: 12, color: '#60a5fa', desc: 'Dim 1536 cosine similarity 0.94' },
          { id: 'vec-chunk-03', name: 'Chunk: Append-only Audit Log Stream', group: 'chunk', val: 12, color: '#34d399', desc: 'Dim 1536 cosine similarity 0.91' },
        ];
        setNodes(fallbackNodes);
        setSelectedNode(fallbackNodes[0]);
      });
  }, []);

  const filteredNodes = nodes.filter((n) =>
    n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSimulateUpload = () => {
    setSimulatedUpload(true);
    setTimeout(() => {
      setSimulatedUpload(false);
      setMetrics((prev) => ({
        ...prev,
        total_documents: prev.total_documents + 1,
        embedded_vectors: prev.embedded_vectors + 24,
      }));
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Telemetry Header */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">TOTAL DOCS</span>
            <span className="text-lg font-bold font-mono text-white">{metrics.total_documents}</span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Hash className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">EMBEDDED VECTORS</span>
            <span className="text-lg font-bold font-mono text-white">{metrics.embedded_vectors}</span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">VECTOR DIMENSION</span>
            <span className="text-lg font-bold font-mono text-white">{metrics.index_dimension}</span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">RETRIEVAL LATENCY</span>
            <span className="text-lg font-bold font-mono text-white">{metrics.mean_retrieval_latency_ms}ms</span>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">GROUNDING ACCURACY</span>
            <span className="text-lg font-bold font-mono text-white">{Math.round(metrics.grounding_accuracy * 1000) / 10}%</span>
          </div>
        </div>
      </div>

      {/* Main Vector Galaxy Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cluster List & Semantic Search */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                Tenant Knowledge Clusters & Embeddings
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-[10px] font-mono text-indigo-300">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>WHERE company_id = &apos;lunetron&apos;</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search knowledge documents or vector chunks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          {/* Node Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-400/80 shadow-lg shadow-cyan-500/10 scale-[1.01]'
                      : 'bg-slate-900/50 border-white/5 hover:border-white/20 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: node.color }}
                      />
                      <span className="text-xs font-bold text-white truncate max-w-[150px]">
                        {node.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                      {node.group}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {node.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Cluster Metadata & Phase 3 Upload Preview */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Node Deep-Dive Card */}
          {selectedNode && (
            <div className="glass-panel p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-semibold">
                  Vector Node Telemetry
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Cosine Sim: 0.954
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedNode.color }} />
                  {selectedNode.name}
                </h4>
                <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-white/5">
                  {selectedNode.desc}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5">
                  <span className="text-slate-500 text-[10px] block">TENANT SCOPE</span>
                  <span className="text-cyan-300 font-semibold">lunetron</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/70 border border-white/5">
                  <span className="text-slate-500 text-[10px] block">STORAGE FORMAT</span>
                  <span className="text-indigo-300 font-semibold">pgvector (HNSW)</span>
                </div>
              </div>
            </div>
          )}

          {/* Phase 3 Ingestion Preview Box */}
          <div className="glass-panel p-5 rounded-2xl space-y-3 border-dashed border-indigo-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-indigo-300 font-semibold flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-cyan-400" />
                Phase 3: Knowledge Ingestion Dropzone
              </span>
              <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Future Feature
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Direct upload for technical specs, security whitepapers, and RFQ response templates with automatic chunking and Gemini embeddings.
            </p>

            <div
              onClick={handleSimulateUpload}
              className={`p-6 rounded-xl border border-dashed text-center cursor-pointer transition-all ${
                simulatedUpload
                  ? 'bg-cyan-500/10 border-cyan-400 animate-pulse'
                  : 'bg-slate-900/50 border-white/10 hover:border-cyan-400/50 hover:bg-slate-900/80'
              }`}
            >
              {simulatedUpload ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-mono text-cyan-300">Chunking & Vectorizing Document (1536-dim)...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">
                    Click to simulate ingest of <strong>Lunetron_Architecture_v2.pdf</strong>
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Supports PDF, DOCX, Markdown, Text</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
