ALTER TABLE org_domains ADD COLUMN IF NOT EXISTS verification_token text;
ALTER TABLE org_domains ADD COLUMN IF NOT EXISTS cf_hostname_id text;

ALTER TABLE org_domains DROP CONSTRAINT IF EXISTS org_domains_status_check;
ALTER TABLE org_domains ADD CONSTRAINT org_domains_status_check
    CHECK (status IN ('active', 'revoked', 'excluded', 'pending_verification'));

ALTER TABLE org_domains DROP CONSTRAINT IF EXISTS org_domains_verified_by_check;
ALTER TABLE org_domains ADD CONSTRAINT org_domains_verified_by_check
    CHECK (verified_by IN ('manual', 'dns_txt', 'managed'));
