#!/usr/bin/env python3
"""Stripe webhook handler - auto-deliver products AND onboard SDR clients on payment."""
import json, urllib.request, os, time, secrets
from pathlib import Path

LOG_FILE = "/home/mike/nebula/payments.log"
CUSTOMER_LEDGER = "/home/mike/nebula/ledgers/customer-ledger.jsonl"
ORDERS_DIR = "/home/mike/nebula/orders"
CLIENTS_DIR = "/home/mike/sdr-service/clients"
TESTIMONIALS_FILE = "/home/mike/nebula/ledgers/testimonials.jsonl"
TESTIMONIAL_QUEUE = "/home/mike/nebula/ledgers/testimonial_queue.jsonl"

def handle_stripe_webhook(payload, signature=None):
    data = json.loads(payload)
    event_type = data.get("type", "")
    
    if event_type == "checkout.session.completed":
        session = data.get("data", {}).get("object", {})
        customer_email = session.get("customer_details", {}).get("email", "unknown")
        amount = session.get("amount_total", 0)
        product = session.get("metadata", {}).get("product", "unknown")
        payment_id = session.get("id", "unknown")
        customer_id = session.get("customer", "")
        subscription_id = session.get("subscription", "")  # For subscription products
        mode = session.get("mode", "payment")  # payment or subscription
        
        entry = {
            "time": time.strftime("%Y-%m-%d %H:%M:%S"),
            "type": "sale",
            "product": product,
            "amount_cents": amount,
            "amount_dollars": f"${amount/100:.2f}",
            "email": customer_email,
            "payment_id": payment_id,
            "customer_id": customer_id,
            "subscription_id": subscription_id,
            "mode": mode,
        }
        
        os.makedirs(ORDERS_DIR, exist_ok=True)
        os.makedirs(CLIENTS_DIR, exist_ok=True)
        
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
        # Also write to customer-ledger so follow-up sequence excludes paid leads
        ledger_entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "event_type": "payment",
            "product": product,
            "email": customer_email,
            "amount": f"${amount/100:.2f}",
            "payment_id": payment_id,
        }
        try:
            os.makedirs(os.path.dirname(CUSTOMER_LEDGER), exist_ok=True)
            with open(CUSTOMER_LEDGER, "a") as f:
                f.write(json.dumps(ledger_entry) + "\n")
        except Exception as e:
            print(f"  customer-ledger write error: {e}")
        
        order_file = os.path.join(ORDERS_DIR, f"{payment_id}.json")
        with open(order_file, "w") as f:
            json.dump(entry, f, indent=2)
        
        print(f"\n💰 PAYMENT: {entry['amount_dollars']} for {product} from {customer_email}")
        
        # Route to appropriate handler
        if "nebula" in product.lower():
            _handle_nebula_sale(entry)
        elif "launch" in product.lower():
            _handle_launchcrate_sale(entry)
        elif "outbound" in product.lower() or "sdr" in product.lower():
            _handle_outbound_sale(entry)
        else:
            _handle_unknown_sale(entry)
        
        return {"status": "success", "entry": entry}
    
    elif event_type == "invoice.payment_succeeded":
        # Recurring subscription payment - notify client
        invoice = data.get("data", {}).get("object", {})
        customer_email = invoice.get("customer_email", "unknown")
        amount = invoice.get("amount_paid", 0)
        subscription_id = invoice.get("subscription", "")
        
        print(f"🔄 Recurring payment: ${amount/100:.2f} from {customer_email} (sub: {subscription_id})")
        
        # Send payment confirmation
        _send_receipt(customer_email, amount, subscription_id)
        
        return {"status": "success", "type": "recurring_payment"}
    
    elif event_type == "customer.subscription.updated":
        sub = data.get("data", {}).get("object", {})
        status = sub.get("status", "")
        customer_email = sub.get("metadata", {}).get("customer_email", "unknown")
        print(f"📋 Subscription update: {customer_email} -> {status}")
        return {"status": "success", "type": "subscription_update"}
    
    elif event_type == "customer.subscription.deleted":
        sub = data.get("data", {}).get("object", {})
        customer_email = sub.get("metadata", {}).get("customer_email", "unknown")
        print(f"❌ Subscription cancelled: {customer_email}")
        _send_cancellation_email(customer_email)
        return {"status": "success", "type": "subscription_cancelled"}
    
    # Dunning: failed payments
    elif event_type == "invoice.payment_failed":
        # Import and delegate to dunning handler
        import sys
        sys.path.insert(0, "/home/mike/sdr-service")
        from dunning_handler import handle_invoice_payment_failed
        return handle_invoice_payment_failed(data)
    
    elif event_type == "customer.subscription.updated":
        import sys
        sys.path.insert(0, "/home/mike/sdr-service")
        from dunning_handler import handle_customer_subscription_updated
        return handle_customer_subscription_updated(data)

    # Abandoned cart: checkout started but not completed
    elif event_type == "checkout.session.expired":
        session = data.get("data", {}).get("object", {})
        _handle_abandoned_cart(session)
        return {"status": "success", "type": "abandoned_cart_queued"}
    
    return {"status": "ignored", "type": event_type}


