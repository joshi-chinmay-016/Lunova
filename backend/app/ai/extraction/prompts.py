EXTRACTION_PROMPT_TEMPLATE = """
You are an expert proposal manager. Your task is to extract structural requirements from the following proposal request or email.

Instructions:
1. Extract ONLY information supported by the input text. Do not invent details.
2. Distinguish explicit requirements from inferred information.
3. Identify and list important constraints (budget, timeline, location, compliance, etc.).
4. Identify any missing information or assumptions made.
5. Return the extracted data in strict JSON format matching the requested structure.

Request Content:
{content}

Additional metadata:
{metadata}

Respond strictly with a JSON object matching this schema:
{{
    "summary": "High-level summary",
    "requested_services": ["Service 1", ...],
    "deliverables": ["Deliverable 1", ...],
    "technical_requirements": ["Tech req 1", ...],
    "business_requirements": ["Biz req 1", ...],
    "constraints": ["Constraint 1", ...],
    "timeline": "Timeline if any",
    "budget": "Budget if any",
    "assumptions_questions": ["Assumption 1", ...],
    "confidence": 0.95
}}
"""
