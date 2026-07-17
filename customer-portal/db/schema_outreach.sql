-- Nebula Components - Lead & Outreach Schema
-- PostgreSQL 15+

-- Leads table (from RB2B webhook)
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  name VARCHAR(255),
  company VARCHAR(255),
  linkedin_url VARCHAR(500),
  first_visit TIMESTAMPTZ,
  last_visit TIMESTAMPTZ,
  visit_count INTEGER DEFAULT 1,
  page_views JSONB DEFAULT '[]',
  utm_source VARCHAR(100),
  utm_campaign VARCHAR(255),
  utm_medium VARCHAR(100),
  score INTEGER DEFAULT 0,
  triggers JSONB DEFAULT '[]',
  icp_match BOOLEAN DEFAULT FALSE,
  outreach_priority VARCHAR(20) DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email queue
CREATE TABLE IF NOT EXISTS email_queue (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  to_email VARCHAR(255) NOT NULL,
  to_name VARCHAR(255),
  company VARCHAR(255),
  sequence_type VARCHAR(50) DEFAULT 'icp_trigger',
  email_number INTEGER NOT NULL,
  subject TEXT,
  body TEXT,
  status VARCHAR(20) DEFAULT 'queued', -- queued, sent, delivered, opened, replied, failed
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach sequences (templates)
CREATE TABLE IF NOT EXISTS outreach_sequences (
  id SERIAL PRIMARY KEY,
  sequence_type VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  total_emails INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_icp_match ON leads(icp_match);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(score DESC);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON email_queue(scheduled_for);

-- Insert default sequence
INSERT INTO outreach_sequences (sequence_type, name, description, total_emails)
VALUES ('icp_trigger', 'ICP Trigger Sequence', '5-email sequence for high-intent ICP matches', 5)
ON CONFLICT (sequence_type) DO NOTHING;

-- Function to queue email sequence
CREATE OR REPLACE FUNCTION queue_outreach_sequence(
  p_lead_id INTEGER,
  p_to_email VARCHAR,
  p_to_name VARCHAR DEFAULT NULL,
  p_company VARCHAR DEFAULT NULL
) RETURNS void AS $$
DECLARE
  seq outreach_sequences%ROWTYPE;
  email_num INTEGER;
  delay_hours INTEGER[];
BEGIN
  -- Get sequence
  SELECT * INTO seq FROM outreach_sequences WHERE sequence_type = 'icp_trigger' AND is_active = TRUE LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active sequence found';
  END IF;

  -- Delay pattern: E1 immediate, E2 +24h, E3 +72h, E4 +120h, E5 +168h
  delay_hours := ARRAY[0, 24, 72, 120, 168];

  FOR email_num IN 1..seq.total_emails LOOP
    INSERT INTO email_queue (
      lead_id,
      to_email,
      to_name,
      company,
      sequence_type,
      email_number,
      scheduled_for
    ) VALUES (
      p_lead_id,
      p_to_email,
      p_to_name,
      p_company,
      seq.sequence_type,
      email_num,
      NOW() + (delay_hours[email_num] || ' hours')::INTERVAL
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