# ── Abandoned Cart Handler ─────────────────────────────────────────
ABANDONED_CART_FILE = "/home/mike/nebula/ledgers/abandoned_carts.jsonl"

def _handle_abandoned_cart(session):
    """Queue a 3-email recovery sequence for checkout starters who didn't complete."""
    email = (session.get("customer_details") or {}).get("email") or \
            (session.get("customer_email") or "")
    if not email:
        return  # No email captured — can't recover
    amount = session.get("amount_total", 0)
    session_id = session.get("id", "")
    url = session.get("metadata", {}).get("url", "")
    product = session.get("metadata", {}).get("product", "nebula_97")

    # Don't re-queue if already processed
    if os.path.exists(ABANDONED_CART_FILE):
        with open(ABANDONED_CART_FILE) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("session_id") == session_id:
                        return  # Already queued
                except Exception:
                    pass

    from datetime import datetime, timezone, timedelta
    now = datetime.now(timezone.utc)
    entry = {
        "email": email.lower().strip(),
        "session_id": session_id,
        "product": product,
        "amount_cents": amount,
        "url": url,
        "created_at": now.isoformat(),
        "sequences": [
            {"label": "cart_email1", "send_at": (now + timedelta(minutes=30)).isoformat(), "status": "queued"},
            {"label": "cart_email2", "send_at": (now + timedelta(hours=4)).isoformat(),   "status": "queued"},
            {"label": "cart_email3", "send_at": (now + timedelta(hours=24)).isoformat(),  "status": "queued"},
        ],
    }
    os.makedirs(os.path.dirname(ABANDONED_CART_FILE), exist_ok=True)
    with open(ABANDONED_CART_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"  [abandoned_cart] queued 3-email recovery for {email} (session {session_id})")


ABANDONED_CART_EMAILS = [
    ("cart_email1",
     "want the lower-risk path?",
     """Hey,

Saw you started checkout and didn't finish.

No pressure. Usually that means one of three things:
1. timing is off
2. you want to DIY first
3. you need a lower-risk bridge before implementation

If it's #2, use the $7 DIY kit: {stripe_7}
If it's #3, reply "bridge" and I'll send the lighter consulting option.

— Nebula Components"""),

    ("cart_email2",
     "the leak still exists",
     """Hey,

Quick context on the checkout you left open.

The page leak doesn't become cheaper with time. If traffic is still running, the same weak CTA/proof/message path keeps taxing every click.

You have three paths:
1. DIY: {stripe_7}
2. Done-for-you implementation: {stripe}
3. Reply "bridge" for a lighter consulting pass first

Pick the path that matches your risk tolerance.

— Nebula Components"""),

    ("cart_email3",
     "closing the loop",
     """Hey,

Last note on this.

If the full implementation felt like too much right now, that's fine. The smarter move is not forcing the big offer — it's choosing the thing you will actually use.

DIY kit: {stripe_7}
Implementation: {stripe}
Lighter consulting bridge: reply "bridge"

No more cart emails after this.

— Nebula Components"""),
]


