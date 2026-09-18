#!/usr/bin/env python
"""Smoke test script for real Gemini-powered proposal requirement extraction.

Safely exercises the live GeminiProvider against a synthetic proposal fixture.
Never logs or displays the API key. Exits 0 on success, non-zero on failure.
"""

import json
import os
from pathlib import Path
import sys

# Ensure backend directory is in sys.path
repo_root = Path(__file__).resolve().parents[1]
backend_dir = repo_root / "backend"
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Optional dotenv loading if python-dotenv is installed
try:
    from dotenv import load_dotenv

    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "backend" / ".env")
except ImportError:
    pass


from intelligence import ProposalContext, RequirementExtractor
from intelligence.exceptions import IntelligenceError
from intelligence.providers.gemini import GeminiProvider


def run_smoke_test() -> int:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        print("[SKIP] GEMINI_API_KEY environment variable is not set.")
        print("To run live smoke test: set GEMINI_API_KEY=<your-key> in .env or shell.")
        return 0

    model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")


    print("=" * 60)
    print("  LUNOVA PHASE 2 — GEMINI EXTRACTION SMOKE TEST")
    print("=" * 60)
    print(f"Provider : Google Gemini")
    print(f"Model    : {model_name}")
    print(f"API Key  : [CONFIGURED - REDACTED]")

    fixture_path = repo_root / "fixtures" / "proposals" / "simple_rfp.json"
    if not fixture_path.exists():
        print(f"[ERROR] Fixture not found at {fixture_path}")
        return 1

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    context = ProposalContext(
        proposal_id=data["proposal_id"],
        company_id=data["company"]["company_id"],
        subject=data["email"]["subject"],
        body=data["email"]["body"],
        attachments_text=[att.get("extracted_content", "") for att in data.get("attachments", [])],
    )

    print(f"\nProcessing Proposal: {context.proposal_id} ({context.subject})...")

    try:
        provider = GeminiProvider(api_key=api_key, model_name=model_name)
        extractor = RequirementExtractor(llm_provider=provider)
        result = extractor.extract(context)

        print("\n--- EXTRACTION RESULTS (SAFE TELEMETRY) ---")
        print(f"Proposal ID             : {result.proposal_id}")
        print(f"Requirements Extracted  : {len(result.requirements)}")
        print(f"Missing Information Items: {len(result.missing_information)}")
        print(f"Ambiguities Identified  : {len(result.ambiguities)}")

        print("\nExtracted Requirements:")
        for req in result.requirements:
            print(f"  • [{req.requirement_id}] ({req.category.upper()} | {req.priority.upper()}) {req.text}")
            if req.evidence:
                print(f"    Evidence: \"{req.evidence}\"")

        if result.missing_information:
            print("\nIdentified Missing Information:")
            for m in result.missing_information:
                print(f"  • [{m.importance.upper()}] {m.field}: {m.reason}")

        if result.ambiguities:
            print("\nIdentified Ambiguities:")
            for a in result.ambiguities:
                print(f"  • \"{a.text}\" -> {a.reason}")

        print("\n[SUCCESS] Live Gemini requirement extraction completed cleanly.")
        return 0

    except IntelligenceError as err:
        print(f"\n[FAILURE] Intelligence extraction error: {err}")
        return 1
    except Exception as exc:
        print(f"\n[FAILURE] Unexpected error during extraction: {exc}")
        return 1


if __name__ == "__main__":
    sys.exit(run_smoke_test())
