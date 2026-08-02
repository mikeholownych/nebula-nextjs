#!/usr/bin/env python3
"""Claim-level semantic QA for AEO answers.

Offline mode is deterministic and auditable. Model mode is intentionally
provider-neutral: configure AEO_JUDGE_URL, AEO_JUDGE_API_KEY, and
AEO_JUDGE_MODEL for an OpenAI-compatible endpoint. No credentials are stored.
"""
from __future__ import annotations
import argparse, json, os, re
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent
CLAIMS=json.loads((ROOT/'reference_claims.json').read_text())

def norm(s): return re.sub(r'\s+',' ',s.lower().replace('–','-')).strip()
def page_for(source):
 name={'/':'homepage','/audit':'audit','/pricing':'pricing','/what-is-landing-page-audit':'definition','/about':'about'}
 return name.get('/'+source.rstrip('/').split('/')[-1] if source.rstrip('/').split('/')[-1] else '/')
def load_source(source):
 p=page_for(source) or 'unknown'
 for split in ('dev','holdout'):
  path=ROOT/'corpus'/split/p/'original.md'
  if path.exists(): return path.read_text()
 raise SystemExit(f'No corpus snapshot for {source}')
def deterministic(answer, claim):
 a=norm(answer); terms=[norm(x) for x in claim['required_terms']]
 return 'supported' if any(t in a for t in terms) else 'omitted'
def score(answer_rows):
 out=[]; total=supported=critical_failures=0
 for row in answer_rows:
  spec=next((x for x in CLAIMS if x['query']==row['query']),None)
  if not spec: out.append({'query':row['query'],'error':'query not in reference_claims.json'}); continue
  statuses=[]
  for claim in spec['claims']:
   status=deterministic(row.get('answer',''),claim); total+=1; supported+=status=='supported'
   if claim['importance']=='critical' and status!='supported': critical_failures+=1
   statuses.append({'id':claim['id'],'status':status,'importance':claim['importance']})
  out.append({'query':row['query'],'claims':statuses})
 return {'mode':'deterministic','supported':supported,'total':total,'accuracy':round(supported/total,4) if total else 0,'critical_failures':critical_failures,'answers':out}
def model_judge(answer_rows):
 url=os.getenv('AEO_JUDGE_URL'); key=os.getenv('AEO_JUDGE_API_KEY'); model=os.getenv('AEO_JUDGE_MODEL')
 if not all((url,key,model)): raise SystemExit('model mode requires AEO_JUDGE_URL, AEO_JUDGE_API_KEY, and AEO_JUDGE_MODEL')
 assert url and key and model
 prompt={'reference_claims':CLAIMS,'answers':answer_rows,'instruction':'Return JSON only. For every claim label supported, partially_supported, omitted, unsupported, or contradicted. Include evidence span and critical_failure boolean. Do not infer support from the question; use only the answer and supplied reference claims.'}
 req=Request(url, data=json.dumps({'model':model,'temperature':0,'messages':[{'role':'user','content':json.dumps(prompt)}]}).encode(), headers={'Authorization':f'Bearer {key}','Content-Type':'application/json'})
 with urlopen(req,timeout=90) as r: payload=json.loads(r.read().decode())
 return {'mode':'model','provider_response':payload}
ap=argparse.ArgumentParser(); ap.add_argument('command',choices=['score']); ap.add_argument('--answers',required=True); ap.add_argument('--mode',choices=['deterministic','model'],default='deterministic'); ap.add_argument('--output',default=str(ROOT/'output'/'semantic.json'))
a=ap.parse_args(); rows=[json.loads(x) for x in Path(a.answers).read_text().splitlines() if x.strip()]
report=score(rows) if a.mode=='deterministic' else model_judge(rows); Path(a.output).parent.mkdir(parents=True,exist_ok=True); Path(a.output).write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report,indent=2))
