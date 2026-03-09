-- Pixelmind Onboarding — PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP DEFAULT NOW(),
  raw_resume_path TEXT,
  parsed_data JSONB,
  onboarding_complete BOOLEAN DEFAULT FALSE
);

CREATE TABLE onboarding_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  answers JSONB,
  traits JSONB,
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE candidate_traits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  traits JSONB,
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  current_state TEXT DEFAULT 'TECH_1',
  question_count INTEGER DEFAULT 0,
  chat_history JSONB DEFAULT '[]',
  analyst_report JSONB,
  completed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX idx_onboarding_candidate_id ON onboarding_answers(candidate_id);
CREATE INDEX idx_traits_candidate_id ON candidate_traits(candidate_id);
