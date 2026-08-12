#!/usr/bin/env python3
"""
AgentMail REST API Client - v0
Replaces all IMAP polling. Single source of truth for email ops.

API base: https://api.agentmail.to/v0
Inbox:    nebulashop@agentmail.to
Key:      ~/.hermes/secrets/agentmail_org.key

Usage:
    from agentmail_client import AgentMailClient
    am = AgentMailClient()
    threads = am.list_threads(labels=["received"])
    am.reply(message_id, recipient="lead@example.com", text="...")
    am.label_thread(thread_id, add=["warm"])
"""

import json
import os
import urllib.parse
import urllib.request
import urllib.error
import hashlib
from datetime import datetime, timezone
from typing import Any, Callable, Optional

from outbound_release_gate import DeliveryPurpose, OutboundReleaseGate

INBOX = "sedrick@nebulacomponents.com"
BASE  = "https://api.agentmail.to/v0"

# Nebula state labels (custom - system labels like sent/received are read-only)
LABEL_WARM       = "warm"
LABEL_AUDIT_SENT = "audit-sent"
LABEL_PITCHED    = "pitched"
LABEL_CLOSED_WON = "closed-won"
LABEL_CLOSED_LOST= "closed-lost"
LABEL_UNSUBSCRIBE= "unsubscribe"
LABEL_BOUNCED_US = "bounce"  # we track our own bounces too
LABEL_OUTREACH   = "targeted-outreach"


