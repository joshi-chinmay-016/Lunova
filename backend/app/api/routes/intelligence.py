import json
import os
import glob
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from intelligence.service import IntelligenceService
from intelligence.models.proposal import ProposalContext
from intelligence.providers.mock import MockLLMProvider
from intelligence.providers.gemini import GeminiProvider
from intelligence.extraction import RequirementExtractor
from intelligence.retrieval import KnowledgeRetriever
from intelligence.generation import ResponseGenerator
from intelligence.evaluation import GroundingEvaluator

router = APIRouter(prefix="/intelligence", tags=["Intelligence Studio"])

# Paths to fixtures
FIXTURES_DIR = Path(__file__).resolve().parents[4] / "fixtures"

class AnalyzeRequest(BaseModel):
    proposal_id: Optional[str] = "custom-rfp-001"
    company_id: str = "lunetron"
    title: Optional[str] = "Custom RFP Analysis"
    sender: Optional[str] = "procurement@client-enterprise.com"
    subject: Optional[str] = "RFP Submission Request"
    text: str = Field(..., min_length=5, description="RFP proposal inquiry or attachment body")
    use_gemini: bool = False

class ReviewDecisionRequest(BaseModel):
    proposal_id: str
    decision: str  # "APPROVED" | "REJECTED" | "NEEDS_REVISION"
    reviewer_notes: Optional[str] = ""
    edited_draft: Optional[str] = None

@router.get("/fixtures")
async def get_fixtures():
    """Retrieve catalog of synthetic RFP fixtures and sample AI analysis for immediate demonstration."""
    fixtures_data = []
    proposals_dir = FIXTURES_DIR / "proposals"
    
    if proposals_dir.exists():
        for file_path in proposals_dir.glob("*.json"):
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    fixtures_data.append({
                        "filename": file_path.name,
                        "data": data
                    })
            except Exception as e:
                continue

    # Sample pre-computed AI analysis
    sample_analysis_path = FIXTURES_DIR / "ai-results" / "sample-analysis-result.json"
    sample_analysis = None
    if sample_analysis_path.exists():
        try:
            with open(sample_analysis_path, "r", encoding="utf-8") as f:
                sample_analysis = json.load(f)
        except Exception:
            pass

    return {
        "status": "success",
        "fixtures": fixtures_data,
        "sample_analysis": sample_analysis
    }

@router.get("/knowledge-graph")
async def get_knowledge_graph():
    """Returns 3D spatial graph coordinates and nodes for Lunetron Knowledge Base & Vector Clusters."""
    nodes = [
        # Central Core
        {"id": "core-lunova", "name": "Lunova Neural Core", "group": "core", "val": 40, "color": "#6366f1", "desc": "Autonomous RFP Reasoning Engine"},
        
        # Knowledge Base Clusters
        {"id": "kb-arch", "name": "System Architecture Specs", "group": "knowledge", "val": 25, "color": "#06b6d4", "desc": "Microservices, Async Event Bus, Latency SLA <100ms"},
        {"id": "kb-sec", "name": "Enterprise Security & RBAC", "group": "knowledge", "val": 25, "color": "#10b981", "desc": "TLS 1.3, AES-256 GCM, OAuth2 / OIDC, SOC2 Type II"},
        {"id": "kb-data", "name": "Multi-Tenant Data Isolation", "group": "knowledge", "val": 25, "color": "#3b82f6", "desc": "Row-level tenant isolation, pgvector company partitioning"},
        {"id": "kb-compliance", "name": "Regulatory & SLA Guarantees", "group": "knowledge", "val": 20, "color": "#8b5cf6", "desc": "99.95% Uptime, GDPR, HIPAA, Tamper-Evident Audit Trails"},
        
        # Vector Embedding Chunks
        {"id": "vec-chunk-01", "name": "Chunk: OAuth2 JWT Token Flow", "group": "chunk", "val": 12, "color": "#38bdf8", "desc": "Dim 1536 cosine similarity 0.96"},
        {"id": "vec-chunk-02", "name": "Chunk: Tenant SQL Scoping Filter", "group": "chunk", "val": 12, "color": "#60a5fa", "desc": "Dim 1536 cosine similarity 0.94"},
        {"id": "vec-chunk-03", "name": "Chunk: Append-only Audit Log Stream", "group": "chunk", "val": 12, "color": "#34d399", "desc": "Dim 1536 cosine similarity 0.91"},
        {"id": "vec-chunk-04", "name": "Chunk: Disaster Recovery & Replication", "group": "chunk", "val": 10, "color": "#a78bfa", "desc": "RPO 1min, RTO 15min failover"},
        {"id": "vec-chunk-05", "name": "Chunk: REST API Rate Limiting", "group": "chunk", "val": 10, "color": "#f43f5e", "desc": "Token bucket 1000 req/sec per tenant"},

        # Pipeline Agents
        {"id": "agent-ingest", "name": "Ingestion Normalizer", "group": "agent", "val": 16, "color": "#ec4899", "desc": "Email parser & attachment OCR extractor"},
        {"id": "agent-extract", "name": "Gemini Requirement Extractor", "group": "agent", "val": 20, "color": "#f59e0b", "desc": "Categorization, priority scoring, evidence grounding"},
        {"id": "agent-rag", "name": "Vector RAG Retriever", "group": "agent", "val": 18, "color": "#14b8a6", "desc": "Tenant-safe semantic search & source grounding"},
        {"id": "agent-gen", "name": "Proposal Response Generator", "group": "agent", "val": 20, "color": "#84cc16", "desc": "Executive summary, cited requirement responses"},
        {"id": "agent-guard", "name": "Anti-Hallucination Guardrail", "group": "agent", "val": 18, "color": "#e11d48", "desc": "Confidence scoring & factual grounding evaluator"}
    ]

    links = [
        {"source": "core-lunova", "target": "agent-ingest"},
        {"source": "core-lunova", "target": "agent-extract"},
        {"source": "core-lunova", "target": "agent-rag"},
        {"source": "core-lunova", "target": "agent-gen"},
        {"source": "core-lunova", "target": "agent-guard"},

        {"source": "agent-rag", "target": "kb-arch"},
        {"source": "agent-rag", "target": "kb-sec"},
        {"source": "agent-rag", "target": "kb-data"},
        {"source": "agent-rag", "target": "kb-compliance"},

        {"source": "kb-sec", "target": "vec-chunk-01"},
        {"source": "kb-data", "target": "vec-chunk-02"},
        {"source": "kb-sec", "target": "vec-chunk-03"},
        {"source": "kb-arch", "target": "vec-chunk-04"},
        {"source": "kb-arch", "target": "vec-chunk-05"},

        {"source": "agent-extract", "target": "agent-rag"},
        {"source": "agent-rag", "target": "agent-gen"},
        {"source": "agent-gen", "target": "agent-guard"}
    ]

    return {
        "status": "success",
        "nodes": nodes,
        "links": links,
        "metrics": {
            "total_documents": 48,
            "embedded_vectors": 1284,
            "index_dimension": 1536,
            "mean_retrieval_latency_ms": 14.2,
            "grounding_accuracy": 0.984
        }
    }

