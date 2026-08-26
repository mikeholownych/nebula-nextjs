-- target: platform
-- One published or draft brand profile per agency organization.
CREATE TABLE IF NOT EXISTS brand_profiles (
    id               uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id  uuid        NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    display_name     text        NOT NULL,
    logo_url         text,
    logo_dark_url    text,
    primary_color    text        NOT NULL DEFAULT '#c7ff2f',
    support_email    text,
    footer_text      text,
    published        boolean     NOT NULL DEFAULT false,
    created_at       timestamptz NOT NULL DEFAULT now(),
    updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_brand_profiles_published
    ON brand_profiles (organization_id) WHERE published = true;
