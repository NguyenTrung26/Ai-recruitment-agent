-- =====================================================
-- AI Recruitment Agent - Schema Migration
-- Add new columns for enhanced features
-- =====================================================

-- Add new columns to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS cv_text TEXT,
ADD COLUMN IF NOT EXISTS cv_entities JSONB,
ADD COLUMN IF NOT EXISTS scores JSONB,
ADD COLUMN IF NOT EXISTS status_history JSONB[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Update status enum to include new statuses
ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;
ALTER TABLE candidates ADD CONSTRAINT candidates_status_check 
CHECK (status IN (
    'pending',
    'received',
    'processing',
    'processing-failed',
    'screening-passed',
    'screening-failed',
    'borderline',
    'interview-scheduled',
    'interviewed',
    'offer-sent',
    'hired',
    'rejected'
));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_candidates_cv_entities ON candidates USING GIN (cv_entities);
CREATE INDEX IF NOT EXISTS idx_candidates_scores ON candidates USING GIN (scores);

-- Add comment to explain new columns
COMMENT ON COLUMN candidates.cv_text IS 'Extracted text from CV (PDF/DOCX)';
COMMENT ON COLUMN candidates.cv_entities IS 'Extracted entities from CV (name, email, phone, skills, etc.)';
COMMENT ON COLUMN candidates.scores IS 'Detailed scoring breakdown (tech, experience, language, culture_fit)';
COMMENT ON COLUMN candidates.status_history IS 'Array of status change history with timestamps';

-- Sample status_history structure:
-- [
--   {
--     "status": "processing",
--     "timestamp": "2025-12-20T10:00:00Z",
--     "reason": "CV uploaded"
--   },
--   {
--     "status": "screening-passed",
--     "timestamp": "2025-12-20T10:05:00Z",
--     "reason": "AI analysis: score 85/100"
--   }
-- ]

-- Sample scores structure:
-- {
--   "overall": 85,
--   "tech": 90,
--   "experience": 80,
--   "language": 75,
--   "culture_fit": 85
-- }

-- Sample cv_entities structure:
-- {
--   "email": "john@example.com",
--   "phone": "+84123456789",
--   "skills": ["JavaScript", "React", "Node.js"],
--   "experience": ["5 years of experience"],
--   "education": ["Bachelor in Computer Science"],
--   "languages": ["English", "Vietnamese"]
-- }

-- =====================================================
-- Optional: Add configuration table for rule engine
-- =====================================================
CREATE TABLE IF NOT EXISTS scoring_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    min_tech_score_pass INTEGER DEFAULT 65,
    min_overall_score_pass INTEGER DEFAULT 70,
    min_tech_score_borderline INTEGER DEFAULT 50,
    min_overall_score_borderline INTEGER DEFAULT 50,
    max_missing_skills_borderline INTEGER DEFAULT 3,
    weights JSONB DEFAULT '{"tech": 0.4, "experience": 0.3, "language": 0.2, "culture": 0.1}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scoring_rules_job ON scoring_rules(job_id);

COMMENT ON TABLE scoring_rules IS 'Customizable scoring rules per job or global defaults';
COMMENT ON COLUMN scoring_rules.weights IS 'Scoring weights for different criteria';

-- =====================================================
-- Add webhook_logs table for tracking n8n callbacks
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    response JSONB,
    status TEXT CHECK (status IN ('success', 'failed', 'pending')),
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

COMMENT ON TABLE webhook_logs IS 'Audit log for all webhook calls to/from n8n';