def process_abandoned_carts():
    """Send queued abandoned cart recovery emails past their send_at time."""
    if not os.path.exists(ABANDONED_CART_FILE):
        return

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    # Load paid emails to skip completed purchases
    paid = set()
    if os.path.exists(CUSTOMER_LEDGER):
        with open(CUSTOMER_LEDGER) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                    if entry.get("event_type") == "payment":
                        e = entry.get("email", "").lower().strip()
                        if e:
                            paid.add(e)
                except Exception:
                    pass

    updated_carts = []
    with open(ABANDONED_CART_FILE) as f:
        carts = [json.loads(l) for l in f if l.strip()]

    for cart in carts:
        email = cart.get("email", "").lower().strip()
        if email in paid:
            # They bought — mark all sequences done, skip sending
            for seq in cart.get("sequences", []):
                if seq["status"] == "queued":
                    seq["status"] = "skipped_paid"
            updated_carts.append(cart)
            continue

        for seq in cart.get("sequences", []):
            if seq["status"] != "queued":
                continue
            send_at = datetime.fromisoformat(seq["send_at"].replace("Z", "+00:00"))
            if now < send_at:
                continue
            # Find matching email template
            tmpl = next((t for t in ABANDONED_CART_EMAILS if t[0] == seq["label"]), None)
            if not tmpl:
                seq["status"] = "no_template"
                continue
            _, subject, body = tmpl
            body_fmt = body.format(
                stripe="https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02",
                stripe_7="https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00",
            )
            ok = _send_email(email, subject, body_fmt, None)
            seq["status"] = "sent" if ok else "failed"
            seq["sent_at"] = now.isoformat()
            print(f"  [cart_recovery] {seq['label']} → {email}: {'sent' if ok else 'FAILED'}")

        updated_carts.append(cart)

    # Atomic rewrite
    tmp = ABANDONED_CART_FILE + ".tmp"
    with open(tmp, "w") as f:
        for cart in updated_carts:
            f.write(json.dumps(cart) + "\n")
    os.replace(tmp, ABANDONED_CART_FILE)


def _handle_nebula_sale(entry):
    """Nebula Components - digital delivery"""
    _send_delivery_email(entry["email"], "Nebula Components")
    print(f"  Nebula: download link sent to {entry['email']}")
    
    # Queue testimonial request (send after 48h to allow product use)
    _queue_testimonial_request(entry["email"], entry["product"], entry["payment_id"])


def _queue_testimonial_request(email: str, product: str, payment_id: str):
    """Add testimonial request to queue for delayed sending (48h after purchase)."""
    from datetime import datetime, timezone, timedelta
    send_at = (datetime.now(timezone.utc) + timedelta(hours=48)).isoformat()
    queue_entry = {
        "email": email,
        "product": product,
        "payment_id": payment_id,
        "send_at": send_at,
        "status": "queued",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    os.makedirs(os.path.dirname(TESTIMONIAL_QUEUE), exist_ok=True)
    with open(TESTIMONIAL_QUEUE, "a") as f:
        f.write(json.dumps(queue_entry) + "\n")
    print(f"  Testimonial request queued for {email} at {send_at}")


def _send_testimonial_request(email: str, product: str, payment_id: str):
    """Send the testimonial request email with simple reply-to-capture."""
    subject = f"How's {product} working for you?"
    text = f"""Hi there,

It's been a couple days since you got {product}. Quick ask — if it saved you time or improved your page, would you share a one-sentence take?

Just reply to this email. I'll use it (anonymized if you prefer) to help other founders decide.

No pressure either way.

— Nebula Components"""
    html = f"""<p>Hi there,</p><p>It's been a couple days since you got <strong>{product}</strong>. Quick ask — if it saved you time or improved your page, would you share a one-sentence take?</p><p>Just reply to this email. I'll use it (anonymized if you prefer) to help other founders decide.</p><p>No pressure either way.</p><p>— Nebula Components</p>"""
    _send_email(email, subject, text, html)


def process_testimonial_queue():
    """Process queued testimonial requests — send those past their send_at time."""
    from datetime import datetime, timezone
    if not os.path.exists(TESTIMONIAL_QUEUE):
        return
    
    now = datetime.now(timezone.utc)
    remaining = []
    with open(TESTIMONIAL_QUEUE) as f:
        for line in f:
            if not line.strip():
                continue
            entry = json.loads(line)
            if entry.get("status") != "queued":
                remaining.append(entry)
                continue
            send_at = datetime.fromisoformat(entry["send_at"].replace("Z", "+00:00"))
            if now >= send_at:
                _send_testimonial_request(entry["email"], entry["product"], entry["payment_id"])
                entry["status"] = "sent"
                entry["sent_at"] = now.isoformat()
            remaining.append(entry)
    
    # Rewrite queue with updated statuses
    with open(TESTIMONIAL_QUEUE, "w") as f:
        for entry in remaining:
            f.write(json.dumps(entry) + "\n")


def _save_testimonial(email: str, product: str, text: str, payment_id: str, anonymous: bool = False):
    """Store a received testimonial."""
    from datetime import datetime, timezone
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "email": email,
        "product": product,
        "testimonial": text[:500],
        "payment_id": payment_id,
        "anonymous": anonymous,
        "status": "pending_approval",
    }
    os.makedirs(os.path.dirname(TESTIMONIALS_FILE), exist_ok=True)
    with open(TESTIMONIALS_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"  Testimonial saved from {email}: {text[:60]}...")


