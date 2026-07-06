#!/usr/bin/env python3
"""
FULL SYSTEM AUDIT — 72-Hour Challenge Infrastructure
Checks every component: infrastructure, payment, email, tracking, crons
"""
import subprocess
import json
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime

print("\n" + "="*70)
print("🔍 FULL SYSTEM AUDIT — AUTONOMOUS BUSINESS OS")
print("="*70)
print(f"Time: {datetime.now().isoformat()}")
print("="*70 + "\n")

FAILURES = []
WARNINGS = []
SUCCESSES = []

def section(title):
    """Print section header"""
    print(f"\n{'─'*70}")
    print(f"📋 {title}")
    print(f"{'─'*70}")

def check(name, result, critical=False):
    """Log check result"""
    if result:
        print(f"  ✅ {name}")
        SUCCESSES.append(name)
    else:
        print(f"  ❌ {name}")
        if critical:
            FAILURES.append(name)
        else:
            WARNINGS.append(name)

# ====== 1. INFRASTRUCTURE ======
section("1. INFRASTRUCTURE")

# Local endpoint
try:
    req = urllib.request.Request("http://localhost:8765/", method='HEAD', timeout=3)
    with urllib.request.urlopen(req) as resp:
        check("Local Endpoint (localhost:8765)", resp.status == 200, critical=True)
except Exception as e:
    check("Local Endpoint (localhost:8765)", False, critical=True)
    print(f"       Error: {e}")

# Cloudflare tunnel
try:
    req = urllib.request.Request("https://nebulacomponents.shop/", method='HEAD', timeout=5)
    with urllib.request.urlopen(req) as resp:
        check("Cloudflare Tunnel", resp.status == 200, critical=True)
except urllib.error.HTTPError as e:
    if e.code == 530:
        check("Cloudflare Tunnel", False, critical=True)
        print(f"       Error: HTTP 530 (tunnel endpoint unreachable)")
    else:
        check("Cloudflare Tunnel", False, critical=True)
        print(f"       Error: HTTP {e.code}")
except Exception as e:
    check("Cloudflare Tunnel", False, critical=True)
    print(f"       Error: {e}")

# ====== 2. EMAIL INFRASTRUCTURE ======
section("2. EMAIL INFRASTRUCTURE")

# AgentMail credentials
cred_file = Path("/home/mike/.hermes/secrets/agentmail.key")
if cred_file.exists():
    key = cred_file.read_text().strip()
    if key.startswith("am_us_") and len(key) >= 60:
        check("AgentMail API Key Stored", True)
    else:
        check("AgentMail API Key Stored", False, critical=True)
        print(f"       Invalid format: {key[:20]}...")
else:
    check("AgentMail API Key Stored", False, critical=True)
    print(f"       File not found: {cred_file}")

# SMTP connectivity
try:
    import smtplib, ssl
    ctx = ssl.create_default_context()
    with smtplib.SMTP_SSL("smtp.agentmail.to", 465, context=ctx, timeout=5) as s:
        key = cred_file.read_text().strip()
        s.login("templates@agentmail.to", key)
        check("SMTP Connectivity (templates@)", True, critical=True)
except Exception as e:
    check("SMTP Connectivity (templates@)", False, critical=True)
    print(f"       Error: {e}")

# ====== 3. PAYMENT INFRASTRUCTURE ======
section("3. PAYMENT INFRASTRUCTURE")

# Stripe config
stripe_config_file = Path("/home/mike/nebula/stripe_97_config.json")
if stripe_config_file.exists():
    with open(stripe_config_file) as f:
        config = json.load(f)
        status = config.get("status", "UNKNOWN")
        if "PENDING" in status or "not created" in status.lower():
            check("Stripe $97 Product Created", False)
            print(f"       Status: {status}")
        else:
            check("Stripe $97 Product Created", True)
else:
    check("Stripe $97 Product Created", False)
    print(f"       Config file not found")

# Check if Stripe checkout link exists
stripe_link_file = Path("/home/mike/nebula/stripe_97_checkout_link.txt")
if stripe_link_file.exists():
    link = stripe_link_file.read_text().strip()
    if link.startswith("https://checkout.stripe.com"):
        check("Stripe Checkout Link Valid", True)
    else:
        check("Stripe Checkout Link Valid", False)
        print(f"       Invalid URL: {link[:50]}")
