# SMTP Bypass Warning

## Critical Warning
**⛔ AgentMail SMTP returns `550 5.7.1 Access denied` for all cold sends** — even when `server.login()` succeeds with `235 Authentication successful`. The rejection happens on `sendmail()`, not login. This is server-side policy, not a credential problem.

## **⚠️ Worse: failed SMTP `sendmail()` attempts permanently suppress the recipient in AgentMail.** Subsequent REST sends to those addresses return `403 MessageRejectedError: Recipient(s) blocked`. There is no suppression-removal API.

## **Use REST API (`/inboxes/{inbox}/messages/send`) for ALL outbound. SMTP has no valid use case.**

## If you hit the REST API rate limit (HTTP 429), wait for reset or use a secondary provider (Resend). Do NOT fall back to SMTP — it will poison your list.