def _handle_launchcrate_sale(entry):
    """LaunchCrate - DFY service, needs personal onboarding"""
    _send_delivery_email(entry["email"], "LaunchCrate")
    print(f"  LaunchCrate: onboarding instructions sent to {entry['email']}")


def _handle_outbound_sale(entry):
    """Managed outbound pilot onboarding after one-time payment."""
    customer_email = entry["email"]
    product_name = entry["product"]
    
    print(f"  🚀 Managed outbound pilot sale! Onboarding {customer_email} for {product_name}")
    
    # 1. Save client record for the managed pilot. Dashboard access is not promised for this pilot.
    client_file = os.path.join(CLIENTS_DIR, f"{customer_email.replace('@', '_at_')}.json")
    client_data = {
        **entry,
        "offer_category": "managed_outbound_pilot",
        "onboarding_status": "payment_received",
        "access_token": secrets.token_hex(16),
        "reply_inbox": "ops@launchcrate.io",
        "manual_reply_monitoring": True,
        "monitoring_sla": "reviewed at least once per business day",
        "welcome_sent": False,
        "operator_notified": False,
        "setup_completed": False,
    }
    with open(client_file, "w") as f:
        json.dump(client_data, f, indent=2)
    
    # 2. Send buyer onboarding and operator notification.
    buyer_sent = _send_outbound_onboarding(customer_email, product_name)
    operator_sent = _send_operator_notification(entry, client_data)
    print(f"  Managed pilot onboarding sent to {customer_email}: buyer={buyer_sent}, operator={operator_sent}")

    # 3. Mark onboarding started
    client_data["welcome_sent"] = bool(buyer_sent)
    client_data["operator_notified"] = bool(operator_sent)
    with open(client_file, "w") as f:
        json.dump(client_data, f, indent=2)

def _handle_unknown_sale(entry):
    """Unknown product - just log and notify"""
    _send_generic_receipt(entry["email"], entry["amount_dollars"])
    print(f"  Unknown product: receipt sent to {entry['email']}")


def _send_email(to_email, subject, text_body, html_body):
    """Send email via AgentMail API"""
    try:
        am_key_path = Path.home() / ".hermes/secrets/agentmail_org.key"
        with open(am_key_path) as f:
            am_key = f.read().strip()
        headers = {"Authorization": f"Bearer {am_key}", "Content-Type": "application/json"}
        data = {
            "to": [to_email],
            "subject": subject,
            "text": text_body,
            "html": html_body,
            "labels": ["transactional"]
        }
        req = urllib.request.Request(
            "https://api.agentmail.to/inboxes/ops@launchcrate.io/messages/send",
            data=json.dumps(data).encode(), headers=headers, method="POST"
        )
        urllib.request.urlopen(req, timeout=15)
        return True
    except Exception as e:
        print(f"  Email send failed: {e}")
        return False