else:
    check("Stripe Checkout Link Valid", False)
    print(f"       Checkout link not saved")

# Gumroad product
gumroad_product_file = Path("/home/mike/nebula/gumroad_7_product.json")
if gumroad_product_file.exists():
    with open(gumroad_product_file) as f:
        product = json.load(f)
        if product.get("published") and product.get("url"):
            check("Gumroad $7 Template Published", True)
        else:
            check("Gumroad $7 Template Published", False)
            print(f"       Published: {product.get('published')}, URL: {product.get('url')}")
else:
    check("Gumroad $7 Template Published", False)
    print(f"       Product not created")

# Real transactions (check if actual Stripe events exist, not test)
payments_log = Path("/home/mike/nebula/payments.log")
real_transactions = 0
test_transactions = 0
if payments_log.exists():
    with open(payments_log) as f:
        for line in f:
            if "cs_test_" in line or "test_" in line.lower():
                test_transactions += 1
            elif "ch_" in line or "cs_" in line and "test" not in line:
                real_transactions += 1
    check(f"Real Transactions (actual revenue)", real_transactions > 0, critical=True)
    if real_transactions == 0:
        print(f"       Found: {test_transactions} test, {real_transactions} real")
    if test_transactions > 0:
        print(f"       ⚠️  Test data detected: {test_transactions} transactions")
else:
    check("Real Transactions", False)
    print(f"       Payments log not found")

# ====== 4. CAMPAIGN INFRASTRUCTURE ======
section("4. CAMPAIGN INFRASTRUCTURE")

# Wave 1 sent
wave1_results = Path("/home/mike/nebula/audit_blast_results.json")
if wave1_results.exists():
    with open(wave1_results) as f:
        results = json.load(f)
        sent = results.get("sent", 0)
        failed = results.get("failed", 0)
        check(f"Wave 1 Emails Sent ({sent} emails, {failed} failed)", sent > 0 and failed == 0)
else:
    check("Wave 1 Emails Sent", False)

# Wave 1 replies
inbound_file = Path("/home/mike/nebula/inbound_replies.log")
replies = 0
if inbound_file.exists():
    content = inbound_file.read_text()
    if "No replies" not in content:
        # Count actual replies
        try:
            import re
            replies = len(re.findall(r"From:", content))
        except:
            pass
    check(f"Wave 1 Replies Received ({replies} replies)", replies > 0)
else:
    check("Wave 1 Replies Received", False)
    print(f"       Awaiting replies (expected 6-24h after send)")

# Wave 2 script
wave2_script = Path("/home/mike/nebula/wave2_dual_sender.py")
check("Wave 2 Script Ready", wave2_script.exists())

# Auto-responder script
auto_responder = Path("/home/mike/nebula/auto_responder_dual_inbox.py")
check("Auto-Responder Script Ready", auto_responder.exists())

# ====== 5. CRON JOBS ======
section("5. CRON JOBS & AUTOMATION")

try:
    result = subprocess.run(
        ["hermes", "cron", "list"],
        capture_output=True,
        text=True,
        timeout=10
    )
    cron_output = result.stdout
    
    crons_to_check = [
        ("tunnel_liveliness", "Tunnel liveliness monitor"),
        ("tunnel_watchdog", "Tunnel watchdog"),
        ("audit_blast_wave2", "Wave 2 audit blast"),
        ("challenge_checkin", "Self-audit checkpoints"),
    ]
    
    for cron_id, name in crons_to_check:
        if cron_id in cron_output or name.lower() in cron_output.lower():
            check(name, True)
        else:
            check(name, False)
            print(f"       Not found in cron list")
    
except Exception as e:
    print(f"  ❌ Could not list cron jobs: {e}")

# ====== 6. TRACKING & LOGGING ======
section("6. TRACKING & LOGGING")

# Tunnel metrics
tunnel_metrics = Path("/home/mike/nebula/tunnel_metrics.json")
check("Tunnel metrics file exists", tunnel_metrics.exists())

# Tunnel liveliness log
tunnel_log = Path("/home/mike/nebula/tunnel_liveliness.log")
check("Tunnel liveliness log exists", tunnel_log.exists())

