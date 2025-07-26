-- Research Analyzer Database Schema
-- Run this in your Supabase SQL Editor

-- Create the research_analyses table if it doesn't exist
CREATE TABLE IF NOT EXISTS research_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Paper Information
    paper_title TEXT,
    paper_authors TEXT,
    paper_journal TEXT,
    paper_year INTEGER,
    
    -- Research Content
    research_text TEXT,
    analysis_summary TEXT,
    
    -- Analysis Data (JSON)
    outcomes_data JSONB,
    
    -- Metadata
    quality_score DECIMAL(3,1),
    policy_connections INTEGER DEFAULT 0
);

-- Create an index on created_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_research_analyses_created_at ON research_analyses(created_at DESC);

-- Create an index on paper_title for faster searching
CREATE INDEX IF NOT EXISTS idx_research_analyses_title ON research_analyses(paper_title);

-- Create an index on paper_authors for faster searching
CREATE INDEX IF NOT EXISTS idx_research_analyses_authors ON research_analyses(paper_authors);

-- Enable Row Level Security (RLS)
ALTER TABLE research_analyses ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (you can restrict this later)
CREATE POLICY "Allow all operations on research_analyses" ON research_analyses
    FOR ALL USING (true);

-- Insert a sample record for testing
INSERT INTO research_analyses (
    paper_title,
    paper_authors,
    paper_journal,
    paper_year,
    research_text,
    analysis_summary,
    outcomes_data,
    quality_score,
    policy_connections
) VALUES (
    'Mental Health Outcomes in Transgender and Nonbinary Youths Receiving Gender-Affirming Care',
    'Diana M. Tordoff, Jonathon W. Wanta, Arin Collin, et al.',
    'JAMA Network Open',
    2022,
    'Participants receiving gender-affirming care had 60% lower odds of moderate or severe depression (adjusted odds ratio [aOR], 0.40; 95% CI, 0.17-0.95; P = .04) and 73% lower odds of suicidality (aOR, 0.27; 95% CI, 0.11-0.65; P = .004) compared with those who did not receive care.',
    'Depression: POSITIVE effect, Suicidality: POSITIVE effect',
    '{
        "outcomes": [
            {
                "outcome_name": "Depression",
                "effect_direction": "POSITIVE",
                "effect_size": 0.40,
                "effect_size_type": "ODDS_RATIO",
                "confidence_interval_lower": 0.17,
                "confidence_interval_upper": 0.95,
                "p_value": 0.04,
                "statistical_significance": true,
                "measurement_instrument": "PHQ-9",
                "raw_finding": "60% lower odds of moderate or severe depression (aOR, 0.40; 95% CI, 0.17-0.95; P = .04)"
            },
            {
                "outcome_name": "Suicidality",
                "effect_direction": "POSITIVE",
                "effect_size": 0.27,
                "effect_size_type": "ODDS_RATIO",
                "confidence_interval_lower": 0.11,
                "confidence_interval_upper": 0.65,
                "p_value": 0.004,
                "statistical_significance": true,
                "measurement_instrument": "Self-report",
                "raw_finding": "73% lower odds of suicidality (aOR, 0.27; 95% CI, 0.11-0.65; P = .004)"
            }
        ],
        "study_quality": {
            "estimated_sample_size": 104,
            "study_design": "COHORT",
            "quality_score_estimate": 8.5
        }
    }',
    8.5,
    3
) ON CONFLICT DO NOTHING;