class AgentMailClient:
    def __init__(
        self,
        inbox: str = INBOX,
        key_path: str = "~/.hermes/secrets/agentmail_org.key",
        *,
        key: Optional[str] = None,
        gate: Optional[OutboundReleaseGate] = None,
        transport: Optional[Callable[[str, str, Optional[dict]], Any]] = None,
    ):
        self.inbox = inbox
        key = key or os.environ.get("AGENTMAIL_API_KEY") or os.environ.get("AM_KEY")
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
        self.gate = gate or OutboundReleaseGate()
        self.__transport = transport or self.__http_transport

    # ─── Core HTTP ────────────────────────────────────────────────────────────

    @staticmethod
    def _is_delivery_endpoint(method: str, path: str) -> bool:
        return method.upper() == "POST" and (
            path.endswith("/messages/send") or path.endswith("/reply")
        )

    @staticmethod
    def _confirmed_delivery(result: object) -> bool:
        """Require a concrete provider receipt before recording delivery."""
        if not isinstance(result, dict):
            return False
        return not result.get("_error") and any(
            isinstance(result.get(key), str) and bool(result[key].strip())
            for key in ("message_id", "id")
        )

    def _complete_delivery(self, client_id: str, result: object) -> dict:
        if not isinstance(result, dict):
            result = {}
        if not self._confirmed_delivery(result) and not result.get("_error"):
            result["_error"] = "provider_unconfirmed"
            result["_reason"] = "provider_unconfirmed"
        error = result.get("_error")
        receipt = ""
        if not error:
            receipt = str(result.get("message_id") or result.get("id") or "").strip()
        self.gate.complete(
            client_id,
            sent=not bool(error),
            reason=str(error or ""),
            provider_message_id=receipt,
        )
        result.setdefault("client_id", client_id)
        return result

    def _reconciled_delivery(self, client_id: str, reason: str) -> dict | None:
        """Return a durable prior receipt without repeating provider I/O."""
        if reason != "already_sent":
            return None
        receipt = self.gate.sent_receipt(client_id)
        if not receipt:
            return None
        return {
            "message_id": receipt,
            "client_id": client_id,
            "_idempotent_replay": True,
        }

    def _req(self, method: str, path: str, data: dict = None) -> dict:
        """Generic read/control request; direct delivery endpoints are forbidden."""
        if self._is_delivery_endpoint(method, path):
            return {"_error": "release_blocked", "_reason": "direct_delivery_forbidden"}
        return self.__transport(method, path, data)

    def __http_transport(self, method: str, path: str, data: Optional[dict] = None) -> dict:
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

    def __send_scoped(
        self,
        to: list,
        subject: str,
        *,
        purpose: DeliveryPurpose,
        text: Optional[str] = None,
        html: Optional[str] = None,
        client_id: Optional[str] = None,
        labels: Optional[list] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> dict:
        if len(to) != 1 or not isinstance(to[0], str):
            return {"_error": "release_blocked", "_reason": "single_recipient_required"}
        recipient = to[0].strip().lower()
        if not client_id:
            digest = hashlib.sha256(
                f"{recipient}\0{subject}\0{text or ''}\0{html or ''}".encode()
            ).hexdigest()[:24]
            prefix = {
                DeliveryPurpose.MARKETING: "auto",
                DeliveryPurpose.AUDIT_DELIVERY: "audit",
                DeliveryPurpose.CONVERSATION_REPLY: "conversation",
                DeliveryPurpose.INTERNAL: "internal",
                DeliveryPurpose.TRANSACTIONAL: "txn",
            }[purpose]
            client_id = f"{prefix}:{digest}"

        decision = self.gate.reserve(recipient, client_id, purpose=purpose)
        if not decision.allowed:
            reconciled = self._reconciled_delivery(client_id, decision.reason)
            if reconciled:
                return reconciled
            return {
                "_error": "release_blocked",
                "_reason": decision.reason,
                "client_id": client_id,
            }
        validation = self.gate.validate(client_id)
        if not validation.allowed:
            return {
                "_error": "release_blocked",
                "_reason": validation.reason,
                "client_id": client_id,
            }

        data = {"to": [recipient], "subject": subject, "client_id": client_id}
        if text:
            data["text"] = text
        if html:
            data["html"] = html
        if labels:
            data["labels"] = labels
        if headers:
            data["headers"] = headers
        result = self.__transport("POST", f"/inboxes/{self.inbox}/messages/send", data)
        return self._complete_delivery(client_id, result)

    def send(
        self,
        to: list,
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        client_id: Optional[str] = None,
        labels: Optional[list] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> dict:
        """Send marketing email through the centralized release gate."""
        return self.__send_scoped(
            to,
            subject,
            text=text,
            html=html,
            client_id=client_id,
            labels=labels,
            headers=headers,
            purpose=DeliveryPurpose.MARKETING,
        )

    def send_newsletter(
        self,
        to: list,
        subject: str,
        text: Optional[str] = None,
        html: Optional[str] = None,
        client_id: Optional[str] = None,
        labels: Optional[list] = None,
        headers: Optional[dict[str, str]] = None,
    ) -> dict:
        """Submit a newsletter only after the PostgreSQL release authority."""
        return self.__send_scoped(
            to,
            subject,
            text=text,
            html=html,
            client_id=client_id,
            labels=labels,
            headers=headers,
            purpose=DeliveryPurpose.NEWSLETTER,
        )

    def send_audit(self, to: list, subject: str, **kwargs) -> dict:
        """Deliver a requested audit to a known lead."""
        return self.__send_scoped(
            to, subject, purpose=DeliveryPurpose.AUDIT_DELIVERY, **kwargs
        )

    def send_conversation(self, to: list, subject: str, **kwargs) -> dict:
        """Send a direct response to a known inbound conversation."""
        return self.__send_scoped(
            to, subject, purpose=DeliveryPurpose.CONVERSATION_REPLY, **kwargs
        )

    def send_internal(self, to: list, subject: str, **kwargs) -> dict:
        """Send only to a configured internal recipient."""
        return self.__send_scoped(
            to, subject, purpose=DeliveryPurpose.INTERNAL, **kwargs
        )

    def send_transactional(self, to: list, subject: str, **kwargs) -> dict:
        """Send a transactional/auth email (magic link, receipt, security notice).

        Exempt from marketing opt-outs and lead-state gates by CAN-SPAM. Uses
        the same single-authority transport and delivery ledger as every other
        outbound message.
        """
        return self.__send_scoped(
            to, subject, purpose=DeliveryPurpose.TRANSACTIONAL, **kwargs
        )

    def reply(
        self,
        message_id: str,
        *,
        recipient: Optional[str] = None,
        text: Optional[str] = None,
        html: Optional[str] = None,
        client_id: Optional[str] = None,
    ) -> dict:
        """Reply in-thread through the centralized release gate."""
        if not recipient:
            return {"_error": "release_blocked", "_reason": "recipient_required"}
        recipient = recipient.strip().lower()
        client_id = client_id or f"reply:{hashlib.sha256(message_id.encode()).hexdigest()[:24]}"
        decision = self.gate.reserve(
            recipient, client_id, purpose=DeliveryPurpose.CONVERSATION_REPLY
        )
        if not decision.allowed:
            reconciled = self._reconciled_delivery(client_id, decision.reason)
            if reconciled:
                return reconciled
            return {
                "_error": "release_blocked",
                "_reason": decision.reason,
                "client_id": client_id,
            }
        validation = self.gate.validate(client_id)
        if not validation.allowed:
            return {
                "_error": "release_blocked",
                "_reason": validation.reason,
                "client_id": client_id,
            }
        data = {"client_id": client_id}
        if text:
            data["text"] = text
        if html:
            data["html"] = html
        safe_id = urllib.parse.quote(message_id, safe='')
        result = self.__transport(
            "POST", f"/inboxes/{self.inbox}/messages/{safe_id}/reply", data
        )
        return self._complete_delivery(client_id, result)

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

        # Unsubscribe signals (highest priority - must act immediately)
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

        # Warm signals - buying intent
        warm_signals = ["interested", "yes", "sure", "send it", "send me",
                        "how much", "price", "cost", "what do you charge",
                        "audit", "would love", "sounds good", "let's do it",
                        "i'd like", "tell me more", "can you help",
                        "please send", "go ahead", "okay", "ok sounds"]
        if any(s in combined for s in warm_signals):
            return "warm"

        # Default: cold (polite but not buying)
        return "cold"

    def diagnose_reply(self, thread: dict, message_body: str) -> str:
        """
        48-hour diagnostic (cold-DM carousel, implemented 2026-07-31):
        map a reply to the sentence that failed, so copy gets fixed, not just
        relabeled. Complementary to classify_reply(): classification decides
        what to DO; diagnosis decides what to FIX.

        Returns one of:
          s1_trigger_stale    - "what audit?" / context not recognized
          s2_who_unclear      - "who is this?" / identity missing
          s3_diagnosed        - defensive reply / we made an assumption
          s4_ask_too_big      - "not right now" / ask was too big
          none                - no diagnostic signal (e.g. warm replies)
        """
        body_lower = message_body.lower()
        subject_lower = thread.get("subject", "").lower()
        combined = body_lower + " " + subject_lower

        # S4: ask too big - deferral
        if any(s in combined for s in [
            "not right now", "not now", "too busy", "no time",
            "later this month", "next quarter", "maybe in the future",
            "not at this time", "not a priority", "not the priority",
        ]):
            return "s4_ask_too_big"

        # S2: identity unclear
        if any(s in combined for s in [
            "who is this", "who are you", "what is nebula", "what do you do",
            "did you email me", "why did you email me", "how did you get",
        ]):
            return "s2_who_unclear"

        # S3: we made an assumption / diagnosed their business
        if any(s in combined for s in [
            "how do you know", "that's wrong", "you don't know", "you assumed",
            "stop assuming", "don't tell me what", "you got it wrong",
            "incorrect", "not accurate", "that's not true",
        ]):
            return "s3_diagnosed"

        # S1: stale trigger - context not recognized
        if any(s in combined for s in [
            "what audit", "which audit", "i never requested", "didn't request",
            "don't remember", "not sure what you", "who are you talking about",
        ]):
            return "s1_trigger_stale"

        return "none"

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