# Pre-campaign validation report
validation_report = Path("/home/mike/nebula/pre_campaign_validation.json")
check("Pre-campaign validation report", validation_report.exists())

# ====== 7. DOCUMENTATION ======
section("7. DOCUMENTATION & PROCEDURES")

docs_to_check = [
    ("Tunnel validation system", Path("/home/mike/nebula/TUNNEL_VALIDATION_SYSTEM.md")),
    ("Dual funnel strategy", Path("/home/mike/nebula/DUAL_FUNNEL_STRATEGY.md")),
    ("Skills applied", Path("/home/mike/nebula/SKILLS_APPLIED.md")),
    ("B-OS competitive analysis", Path("/home/mike/nebula/B-OS_COMPETITIVE_ANALYSIS.md")),
]

for name, path in docs_to_check:
    check(name, path.exists())

# ====== 8. CRITICAL ISSUES ======
section("8. CRITICAL ISSUES")

if not wave1_results.exists():
    FAILURES.append("CRITICAL: Wave 1 results not recorded")
    print("  🚨 Wave 1 execution not tracked")

if not cred_file.exists():
    FAILURES.append("CRITICAL: AgentMail credentials missing")
    print("  🚨 Cannot send emails without credentials")

stripe_status = "UNKNOWN"
if stripe_config_file.exists():
    with open(stripe_config_file) as f:
        config = json.load(f)
        stripe_status = config.get("status", "")

if "PENDING" in stripe_status:
    FAILURES.append("CRITICAL: Stripe product not created")
    print("  🚨 Cannot charge customers without Stripe product")
    print(f"      Status: {stripe_status}")

if real_transactions == 0:
    FAILURES.append("CRITICAL: Zero real revenue (only test data)")
    print("  🚨 No real customer transactions yet (expected for Wave 1)")

# ====== 9. RECOMMENDATIONS ======
section("9. IMMEDIATE ACTION ITEMS")

if "PENDING" in stripe_status or not stripe_link_file.exists():
    print("  1. CREATE STRIPE $97 PRODUCT")
    print("     - Go to Stripe Dashboard")
    print("     - Create product: 'Landing Page Audit'")
    print("     - Set price: $97 USD")
    print("     - Create checkout link")
    print("     - Save checkout URL to: /home/mike/nebula/stripe_97_checkout_link.txt")

if not gumroad_product_file.exists():
    print("  2. CREATE GUMROAD $7 TEMPLATE")
    print("     - Upload template pack to Gumroad")
    print("     - Set price: $7 USD")
    print("     - Get public URL")
    print("     - Save to: /home/mike/nebula/gumroad_7_product.json")

if replies == 0:
    print("  3. MONITOR WAVE 1 REPLIES")
    print("     - Check inbox in 6-24 hours")
    print("     - Auto-responder should handle replies automatically")
    print("     - Manually verify if replies arrive but don't route correctly")

if "530" in str(cron_output) or "tunnel" in str(FAILURES).lower():
    print("  4. VERIFY CLOUDFLARE TUNNEL")
    print("     - Check if cloudflared process is running")
    print("     - Tunnel watchdog should auto-restart if crashed")
    print("     - Run: ps aux | grep cloudflared")

# ====== FINAL REPORT ======
print("\n" + "="*70)
print("📊 AUDIT SUMMARY")
print("="*70)

total_checks = len(SUCCESSES) + len(WARNINGS) + len(FAILURES)
print(f"\n✅ Passed:  {len(SUCCESSES)}/{total_checks}")
print(f"⚠️  Warnings: {len(WARNINGS)}/{total_checks}")
print(f"❌ Critical: {len(FAILURES)}/{total_checks}")

if FAILURES:
    print("\n❌ CRITICAL FAILURES:")
    for failure in FAILURES:
        print(f"   • {failure}")

if WARNINGS:
    print("\n⚠️  WARNINGS:")
    for warning in WARNINGS:
        print(f"   • {warning}")

print("\n" + "="*70)
if FAILURES:
    print("🚫 AUDIT FAILED — Fix critical issues before Wave 2")
    print("="*70 + "\n")
    exit(1)
else:
    print("✅ AUDIT PASSED — Systems ready for deployment")
    print("="*70 + "\n")
    exit(0)
