/**
 * Lead scoring schema
 */

CREATE TABLE IF NOT EXISTS leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  score INTEGER NOT NULL DEFAULT 0,
  grade TEXT CHECK (grade IN ('A', 'B', 'C', 'D', 'F')),
  factors jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW(),
  last_scored_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_url ON leads(url);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score);
CREATE INDEX IF NOT EXISTS idx_leads_grade ON leads(grade);
CREATE INDEX IF NOT EXISTS idx_leads_last_scored_at ON leads(last_scored_at);
