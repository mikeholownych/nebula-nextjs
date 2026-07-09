#!/usr/bin/env python3
"""
Nebula Webhook Server — port 9000
Handles:
  - Stripe payment events       POST /webhook/stripe
  - AgentMail inbound events    POST /webhook/agentmail
  - Live stats for blog         GET  /api/stats
  - Health check                GET  /health
"""
import json, os, time, threading, hmac, hashlib, sys
from http.server import HTTPServer, BaseHTTPRequestHandler

sys.path.insert(0, "/home/mike/nebula")

PORT           = 9000
PAYMENTS_LOG   = "/home/mike/nebula/payments.log"
STATS_FILE     = "/home/mike/nebula/stats.json"
INBOX_LOG      = "/home/mike/nebula/ledgers/customer-ledger.jsonl"
SEEN_THREADS_FILE = "/home/mike/nebula/seen_threads.json"
HOT_LEAD_FILE  = "/home/mike/nebula/HOT_LEAD.json"
CHECKOUT_97    = "https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02"
CHECKOUT_997   = "https://buy.stripe.com/4gMcN5aYk92Qaa5drY43S09"

# In-memory + persisted dedup set — prevents same thread firing duplicate actions
_seen_threads: set = set()
_seen_threads_lock = threading.Lock()

def _load_seen_threads():
    global _seen_threads
    try:
        with open(SEEN_THREADS_FILE) as f:
            _seen_threads = set(json.load(f))
    except:
        _seen_threads = set()

def _mark_thread_seen(thread_id: str):
    with _seen_threads_lock:
        _seen_threads.add(thread_id)
        try:
            with open(SEEN_THREADS_FILE, "w") as f:
                json.dump(list(_seen_threads), f)
        except Exception as e:
            print(f"[dedup] persist error: {e}")

def _is_thread_seen(thread_id: str) -> bool:
    with _seen_threads_lock:
        return thread_id in _seen_threads
KEY_FILE       = os.path.expanduser("~/.hermes/secrets/agentmail_org.key")
WH_SECRET_FILE = os.path.expanduser("~/.hermes/secrets/agentmail_webhook_secret.key")


def load_key(path):
    try:
        return open(path).read().strip()
    except:
        return ""


def _is_test_payment_text(*parts):
    text = " ".join(str(p or "") for p in parts).lower()
    return any(marker in text for marker in ("cs_test", "test", "restart-test", "example.com", "ops@launchcrate.io"))


def _real_revenue_from_ledger():
    total = 0
    tests = 0
    if not os.path.exists(INBOX_LOG):
        return 0, 0, 0
    with open(INBOX_LOG) as f:
        for line in f:
            if not line.strip():
                continue
            try:
                row = json.loads(line)
            except Exception:
                continue
            if row.get("event_type") != "payment":
                continue
            if _is_test_payment_text(row.get("payment_id"), row.get("email"), row.get("product")):
                tests += 1
                continue
            amount = row.get("amount_cents")
            if amount is None:
                try:
                    amount = int(round(float(str(row.get("amount") or "0").replace("$", "")) * 100))
                except Exception:
                    amount = 0
            total += int(amount or 0)
    return total // 100, total, tests


