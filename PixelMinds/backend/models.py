"""
SQLAlchemy ORM models for candidates, onboarding_answers, and candidate_traits.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    raw_resume_path = Column(Text, nullable=True)
    parsed_data = Column(JSONB, nullable=True)
    onboarding_complete = Column(Boolean, default=False)

    onboarding_answers = relationship("OnboardingAnswer", back_populates="candidate", cascade="all, delete-orphan")
    traits = relationship("CandidateTraits", back_populates="candidate", cascade="all, delete-orphan")


class OnboardingAnswer(Base):
    __tablename__ = "onboarding_answers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    answers = Column(JSONB, nullable=True)
    traits = Column(JSONB, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="onboarding_answers")


class CandidateTraits(Base):
    __tablename__ = "candidate_traits"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    traits = Column(JSONB, nullable=True)
    calculated_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="traits")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_role = Column(String, default="Software Engineer")
    technical_first = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    current_state = Column(String, default="TECH_1")
    question_count = Column(Integer, default=0)
    chat_history = Column(JSONB, default=[])
    analyst_report = Column(JSONB, nullable=True)
    completed = Column(Boolean, default=False)

    candidate = relationship("Candidate", back_populates="interview_sessions")

Candidate.traits = relationship("CandidateTraits", back_populates="candidate", uselist=False)
Candidate.interview_sessions = relationship("InterviewSession", back_populates="candidate")
