#!/usr/bin/env python3
"""Validate Nebula's state/ownership ledger without mutating it."""
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LEDGER=ROOT/'ops/state-ownership-ledger.json'
data=json.loads(LEDGER.read_text())
errors=[]
ids=set()
for life in data.get('lifecycles',[]):
 lid=life.get('id')
 if not lid or lid in ids: errors.append(f'duplicate/missing lifecycle id: {lid}')
 ids.add(lid)
 if not life.get('owner'): errors.append(f'{lid}: missing owner')
 source=ROOT/life.get('source_of_truth','')
 if not source.exists(): errors.append(f'{lid}: missing source_of_truth {life.get("source_of_truth")}')
 states=set(life.get('states',[]))
 for t in life.get('transitions',[]):
  if t.get('from') not in states: errors.append(f'{lid}: invalid transition from {t.get("from")}')
  if t.get('to') not in states: errors.append(f'{lid}: invalid transition to {t.get("to")}')
  if not t.get('evidence'): errors.append(f'{lid}: transition {t.get("from")}->{t.get("to")} has no evidence')
 if not life.get('retry',{}).get('policy'): errors.append(f'{lid}: missing retry policy')
priority_ids=set()
for gap in data.get('priority_gaps',[]):
 gid=gap.get('id')
 if not gid or gid in priority_ids: errors.append(f'duplicate/missing gap id: {gid}')
 priority_ids.add(gid)
 if gap.get('severity') not in {'critical','high','medium','low'}: errors.append(f'{gid}: invalid severity')
 if not gap.get('evidence_needed'): errors.append(f'{gid}: no evidence needed')
if errors:
 print(json.dumps({'status':'invalid','errors':errors},indent=2)); raise SystemExit(1)
print(json.dumps({'status':'valid','lifecycles':len(ids),'priority_gaps':len(priority_ids),'verified':data.get('last_verified')},indent=2))
