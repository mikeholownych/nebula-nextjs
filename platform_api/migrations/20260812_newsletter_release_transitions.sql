-- Enforce release status transitions at the database boundary.
CREATE OR REPLACE FUNCTION newsletter_release_transition_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status <> OLD.status AND NOT (
    (OLD.status = 'DRAFT' AND NEW.status IN ('VALIDATING','BLOCKED','CANCELLED')) OR
    (OLD.status = 'VALIDATING' AND NEW.status IN ('BLOCKED','APPROVED','CANCELLED')) OR
    (OLD.status = 'BLOCKED' AND NEW.status IN ('CANCELLED','VALIDATING')) OR
    (OLD.status = 'APPROVED' AND NEW.status = 'SENDING') OR
    (OLD.status = 'SENDING' AND NEW.status IN ('PARTIAL','SENT','FAILED','CANCELLED')) OR
    (OLD.status = 'PARTIAL' AND NEW.status IN ('SENDING','SENT','FAILED','CANCELLED')) OR
    (OLD.status = 'FAILED' AND NEW.status IN ('VALIDATING','CANCELLED'))
  ) THEN
    RAISE EXCEPTION 'invalid newsletter release transition: % -> %', OLD.status, NEW.status;
  END IF;
  IF NEW.status IN ('SENDING','PARTIAL','SENT') AND NEW.approved_at IS NULL THEN
    RAISE EXCEPTION 'newsletter release must be approved before sending';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS newsletter_release_transition_guard ON newsletter_release;
CREATE TRIGGER newsletter_release_transition_guard
BEFORE UPDATE OF status ON newsletter_release
FOR EACH ROW EXECUTE FUNCTION newsletter_release_transition_guard();
