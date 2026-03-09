import uuid
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_session
from models import Candidate, InterviewSession
from .orchestrator import InterviewOrchestrator

router = APIRouter(prefix="/api/interview", tags=["Interview"])

class StartInterviewRequest(BaseModel):
    candidate_id: str
    job_role: str = "Software Engineer"
    technical_first: bool = True

class AnswerRequest(BaseModel):
    session_id: str
    answer: str

def build_candidate_summary(candidate: Candidate) -> str:
    """Creates a brief text summary from the candidate's parsed resume constraints"""
    parsed = candidate.parsed_data or {}
    personal = parsed.get("personal", {})
    name = personal.get("name", "A candidate")
    
    summary = f"Name: {name}\n"
    if "skills" in parsed:
        summary += f"Skills: {', '.join(parsed['skills'])}\n"
    if "education" in parsed and len(parsed["education"]) > 0:
        edu = parsed["education"][0]
        summary += f"Education: {edu.get('degree', 'Unknown degree')} at {edu.get('institution', 'Unknown')}\n"
    if "experience" in parsed and len(parsed["experience"]) > 0:
        exp = parsed["experience"][0]
        summary += f"Experience: {exp.get('role', 'Role')} at {exp.get('company', 'Company')} ({exp.get('duration', 'Duration')})\n"
    
    # Can also append traits if onboarding is complete
    if candidate.traits:
        traits_dict = candidate.traits.traits
        # Get top 3 traits
        if traits_dict:
            top_traits = sorted(traits_dict.items(), key=lambda item: item[1], reverse=True)[:3]
            summary += f"Top Computed Traits: {', '.join([f'{k} ({v})' for k,v in top_traits])}\n"
            
    return summary


@router.post("/start")
async def start_interview(req: StartInterviewRequest, session: AsyncSession = Depends(get_session)):
    try:
        uid = uuid.UUID(req.candidate_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid format")

    result = await session.execute(
        select(Candidate)
        .where(Candidate.id == uid)
    )
    candidate = result.scalar_one_or_none()
    
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Force eager loading or direct queries for related fields if needed.
    # We will fetch traits separately because scalar_one_or_none() doesn't auto-join unless configured
    from models import CandidateTraits
    traits_res = await session.execute(select(CandidateTraits).where(CandidateTraits.candidate_id == uid))
    candidate.traits = traits_res.scalar_one_or_none()

    summary = build_candidate_summary(candidate)
    
    first_state = "TECH_1" if req.technical_first else "HR"
    
    # Initialize state
    orchestrator = InterviewOrchestrator(
        current_state=first_state,
        question_count=0,
        chat_history=[{"role": "user", "content": f"Hi, I am ready to begin the interview for the {req.job_role} role."}],
        candidate_summary=summary,
        job_role=req.job_role,
        technical_first=req.technical_first
    )
    
    # Trigger LLM for the opening question (no user message yet)
    opening_message = await orchestrator.process_answer(None)
    
    # Persist session
    new_session = InterviewSession(
        candidate_id=uid,
        job_role=req.job_role,
        technical_first=req.technical_first,
        current_state=orchestrator.current_state,
        question_count=orchestrator.question_count,
        chat_history=orchestrator.chat_history,
        completed=False
    )
    session.add(new_session)
    await session.commit()
    await session.refresh(new_session)
    
    return {
        "session_id": str(new_session.id),
        "message": opening_message,
        "current_round": new_session.current_state
    }

@router.post("/answer")
async def answer_interview(req: AnswerRequest, session: AsyncSession = Depends(get_session)):
    try:
        sid = uuid.UUID(req.session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid format")

    result = await session.execute(select(InterviewSession).where(InterviewSession.id == sid))
    int_session = result.scalar_one_or_none()
    
    if not int_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if int_session.completed or int_session.current_state == "END":
        raise HTTPException(status_code=400, detail="Interview completed")

    # Build summary again since Orchestrator is stateless
    # We need candidate parsed_data again
    cand_res = await session.execute(select(Candidate).where(Candidate.id == int_session.candidate_id))
    candidate = cand_res.scalar_one_or_none()
    
    from models import CandidateTraits
    traits_res = await session.execute(select(CandidateTraits).where(CandidateTraits.candidate_id == int_session.candidate_id))
    candidate.traits = traits_res.scalar_one_or_none()
    
    summary = build_candidate_summary(candidate)

    # Reconstruct orchestrator
    orchestrator = InterviewOrchestrator(
        current_state=int_session.current_state,
        question_count=int_session.question_count,
        chat_history=list(int_session.chat_history),
        candidate_summary=summary,
        job_role=int_session.job_role,
        technical_first=int_session.technical_first
    )
    
    # Process
    response = await orchestrator.process_answer(req.answer)
    
    message = response
    analyst_report = None
    is_complete = False
    
    # If the response was the analyst JSON dict
    if isinstance(response, dict):
        analyst_report = response
        is_complete = True
        message = "Interview completed and analyzed."
    elif orchestrator.current_state == "END":
        is_complete = True
        
    # Update DB row
    int_session.current_state = orchestrator.current_state
    int_session.question_count = orchestrator.question_count
    int_session.chat_history = orchestrator.chat_history
    if is_complete:
        int_session.completed = True
        int_session.analyst_report = analyst_report
        
    await session.commit()
    
    return {
        "message": message,
        "current_round": int_session.current_state,
        "question_number": int_session.question_count,
        "is_complete": is_complete,
        "analyst_report": analyst_report
    }

@router.get("/session/{session_id}")
async def get_session_details(session_id: str, session: AsyncSession = Depends(get_session)):
    try:
        sid = uuid.UUID(session_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid format")

    result = await session.execute(select(InterviewSession).where(InterviewSession.id == sid))
    int_session = result.scalar_one_or_none()
    
    if not int_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "id": str(int_session.id),
        "candidate_id": str(int_session.candidate_id),
        "started_at": int_session.started_at,
        "current_state": int_session.current_state,
        "question_count": int_session.question_count,
        "chat_history": int_session.chat_history,
        "analyst_report": int_session.analyst_report,
        "completed": int_session.completed
    }
