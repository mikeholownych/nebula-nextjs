#!/usr/bin/env python3
"""Fail-closed AI operations controls for Nebula."""
from __future__ import annotations
import fcntl, hashlib, json, re, shutil, uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dataclasses import dataclass
from typing import Any
BASE=Path('/home/mike/nebula'); CONTROL_DIR=BASE/'company_os'; RECEIPTS=CONTROL_DIR/'control_receipts.jsonl'; PROPOSALS=CONTROL_DIR/'improvement_proposals.jsonl'; ROLLBACK_DIR=CONTROL_DIR/'rollback'; MEMORY_REGISTRY=CONTROL_DIR/'memory_registry.json'
SECRET_RE=re.compile(r'(?:sk_(?:live|test)_|whsec_|AKIA[0-9A-Z]{16}|BEGIN (?:RSA|OPENSSH|EC|DSA) PRIVATE)',re.I)
FIXED_RULES={'outreach':(('unsupported_guarantee',re.compile(r'(?:guarantee|guaranteed).{0,50}(?:conversion|revenue|results)',re.I)),('call_first_cta',re.compile(r'\b(?:book|schedule)\s+(?:a\s+)?call\b|reply\s+[\'\"]?yes[\'\"]?',re.I)),('secret_exposure',SECRET_RE)),'audit_delivery':(('unsupported_guarantee',re.compile(r'(?:guarantee|guaranteed).{0,60}(?:conversion|revenue|results)',re.I)),('secret_exposure',SECRET_RE)),'content':(('unsupported_guarantee',re.compile(r'(?:guarantee|guaranteed).{0,60}(?:conversion|revenue|results)',re.I)),('secret_exposure',SECRET_RE)),'fulfillment':(('secret_exposure',SECRET_RE),('unbound_fulfillment',re.compile(r'(?:delivered|fulfill|implementation).{0,80}(?:without|missing).{0,30}(?:audit[_ -]?id|order[_ -]?id|customer)',re.I)))}
ROUTING_POLICY={'scrape':{'tier':'bulk','critic':False,'human_approval':False},'format':{'tier':'bulk','critic':False,'human_approval':False},'classify':{'tier':'bulk','critic':True,'human_approval':False},'outreach_draft':{'tier':'creative','critic':True,'human_approval':True},'audit':{'tier':'audit','critic':True,'human_approval':False},'code_change':{'tier':'deep','critic':True,'human_approval':True},'pricing_or_legal':{'tier':'reasoning','critic':True,'human_approval':True},'fulfillment':{'tier':'reasoning','critic':True,'human_approval':True}}
def _iso(): return datetime.now(timezone.utc).isoformat().replace('+00:00','Z')
def _append(path,payload):
 path.parent.mkdir(parents=True,exist_ok=True)
 with path.open('a',encoding='utf-8') as f:
  fcntl.flock(f.fileno(),fcntl.LOCK_EX); f.write(json.dumps(payload,sort_keys=True)+'\n'); f.flush(); fcntl.flock(f.fileno(),fcntl.LOCK_UN)
def receipt(kind,status,**details):
 p={'receipt_id':str(uuid.uuid4()),'occurred_at':_iso(),'kind':kind,'status':status,**details}; _append(RECEIPTS,p); return p
@dataclass(frozen=True)
class CriticDecision: allowed: bool; issues: tuple[str,...]; rules: tuple[str,...]; receipt_id: str
def critic_gate(draft:str,kind='content',required_fields:tuple[str,...]=()):
 text=str(draft or ''); issues=[]
 if not text.strip(): issues.append('empty_draft')
 for field in required_fields:
  if field not in text: issues.append('missing_required:'+field)
 rules=FIXED_RULES.get(kind,FIXED_RULES['content'])
 for name,pattern in rules:
  if pattern.search(text): issues.append(name)
 r=receipt('critic_gate','pass' if not issues else 'blocked',draft_sha256=hashlib.sha256(text.encode()).hexdigest(),content_kind=kind,issues=issues,rules=[n for n,_ in rules])
 return CriticDecision(not issues,tuple(issues),tuple(n for n,_ in rules),r['receipt_id'])
def route_task(task_kind:str,*,input_tokens=0,output_tokens=0):
 from model_router import estimate_cost,pick_model
 policy=ROUTING_POLICY.get(task_kind,{'tier':'deep','critic':True,'human_approval':True}); result={'task_kind':task_kind,**policy,'model':pick_model(policy['tier'],0),'estimated_cost_usd':estimate_cost(policy['tier'],input_tokens,output_tokens)}; receipt('model_route','routed',**result); return result
