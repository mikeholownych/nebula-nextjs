#!/usr/bin/env python3
"""Measure citations from captured AI-engine response JSONL.

No captured rows means no-data, not zero visibility. Canonical URLs are matched
by host and path; external citations remain in the denominator for precision.
"""
from __future__ import annotations
import argparse, collections, json
from pathlib import Path
from urllib.parse import urlparse
CANONICAL_HOST='nebulacomponents.shop'
def is_canonical(url): return urlparse(url).netloc.lower().removeprefix('www.')==CANONICAL_HOST
def main(path):
 rows=[json.loads(x) for x in Path(path).read_text().splitlines() if x.strip()]
 if not rows: return {'status':'no_data','rows':0}
 required={'engine','query','timestamp','answer','citations'}
 invalid=[]
 for i,r in enumerate(rows,1):
  missing=sorted(required-set(r))
  if missing: invalid.append({'row':i,'missing':missing})
 if invalid: raise SystemExit(json.dumps({'status':'invalid_capture','errors':invalid}))
 by=collections.defaultdict(list)
 for r in rows: by[r['engine']].append(r)
 result={'status':'ok','rows':len(rows),'engines':{}}
 for engine,items in by.items():
  mentioned=sum('nebula' in r.get('answer','').lower() for r in items)
  cited=sum(bool(r.get('citations')) for r in items)
  canonical=[c for r in items for c in r.get('citations',[]) if is_canonical(c['url'])]
  allc=[c for r in items for c in r.get('citations',[])]
  positions=[c.get('position') for c in canonical if isinstance(c.get('position'),int)]
  paths=collections.Counter(urlparse(c['url']).path or '/' for c in canonical)
  result['engines'][engine]={'responses':len(items),'mention_rate':round(mentioned/len(items),4),'citation_rate':round(cited/len(items),4),'canonical_citation_precision':round(len(canonical)/len(allc),4) if allc else None,'canonical_citations':len(canonical),'mean_citation_position':round(sum(positions)/len(positions),2) if positions else None,'canonical_paths':dict(paths)}
 return result
ap=argparse.ArgumentParser(); ap.add_argument('--captures',required=True); ap.add_argument('--output',default='aeo_harness/output/citations.json'); a=ap.parse_args(); report=main(a.captures); Path(a.output).parent.mkdir(parents=True,exist_ok=True); Path(a.output).write_text(json.dumps(report,indent=2)+'\n'); print(json.dumps(report,indent=2))
