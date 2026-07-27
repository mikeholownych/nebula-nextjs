BEGIN;

LOCK TABLE audit_cohort IN ACCESS EXCLUSIVE MODE;

CREATE TABLE audit_cohort_aggregate_new (
    id bigserial PRIMARY KEY,
    audit_date date NOT NULL,
    source text NOT NULL DEFAULT 'live',
    industry_tag text NOT NULL DEFAULT 'unknown',
    score_bucket smallint NOT NULL CHECK (score_bucket BETWEEN 0 AND 100),
    grade text NOT NULL,
    sample_count integer NOT NULL CHECK (sample_count > 0),
    finding_count_sum integer NOT NULL DEFAULT 0,
    h1_pass_count integer NOT NULL DEFAULT 0,
    cta_pass_count integer NOT NULL DEFAULT 0,
    above_fold_pass_count integer NOT NULL DEFAULT 0,
    social_proof_pass_count integer NOT NULL DEFAULT 0,
    load_speed_pass_count integer NOT NULL DEFAULT 0,
    mobile_pass_count integer NOT NULL DEFAULT 0,
    seo_foundations_pass_count integer NOT NULL DEFAULT 0,
    ad_signals_pass_count integer NOT NULL DEFAULT 0,
    ai_readiness_pass_count integer NOT NULL DEFAULT 0,
    UNIQUE (audit_date, source, industry_tag, score_bucket, grade)
);

INSERT INTO audit_cohort_aggregate_new (
    audit_date,
    source,
    industry_tag,
    score_bucket,
    grade,
    sample_count,
    finding_count_sum,
    h1_pass_count,
    cta_pass_count,
    above_fold_pass_count,
    social_proof_pass_count,
    load_speed_pass_count,
    mobile_pass_count,
    seo_foundations_pass_count,
    ad_signals_pass_count,
    ai_readiness_pass_count
)
SELECT
    audit_date::date,
    COALESCE(source, 'unknown'),
    COALESCE(industry_tag, 'unknown'),
    GREATEST(0, LEAST(100, ROUND(score * 10)::integer)),
    grade,
    COUNT(*)::integer,
    SUM(COALESCE(finding_count, 0))::integer,
    SUM(CASE WHEN h1_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN cta_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN above_fold_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN social_proof_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN load_speed_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN mobile_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN seo_foundations_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN ad_signals_ok THEN 1 ELSE 0 END)::integer,
    SUM(CASE WHEN ai_readiness_ok THEN 1 ELSE 0 END)::integer
FROM audit_cohort
WHERE score IS NOT NULL AND grade IS NOT NULL
GROUP BY
    audit_date::date,
    COALESCE(source, 'unknown'),
    COALESCE(industry_tag, 'unknown'),
    GREATEST(0, LEAST(100, ROUND(score * 10)::integer)),
    grade;

DROP TABLE audit_cohort;
ALTER TABLE audit_cohort_aggregate_new RENAME TO audit_cohort;
ALTER SEQUENCE audit_cohort_aggregate_new_id_seq RENAME TO audit_cohort_id_seq;

CREATE INDEX idx_cohort_date ON audit_cohort (audit_date);
CREATE INDEX idx_cohort_score_bucket ON audit_cohort (score_bucket);
CREATE INDEX idx_cohort_industry ON audit_cohort (industry_tag);

COMMIT;
