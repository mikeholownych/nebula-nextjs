-- AgentMail webhook event types documented at https://www.agentmail.to/docs/events.
ALTER TABLE newsletter_event DROP CONSTRAINT IF EXISTS newsletter_event_event_type_check;
ALTER TABLE newsletter_event ADD CONSTRAINT newsletter_event_event_type_check
  CHECK (event_type IN ('SENT','DELIVERY','HARD_BOUNCE','SOFT_BOUNCE','COMPLAINT','REJECTED','UNSUBSCRIBE'));