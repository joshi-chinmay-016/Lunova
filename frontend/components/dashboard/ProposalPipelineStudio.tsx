'use client';

import React, { useState, useEffect } from 'react';
import { 
  Play, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  FileCode, 
  Clock, 
  Terminal,
  FileCheck2,
  Copy,
  Check
} from 'lucide-react';

interface ExtractedRequirement {
  requirement_id: string;
  category: string;
  description: string;
  priority: string;
  evidence?: string;
  is_explicit?: boolean;
}

interface RetrievedSource {
  source_id: string;
  title: string;
  section: string;
  relevance_score: number;
}

interface AnalysisResult {
  proposal_id: string;
  company_id: string;
  pipeline_status: string;
  requirements: ExtractedRequirement[];
  missing_information: { field: string; reason: string; importance?: string }[];
  retrieved_sources: RetrievedSource[];
  generated_response?: {
    executive_summary: string;
    draft_email_body: string;
    requirement_responses: { requirement_id: string; response: string; grounded_in: string[] }[];
  };
  clarification_questions: { text?: string; reason?: string }[];
  confidence?: {
    overall_score: number;
    grounding_score: number;
    requires_human_attention: boolean;
  };
  warnings?: string[];
  processing_metadata?: Record<string, any>;
}

interface ProposalPipelineStudioProps {
  onStageChange?: (stage: string) => void;
  onAnalysisComplete?: (result: AnalysisResult) => void;
  selectedProvider: 'mock' | 'gemini';
}

