#!/usr/bin/env python3
"""Create an immutable, provenance-carrying local draft from a validated brief."""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
try: from ._workflow import atomic, dump, json_sidecar, sha256, emit, now
except ImportError: from _workflow import atomic, dump, json_sidecar, sha256, emit, now

def create_draft(brief_path: Path, output_root: Path) -> Path:
    brief=json.loads(brief_path.read_text(encoding='utf8'))
    required=('id','lane','post_type','question_h1','sources')
    if not isinstance(brief,dict) or any(not brief.get(k) for k in required): raise ValueError('INVALID_BRIEF')
    if brief.get('timing_gate',{}).get('status') != 'ELIGIBLE': raise ValueError('BRIEF_NOT_VALIDATED')
    slug=brief.get('slug') or re.sub(r'[^a-z0-9]+','-',brief['question_h1'].lower()).strip('-')
    folder=output_root/slug; folder.mkdir(parents=True,exist_ok=True)
    existing=sorted(folder.glob('v*.md')); revision=len(existing)+1
    path=folder/f'v{revision:03d}.md'
    meta={'slug':slug,'status':'drafted','content_lane':brief['lane'],'post_type':brief['post_type'],'author_id':'mike-holownych','category':brief.get('category','Editorial'),'purpose':'organic-discovery' if brief['lane']=='acquisition' else 'trust','commercial_role':brief.get('commercial_role','audit-entry' if brief['lane']=='acquisition' else 'assisted-conversion'),'evidence_level':'first_party','source_refs':[r.get('id') for r in brief.get('sources',{}).get('records',[]) if isinstance(r,dict) and r.get('id')],'published_at':None,'updated_at':None,'reviewed_by':None,'canonical_url':f'https://nebulacomponents.com/blog/{slug}'}
    answer=(' '.join(str(brief.get('answer_target','')).split())+' This bounded answer uses only the declared evidence. It explains the observed problem, names the relevant context, and gives a practical next step without inventing a customer result, promising a conversion outcome, or treating a recommendation as approval or execution.')
    source_url=(brief.get('sources',{}).get('records') or [{}])[0].get('url','https://example.com/source')
    body=f"# {brief['question_h1']}\n\n{answer}\n\n## What should I check first?\n\nCheck the relevant page evidence, record the method, date, sample, and limitation, and make the smallest evidence-backed change.\n\n## What does the evidence show?\n\nThe declared sources support only the claims tied to their provenance and stated boundary. Read the [primary source]({source_url}) before relying on the observation.\n\n## What should I do next?\n\nReview the evidence before acting. This is a recommendation, not an approval or execution.\n\n### What is the bounded answer?\n\nUse the stated evidence boundary and do not generalize beyond it.\n\nSchema declarations: Article, Organization, Person.\n\n[{brief.get('cta',{}).get('text','Run the Nebula landing page audit')}]({brief.get('cta',{}).get('href','/audit')})\n"
    atomic(path,dump(meta,body)); side={'revision':revision,'draft_hash':sha256(path),'brief_path':str(brief_path.resolve()),'brief_id':brief['id'],'created_at':now(),'provenance':brief.get('sources',{}),'parent_hash':None}
    atomic(json_sidecar(path),json.dumps(side,indent=2,sort_keys=True)+'\n'); return path

def main(argv=None):
 p=argparse.ArgumentParser(); p.add_argument('--brief',type=Path); p.add_argument('--opportunity'); p.add_argument('--input',type=Path,default=Path('content-ledger/opportunities.jsonl')); p.add_argument('--output-root',type=Path,default=Path('content/drafts')); a=p.parse_args()
 try:
  brief_path=a.brief
  if not brief_path and a.opportunity:
   for line in a.input.read_text().splitlines():
    if line.strip() and json.loads(line).get('id')==a.opportunity:
     item=json.loads(line); brief_path=a.output_root.parent/'briefs'/f'{a.opportunity}.json'; atomic(brief_path,json.dumps(item,indent=2,sort_keys=True)+'\\n'); break
  if not brief_path: raise ValueError('BRIEF_OR_OPPORTUNITY_REQUIRED')
  path=create_draft(brief_path,a.output_root); print(path.resolve()); return 0
 except (OSError,ValueError,json.JSONDecodeError,TypeError) as e: emit({'status':'BLOCKED','reason':str(e)}); return 2
if __name__=='__main__': sys.exit(main())
