#!/usr/bin/env python3
"""Send the fresh public-trigger conversion batch through Nebula's gate."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path('/home/mike/nebula')
sys.path.insert(0, str(ROOT))

from agentmail_client import AgentMailClient
from hunter_parallel import HunterAdapter
from lead_store import LeadStore
from mailcheck_adapter import MailCheckAdapter, MailCheckError
from send_window import in_send_window

BATCH = ROOT / 'ops' / 'fresh_trigger_batch_20260815.json'
BETA_CONFIG = Path('/etc/nebula-mailcheck-beta.conf')


def beta_setting(name: str, default: str = '') -> str:
    value = os.environ.get(name)
    if value is not None:
        return value
    try:
        for line in BETA_CONFIG.read_text().splitlines():
            if line.startswith(name + '='):
                return line.split('=', 1)[1].strip()
    except OSError:
        pass
    return default


def main() -> int:
    batch = json.loads(BATCH.read_text())
    db = LeadStore()
    am = AgentMailClient()
    hunter = HunterAdapter()
    mc = MailCheckAdapter()
    dry_run = '--dry-run' in sys.argv
    if not dry_run and beta_setting('MAILCHECK_BETA_ENABLED') != '1':
        print('blocked: MAILCHECK_BETA_ENABLED is not 1')
        return 2
    max_prospects = max(1, int(beta_setting('MAILCHECK_BETA_MAX_PROSPECTS', '50')))
    sent = 0
    blocked = 0
    processed = 0

    for prospect in batch['prospects']:
        if not dry_run and processed >= max_prospects:
            break
        processed += 1
        email = prospect['contact_route'].strip().lower()
        if not in_send_window(email) and not dry_run:
            print(f"outside_send_window: {email}")
            blocked += 1
            continue
        existing = db.get_lead(email)
        if existing:
            print(f"blocked_existing_lead: {email}")
            blocked += 1
            continue
        if dry_run:
            print(f"DRY_RUN: {email} | {prospect['message'].splitlines()[0]}")
            continue

        db.upsert_lead(
            email=email,
            url=prospect['site'],
            stage='discovered',
            source='fresh_public_trigger_show_hn_20260813',
            trigger_context=prospect['trigger'],
            notes=json.dumps({
                'hn_post': prospect['hn_post'],
                'audit_score': prospect['audit_score'],
                'finding': prospect['finding'],
            }),
        )
        client_id = 'marketing:fresh-trigger:20260813:' + prospect['name'].lower().replace(' ', '-')
        hunter_result = hunter.verify(email)
        hunter_error = hunter_result.get('error', '')
        print(f"hunter_observation: {prospect['name']} | result={hunter_result.get('result', '')} | score={hunter_result.get('score', '')} | error={hunter_error}")
        try:
            mc_decision = mc.verify_for_outreach(
                email,
                lead_id=client_id,
                source='fresh_public_trigger_show_hn_20260813',
            )
        except (MailCheckError, ValueError) as exc:
            print(f"mailcheck_blocked: {email} | {exc}")
            blocked += 1
            continue
        if not mc_decision.allowed:
            print(f"mailcheck_blocked: {email} | {mc_decision.classification} | {mc_decision.reason}")
            blocked += 1
            continue
        result = am.send(
            to=[email],
            subject=prospect['message'].splitlines()[0].replace('Subject: ', '', 1),
            text='\n'.join(prospect['message'].splitlines()[2:]),
            client_id=client_id,
            labels=['targeted-outreach'],
        )
        if result.get('_error'):
            print(f"blocked_or_failed: {email} | {result.get('_error')} | {result.get('_reason', '')}")
            blocked += 1
            continue
        db.advance_stage(email, 'contacted', source='fresh_public_trigger_show_hn_20260813')
        message_id = result.get('message_id') or result.get('id', '')
        try:
            mc.record_outcome(
                mc_decision.verification_id,
                email=email,
                outcome='SENT',
                source_system='nebula-outreach',
                provider='agentmail',
            )
        except MailCheckError as exc:
            print(f"mailcheck_outcome_record_failed: {email} | {exc}")
        print(f"sent: {email} | provider_message_id={result.get('message_id') or result.get('id', '[REDACTED]')}")
        sent += 1

    print(json.dumps({'sent': sent, 'blocked': blocked, 'dry_run': dry_run}))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