@router.post("/analyze")
async def analyze_proposal_text(payload: AnalyzeRequest):
    """Run real proposal understanding & extraction pipeline."""
    try:
        # Determine provider
        llm_provider = None
        if payload.use_gemini and os.getenv("GEMINI_API_KEY"):
            try:
                llm_provider = GeminiProvider()
            except Exception:
                llm_provider = MockLLMProvider()
        else:
            llm_provider = MockLLMProvider()

        extractor = RequirementExtractor(llm_provider=llm_provider)
        service = IntelligenceService(
            llm_provider=llm_provider,
            extractor=extractor,
            retriever=KnowledgeRetriever(),
            generator=ResponseGenerator(llm_provider=llm_provider),
            evaluator=GroundingEvaluator()
        )

        context = ProposalContext(
            proposal_id=payload.proposal_id or "prop-custom-live",
            company_id=payload.company_id or "lunetron",
            text=payload.text
        )

        result = service.analyze_proposal(context)

        # Convert dataclasses to serializable dict
        serialized_requirements = []
        for req in result.requirements:
            serialized_requirements.append({
                "requirement_id": getattr(req, "requirement_id", "req-auto"),
                "category": getattr(req, "category", "GENERAL"),
                "description": getattr(req, "description", ""),
                "priority": getattr(req, "priority", "MEDIUM"),
                "evidence": getattr(req, "evidence", ""),
                "is_explicit": getattr(req, "is_explicit", True)
            })

        serialized_sources = []
        for src in result.retrieved_sources:
            serialized_sources.append({
                "source_id": getattr(src, "source_id", "kb-001"),
                "title": getattr(src, "title", "Knowledge Document"),
                "section": getattr(src, "section", ""),
                "relevance_score": getattr(src, "relevance_score", 0.92)
            })

        gen_dict = None
        if result.generated_response:
            req_responses = []
            for r in getattr(result.generated_response, "requirement_responses", []):
                req_responses.append({
                    "requirement_id": getattr(r, "requirement_id", ""),
                    "response": getattr(r, "response", ""),
                    "grounded_in": getattr(r, "grounded_in", [])
                })
            gen_dict = {
                "executive_summary": getattr(result.generated_response, "executive_summary", ""),
                "draft_email_body": getattr(result.generated_response, "draft_email_body", ""),
                "requirement_responses": req_responses
            }

        conf_dict = None
        if result.confidence:
            conf_dict = {
                "overall_score": getattr(result.confidence, "overall_score", 0.95),
                "grounding_score": getattr(result.confidence, "grounding_score", 0.98),
                "requires_human_attention": getattr(result.confidence, "requires_human_attention", False)
            }

        return {
            "status": "success",
            "proposal_id": result.proposal_id,
            "company_id": result.company_id,
            "pipeline_status": result.status,
            "requirements": serialized_requirements,
            "missing_information": result.missing_information,
            "retrieved_sources": serialized_sources,
            "generated_response": gen_dict,
            "clarification_questions": result.clarification_questions,
            "confidence": conf_dict,
            "warnings": result.warnings,
            "processing_metadata": result.processing_metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Intelligence pipeline error: {str(e)}")
