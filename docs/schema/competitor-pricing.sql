/**
 * Competitor pricing schema
 */

CREATE TABLE IF NOT EXISTS competitor_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('monthly', 'yearly', 'annual')),
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  last_checked_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS competitor_price_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id uuid NOT NULL REFERENCES competitor_pricing(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2) NOT NULL,
  new_price DECIMAL(10, 2) NOT NULL,
  percent_change DECIMAL(10, 2) NOT NULL,
  change_date timestamp with time zone DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_competitor_pricing_name ON competitor_pricing(name);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_status ON competitor_pricing(status);
CREATE INDEX IF NOT EXISTS idx_competitor_pricing_last_checked_at ON competitor_pricing(last_checked_at);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_competitor_id ON competitor_price_changes(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_changes_change_date ON competitor_price_changes(change_date);
