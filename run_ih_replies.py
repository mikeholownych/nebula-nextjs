"""
IH Reply Runner
===============
Reads /home/mike/nebula/reply_drafts.jsonl for unposted drafts
(where posted=false or the field is missing), calls ih_bot.post_reply
for each, then marks posted=true and records posted_at timestamp.

JSONL format (one JSON object per line):
{
  "thread_url": "https://www.indiehackers.com/post/...",
  "reply_text": "Great insight! ...",
  "posted": false          // optional; if missing, treated as unposted
}

After posting, each record is updated in-place:
{
  ...,
  "posted": true,
  "posted_at": "2025-06-29T14:35:00Z"
}
"""

import json
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path

# ── Path constants ─────────────────────────────────────────────────────────────
NEBULA_DIR = Path(__file__).parent
DRAFTS_FILE = NEBULA_DIR / "reply_drafts.jsonl"
CREDS_PATH = Path.home() / ".hermes" / "secrets" / "ih_creds.json"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [run_ih_replies] %(levelname)s %(message)s",
)
log = logging.getLogger("run_ih_replies")

# Import bot (same venv, same directory)
sys.path.insert(0, str(NEBULA_DIR))
from ih_bot import post_reply


# ── Helpers ────────────────────────────────────────────────────────────────────

def load_drafts(path: Path) -> list[dict]:
    """Read all records from a JSONL file."""
    if not path.exists():
        log.warning("Drafts file not found: %s — nothing to do", path)
        return []
    records = []
    with path.open() as f:
        for lineno, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError as e:
                log.error("Skipping malformed JSON on line %d: %s", lineno, e)
    return records


def save_drafts(path: Path, records: list[dict]):
    """Write all records back to the JSONL file (atomic via temp)."""
    tmp = path.with_suffix(".jsonl.tmp")
    with tmp.open("w") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")
    tmp.replace(path)


def is_unposted(record: dict) -> bool:
    """Return True if this draft has not been posted yet."""
    return not record.get("posted", False)


# ── Main ───────────────────────────────────────────────────────────────────────

def run():
    records = load_drafts(DRAFTS_FILE)
    if not records:
        log.info("No drafts loaded — exiting.")
        return

    unposted = [r for r in records if is_unposted(r)]
    log.info(
        "Loaded %d total drafts, %d unposted", len(records), len(unposted)
    )

    if not unposted:
        log.info("All drafts already posted — nothing to do.")
        return

    posted_count = 0
    failed_count = 0

    for i, draft in enumerate(unposted, 1):
        thread_url = draft.get("thread_url", "").strip()
        reply_text = draft.get("reply_text", "").strip()

        if not thread_url:
            log.warning("Draft %d missing thread_url — skipping: %s", i, draft)
            continue
        if not reply_text:
            log.warning("Draft %d missing reply_text — skipping: %s", i, draft)
            continue

        log.info(
            "[%d/%d] Posting reply to: %s", i, len(unposted), thread_url
        )
        try:
            post_reply(thread_url, reply_text, creds_path=CREDS_PATH)
            draft["posted"] = True
            draft["posted_at"] = datetime.now(timezone.utc).strftime(
                "%Y-%m-%dT%H:%M:%SZ"
            )
            posted_count += 1
            log.info("✓ Reply posted — thread: %s", thread_url)
        except Exception as e:
            failed_count += 1
            log.error("✗ Failed to post reply [%s]: %s", thread_url, e)
            # Do NOT mark as posted; will retry next run

        # Persist after every post so partial progress is saved
        save_drafts(DRAFTS_FILE, records)

    log.info(
        "Done — posted: %d, failed: %d, skipped: %d",
        posted_count,
        failed_count,
        len(unposted) - posted_count - failed_count,
    )


if __name__ == "__main__":
    run()
