#!/usr/bin/env python3
"""Legacy IMAP smoke helper.

Uses environment variables only; no hard-coded credentials and no import-time
network side effects.
"""
from __future__ import annotations

from email.message import Message
import email
import imaplib
import os


def send_auto_response(msg: Message) -> None:
    """Hook for legacy callers; intentionally no-op by default."""
    return None


def check_email() -> int:
    host = os.environ.get("IMAP_HOST")
    username = os.environ.get("IMAP_USERNAME")
    password = os.environ.get("IMAP_PASSWORD")
    mailbox = os.environ.get("IMAP_MAILBOX", "INBOX")
    subject = os.environ.get("IMAP_SUBJECT", "Re: $97 audit offer")
    if not host or not username or not password:
        print("Skipping IMAP check: IMAP_HOST/IMAP_USERNAME/IMAP_PASSWORD not set")
        return 0

    with imaplib.IMAP4_SSL(host) as mail:
        mail.login(username, password)
        mail.select(mailbox)
        _result, data = mail.search(None, f'SUBJECT "{subject}"')
        for message_id in data[0].split():
            _result, fetched = mail.fetch(message_id, "(RFC822)")
            for response_part in fetched:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    send_auto_response(msg)
    return 0


if __name__ == "__main__":
    raise SystemExit(check_email())
