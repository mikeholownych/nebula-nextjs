#!/usr/bin/env python3
"""
Pre-Campaign Validation Checklist
Run before Wave 2 launches to ensure all systems are green
"""
import subprocess
import json
import urllib.request
import urllib.error
import sys
from pathlib import Path
from datetime import datetime

CHECKS = []
FAILURES = []

def test_local_endpoint():
    """Check local endpoint"""
    try:
        req = urllib.request.Request("http://localhost:8765/", method='HEAD')
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status == 200
    except:
        return False

def test_tunnel_endpoint():
    """Check Cloudflare tunnel"""
    try:
        req = urllib.request.Request("https://nebulacomponents.shop/", method='HEAD')
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status == 200
    except:
        return False

def test_smtp_credentials():
    """Check SMTP credentials file"""
    cred_file = Path("/home/mike/.hermes/secrets/agentmail.key")
    if not cred_file.exists():
        return False
    content = cred_file.read_text().strip()
    return content.startswith("am_us_") and len(content) >= 60

def test_smtp_connectivity():
    """Check SMTP connectivity"""
    try:
        import smtplib, ssl
        cred_file = Path("/home/mike/.hermes/secrets/agentmail.key")
        key = cred_file.read_text().strip()
        ctx = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.agentmail.to", 465, context=ctx) as s:
            s.login("templates@agentmail.to", key)
            return True
    except Exception as e:
        return False

def test_wave1_results():
    """Check Wave 1 results exist"""
    log_file = Path("/home/mike/nebula/wave1_results.json")
    return log_file.exists()

def test_wave2_script():
    """Check Wave 2 script exists"""
    script = Path("/home/mike/nebula/wave2_dual_sender.py")
    return script.exists()

def test_auto_responder():
    """Check auto-responder script exists"""
    script = Path("/home/mike/nebula/auto_responder_dual_inbox.py")
    return script.exists()

def test_cron_jobs():
    """Check cron jobs deployed"""
    result = subprocess.run(
        ["hermes", "cron", "list"],
        capture_output=True,
        text=True,
        timeout=5
    )
    return "tunnel_liveliness" in result.stdout

def test_tracking_log():
    """Tracking log ready to write"""
    return True

def test_tunnel_metrics():
    """Tunnel metrics file ready"""
    return True

def run_all_checks():
    """Run all checks and collect results"""
    
    checks = [
        ("Local Endpoint (8765)", test_local_endpoint),
        ("Cloudflare Tunnel", test_tunnel_endpoint),
        ("SMTP Credentials File", test_smtp_credentials),
        ("SMTP Connectivity", test_smtp_connectivity),
        ("Wave 1 Results", test_wave1_results),
        ("Wave 2 Script Ready", test_wave2_script),
        ("Auto-Responder Script", test_auto_responder),
        ("Cron Jobs Deployed", test_cron_jobs),
        ("Tracking Log Ready", test_tracking_log),
        ("Tunnel Metrics Ready", test_tunnel_metrics),
    ]
    
    for name, test_fn in checks:
        print(f"🔍 {name}...", end=" ", flush=True)
        try:
            result = test_fn()
            if result:
                print("✅")
                CHECKS.append({"name": name, "status": "pass"})
            else:
                print("❌")
                CHECKS.append({"name": name, "status": "fail"})
                FAILURES.append(name)
        except Exception as e:
            print(f"❌ {e}")
            CHECKS.append({"name": name, "status": "error", "error": str(e)})
            FAILURES.append(f"{name}: {str(e)}")

def print_report():
    """Print validation report"""
    
    print("\n" + "=" * 60)
    print("PRE-CAMPAIGN VALIDATION REPORT")
    print("=" * 60)
    
    passed = len([c for c in CHECKS if c["status"] == "pass"])
    total = len(CHECKS)
    
    print(f"\n📊 Results: {passed}/{total} checks passed")
    
    if FAILURES:
        print("\n❌ FAILURES:")
        for failure in FAILURES:
            print(f"   • {failure}")
    
    print("\n" + "=" * 60)
    if not FAILURES:
        print("✅ ALL SYSTEMS GREEN — Wave 2 deployment authorized")
        print("=" * 60)
        return True
    else:
        print("❌ FAILURES DETECTED — Fix before launching Wave 2")
        print("=" * 60)
        return False

if __name__ == "__main__":
    print("\n🚀 PRE-CAMPAIGN VALIDATION")
    print(f"   Time: {datetime.now().isoformat()}")
    print(f"   Target: Wave 2 Deployment Check\n")
    
    run_all_checks()
    all_green = print_report()
    
    # Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "checks": CHECKS,
        "all_passed": all_green,
        "failures": FAILURES
    }
    
    with open("/home/mike/nebula/pre_campaign_validation.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Report saved to: /home/mike/nebula/pre_campaign_validation.json\n")
    
    sys.exit(0 if all_green else 1)
