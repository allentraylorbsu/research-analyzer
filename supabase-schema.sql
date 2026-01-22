-- Physician Workforce Research Analyzer Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)

-- Policies table
CREATE TABLE IF NOT EXISTS policies (
  id SERIAL PRIMARY KEY,
  policy_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  jurisdiction TEXT NOT NULL,
  policy_type TEXT,
  status TEXT,
  effective_date TIMESTAMPTZ,
  source_url TEXT,
  bill_number TEXT,
  session TEXT,
  estimated_population_affected INTEGER,
  project TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Research Papers table
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  first_author TEXT,
  all_authors TEXT[],
  journal TEXT,
  publication_year INTEGER,
  abstract TEXT,
  research_text TEXT,
  categories TEXT[],
  project TEXT,
  pmid TEXT,
  doi TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add PubMed fields to existing tables (run if updating existing database)
ALTER TABLE research_papers ADD COLUMN IF NOT EXISTS pmid TEXT;
ALTER TABLE research_papers ADD COLUMN IF NOT EXISTS doi TEXT;
ALTER TABLE research_papers ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create index for PMID lookups
CREATE INDEX IF NOT EXISTS idx_research_papers_pmid ON research_papers(pmid);

-- Policy-Research Connections table
CREATE TABLE IF NOT EXISTS policy_research_connections (
  id SERIAL PRIMARY KEY,
  connection_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES policies(policy_id) ON DELETE CASCADE,
  paper_id UUID REFERENCES research_papers(id) ON DELETE CASCADE,
  state_jurisdiction TEXT,
  connection_type TEXT,
  strength_score INTEGER CHECK (strength_score >= 1 AND strength_score <= 10),
  evidence_quality INTEGER CHECK (evidence_quality >= 1 AND evidence_quality <= 10),
  workforce_relevance INTEGER CHECK (workforce_relevance >= 1 AND workforce_relevance <= 10),
  rationale TEXT,
  outcome_affected TEXT,
  project TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- State Baseline Workforce Data table
CREATE TABLE IF NOT EXISTS state_baseline_workforce (
  id SERIAL PRIMARY KEY,
  state_name TEXT UNIQUE NOT NULL,
  baseline_workforce_score NUMERIC,
  physician_density NUMERIC,
  nurse_ratio NUMERIC,
  rural_access_score NUMERIC,
  specialty_distribution JSONB
);

-- Enable Row Level Security (RLS) - allows all operations with anon key
ALTER TABLE policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_research_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_baseline_workforce ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development)
CREATE POLICY "Allow all operations on policies" ON policies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on research_papers" ON research_papers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on policy_research_connections" ON policy_research_connections FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on state_baseline_workforce" ON state_baseline_workforce FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_policies_jurisdiction ON policies(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_policies_project ON policies(project);
CREATE INDEX IF NOT EXISTS idx_research_papers_project ON research_papers(project);
CREATE INDEX IF NOT EXISTS idx_connections_policy ON policy_research_connections(policy_id);
CREATE INDEX IF NOT EXISTS idx_connections_paper ON policy_research_connections(paper_id);
CREATE INDEX IF NOT EXISTS idx_connections_state ON policy_research_connections(state_jurisdiction);