def update_stats(field, increment=1):
    try:
        stats = {}
        if os.path.exists(STATS_FILE):
            with open(STATS_FILE) as f:
                stats = json.load(f)
        if field == "revenue":
            # Never increment public revenue from webhook state blindly; test-mode Stripe events exist.
            real_dollars, _real_cents, test_count = _real_revenue_from_ledger()
            stats["revenue"] = real_dollars
            stats["real_revenue"] = real_dollars
            stats["test_revenue_excluded"] = True
            stats["test_payments_excluded"] = test_count
        else:
            stats[field] = stats.get(field, 0) + increment
        stats["updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
        with open(STATS_FILE, "w") as f:
            json.dump(stats, f, indent=2)
    except Exception as e:
        print(f"[stats] update error: {e}")


def log_to_ledger(entry: dict):
    try:
        os.makedirs(os.path.dirname(INBOX_LOG), exist_ok=True)
        with open(INBOX_LOG, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print(f"[ledger] write error: {e}")


def _extract_email(sender: str) -> str:
    import re
    match = re.search(r"<([^>]+)>", sender or "")
    return (match.group(1) if match else (sender or "")).strip().lower()


def _extract_url(*parts) -> str:
    import re
    text = " ".join(str(p or "") for p in parts)
    match = re.search(r"https?://[^\s<>)\]]+|\b(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+[^\s<>)\]]*", text, re.I)
    if not match:
        return ""
    url = match.group(0).rstrip(".,;:!?\"'")
    return url if url.startswith(("http://", "https://")) else f"https://{url}"


def _is_payment_intent(subject: str, preview: str) -> bool:
    text = f"{subject} {preview}".lower()
    return any(s in text for s in ("how do i pay", "how to pay", "payment link", "checkout", "buy", "paid", "send the link", "where do i pay"))


def _upsert_hot_lead(record: dict):
    try:
        if os.path.exists(HOT_LEAD_FILE):
            raw = json.load(open(HOT_LEAD_FILE))
        else:
            raw = []
        leads = raw if isinstance(raw, list) else [raw]
        key_email = (record.get("email") or "").lower()
        key_thread = record.get("thread_id")
        replaced = False
        for lead in leads:
            if not isinstance(lead, dict):
                continue
            if (key_thread and lead.get("thread_id") == key_thread) or (key_email and (lead.get("email") or "").lower() == key_email):
                lead.update({k: v for k, v in record.items() if v not in (None, "")})
                lead["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ")
                replaced = True
                break
        if not replaced:
            leads.append(record)
        with open(HOT_LEAD_FILE, "w") as f:
            json.dump(leads if isinstance(raw, list) else leads[-1], f, indent=2)
    except Exception as e:
        print(f"[hot-lead] write error: {e}")


def handle_agentmail_event(event: dict):
    """
    Process an AgentMail webhook event.
    Events: message.received, message.bounced, message.complained, message.rejected
    """
    event_type = event.get("type", "")
    ts = time.strftime("%Y-%m-%d %H:%M:%S UTC")

    if event_type == "message.received":
        msg = event.get("data", {}).get("message", event.get("data", {}))
        sender = msg.get("from", "") or str(msg.get("senders", ["unknown"]))
        subject = msg.get("subject", "")
        thread_id = msg.get("thread_id", "")
        message_id = msg.get("message_id", "")
        preview = msg.get("text", "") or msg.get("preview", "")
        preview = (preview or "")[:200]

        # Skip our own sends bouncing back, mailer daemons
        skip_senders = ["agentmail.to", "mailer-daemon", "amazonses.com", "postmaster"]
        if any(s in sender.lower() for s in skip_senders):
            print(f"[agentmail] Skipping daemon/bounce from {sender}")
            return

        print(f"[agentmail] INBOUND from {sender} | {subject}")

        # DEDUP: skip if we already processed this thread
        if _is_thread_seen(thread_id):
            print(f"[agentmail] DEDUP: thread {thread_id[:20]} already processed — skipping")
            return
        _mark_thread_seen(thread_id)

        # Log to customer ledger
        entry = {
            "timestamp": ts,
            "event": "inbound_reply",
            "sender": sender,
            "subject": subject,
            "thread_id": thread_id,
            "message_id": message_id,
            "preview": preview,
            "classification": _classify_message(subject, preview),
            "actioned": False
        }
        log_to_ledger(entry)
        update_stats("replies")

        # Score: +3 for reply (TrustOS: email_replied)
        try:
            _score_email = sender.split("<")[-1].split(">")[0].strip() if "<" in sender else sender.strip()
            if _score_email and "@" in _score_email:
                from lead_store import LeadStore as _ScoreDB
                _sdb = _ScoreDB()
                _sdb.add_score(_score_email, 3, reason="email_replied")
        except Exception:
            pass

        # Trigger async classification + label via AgentMail REST API
        threading.Thread(
            target=_process_inbound_reply,
            args=(thread_id, message_id, sender, subject, preview, entry["classification"]),
            daemon=True
        ).start()

    elif event_type == "message.bounced":
        recipient = event.get("data", {}).get("recipient", "unknown")
        print(f"[agentmail] BOUNCE: {recipient}")
        log_to_ledger({
            "timestamp": ts,
            "event": "bounce",
            "recipient": recipient,
            "raw": str(event)[:300]
        })

    elif event_type == "message.complained":
        sender = event.get("data", {}).get("sender", "unknown")
        print(f"[agentmail] COMPLAINT from {sender} — flagging immediately")
        log_to_ledger({
            "timestamp": ts,
            "event": "complaint",
            "sender": sender,
            "raw": str(event)[:300]
        })
        # Score: -10 for spam complaint (TrustOS: complaint = severe penalty)
        try:
            _c_email = sender.split("<")[-1].split(">")[0].strip() if "<" in sender else sender.strip()
            if _c_email and "@" in _c_email:
                from lead_store import LeadStore as _CScoreDB
                _cdb = _CScoreDB()
                _cdb.add_score(_c_email, -10, reason="spam_complaint")
                # Also mark as bounced — this address is dead
                _cdb.mark_bounced(_c_email, bounce_type="hard",
                                  bounce_detail="Spam complaint — suppressed by AgentMail")
        except Exception:
            pass
        # Complaints must be handled immediately — log prominently
        with open("/home/mike/nebula/ESCALATE_COMPLAINT.log", "a") as f:
            f.write(f"{ts} COMPLAINT from {sender}\n{json.dumps(event)}\n\n")


def _classify_message(subject: str, body: str) -> str:
    """Quick keyword classification — same logic as agentmail_client.py."""
    combined = (subject + " " + body).lower()

    unsub = ["unsubscribe", "remove me", "take me off", "stop emailing",
             "opt out", "not interested", "don't contact", "stop sending"]
    if any(s in combined for s in unsub):
        return "unsubscribe"

    complaint = ["spam", "reported", "abuse", "harassment", "lawsuit", "legal action"]
    if any(s in combined for s in complaint):
        return "complaint"

    warm = ["interested", "yes", "sure", "send it", "send me", "how much",
            "price", "cost", "audit", "would love", "sounds good", "let's do",
            "tell me more", "can you help", "please send", "okay", "go ahead"]
    if any(s in combined for s in warm):
        return "warm"

    return "cold"


def _process_inbound_reply(thread_id, message_id, sender, subject, preview, classification):
    """
    Apply AgentMail labels based on classification.
    Warm leads get immediate Telegram-style notification via stats update.
    """
    try:
        from agentmail_client import AgentMailClient
        am = AgentMailClient()

        if classification == "warm":
            am.label_thread(thread_id, add=["warm"])
            update_stats("warm_leads")
            email = _extract_email(sender)
            lead_url = _extract_url(subject, preview)

            if _is_payment_intent(subject, preview):
                am.reply(message_id, text=f"You can start the $147 implementation here: {CHECKOUT_97}")
                am.label_thread(thread_id, add=["pitched"])
                _upsert_hot_lead({
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "sender": sender,
                    "email": email,
                    "subject": subject,
                    "thread_id": thread_id,
                    "message_id": message_id,
                    "preview": preview,
                    "url": lead_url,
                    "stage": "pitch_sent",
                    "status": "pitched",
                    "action": "monitor_payment_or_reply",
                    "pitch_sent_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                })
                print(f"[agentmail] $147 payment-intent reply sent to {sender}")
                return

            # Write a hot-lead signal file for the watcher to deliver or request URL.
            _upsert_hot_lead({
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "sender": sender,
                "email": email,
                "subject": subject,
                "thread_id": thread_id,
                "message_id": message_id,
                "preview": preview,
                "url": lead_url,
                "stage": "warm_reply" if lead_url else "awaiting_url_or_schedule",
                "status": "warm" if lead_url else "awaiting_url_or_schedule",
                "action": "deliver_audit" if lead_url else "request_url_or_schedule",
            })
            print(f"[agentmail] 🔥 WARM LEAD: {sender} — HOT_LEAD.json written")

        elif classification == "unsubscribe":
            am.label_thread(thread_id, add=["unsubscribe"])
            # Add to blocklist
            am._req("POST", f"/v0/inboxes/{am.inbox}/lists/send/block/{sender.split('<')[-1].strip('>')}") 
            print(f"[agentmail] Unsubscribe processed for {sender}")

        elif classification == "complaint":
            am.label_thread(thread_id, add=["complaint"])
            print(f"[agentmail] ⚠️  COMPLAINT labeled — check ESCALATE_COMPLAINT.log")

        else:
            am.label_thread(thread_id, add=["cold"])

    except Exception as e:
        print(f"[agentmail] _process error: {e}")


class WebhookHandler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print(f"[{time.strftime('%H:%M:%S')}] {fmt % args}")

    def do_GET(self):
        if self.path == "/api/stats" or self.path.startswith("/api/stats?"):
            self._serve_stats()
        elif self.path == "/health":
            self._send_json(200, {"status": "ok", "ts": time.time()})
        else:
            self._send_json(404, {"error": "not found"})

    def do_POST(self):
        if self.path == "/webhook/stripe":
            self._handle_stripe()
        elif self.path == "/webhook/agentmail":
            self._handle_agentmail()
        else:
            self._send_json(404, {"error": "not found"})

    def _serve_stats(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        try:
            if os.path.exists(STATS_FILE):
                with open(STATS_FILE) as f:
                    stats = json.load(f)
            else:
                stats = {
                    "revenue": 0, "emails_sent": 155, "replies": 2,
                    "warm_leads": 0, "open_convos": 1, "uptime": 99,
                    "challenge_day": 0,
                    "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ")
                }
            real_dollars, _real_cents, test_count = _real_revenue_from_ledger()
            stats["revenue"] = real_dollars
            stats["real_revenue"] = real_dollars
            stats["test_revenue_excluded"] = True
            stats["test_payments_excluded"] = test_count
            self.wfile.write(json.dumps(stats).encode())
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def _handle_stripe(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            event = json.loads(body)
            etype = event.get("type", "")

            if etype == "checkout.session.completed":
                session = event["data"]["object"]
                customer_email = session.get("customer_details", {}).get("email", "unknown")
                amount_cents   = session.get("amount_total", 0)
                amount_str     = f"${amount_cents/100:.2f}"
                product        = session.get("metadata", {}).get("product", "unknown")

                entry = {
                    "time": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "product": product, "amount": amount_str,
                    "email": customer_email,
                    "session_id": session.get("id", "")
                }
                try:
                    os.makedirs(os.path.dirname(PAYMENTS_LOG), exist_ok=True)
                    with open(PAYMENTS_LOG, "a") as f:
                        f.write(json.dumps(entry) + "\n")
                except Exception as e:
                    print(f"[stripe] log error: {e}")

                log_to_ledger({
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "event_type": "payment",
                    "email": customer_email,
                    "amount_cents": amount_cents,
                    "amount": amount_str,
                    "product": product,
                    "payment_id": session.get("payment_intent") or session.get("id", ""),
                    "checkout_session_id": session.get("id", ""),
                })
                _upsert_hot_lead({
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "email": (customer_email or "").lower(),
                    "stage": "paid",
                    "status": "paid",
                    "action": "fulfill_implementation",
                    "paid_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                    "amount_cents": amount_cents,
                    "checkout_session_id": session.get("id", ""),
                })
                update_stats("revenue", amount_cents // 100)
                print(f"[SALE] {amount_str} — {product} — {customer_email}")

            self._send_json(200, {"received": True})
        except Exception as e:
            print(f"[stripe] error: {e}")
            self._send_json(400, {"error": str(e)})

    def _handle_agentmail(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)

        # Verify webhook signature (HMAC-SHA256)
        secret = load_key(WH_SECRET_FILE)
        if secret:
            sig_header = self.headers.get("X-AgentMail-Signature", "") or \
                         self.headers.get("X-Webhook-Signature", "")
            if sig_header:
                expected = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
                # Strip "sha256=" prefix if present
                received = sig_header.replace("sha256=", "")
                if not hmac.compare_digest(expected, received):
                    print("[agentmail] ⚠️  Webhook signature mismatch — ignoring")
                    self._send_json(401, {"error": "invalid signature"})
                    return

        try:
            event = json.loads(body)
            threading.Thread(
                target=handle_agentmail_event,
                args=(event,),
                daemon=True
            ).start()
            self._send_json(200, {"received": True})
        except Exception as e:
            print(f"[agentmail] parse error: {e}")
            self._send_json(400, {"error": str(e)})

    def _send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    _load_seen_threads()
    print(f"[dedup] Loaded {len(_seen_threads)} seen thread IDs")
    if not os.path.exists(STATS_FILE):
        with open(STATS_FILE, "w") as f:
            json.dump({
                "revenue": 0, "emails_sent": 155, "replies": 2,
                "warm_leads": 0, "open_convos": 1, "uptime": 99,
                "challenge_day": 0,
                "updated": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            }, f, indent=2)

    server = HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    print(f"[nebula-webhook] listening on :{PORT}")
    server.serve_forever()
