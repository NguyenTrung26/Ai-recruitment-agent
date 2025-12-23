-- =====================================================
-- AI Recruitment Agent - Supabase Database Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: jobs
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT NOT NULL,
    location TEXT NOT NULL,
    employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
    description TEXT NOT NULL,
    requirements TEXT NOT NULL,
    salary_range TEXT,
    experience_level TEXT NOT NULL CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
    skills_required TEXT[] NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_department ON jobs(department);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- =====================================================
-- Table: candidates
-- =====================================================
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    cv_url TEXT NOT NULL,
    status TEXT DEFAULT 'received' CHECK (status IN (
        'received',
        'processing',
        'screening-passed',
        'screening-failed',
        'interview-scheduled',
        'interviewed',
        'offer-sent',
        'hired',
        'rejected'
    )),
    ai_score INTEGER CHECK (ai_score >= 0 AND ai_score <= 100),
    ai_analysis JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX idx_candidates_status ON candidates(status);
CREATE INDEX idx_candidates_job_id ON candidates(job_id);
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_candidates_created_at ON candidates(created_at DESC);
CREATE INDEX idx_candidates_ai_score ON candidates(ai_score DESC);

-- =====================================================
-- Table: interview_schedules (Optional - for future)
-- =====================================================
CREATE TABLE IF NOT EXISTS interview_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    interview_date TIMESTAMPTZ NOT NULL,
    interview_type TEXT DEFAULT 'technical' CHECK (interview_type IN ('phone-screen', 'technical', 'behavioral', 'final')),
    interviewer_name TEXT,
    interviewer_email TEXT,
    meeting_link TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_interview_candidate ON interview_schedules(candidate_id);
CREATE INDEX idx_interview_date ON interview_schedules(interview_date);

-- =====================================================
-- Table: activity_logs (Optional - for audit trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    performed_by TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_candidate ON activity_logs(candidate_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- =====================================================
-- Functions: Update timestamp automatically
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to jobs table
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to candidates table
CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to interview_schedules table
CREATE TRIGGER update_interview_schedules_updated_at
    BEFORE UPDATE ON interview_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Function: Log candidate status changes
-- =====================================================
CREATE OR REPLACE FUNCTION log_candidate_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO activity_logs (candidate_id, action, description, metadata)
        VALUES (
            NEW.id,
            'status_changed',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'ai_score', NEW.ai_score
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_candidate_status
    AFTER UPDATE ON candidates
    FOR EACH ROW
    EXECUTE FUNCTION log_candidate_status_change();

-- =====================================================
-- Storage Bucket for CVs
-- =====================================================
-- Run this in Supabase Storage UI or via SQL:
-- 1. Create bucket named 'cvs'
-- 2. Make it public (or configure RLS policies)

-- If using SQL API:
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public read
CREATE POLICY "Public Access to CVs"
ON storage.objects FOR SELECT
USING (bucket_id = 'cvs');

-- Storage policy: Allow authenticated uploads
CREATE POLICY "Authenticated users can upload CVs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cvs');

-- =====================================================
-- Row Level Security (RLS) - Optional
-- =====================================================
-- Enable RLS on tables (uncomment if needed)
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Example policy: Allow all operations for service role
-- CREATE POLICY "Service role full access - jobs"
-- ON jobs FOR ALL
-- USING (true);

-- CREATE POLICY "Service role full access - candidates"
-- ON candidates FOR ALL
-- USING (true);

-- =====================================================
-- Sample Data (for testing)
-- =====================================================
-- Insert sample jobs
INSERT INTO jobs (title, department, location, employment_type, description, requirements, experience_level, skills_required, status)
VALUES
    (
        'Backend Developer',
        'Engineering',
        'Remote',
        'full-time',
        'We are looking for an experienced Backend Developer to join our team. You will be responsible for building scalable APIs and microservices.',
        '- 3+ years experience with Node.js\n- Strong knowledge of PostgreSQL\n- Experience with Docker and Kubernetes\n- Understanding of REST API design\n- Familiar with CI/CD pipelines',
        'mid',
        ARRAY['Node.js', 'PostgreSQL', 'Docker', 'Kubernetes', 'REST API'],
        'open'
    ),
    (
        'Frontend Developer',
        'Engineering',
        'Hybrid - Ho Chi Minh City',
        'full-time',
        'Join our frontend team to build beautiful and responsive user interfaces using modern frameworks.',
        '- 2+ years experience with React or Vue.js\n- Strong HTML, CSS, JavaScript skills\n- Experience with responsive design\n- Familiar with Git and Agile workflows',
        'mid',
        ARRAY['React', 'Vue.js', 'TypeScript', 'CSS', 'HTML'],
        'open'
    ),
    (
        'Data Analyst',
        'Data Science',
        'On-site - Ha Noi',
        'full-time',
        'We need a Data Analyst to help us make data-driven decisions. You will work with large datasets and create insightful reports.',
        '- 1+ year experience in data analysis\n- Proficient in SQL and Python\n- Experience with data visualization tools (Tableau, Power BI)\n- Strong analytical and problem-solving skills',
        'entry',
        ARRAY['SQL', 'Python', 'Tableau', 'Excel', 'Statistics'],
        'open'
    );

-- =====================================================
-- Useful Views
-- =====================================================

-- View: Recent applications with job info
CREATE OR REPLACE VIEW recent_applications AS
SELECT 
    c.id,
    c.full_name,
    c.email,
    c.status,
    c.ai_score,
    c.created_at,
    j.title as job_title,
    j.department
FROM candidates c
LEFT JOIN jobs j ON c.job_id = j.id
ORDER BY c.created_at DESC
LIMIT 50;

-- View: Job statistics
CREATE OR REPLACE VIEW job_statistics AS
SELECT 
    j.id,
    j.title,
    j.status,
    COUNT(c.id) as total_candidates,
    COUNT(c.id) FILTER (WHERE c.ai_score IS NOT NULL) as screened_candidates,
    COUNT(c.id) FILTER (WHERE c.status = 'screening-passed') as passed_candidates,
    ROUND(AVG(c.ai_score), 2) as avg_score
FROM jobs j
LEFT JOIN candidates c ON j.id = c.job_id
GROUP BY j.id, j.title, j.status;

-- =====================================================
-- Completion Message
-- =====================================================
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Tables: jobs, candidates, interview_schedules, activity_logs';
    RAISE NOTICE '🪣 Storage bucket: cvs (for CV files)';
    RAISE NOTICE '🔍 Views: recent_applications, job_statistics';
    RAISE NOTICE '🎉 Ready to use!';
END $$;
