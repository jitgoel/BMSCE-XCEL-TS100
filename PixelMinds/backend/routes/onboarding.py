"""
Onboarding routes — submit questionnaire answers, compute traits, store in PostgreSQL + Neo4j.
"""

import uuid
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models import Candidate, OnboardingAnswer, CandidateTraits
from neo4j_client import store_candidate_traits

router = APIRouter()

# ─── Trait Mapping (from Onboarding Questions PDF) ──────────────

TRAIT_MAPPING = {
    "q1": {
        "A": {"LearningAgility": 0.8, "ResearchEfficiency": 0.9},
        "B": {"LearningAgility": 0.7, "AnalyticalDecisionMaking": 0.5},
        "C": {"LearningAgility": 0.6},
        "D": {"CollaborationStyle": 0.7},
    },
    "q2": {
        "A": {"IncidentManagement": 0.7},
        "B": {"DebuggingDepth": 0.9},
        "C": {"SystemSustainability": 0.6},
        "D": {"DebuggingDepth": 0.7},
    },
    "q3": {
        "A": {"TechnicalDebtStrategy": 0.4},
        "B": {"SystemSustainability": 0.8},
        "C": {"TechnicalDebtStrategy": 0.7},
        "D": {"SystemSustainability": 0.7},
    },
    "q4": {
        "A": {"SelfAwareness": 0.7},
        "B": {"Adaptability": 0.8},
        "C": {"ResearchEfficiency": 0.7},
        "D": {"SelfAwareness": 0.4},
    },
    "q5": {
        "A": {"CodeQualityFocus": 0.8},
        "B": {"SystemSustainability": 0.8},
        "C": {"TradeoffReasoning": 0.7},
        "D": {"SecurityAwareness": 0.9},
    },
    "q6": {
        "A": {"StakeholderCommunication": 0.3},
        "B": {"TradeoffReasoning": 0.9},
        "C": {"ArchitectureThinking": 0.6},
        "D": {"StakeholderCommunication": 0.6},
    },
    "q7": {
        "A": {"ArchitectureThinking": 0.5},
        "B": {"ArchitectureThinking": 0.8},
        "C": {"ArchitectureThinking": 0.6},
        "D": {"ArchitectureThinking": 0.9},
    },
    "q8": {
        "A": {"Accountability": 0.9},
        "B": {"Ownership": 0.6},
        "C": {"CommunicationTransparency": 0.2},
        "D": {"Accountability": 0.3},
    },
    "q9": {
        "A": {"CareerOrientation": 0.4},
        "B": {"CareerOrientation": 0.6},
        "C": {"LeadershipMaturity": 0.6},
        "D": {"LeadershipMaturity": 0.9},
    },
    "q10": {
        "A": {"Ownership": 0.9},
        "B": {"SecurityResponsibility": 0.7},
        "C": {"Ownership": 0.7},
        "D": {"Ownership": 0.1},
    },
    "q11": {
        "A": {"Integrity": 0.1},
        "B": {"ComplianceAwareness": 0.8},
        "C": {"Integrity": 0.9},
        "D": {"Integrity": 1.0},
    },
    "q12": {
        "A": {"AnalyticalDecisionMaking": 0.8},
        "B": {"CollaborationStyle": 0.6},
        "C": {"AnalyticalDecisionMaking": 0.9},
        "D": {"CollaborationStyle": 0.4},
    },
    "q13": {
        "A": {"UXEmpathy": 0.2},
        "B": {"InclusiveDesign": 0.7},
        "C": {"InclusiveDesign": 0.8},
        "D": {"InclusiveDesign": 1.0},
    },
    "q14": {
        "A": {"ProcessMaturity": 0.6},
        "B": {"ProcessMaturity": 0.9},
        "C": {"LeadershipMaturity": 0.6},
        "D": {"Resilience": 0.7},
    },
    "q15": {
        "A": {"LeadershipMaturity": 0.3},
        "B": {"ArchitectureThinking": 0.7},
        "C": {"Ownership": 0.8},
        "D": {"LeadershipMaturity": 0.9},
    },
}


from typing import Dict, List, Union

def compute_trait_scores(answers: dict) -> dict:
    """
    Compute normalized trait scores from MCQ answers.
    Handles multiple selected options per question.
    """
    trait_scores = defaultdict(float)
    trait_counts = defaultdict(int)

    for qid, options in answers.items():
        if qid not in TRAIT_MAPPING:
            continue
            
        # Ensure options is a list (for backward compatibility if needed)
        if isinstance(options, str):
            options = [options]
            
        for option in options:
            option_traits = TRAIT_MAPPING[qid].get(option, {})
            for trait, weight in option_traits.items():
                trait_scores[trait] += weight
                trait_counts[trait] += 1

    # Normalize: average score per trait
    normalized = {}
    for trait in trait_scores:
        normalized[trait] = round(trait_scores[trait] / trait_counts[trait], 4)

    return normalized


class OnboardingSubmission(BaseModel):
    candidate_id: str
    answers: Dict[str, Union[List[str], str]]  # e.g. {"q1": ["A", "C"], "q2": ["B"]}


@router.post("/submit")
async def submit_onboarding(
    submission: OnboardingSubmission,
    session: AsyncSession = Depends(get_session),
):
    """
    Save onboarding answers, calculate traits, store in PostgreSQL + Neo4j,
    and mark onboarding as complete.
    """
    # Validate candidate_id
    try:
        uid = uuid.UUID(submission.candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid candidate ID format")

    # Check candidate exists
    result = await session.execute(select(Candidate).where(Candidate.id == uid))
    candidate = result.scalar_one_or_none()

    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Compute trait scores
    traits = compute_trait_scores(submission.answers)

    # Store answers + traits in onboarding_answers
    onboarding = OnboardingAnswer(
        candidate_id=uid,
        answers=submission.answers,
        traits=traits,
    )
    session.add(onboarding)

    # Store traits in candidate_traits table
    candidate_trait = CandidateTraits(
        candidate_id=uid,
        traits=traits,
    )
    session.add(candidate_trait)

    # Mark onboarding complete
    await session.execute(
        update(Candidate).where(Candidate.id == uid).values(onboarding_complete=True)
    )

    await session.commit()
    await session.refresh(onboarding)

    # Store in Neo4j graph (non-blocking, non-critical)
    try:
        parsed = candidate.parsed_data or {}
        personal = parsed.get("personal", {})
        store_candidate_traits(
            candidate_id=str(uid),
            traits=traits,
            name=personal.get("name", ""),
            email=personal.get("email", ""),
        )
    except Exception as e:
        print(f"[onboarding] Neo4j storage failed: {e}")

    return {
        "success": True,
        "message": "Onboarding completed successfully",
        "onboarding_id": str(onboarding.id),
        "candidate_id": str(uid),
        "traits": traits,
    }
