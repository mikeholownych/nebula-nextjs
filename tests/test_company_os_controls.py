import json
import sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
import pytest
from company_os.controls import apply_approved_change, critic_gate, memory_status, propose_change, route_task
from outbound_release_gate import DeliveryPurpose, OutboundReleaseGate

def test_critic_blocks_fixed_patterns(tmp_path, monkeypatch):
    monkeypatch.setattr('company_os.controls.RECEIPTS', tmp_path/'receipts.jsonl')
    d=critic_gate('We guarantee conversion results. Book a call.','outreach')
    assert not d.allowed and 'unsupported_guarantee' in d.issues and 'call_first_cta' in d.issues
    assert critic_gate('Evidence-backed audit with self-serve checkout.','outreach').allowed

def test_outbound_critic_blocks_before_reservation(tmp_path, monkeypatch):
    monkeypatch.setattr('company_os.controls.RECEIPTS', tmp_path/'receipts.jsonl')
    lead_db=tmp_path/'leads.db'
    with sqlite3.connect(lead_db) as c:
        c.execute("CREATE TABLE leads (email TEXT PRIMARY KEY COLLATE NOCASE, stage TEXT NOT NULL, bounce_type TEXT NOT NULL DEFAULT '')")
        c.execute("INSERT INTO leads(email, stage) VALUES ('lead@example.com','discovered')")
    replied=tmp_path/'replied.jsonl'; replied.touch()
    gate=OutboundReleaseGate(state_db=tmp_path/'outbound.db', lead_db=lead_db, replied_path=replied, disable_marker=tmp_path/'OUTREACH_DISABLED')
    d=gate.reserve('lead@example.com','campaign:lead:critic',purpose=DeliveryPurpose.MARKETING,draft='We guarantee conversion results. Book a call.')
    assert not d.allowed and d.reason.startswith('critic_blocked:')
    with sqlite3.connect(tmp_path/'outbound.db') as c: assert c.execute('SELECT COUNT(*) FROM delivery_reservations').fetchone()[0] == 0

def test_unknown_route_is_cautious(tmp_path, monkeypatch):
    monkeypatch.setattr('company_os.controls.RECEIPTS', tmp_path/'receipts.jsonl')
    d=route_task('unknown_task'); assert d['tier']=='deep' and d['critic'] and d['human_approval']

def test_bounded_loop_and_revert(tmp_path, monkeypatch):
    monkeypatch.setattr('company_os.controls.PROPOSALS', tmp_path/'proposals.jsonl'); monkeypatch.setattr('company_os.controls.RECEIPTS', tmp_path/'receipts.jsonl'); target=tmp_path/'policy.json'; target.write_text('{"memory_ttl_days":90}')
    with pytest.raises(ValueError): propose_change('arbitrary_prompt_edit','x','a','b','drift')
    p=propose_change('memory_ttl_days',str(target),90,120,'bounded test')
    assert apply_approved_change(p,'APPROVE',score_before=9,score_after=8,target_path=target)['status']=='reverted'
    r=apply_approved_change(p,'APPROVE',score_before=8,score_after=9,target_path=target); assert r['status']=='applied' and Path(r['backup']).exists()

def test_memory_expiry_respects_pin():
    now=datetime(2026,8,3,tzinfo=timezone.utc); result=memory_status([{'id':'old','created_at':(now-timedelta(days=91)).isoformat(),'ttl_days':90},{'id':'pin','created_at':(now-timedelta(days=900)).isoformat(),'pinned':True}],now=now)
    assert result[0]['status']=='expired' and result[1]['status']=='active'
