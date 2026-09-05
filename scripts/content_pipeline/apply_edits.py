#!/usr/bin/env python3
"""Apply explicit replacements into a new immutable draft revision."""
from __future__ import annotations
import argparse,json,sys
from pathlib import Path
try: from ._workflow import atomic,parse,dump,json_sidecar,sha256,emit,now
except ImportError: from _workflow import atomic,parse,dump,json_sidecar,sha256,emit,now

def apply_edits(draft:Path, edits_path:Path)->Path:
 data,body,_=parse(draft); edits=json.loads(edits_path.read_text())
 rows=edits.get('replacements') if isinstance(edits,dict) else None
 if not isinstance(rows,list) or not rows: raise ValueError('INVALID_EDITS')
 old_hash=sha256(draft); newbody=body; records=[]
 for row in rows:
  if not isinstance(row,dict) or not isinstance(row.get('old'),str) or not isinstance(row.get('new'),str) or row['old'] not in newbody: raise ValueError('EDIT_TARGET_NOT_FOUND')
  newbody=newbody.replace(row['old'],row['new'],1); records.append({'old':row['old'],'new':row['new'],'editor':edits.get('editor','unknown'),'at':now()})
 for key in ('published_at','updated_at','reviewed_by'):
  if key in edits: data[key]=edits[key]
 versions=sorted(draft.parent.glob('v*.md')); revision=max([int(x.stem[1:]) for x in versions]+[0])+1; target=draft.parent/f'v{revision:03d}.md'
 atomic(target,dump(data,newbody)); atomic(json_sidecar(target),json.dumps({'revision':revision,'draft_hash':sha256(target),'parent':str(draft),'parent_hash':old_hash,'edits':records,'created_at':now()},indent=2,sort_keys=True)+'\n'); return target

def main(argv=None):
 p=argparse.ArgumentParser(); p.add_argument('--draft',required=True,type=Path); p.add_argument('--edits',required=True,type=Path); a=p.parse_args()
 try: print(apply_edits(a.draft,a.edits).resolve()); return 0
 except (OSError,ValueError,json.JSONDecodeError) as e: emit({'status':'BLOCKED','reason':str(e)}); return 2
if __name__=='__main__': sys.exit(main())
