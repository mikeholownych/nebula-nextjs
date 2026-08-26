-- target: audit
-- api_keys.scopes column
-- principal.py _load_api_key_principal() references this column for per-key
-- scope restriction. Without it every nbk_ request errors with
-- "column scopes does not exist". NULL = key inherits DEFAULT_API_KEY_SCOPES.

ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS scopes text[] NULL;