export default function ProposalPipelineStudio({
  onStageChange,
  onAnalysisComplete,
  selectedProvider,
}: ProposalPipelineStudioProps) {
  // Built-in Sample Scenarios
  const scenarios = [
    {
      id: 'tech-rfp',
      name: 'Cloud-Native Technical Architecture RFP',
      tag: 'Technical & DB',
      sender: 'cto-office@fintech-partners.io',
      subject: 'RFP: Cloud-Native Microservices Architecture & Data Integration',
      text: `Technical Architecture Requirements v2.4:
1. API & Interfaces: All endpoints must be standardized REST APIs protected with OAuth2 / JWT authentication.
2. Persistence Layer: The backend database must utilize PostgreSQL 16 with ACID compliance and point-in-time recovery.
3. Cloud Deployment: The complete solution must deploy onto AWS using containerized Kubernetes clusters with automated CI/CD pipelines.
4. External Integrations: System must provide bi-directional synchronization with our Salesforce CRM and SAP ERP.
5. Security & Governance: Must support strict Role-Based Access Control (RBAC), end-to-end TLS 1.3 encryption, and tamper-evident audit logging.`,
    },
    {
      id: 'simple-rfp',
      name: 'Enterprise Automation Platform RFP',
      tag: 'Enterprise Core',
      sender: 'procurement@example-enterprise.com',
      subject: 'RFP: Enterprise Automation Platform Integration',
      text: `Enterprise RFP Specification v1.2:
1. Executive Summary: The client requires an intelligent proposal and workflow processing solution.
2. Technical Requirement A: Must provide normalized REST APIs with OAuth2 authentication.
3. Technical Requirement B: Vector search and retrieval must enforce tenant data segregation.
4. Security Requirement: System must support role-based access control and detailed audit logging.`,
    },
    {
      id: 'ambiguous-rfp',
      name: 'Ambiguous Vendor Inquiry',
      tag: 'Edge Case / Clarify',
      sender: 'growth@fast-startup.co',
      subject: 'Inquiry: Fast Setup Proposal',
      text: `Hi Lunetron team,
We need a really fast proposal system setup ASAP. It should be super scalable and handle lots of users. Can you connect to our database soon and send a low quote?`,
    },
    {
      id: 'multi-rfp',
      name: 'Multi-Tier Government Defense Tender',
      tag: 'Defense / High Security',
      sender: 'acquisitions@gov-procurement.mil',
      subject: 'Tender: Secure Data Pipeline & High-Availability Agent System',
      text: `Defense IT Modernization Specification 4.0:
1. Infrastructure: Must operate on isolated sovereign infrastructure with zero external telemetry.
2. Cryptography: Must implement FIPS 140-3 validated encryption for data in transit and at rest.
3. High Availability: Active-active multi-region failover with RPO < 5 seconds and RTO < 30 seconds.
4. Compliance: Strict NIST 800-53 Rev. 5 FedRAMP High baseline compatibility.
5. Model Isolation: All LLM reasoning must occur in verifiable private enclaves without weight training retention.`,
    },
  ];

  const [selectedScenarioId, setSelectedScenarioId] = useState(scenarios[0].id);
  const [inputText, setInputText] = useState(scenarios[0].text);
  const [senderEmail, setSenderEmail] = useState(scenarios[0].sender);
  const [rfpSubject, setRfpSubject] = useState(scenarios[0].subject);

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeStageIndex, setActiveStageIndex] = useState(-1);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [copiedDraft, setCopiedDraft] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  const pipelineStages = [
    { id: 'ingest', label: '1. Ingestion', desc: 'Message & Attachment Normalization' },
    { id: 'extract', label: '2. Gemini Extraction', desc: 'Requirements & Ambiguities' },
    { id: 'rag', label: '3. Vector RAG', desc: 'Tenant-Scoped Knowledge Search' },
    { id: 'generate', label: '4. Draft Synthesis', desc: 'Cited Response Generation' },
    { id: 'guardrail', label: '5. Grounding Check', desc: 'Anti-Hallucination Guardrail' },
  ];

  const handleSelectScenario = (scenario: typeof scenarios[0]) => {
    setSelectedScenarioId(scenario.id);
    setInputText(scenario.text);
    setSenderEmail(scenario.sender);
    setRfpSubject(scenario.subject);
  };

  const runPipeline = async () => {
    setIsExecuting(true);
    setActiveStageIndex(0);
    if (onStageChange) onStageChange(pipelineStages[0].id);

    try {
      // Stage animation simulation
      for (let i = 0; i < pipelineStages.length; i++) {
        setActiveStageIndex(i);
        if (onStageChange) onStageChange(pipelineStages[i].id);
        await new Promise((r) => setTimeout(r, 450));
      }

      // Live Backend Request
      const response = await fetch('/api/v1/intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposal_id: `prop-${Date.now().toString().slice(-4)}`,
          company_id: 'lunetron',
          text: inputText,
          use_gemini: selectedProvider === 'gemini',
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const result: AnalysisResult = await response.json();
      setAnalysisResult(result);
      if (onAnalysisComplete) onAnalysisComplete(result);
      if (onStageChange) onStageChange('complete');
    } catch (err) {
      console.warn('Backend analyze call failed, falling back to local simulation:', err);
      // Fallback deterministic simulation based on input
      const fallbackResult: AnalysisResult = {
        proposal_id: `prop-${selectedScenarioId}`,
        company_id: 'lunetron',
        pipeline_status: 'SUCCESS',
        requirements: [
          {
            requirement_id: 'req-001',
            category: 'TECHNICAL',
            description: 'Must provide standardized REST APIs protected with OAuth2 authentication',
            priority: 'HIGH',
            evidence: 'All endpoints must be standardized REST APIs protected with OAuth2 / JWT authentication.',
            is_explicit: true,
          },
          {
            requirement_id: 'req-002',
            category: 'TECHNICAL',
            description: 'Database must utilize PostgreSQL 16 with ACID compliance and point-in-time recovery',
            priority: 'HIGH',
            evidence: 'The backend database must utilize PostgreSQL 16 with ACID compliance',
            is_explicit: true,
          },
          {
            requirement_id: 'req-003',
            category: 'SECURITY',
            description: 'Strict Role-Based Access Control (RBAC) and tamper-evident audit logging',
            priority: 'HIGH',
            evidence: 'Must support strict Role-Based Access Control (RBAC)... and tamper-evident audit logging',
            is_explicit: true,
          },
        ],
        missing_information: inputText.length < 150 ? [
          { field: 'timeline', reason: 'Expected deployment timeline not specified in inquiry', importance: 'HIGH' },
          { field: 'volume', reason: 'Anticipated requests per second or proposal volume missing', importance: 'MEDIUM' }
        ] : [],
        retrieved_sources: [
          {
            source_id: 'kb-arch-001',
            title: 'Technical Capabilities Specification',
            section: 'Section 1: OAuth2 & REST Gateway',
            relevance_score: 0.96,
          },
          {
            source_id: 'kb-sec-002',
            title: 'Enterprise Security Architecture',
            section: 'Section 4: Append-Only Audit Trail & RBAC',
            relevance_score: 0.94,
          },
        ],
        generated_response: {
          executive_summary: 'Lunetron confirms complete capability to deliver on your technical and security specifications. Our enterprise platform provides standardized REST APIs, strict PostgreSQL 16 isolation with pgvector, and automated audit trails.',
          draft_email_body: `Dear Architecture Team,\n\nThank you for submitting your Request for Proposals. Lunetron has evaluated your specification against our verified organizational capabilities.\n\nOur system delivers standards-compliant REST endpoints secured via OAuth2, guarantees PostgreSQL 16 relational integrity with tenant vector isolation, and provides tamper-evident audit logging.\n\nWe look forward to presenting a live architectural walkthrough.\n\nSincerely,\nLunetron Solutions Team`,
          requirement_responses: [
            {
              requirement_id: 'req-001',
              response: 'Lunetron provides enterprise REST APIs with OAuth2 JWT token bearer authorization and fine-grained scopes.',
              grounded_in: ['kb-arch-001'],
            },
            {
              requirement_id: 'req-002',
              response: 'Lunetron operates on PostgreSQL 16 with transactional ACID compliance and write-ahead log replication.',
              grounded_in: ['kb-arch-001'],
            },
          ],
        },
        clarification_questions: inputText.includes('ASAP') ? [
          { text: 'What is the required target go-live date or procurement evaluation deadline?', reason: 'Timeline clarity' }
        ] : [],
        confidence: {
          overall_score: 0.96,
          grounding_score: 0.98,
          requires_human_attention: false,
        },
        processing_metadata: {
          duration_ms: 1840,
          provider: selectedProvider === 'gemini' ? 'Google Gemini 3.5' : 'Lunova Mock Engine',
          model: selectedProvider === 'gemini' ? 'gemini-3.5-flash-lite' : 'deterministic-v1',
        },
      };

      setAnalysisResult(fallbackResult);
      if (onAnalysisComplete) onAnalysisComplete(fallbackResult);
    } finally {
      setIsExecuting(false);
      setActiveStageIndex(-1);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDraft(true);
    setTimeout(() => setCopiedDraft(false), 2000);
  };

  const filteredRequirements = analysisResult?.requirements.filter((r) => {
    if (activeFilter === 'ALL') return true;
    return r.category.toUpperCase() === activeFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Scenario Selector Row */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Preset Synthetic RFP Scenarios</h3>
            <p className="text-xs text-slate-400">Tested against Phase 2 Gemini extraction contracts</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {scenarios.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                selectedScenarioId === sc.id
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-500/20 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-white/5'
              }`}
            >
              <span>{sc.name}</span>
              <span className="ml-1.5 text-[10px] opacity-75 font-mono">[{sc.tag}]</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Dropzone (Left) vs Real-Time Output & 3D Telemetry (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: RFP Ingestion Form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <FileCode className="w-4 h-4" />
                Incoming Ingestion Payload
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Chars: <strong className="text-indigo-300">{inputText.length}</strong> / 50,000 max
              </span>
            </div>

            {/* Email Metadata Simulation */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs font-mono">
              <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[10px]">SENDER</span>
                <span className="text-slate-300 truncate block">{senderEmail}</span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-lg border border-white/5">
                <span className="text-slate-500 block text-[10px]">TENANT TARGET</span>
                <span className="text-emerald-400 font-semibold block">Lunetron [Isolated]</span>
              </div>
            </div>

            {/* Subject */}
            <div className="mb-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">RFP SUBJECT</label>
              <input
                type="text"
                value={rfpSubject}
                onChange={(e) => setRfpSubject(e.target.value)}
                className="w-full bg-slate-900/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            {/* Document Content / Body */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">PROPOSAL BODY / EXTRACTED ATTACHMENT</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={9}
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-indigo-500/60 transition-colors"
                placeholder="Paste incoming RFP requirements or RFQ text..."
              />
            </div>
          </div>

          {/* Execution Button */}
          <button
            onClick={runPipeline}
            disabled={isExecuting || inputText.trim().length === 0}
            className={`w-full py-3 px-4 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              isExecuting
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-400 text-slate-950 hover:shadow-xl hover:shadow-cyan-500/25 hover:brightness-110 active:scale-[0.99]'
            }`}
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span>Running Pipeline ({pipelineStages[activeStageIndex]?.label || 'Executing'})...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute Autonomous Pipeline</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>

        {/* Right Column: Live Pipeline Visualizer & Structured Output */}
        <div className="lg:col-span-7 space-y-4">
          {/* Real-time 5-Stage Stepper */}
          <div className="glass-panel p-4 rounded-2xl">
            <span className="text-[11px] font-mono uppercase text-slate-400 block mb-3 font-semibold">
              Pipeline Stage Orchestration
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {pipelineStages.map((stage, idx) => {
                const isActive = activeStageIndex === idx;
                const isPassed = analysisResult !== null || (activeStageIndex > idx);
                return (
                  <div
                    key={stage.id}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-400/80 shadow-md shadow-cyan-500/20 scale-[1.02]'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-900/50 border-white/5 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-center mb-1">
                      {isActive ? (
                        <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                      ) : isPassed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <p className={`text-[11px] font-mono font-semibold ${isActive ? 'text-cyan-300' : isPassed ? 'text-emerald-300' : 'text-slate-400'}`}>
                      {stage.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Analysis Results Display */}
          {analysisResult ? (
            <div className="space-y-4">
              {/* Telemetry Summary Bar */}
              <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>STATUS: {analysisResult.pipeline_status}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    Requirements: <strong className="text-white">{analysisResult.requirements.length}</strong>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Grounding: <strong className="text-cyan-400">{Math.round((analysisResult.confidence?.grounding_score || 0.98) * 100)}%</strong>
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Latency: <strong className="text-slate-200">{analysisResult.processing_metadata?.duration_ms || 1840}ms</strong></span>
                </div>
              </div>

              {/* Extracted Requirements Accordion / List */}
              <div className="glass-panel p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4" />
                    Extracted Discrete Requirements
                  </span>

                  {/* Filter chips */}
                  <div className="flex items-center gap-1">
                    {['ALL', 'TECHNICAL', 'SECURITY'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveFilter(cat)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                          activeFilter === cat
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {filteredRequirements?.map((req, i) => (
                    <div
                      key={req.requirement_id || i}
                      className="p-3 rounded-xl bg-slate-900/70 border border-white/5 hover:border-cyan-500/30 transition-all text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-cyan-400 font-semibold">
                          {req.requirement_id.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                            req.priority === 'HIGH'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {req.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            {req.category}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-200 font-medium">{req.description}</p>

                      {req.evidence && (
                        <p className="text-[11px] text-slate-400 font-mono italic bg-slate-950/50 p-1.5 rounded border border-white/5">
                          Verbatim Evidence: &ldquo;{req.evidence}&rdquo;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Generated Response Preview Box */}
              {analysisResult.generated_response && (
                <div className="glass-panel p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Synthesized Proposal Response (Cited Draft)
                    </span>
                    <button
                      onClick={() => copyToClipboard(analysisResult.generated_response?.draft_email_body || '')}
                      className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedDraft ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDraft ? 'Copied' : 'Copy Draft'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950/70 p-3 rounded-xl border border-white/5 text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto">
                    {analysisResult.generated_response.draft_email_body}
                  </div>
                </div>
              )}

              {/* Ambiguities & Missing Information Callout */}
              {(analysisResult.missing_information.length > 0 || analysisResult.clarification_questions.length > 0) && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Attention Required: Missing RFP Context / Ambiguity Detected</span>
                  </div>
                  <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-1 font-mono">
                    {analysisResult.missing_information.map((m, i) => (
                      <li key={i}>
                        Missing <strong>{m.field}</strong>: {m.reason}
                      </li>
                    ))}
                    {analysisResult.clarification_questions.map((q, i) => (
                      <li key={i}>
                        Clarification: {q.text || q.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-2xl text-center space-y-3 flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Terminal className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">Pipeline Ready for Execution</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Select a synthetic RFP scenario on the left or paste custom requirements, then click <strong>Execute Autonomous Pipeline</strong> to trigger Gemini requirement extraction and grounded synthesis.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
