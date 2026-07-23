from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
SKIP_PARTS = {".git", ".legacy", ".worktrees", "tests", "venv", "himalaya-venv", "node_modules"}
ALLOWED_RAW_CLIENTS = {
    ROOT / "agentmail_client.py",
    ROOT / "scripts" / "check_agentmail_inbox.py",
}
BANNED = {
    "AgentMail SMTP": re.compile(r"smtp\.agentmail\.to", re.IGNORECASE),
    "raw AgentMail API": re.compile(r"api\.agentmail\.to", re.IGNORECASE),
    "raw AgentMail send endpoint": re.compile(r"messages/send", re.IGNORECASE),
    "direct transport call": re.compile(r"\._transport\s*\("),
    "Resend bypass": re.compile(r"\bresend_client\b"),
    "Resend provider endpoint": re.compile(r"api\.resend\.com", re.IGNORECASE),
    "SMTP library": re.compile(r"(?:^|\n)\s*(?:import|from)\s+smtplib\b"),
    "SMTP provider endpoint": re.compile(r"smtp\.[a-z0-9.-]+", re.IGNORECASE),
    "SMTP send call": re.compile(r"\.(?:sendmail|send_message)\s*\("),
}


def test_outbound_delivery_has_one_authority():
    offenders = []
    source_suffixes = {".py", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".sh"}
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in source_suffixes:
            continue
        if path in ALLOWED_RAW_CLIENTS or path == Path(__file__).resolve():
            continue
        if any(part in SKIP_PARTS for part in path.relative_to(ROOT).parts):
            continue
        text = path.read_text(errors="replace")
        for label, pattern in BANNED.items():
            if pattern.search(text):
                offenders.append(f"{path.relative_to(ROOT)}: {label}")

    assert offenders == [], "Outbound bypasses found:\n" + "\n".join(offenders)
