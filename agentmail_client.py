#!/usr/bin/env python3
"""
AgentMail REST API Client — v0
Replaces all IMAP polling. Single source of truth for email ops.

API base: https://api.agentmail.to/v0
Inbox:    ops@launchcrate.io
Key:      ~/.hermes/secrets/agentmail_org.key

Usage:
    from agentmail_client import AgentMailClient
    am = AgentMailClient()
    threads = am.list_threads(labels=["received"])
    am.reply(message_id, text="...")
    am.label_thread(thread_id, add=["warm"])
"""

import json
import os
import urllib.parse
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Optional

INBOX = "ops@launchcrate.io"
BASE  = "https://api.agentmail.to/v0"

# Nebula state labels (custom — system labels like sent/received are read-only)
LABEL_WARM       = "warm"
LABEL_AUDIT_SENT = "audit-sent"
LABEL_PITCHED    = "pitched"
LABEL_CLOSED_WON = "closed-won"
LABEL_CLOSED_LOST= "closed-lost"
LABEL_UNSUBSCRIBE= "unsubscribe"
LABEL_BOUNCED_US = "bounce"  # we track our own bounces too
LABEL_OUTREACH   = "targeted-outreach"


class AgentMailClient:
    def __init__(self, inbox: str = INBOX, key_path: str = "~/.hermes/secrets/agentmail_org.key"):
        self.inbox = inbox
        key = os.environ.get("AGENTMAIL_API_KEY") or os.environ.get("AM_KEY")
        if not key:
            expanded = os.path.expanduser(key_path)
            candidates = [expanded]
            if key_path.startswith("~/.hermes/"):
                candidates.append(os.path.join("/home/mike/.hermes", key_path[len("~/.hermes/"):]))
            for candidate in candidates:
                if os.path.exists(candidate):
                    with open(candidate) as f:
                        key = f.read().strip()
                    break
            if not key:
                raise FileNotFoundError(f"AgentMail key not found in: {', '.join(candidates)}")
        self.key = key

    # ─── Core HTTP ────────────────────────────────────────────────────────────

    def _req(self, method: str, path: str, data: dict = None) -> dict:
        url = f"{BASE}{path}"
        payload = json.dumps(data).encode() if data else None
        req = urllib.request.Request(
            url, data=payload,
            headers={"Authorization": f"Bearer {self.key}", "Content-Type": "application/json"},
            method=method
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            return {"_error": e.code, "_body": body[:800]}
        except Exception as e:
            return {"_error": str(e)}

    # ─── Threads ──────────────────────────────────────────────────────────────

    def list_threads(self, limit: int = 50, labels: list = None) -> list:
        """List threads. Filter by labels (e.g. ['received'] or ['warm'])."""
        path = f"/inboxes/{self.inbox}/threads?limit={limit}"
        if labels:
            for l in labels:
                path += f"&labels={l}"
        r = self._req("GET", path)
        return r.get("threads", [])

    def get_human_replies(self) -> list:
        """Threads with real human inbound replies (not bounces, not our own sends)."""
        threads = self.list_threads(limit=100)
        human = []
        inbox_lower = self.inbox.lower()
        for t in threads:
            labels = t.get("labels", [])
            senders = t.get("senders", [])
            # Has received label and at least one non-us, non-daemon sender
            if "received" not in labels:
                continue
            real_humans = []
            for s in senders:
                if "<" in s and ">" in s:
                    addr = s.split("<")[1].split(">")[0].strip().lower()
                else:
                    addr = s.strip().lower()
                if any(skip in addr for skip in
                       ["agentmail.to", "mailer-daemon", "amazonses.com",
                        "postmaster", inbox_lower, "launchcrate.io"]):
                    continue
                real_humans.append(addr)
            if real_humans:
                human.append(t)
        return human

    def label_thread(self, thread_id: str, add: list = None, remove: list = None) -> dict:
        """Add/remove custom labels on a thread."""
        data = {}
        if add:    data["add_labels"]    = add
        if remove: data["remove_labels"] = remove
        return self._req("PATCH", f"/inboxes/{self.inbox}/threads/{thread_id}", data)

    # ─── Messages ─────────────────────────────────────────────────────────────

    def list_messages(self, thread_id: str = None, limit: int = 20) -> list:
        """List messages for inbox, optionally filtered by thread."""
        path = f"/inboxes/{self.inbox}/messages?limit={limit}"
        r = self._req("GET", path)
        msgs = r.get("messages", [])
        if thread_id:
            msgs = [m for m in msgs if m.get("thread_id") == thread_id]
        return msgs

    def get_message(self, message_id: str) -> dict:
        """Get a single message with full body."""
        safe_id = urllib.parse.quote(message_id, safe='')
        return self._req("GET", f"/inboxes/{self.inbox}/messages/{safe_id}")

    def send(self, to: list, subject: str, text: str = None, html: str = None,
             client_id: str = None) -> dict:
        """Send a new email. to = list of email strings.
        Auto-falls back to Resend if AgentMail returns 5xx or network error.
        403 (recipient suppressed) is NOT retried via backup — it means blocked.
        """
        data = {"to": to, "subject": subject}
        if text: data["text"] = text
        if html: data["html"] = html
        if client_id: data["client_id"] = client_id  # idempotency key
        result = self._req("POST", f"/inboxes/{self.inbox}/messages/send", data)

        # 403 = recipient suppressed — do not retry via backup
        if result.get("_error") == 403:
            return result

        # 5xx or network error — failover to Resend
        err = result.get("_error")
        if err and isinstance(err, int) and err >= 500:
            try:
                import resend_client as _resend
                body = text or ""
                backup = _resend.send(to=to, subject=subject, text=body)
                if backup.get("message_id"):
                    backup["_via"] = "resend_backup"
                    return backup
            except Exception as fe:
                result["_failover_error"] = str(fe)

        return result

    def reply(self, message_id: str, text: str = None, html: str = None) -> dict:
        """Reply to a specific message (preserves thread/In-Reply-To headers)."""
        data = {}
        if text: data["text"] = text
        if html: data["html"] = html
        safe_id = urllib.parse.quote(message_id, safe='')
        return self._req("POST", f"/inboxes/{self.inbox}/messages/{safe_id}/reply", data)

    # ─── Webhooks ─────────────────────────────────────────────────────────────

    def list_webhooks(self) -> list:
        r = self._req("GET", f"/inboxes/{self.inbox}/webhooks")
        return r.get("webhooks", [])

    def create_webhook(self, url: str, event_types: list = None) -> dict:
        """Register a webhook for this inbox."""
        return self._req("POST", f"/inboxes/{self.inbox}/webhooks", {
            "url": url,
            "event_types": event_types or ["message.received", "message.bounced", "message.complained"]
        })

    def delete_webhook(self, webhook_id: str) -> dict:
        return self._req("DELETE", f"/inboxes/{self.inbox}/webhooks/{webhook_id}")

    # ─── Higher-level ops ─────────────────────────────────────────────────────

    def classify_reply(self, thread: dict, message_body: str) -> str:
        """
        Classify a human reply into one of:
          warm | cold | unsubscribe | complaint | bounce | spam
        """
        body_lower = message_body.lower()
        subject_lower = thread.get("subject", "").lower()
        combined = body_lower + " " + subject_lower

        # Unsubscribe signals (highest priority — must act immediately)
        unsub_signals = ["unsubscribe", "remove me", "take me off", "stop emailing",
                         "opt out", "opt-out", "don't contact", "do not contact",
                         "not interested", "stop sending"]
        if any(s in combined for s in unsub_signals):
            return "unsubscribe"

        # Complaint signals
        complaint_signals = ["spam", "reported", "abuse", "harassment", "threatening",
                             "inappropriate", "lawsuit", "legal"]
        if any(s in combined for s in complaint_signals):
            return "complaint"

        # Warm signals — buying intent
        warm_signals = ["interested", "yes", "sure", "send it", "send me",
                        "how much", "price", "cost", "what do you charge",
                        "audit", "would love", "sounds good", "let's do it",
                        "i'd like", "tell me more", "can you help",
                        "please send", "go ahead", "okay", "ok sounds"]
        if any(s in combined for s in warm_signals):
            return "warm"

        # Default: cold (polite but not buying)
        return "cold"

    def triage_inbox(self) -> dict:
        """
        Full inbox triage. Returns classified dict:
        {
          "warm": [...threads],
          "cold": [...],
          "unsubscribe": [...],
          "complaint": [...]
        }
        """
        human_threads = self.get_human_replies()
        result = {"warm": [], "cold": [], "unsubscribe": [], "complaint": []}

        for thread in human_threads:
            # Get last message body for classification
            msgs = self.list_messages(thread_id=thread["thread_id"], limit=5)
            # Find the most recent inbound (not from us)
            body = thread.get("preview", "")
            for msg in reversed(msgs):
                sender = msg.get("from", "") or ""
                if "agentmail.to" not in sender:
                    body = msg.get("text", "") or msg.get("preview", "") or body
                    break

            classification = self.classify_reply(thread, body)
            thread["_classification"] = classification
            thread["_body_preview"] = body[:200]
            result[classification].append(thread)

        return result


if __name__ == "__main__":
    am = AgentMailClient()
    print("=== INBOX TRIAGE ===")
    triage = am.triage_inbox()
    for bucket, threads in triage.items():
        if threads:
            print(f"\n{bucket.upper()} ({len(threads)}):")
            for t in threads:
                print(f"  Thread: {t['thread_id']}")
                print(f"  From:   {t['senders']}")
                print(f"  Subj:   {t.get('subject','')}")
                print(f"  Body:   {t['_body_preview'][:100]}")
                print()
    print("\n=== WEBHOOKS ===")
    wh = am.list_webhooks()
    print(f"Registered: {len(wh)}")
    for w in wh:
        print(f"  {w.get('webhook_id')} → {w.get('url')} | events={w.get('event_types')}")
