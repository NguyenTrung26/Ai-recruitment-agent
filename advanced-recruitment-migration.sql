-- ============================================================
-- MIGRATION SCRIPT: Advanced Recruitment Workflow Database
-- ============================================================

-- 1️⃣ EXTEND CANDIDATES TABLE
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS (
  duplicate_check BOOLEAN DEFAULT FALSE,
  manual_review_required BOOLEAN DEFAULT FALSE,
  interview_stage VARCHAR(50) DEFAULT 'pending',
  -- pending, technical_test, hr_interview, final_interview, rejected, interview_scheduled
  interview_date TIMESTAMP,
  interview_link TEXT,
  follow_up_sent_count INT DEFAULT 0,
  last_follow_up_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_candidates_status ON candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_phone ON candidates(phone_number);
CREATE INDEX IF NOT EXISTS idx_candidates_interview_stage ON candidates(interview_stage);
CREATE INDEX IF NOT EXISTS idx_candidates_created_at ON candidates(created_at);

-- 2️⃣ CREATE ANALYTICS TABLE
CREATE TABLE IF NOT EXISTS recruitment_analytics (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  total_applications INT DEFAULT 0,
  tier_1_passed INT DEFAULT 0,      -- score >= 70
  tier_2_review INT DEFAULT 0,       -- 40-70
  tier_3_rejected INT DEFAULT 0,     -- < 40
  average_score FLOAT DEFAULT 0,
  top_skill VARCHAR(100),
  conversion_rate FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_date ON recruitment_analytics(date);

-- 3️⃣ CREATE FOLLOW-UP QUEUE TABLE
CREATE TABLE IF NOT EXISTS follow_up_queue (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  follow_up_number INT DEFAULT 1,  -- 1st, 2nd, 3rd follow-up
  status VARCHAR(20) DEFAULT 'pending',  -- pending, sent, failed, skipped
  scheduled_date TIMESTAMP,
  actual_sent_date TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_up_candidate ON follow_up_queue(candidate_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_status ON follow_up_queue(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_scheduled ON follow_up_queue(scheduled_date);

-- 4️⃣ CREATE INTERVIEW SCHEDULE TABLE
CREATE TABLE IF NOT EXISTS interview_schedule (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  interview_type VARCHAR(50) NOT NULL,  -- technical_test, hr_interview, final_interview
  scheduled_date TIMESTAMP NOT NULL,
  interviewer_email VARCHAR(255),
  interview_link TEXT,
  meeting_id VARCHAR(255),  -- Google Meet ID
  status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, completed, no-show, rescheduled, cancelled
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interview_candidate ON interview_schedule(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_type ON interview_schedule(interview_type);
CREATE INDEX IF NOT EXISTS idx_interview_scheduled_date ON interview_schedule(scheduled_date);

-- 5️⃣ CREATE MANUAL REVIEW TABLE
CREATE TABLE IF NOT EXISTS manual_review (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  reviewer_email VARCHAR(255),
  decision VARCHAR(20),  -- approved, rejected, pending
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  UNIQUE(candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_review_candidate ON manual_review(candidate_id);
CREATE INDEX IF NOT EXISTS idx_review_decision ON manual_review(decision);

-- 6️⃣ CREATE SKILLS TRACKING TABLE
CREATE TABLE IF NOT EXISTS candidate_skills (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  skill_name VARCHAR(100),
  skill_category VARCHAR(50),  -- technical, soft-skill, language, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_candidate ON candidate_skills(candidate_id);
CREATE INDEX IF NOT EXISTS idx_skill_name ON candidate_skills(skill_name);

-- 7️⃣ CREATE AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS recruitment_audit_log (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  action VARCHAR(100),  -- created, scored, routed, notified, interviewed, etc.
  details JSONB,
  created_by VARCHAR(255) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_candidate ON recruitment_audit_log(candidate_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON recruitment_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON recruitment_audit_log(created_at);

-- ============================================================
-- VIEWS FOR ANALYTICS & REPORTING
-- ============================================================

-- View: Daily Recruitment Stats
CREATE OR REPLACE VIEW v_daily_recruitment_stats AS
SELECT 
  DATE(c.created_at) as application_date,
  COUNT(*) as total_applications,
  COUNT(CASE WHEN c.ai_score >= 70 THEN 1 END) as tier_1_count,
  COUNT(CASE WHEN c.ai_score >= 40 AND c.ai_score < 70 THEN 1 END) as tier_2_count,
  COUNT(CASE WHEN c.ai_score < 40 THEN 1 END) as tier_3_count,
  ROUND(AVG(c.ai_score), 2) as average_score,
  ROUND(COUNT(CASE WHEN c.ai_score >= 70 THEN 1 END)::numeric / COUNT(*) * 100, 2) as pass_rate
FROM candidates c
GROUP BY DATE(c.created_at)
ORDER BY application_date DESC;

-- View: Candidates Needing Follow-up
CREATE OR REPLACE VIEW v_candidates_pending_followup AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.created_at,
  c.follow_up_sent_count,
  c.last_follow_up_date,
  EXTRACT(DAY FROM NOW() - c.created_at) as days_since_apply
FROM candidates c
WHERE c.status = 'pending'
  AND (c.follow_up_sent_count IS NULL OR c.follow_up_sent_count < 3)
  AND (EXTRACT(DAY FROM NOW() - c.created_at) >= 7
       OR c.last_follow_up_date IS NULL)
ORDER BY c.created_at ASC;

-- View: Candidates Ready for Interview
CREATE OR REPLACE VIEW v_candidates_ready_interview AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.phone_number,
  c.ai_score,
  c.job_title,
  c.interview_stage,
  c.interview_date,
  c.interview_link
FROM candidates c
WHERE c.interview_stage = 'technical_test'
  AND c.status = 'tier_1_passed'
  AND c.interview_date IS NULL
ORDER BY c.ai_score DESC;

-- View: Manual Review Pending
CREATE OR REPLACE VIEW v_manual_review_pending AS
SELECT 
  c.id,
  c.full_name,
  c.email,
  c.ai_score,
  c.ai_analysis,
  c.created_at,
  mr.decision
FROM candidates c
LEFT JOIN manual_review mr ON c.id = mr.candidate_id
WHERE c.interview_stage = 'manual_review'
  AND c.status = 'tier_2_review'
  AND (mr.decision IS NULL OR mr.decision != 'pending')
ORDER BY c.created_at ASC;

-- View: Top Skills Performance
CREATE OR REPLACE VIEW v_top_skills_performance AS
SELECT 
  cs.skill_name,
  COUNT(DISTINCT cs.candidate_id) as candidate_count,
  ROUND(AVG(c.ai_score), 2) as avg_score,
  COUNT(CASE WHEN c.ai_score >= 70 THEN 1 END) as passed_candidates
FROM candidate_skills cs
JOIN candidates c ON cs.candidate_id = c.id
GROUP BY cs.skill_name
ORDER BY candidate_count DESC;

-- ============================================================
-- SAMPLE DATA & TESTING
-- ============================================================

-- Insert sample recruitment analytics
INSERT INTO recruitment_analytics (date, total_applications, tier_1_passed, tier_2_review, tier_3_rejected, average_score)
VALUES 
  (CURRENT_DATE, 5, 2, 2, 1, 62.4),
  (CURRENT_DATE - INTERVAL '1 day', 8, 3, 3, 2, 58.7),
  (CURRENT_DATE - INTERVAL '2 days', 6, 2, 2, 2, 60.5)
ON CONFLICT (date) DO UPDATE 
SET total_applications = EXCLUDED.total_applications,
    tier_1_passed = EXCLUDED.tier_1_passed,
    tier_2_review = EXCLUDED.tier_2_review,
    tier_3_rejected = EXCLUDED.tier_3_rejected,
    average_score = EXCLUDED.average_score;

-- ============================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ============================================================

-- Function: Auto-calculate Tier based on Score
CREATE OR REPLACE FUNCTION calculate_candidate_tier(score INT)
RETURNS VARCHAR AS $$
BEGIN
  IF score >= 70 THEN
    RETURN 'tier_1_passed';
  ELSIF score >= 40 AND score < 70 THEN
    RETURN 'tier_2_review';
  ELSE
    RETURN 'tier_3_rejected';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-calculate Interview Stage
CREATE OR REPLACE FUNCTION calculate_interview_stage(score INT)
RETURNS VARCHAR AS $$
BEGIN
  IF score >= 70 THEN
    RETURN 'technical_test';
  ELSIF score >= 40 AND score < 70 THEN
    RETURN 'manual_review';
  ELSE
    RETURN 'rejected';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: Check if candidate is duplicate
CREATE OR REPLACE FUNCTION check_duplicate_candidate(
  p_email VARCHAR,
  p_phone VARCHAR
)
RETURNS TABLE(is_duplicate BOOLEAN, existing_id INT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) > 0 as is_duplicate,
    MAX(id)::INT as existing_id
  FROM candidates
  WHERE (email = p_email OR phone_number = p_phone)
    AND created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function: Log audit action
CREATE OR REPLACE FUNCTION log_audit_action(
  p_candidate_id INT,
  p_action VARCHAR,
  p_details JSONB,
  p_created_by VARCHAR DEFAULT 'system'
)
RETURNS INT AS $$
DECLARE
  v_audit_id INT;
BEGIN
  INSERT INTO recruitment_audit_log (candidate_id, action, details, created_by)
  VALUES (p_candidate_id, p_action, p_details, p_created_by)
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update analytics daily
CREATE OR REPLACE FUNCTION update_daily_analytics()
RETURNS VOID AS $$
BEGIN
  INSERT INTO recruitment_analytics 
    (date, total_applications, tier_1_passed, tier_2_review, tier_3_rejected, average_score)
  SELECT 
    CURRENT_DATE,
    COUNT(*),
    COUNT(CASE WHEN ai_score >= 70 THEN 1 END),
    COUNT(CASE WHEN ai_score >= 40 AND ai_score < 70 THEN 1 END),
    COUNT(CASE WHEN ai_score < 40 THEN 1 END),
    ROUND(AVG(ai_score), 2)
  FROM candidates
  WHERE DATE(created_at) = CURRENT_DATE
  ON CONFLICT (date) DO UPDATE
  SET total_applications = EXCLUDED.total_applications,
      tier_1_passed = EXCLUDED.tier_1_passed,
      tier_2_review = EXCLUDED.tier_2_review,
      tier_3_rejected = EXCLUDED.tier_3_rejected,
      average_score = EXCLUDED.average_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger: Auto-update candidates.updated_at
CREATE OR REPLACE FUNCTION update_candidates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_candidates_updated_at
BEFORE UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION update_candidates_timestamp();

-- Trigger: Log candidate changes
CREATE OR REPLACE FUNCTION log_candidate_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_changes JSONB;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    v_changes = jsonb_build_object(
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_score', OLD.ai_score,
      'new_score', NEW.ai_score,
      'old_stage', OLD.interview_stage,
      'new_stage', NEW.interview_stage
    );
    
    PERFORM log_audit_action(NEW.id, 'updated', v_changes);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_log_candidate_changes
AFTER UPDATE ON candidates
FOR EACH ROW
EXECUTE FUNCTION log_candidate_changes();

-- ============================================================
-- GRANT PERMISSIONS (if using role-based access)
-- ============================================================

-- Assuming you have a role: recruitment_system
GRANT SELECT, INSERT, UPDATE ON candidates TO recruitment_system;
GRANT SELECT, INSERT ON recruitment_analytics TO recruitment_system;
GRANT SELECT, INSERT, UPDATE ON follow_up_queue TO recruitment_system;
GRANT SELECT, INSERT, UPDATE ON interview_schedule TO recruitment_system;
GRANT SELECT, INSERT, UPDATE ON manual_review TO recruitment_system;
GRANT SELECT, INSERT ON candidate_skills TO recruitment_system;
GRANT SELECT, INSERT ON recruitment_audit_log TO recruitment_system;

-- ============================================================
-- TEST QUERIES
-- ============================================================

-- Test: Get daily stats
-- SELECT * FROM v_daily_recruitment_stats LIMIT 5;

-- Test: Get pending follow-ups
-- SELECT * FROM v_candidates_pending_followup;

-- Test: Get ready for interview
-- SELECT * FROM v_candidates_ready_interview;

-- Test: Check duplicate
-- SELECT * FROM check_duplicate_candidate('john@example.com', '0123456789');

-- Test: View top skills
-- SELECT * FROM v_top_skills_performance LIMIT 10;

-- ============================================================
-- CLEANUP (if needed - use with caution!)
-- ============================================================

-- DROP TABLE IF EXISTS recruitment_audit_log;
-- DROP TABLE IF EXISTS candidate_skills;
-- DROP TABLE IF EXISTS manual_review;
-- DROP TABLE IF EXISTS interview_schedule;
-- DROP TABLE IF EXISTS follow_up_queue;
-- DROP TABLE IF EXISTS recruitment_analytics;
