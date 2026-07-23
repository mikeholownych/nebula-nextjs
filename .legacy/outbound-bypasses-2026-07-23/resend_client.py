#!/usr/bin/env python3
"""
Resend backup email client for Nebula Components.
Drop-in API-compatible with AgentMailClient.send().

Used by email_sender.py when AgentMail returns 403/5xx or is unavailable.
Requires: from domain verified in Resend dashboard (nebulashop domain or resend onboarding domain).
Key stored at: /home/mike/nebula/secrets/resend.key
"""
import json
import requests
from pathlib import Path

RESEND_KEY_FILE = Path('/home/mike/nebula/secrets/resend.key')
RESEND_API = 'https://api.resend.com/emails'
# Use verified sender — update once domain is added to Resend dashboard
RESEND_FROM = 'Nebula Components <hello@nebulacomponents.shop>'


def load_resend_key() -> str | None:
    try:
        return RESEND_KEY_FILE.read_text().strip()
    except Exception:
        return None


def send(to: list[str], subject: str, text: str, from_addr: str = None) -> dict:
    """
    Send via Resend API.
    Returns: {'message_id': str} on success, {'_error': int, '_body': str} on failure.
    """
    key = load_resend_key()
    if not key:
        return {'_error': 500, '_body': 'No Resend API key found'}

    sender = from_addr or RESEND_FROM
    payload = {
        'from': sender,
        'to': to,
        'subject': subject,
        'text': text,
    }

    try:
        r = requests.post(
            RESEND_API,
            headers={
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
            },
            json=payload,
            timeout=15,
        )
        body = r.text
        try:
            data = r.json()
        except Exception:
            data = {}

        if r.ok:
            msg_id = data.get('id', '')
            return {'message_id': msg_id}
        else:
            return {'_error': r.status_code, '_body': body[:200]}

    except requests.exceptions.Timeout:
        return {'_error': 408, '_body': 'Resend API timeout'}
    except Exception as e:
        return {'_error': 500, '_body': str(e)[:200]}


def test_connection() -> bool:
    """Quick connectivity check — doesn't send a real email."""
    key = load_resend_key()
    if not key:
        print('[resend] No API key')
        return False
    r = requests.get(
        'https://api.resend.com/domains',
        headers={'Authorization': f'Bearer {key}'},
        timeout=10,
    )
    if r.ok:
        data = r.json()
        domains = [d.get('name') for d in data.get('data', [])]
        print(f'[resend] Connected. Verified domains: {domains}')
        return True
    else:
        print(f'[resend] Auth failed: {r.status_code} {r.text[:100]}')
        return False


if __name__ == '__main__':
    test_connection()
