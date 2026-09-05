#!/usr/bin/env python3
"""Review a draft without modifying it. Findings are named and fail closed."""
from __future__ import annotations
import argparse, json, re, sys
from pathlib import Path
try: from ._workflow import parse, json_sidecar, emit
except ImportError: from _workflow import parse, json_sidecar, emit

REQUIREMENTS=('H1_QUESTION','BYLINE','DATELINE','ANSWER_BLOCK','QUESTION_H2S','SELF_CONTAINED_SECTIONS','EXTRACTABLE_SENTENCES','ORIGINAL_DATA_PROVENANCE','SOURCE_LINKS','COMPARISON_TABLE','FAQ_BLOCK','SCHEMA','SERVER_RENDERING','NEXT_STEP')
BANNED=re.compile(r'\b(?:guarantee(?:s|d)?|double[sd]?|always|never|almost certainly|one real proof point outperforms)\b',re.I)

def review(path: Path) -> dict:
    data,body,_=parse(path); findings=[]
    h1=re.findall(r'^# (.+)$',body,re.M)
    if not h1 or '?' not in h1[0]: findings.append(('H1_QUESTION','H1 must be a reader question'))
    if not data.get('author_id'): findings.append(('BYLINE','named author is required'))
    if not data.get('published_at') and not data.get('updated_at'): findings.append(('DATELINE','published and updated dates are required'))
    paragraphs=[p.strip() for p in body.split('\n\n') if p.strip() and not p.startswith(('#','[','|'))]
    if not any(40 <= len(re.findall(r"\b[\w'-]+\b",p)) <= 60 for p in paragraphs[:2]): findings.append(('ANSWER_BLOCK','direct answer must be 40 to 60 words before the preamble'))
    h2=re.findall(r'^## (.+)$',body,re.M)
    if not h2 or not all('?' in h for h in h2): findings.append(('QUESTION_H2S','H2 headings must be questions'))
    if len(h2)<2: findings.append(('SELF_CONTAINED_SECTIONS','at least two self-contained sections are required'))
    if len(paragraphs)<3: findings.append(('EXTRACTABLE_SENTENCES','article needs extractable explanatory sentences'))
    side=json_sidecar(path); provenance={}
    if side.exists():
        try: provenance=json.loads(side.read_text()).get('provenance',{})
        except json.JSONDecodeError: findings.append(('PROVENANCE','malformed provenance sidecar'))
    refs=data.get('source_refs') or []
    if refs and not provenance: findings.append(('ORIGINAL_DATA_PROVENANCE','source refs require provenance records'))
    if not re.search(r'\[[^]]+\]\(https?://[^)]+\)',body): findings.append(('SOURCE_LINKS','at least one primary source link is required'))
    if 'comparison' in str(data.get('post_type','')) and '|' not in body: findings.append(('COMPARISON_TABLE','comparison posts require a table'))
    if not re.search(r'^###?\s+.+\?',body,re.M): findings.append(('FAQ_BLOCK','visible FAQ questions are required'))
    schemas=body.lower()
    for item in ('article','organization','person'):
        if item not in schemas: findings.append(('SCHEMA',f'{item} schema declaration is missing'))
    if '<script' in body or 'style=' in body: findings.append(('SERVER_RENDERING','draft contains client-only or inline presentation markup'))
    if data.get('content_lane')=='acquisition' and not re.search(r'\(/audit\)',body): findings.append(('NEXT_STEP','acquisition articles require one /audit CTA'))
    for name,pattern in [('NO_EM_DASH','—'),('NO_BANNED_CLAIMS',BANNED),('NO_DUPLICATE_NAV',re.compile(r'(?:^|\n)#?\s*(?:navigation|footer)\s*$',re.I)),('NO_INLINE_STYLES','style=')]:
        if (pattern.search(body) if hasattr(pattern,'search') else pattern in body): findings.append((name,'content rule failed'))
    result={'status':'PASS' if not findings else 'BLOCKED','draft':str(path),'draft_hash':__import__('hashlib').sha256(path.read_bytes()).hexdigest(),'findings':[{'code':c,'message':m} for c,m in findings],'requirements':list(REQUIREMENTS)}
    return result

def main(argv=None):
 p=argparse.ArgumentParser(); p.add_argument('--draft',required=True,type=Path); p.add_argument('--output',type=Path); a=p.parse_args()
 try:
  result=review(a.draft)
  if a.output: a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
  emit(result); return 0 if result['status']=='PASS' else 1
 except (OSError,ValueError,UnicodeError) as e: emit({'status':'BLOCKED','findings':[{'code':'INPUT_ERROR','message':str(e)}]}); return 2
if __name__=='__main__': sys.exit(main())
