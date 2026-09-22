from uuid import uuid4
from app.ai.contracts.requirements import RequirementExtractionInput
from app.ai.contracts.retrieval import RetrievalInput

def test_requirement_extraction_input_validation():
    # Valid input
    company_id = uuid4()
    req = RequirementExtractionInput(
        company_id=company_id,
        content="We need a proposal for XYZ."
    )
    assert req.company_id == company_id
    assert req.content == "We need a proposal for XYZ."
    assert req.subject is None

def test_retrieval_input_validation():
    company_id = uuid4()
    req = RetrievalInput(
        company_id=company_id,
        query="What is our SLA?",
        top_k=5
    )
    assert req.company_id == company_id
    assert req.query == "What is our SLA?"
    assert req.top_k == 5