def _send_delivery_email(customer_email, product_name):
    if product_name == "Nebula Components":
        subject = "Your Nebula Components download is ready!"
        text = f"Thanks for your purchase!\n\nDownload: https://nebulacomponents.shop/nebula-v1.0.0.tar.gz\n\nDemo: https://nebulacomponents.shop/demo.html\nFree hero generator: https://nebulacomponents.shop/generator.html\nFree pricing generator: https://nebulacomponents.shop/pricing-generator.html\n\nCommercial license - unlimited projects."
        html = f"<p>Thanks!</p><p><a href='https://nebulacomponents.shop/nebula-v1.0.0.tar.gz'>Download Nebula v1.0.0</a></p><p><a href='https://nebulacomponents.shop/demo.html'>Live Demo</a></p>"
    elif product_name == "LaunchCrate":
        subject = "Welcome to LaunchCrate! Let's build your page."
        text = "Thanks for purchasing LaunchCrate!\n\nI'll build your landing page within 24 hours. Reply with:\n1. Your logo (or text)\n2. Brand colors (or dark theme)\n3. Product name + one-liner\n4. Your domain\n5. Any copy you have"
        html = "<p>Thanks! Reply with your logo, colors, product info, and domain to get started.</p>"
    else:
        return
    
    _send_email(customer_email, subject, text, html)


def _send_outbound_onboarding(customer_email, product_name):
    subject = "Your Managed Outbound Pilot — Intake Instructions"
    text = f"""Thanks for starting your managed outbound pilot.

This is not self-serve software. Within 1 business hour, we will review your intake details and configure your campaign. Please reply to this email with:

1. Your ICP (target buyer role, company type, company size)
2. Your offer description and primary CTA
3. Target geography
4. Excluded companies or segments
5. Any existing prospect list or CRM export
6. Your preferred sender identity / brand tone
7. Any compliance constraints or claims to avoid

WHAT HAPPENS NEXT
- We review complete intake details within 1 business hour.
- We generate and manually review your first 3-step sequence.
- Your reviewed first sequence will be ready within 48 hours of complete intake.
- No campaign emails are sent until the sequence is reviewed.

REPLY HANDLING
Replies are monitored manually during the pilot. We review the campaign inbox (ops@launchcrate.io) at least once per business day, forward qualified replies to you, and include reply status in your weekly report. Automatic reply classification and CRM sync are not included in the current pilot.

RISK REVERSAL
If we cannot launch your reviewed first campaign within 48 hours of receiving complete intake details, you may request a refund before any emails are sent.

Questions? Reply directly to this email.
"""
    html = """<h2>Your managed outbound pilot has started</h2>
<p><strong>This is not self-serve software.</strong> Within 1 business hour, we will review your intake details and configure your campaign.</p>
<p>Please reply with your ICP, offer description, target geography, excluded companies, any existing prospect list, preferred sender identity, and compliance constraints.</p>
<h3>Reply handling</h3>
<p>Replies are monitored manually during the pilot. We review the campaign inbox at least once per business day, forward qualified replies to you, and include reply status in your weekly report. Automatic reply classification and CRM sync are not included in the current pilot.</p>
<h3>Risk reversal</h3>
<p>If we cannot launch your reviewed first campaign within 48 hours of receiving complete intake details, you may request a refund before any emails are sent.</p>"""
    return _send_email(customer_email, subject, text, html)


def _send_operator_notification(entry, client_data):
    subject = f"NEW MANAGED PILOT PURCHASE: {entry.get('email')} — {entry.get('amount_dollars')}"
    text = f"""New managed outbound pilot purchase.

Buyer: {entry.get('email')}
Amount: {entry.get('amount_dollars')}
Payment ID: {entry.get('payment_id')}
Product: {entry.get('product')}
Client file: {os.path.join(CLIENTS_DIR, entry.get('email','unknown').replace('@','_at_') + '.json')}

Required operator actions:
1. Confirm buyer received intake instructions.
2. Monitor ops@launchcrate.io for their reply.
3. Review intake within 1 business hour after complete details arrive.
4. Generate and manually review first sequence.
5. Do not send campaign emails until review is complete.
6. Monitor replies manually at least once per business day and include reply status in weekly report.
"""
    html = f"""<h2>New managed outbound pilot purchase</h2>
<p><strong>Buyer:</strong> {entry.get('email')}</p>
<p><strong>Amount:</strong> {entry.get('amount_dollars')}</p>
<p><strong>Payment ID:</strong> {entry.get('payment_id')}</p>
<ol><li>Confirm buyer received intake instructions.</li><li>Monitor inbox for intake reply.</li><li>Review intake within 1 business hour after complete details arrive.</li><li>Generate and manually review sequence.</li><li>Do not send until review is complete.</li></ol>"""
    return _send_email("ops@launchcrate.io", subject, text, html)