def _open():
 if not PROPOSALS.exists(): return None
 latest=None
 for line in PROPOSALS.read_text(encoding='utf-8').splitlines():
  try: item=json.loads(line)
  except json.JSONDecodeError: continue
  if item.get('status')=='proposed': latest=item
 return latest
def propose_change(change_key,target,old_value,new_value,reason):
 if change_key not in {'critic_rules','model_tier','memory_ttl_days'}: raise ValueError('change_not_whitelisted:'+change_key)
 if _open(): raise RuntimeError('proposal_already_open')
 p={'proposal_id':str(uuid.uuid4()),'status':'proposed','change_key':change_key,'target':target,'old_value':old_value,'new_value':new_value,'reason':reason,'proposed_at':_iso()}; _append(PROPOSALS,p); receipt('improvement_proposal','proposed',proposal_id=p['proposal_id'],change_key=change_key); return p
def apply_approved_change(proposal,approval_token,*,score_before,score_after,target_path):
 if approval_token!='APPROVE' or score_after<=score_before: receipt('improvement_change','reverted',proposal_id=proposal.get('proposal_id'),reason='approval_or_score_gate_failed',score_before=score_before,score_after=score_after); return {'status':'reverted','reason':'approval_or_score_gate_failed'}
 path=Path(target_path)
 if not path.exists(): raise FileNotFoundError(path)
 ROLLBACK_DIR.mkdir(parents=True,exist_ok=True); backup=ROLLBACK_DIR/f"{path.name}.{proposal['proposal_id']}.bak"; shutil.copy2(path,backup); data=json.loads(path.read_text(encoding='utf-8')); data[proposal['change_key']]=proposal['new_value']; tmp=path.with_suffix(path.suffix+'.tmp'); tmp.write_text(json.dumps(data,indent=2,sort_keys=True)+'\n',encoding='utf-8'); tmp.replace(path); result={'status':'applied','proposal_id':proposal['proposal_id'],'backup':str(backup),'score_before':score_before,'score_after':score_after}; receipt('improvement_change','applied',proposal_id=result['proposal_id'],backup=result['backup'],score_before=score_before,score_after=score_after); return result
def memory_status(entries,*,now=None):
 current=now or datetime.now(timezone.utc); out=[]
 for entry in entries:
  item=dict(entry); renewed=item.get('renewed_at') or item.get('created_at')
  try: dt=datetime.fromisoformat(str(renewed).replace('Z','+00:00')); dt=dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
  except (TypeError,ValueError): dt=current-timedelta(days=365)
  item['status']='active' if item.get('pinned') or current<=dt+timedelta(days=int(item.get('ttl_days',90))) else 'expired'; out.append(item)
 return out
def reconcile_memory_registry(path=MEMORY_REGISTRY):
 target=Path(path); payload=json.loads(target.read_text()) if target.exists() else {'policy':{'default_ttl_days':90},'entries':[]}; entries=memory_status(payload.get('entries',[])); payload['entries']=entries; payload['last_reconciled_at']=_iso(); target.parent.mkdir(parents=True,exist_ok=True); tmp=target.with_suffix('.tmp'); tmp.write_text(json.dumps(payload,indent=2,sort_keys=True)+'\n'); tmp.replace(target); counts={'active':sum(e.get('status')=='active' for e in entries),'expired':sum(e.get('status')=='expired' for e in entries),'pinned':sum(bool(e.get('pinned')) for e in entries)}; receipt('memory_reconcile','completed',**counts); return {'entries':entries,**counts}
if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser(); p.add_argument('--route'); p.add_argument('--critic'); p.add_argument('--kind',default='content'); p.add_argument('--memory-reconcile',action='store_true'); a=p.parse_args()
 if a.route: print(json.dumps(route_task(a.route),indent=2,sort_keys=True))
 elif a.critic is not None:
  d=critic_gate(a.critic,a.kind); print(json.dumps({'allowed':d.allowed,'issues':d.issues,'receipt_id':d.receipt_id},indent=2))
 elif a.memory_reconcile: print(json.dumps(reconcile_memory_registry(),indent=2,sort_keys=True))
 else: p.print_help()