def _send_receipt(customer_email, amount_cents, subscription_id):
    subject = f"Outbound SDR — Payment received (${amount_cents/100:.2f})"
    text = f"Your recurring payment of ${amount_cents/100:.2f} was received. Your pipeline is running.\n\nDashboard: https://sdr.launchcrate.io\nManage billing: https://launchcrate.io/portal"
    html = f"<p>Payment of <strong>${amount_cents/100:.2f}</strong> received.</p><p>Your Outbound SDR pipeline is running.</p><p><a href='https://sdr.launchcrate.io'>Open Dashboard</a> | <a href='https://launchcrate.io/portal'>Manage Billing</a></p>"
    _send_email(customer_email, subject, text, html)


def _send_cancellation_email(customer_email):
    subject = "Outbound SDR — Subscription cancelled"
    text = "Your Outbound SDR subscription has been cancelled. Your pipeline will continue through the current billing period.\n\nIf you'd like to reactivate, reply to this email.\n\nSorry to see you go. We'd love your feedback on what we could improve."
    html = "<p>Your Outbound SDR subscription has been cancelled.</p><p>Pipeline continues through current billing period.</p><p>Reply to reactivate or share feedback.</p>"
    _send_email(customer_email, subject, text, html)


def _send_generic_receipt(customer_email, amount):
    subject = f"Payment received — ${amount}"
    text = f"Thanks for your purchase of ${amount}! If you have any questions, reply to this email."
    html = f"<p>Thanks for your purchase of <strong>${amount}</strong>!</p>"
    _send_email(customer_email, subject, text, html)


def create_stripe_portal():
    """Create or get Stripe Customer Portal configuration"""
    try:
        import stripe
        with open('/home/mike/.hermes/.env', 'rb') as f:
            raw = f.read()
        for line in raw.split(b'\n'):
            if b'STRIPE_SECRET_KEY' in line:
                sk = line.split(b'=', 1)[1].strip().decode()
                break
        stripe.api_key = sk
        
        # Check if portal config exists
        configs = stripe.billing_portal.Configuration.list()
        if configs.data:
            print(f"Portal config exists: {configs.data[0].id}")
            return configs.data[0]
        
        # Create portal config
        config = stripe.billing_portal.Configuration.create(
            business_profile={
                "headline": "Outbound SDR - Manage Your Subscription",
                "privacy_policy_url": "https://launchcrate.io/privacy",
                "terms_of_service_url": "https://launchcrate.io/terms",
            },
            features={
                "customer_update": {"enabled": True, "allowed_updates": ["email", "address", "shipping", "phone"]},
                "invoice_history": {"enabled": True},
                "payment_method_update": {"enabled": True},
                "subscription_cancel": {"enabled": True, "mode": "at_period_end", "cancellation_reason": {"enabled": True, "options": ["too_expensive", "missing_features", "not_needed", "other"]}},
                "subscription_pause": {"enabled": True, "pauses": [{"interval": "month", "min_duration": 1}]},
            },
        )
        print(f"Portal config created: {config.id}")
        return config
    except Exception as e:
        print(f"Portal setup error: {e}")
        return None

def create_customer_portal_session(customer_id):
    """Create a one-time portal session URL for a customer"""
    try:
        import stripe
        with open('/home/mike/.hermes/.env', 'rb') as f:
            raw = f.read()
        for line in raw.split(b'\n'):
            if b'STRIPE_SECRET_KEY' in line:
                sk = line.split(b'=', 1)[1].strip().decode()
                break
        stripe.api_key = sk
        
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url="https://launchcrate.io/outbound.html",
        )
        return session.url
    except:
        return None


if __name__ == "__main__":
    # Also set up the Stripe Customer Portal
    print("Setting up Stripe Customer Portal...")
    portal = create_stripe_portal()
    if portal:
        print(f"✅ Portal ready. Customers can manage billing at the portal URL.")
    
    print("\nStripe webhook handler ready")
    print(f"Log file: {LOG_FILE}")
    print(f"Orders dir: {ORDERS_DIR}")
    print(f"Clients dir: {CLIENTS_DIR}")
