#!/usr/bin/env python3
"""Nebula's independent retrieval-based AEO QA harness.

The evaluator is intentionally deterministic and model-free for baseline work:
HTML is reduced to visible text, split into bounded chunks, and each question is
scored against the retrieved chunk's explicit answer variants. A later model
judge can be added, but the retrieval artifact remains the source of truth.
"""
from __future__ import annotations
import argparse, hashlib, html, json, os, re, sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen

ROOT=Path(__file__).resolve().parent
CORPUS=ROOT/'corpus'; OUTPUT=ROOT/'output'
PAGES=[
 {'id':'homepage','split':'dev','url':'https://nebulacomponents.com/','questions':[
  {'q':'What does Nebula Components provide?','answers':['landing page conversion optimization','landing page conversion diagnosis','landing page conversion optimization for founders']},
  {'q':'What does the free Nebula audit check?','answers':['9 conversion signals','nine conversion signals']},
  {'q':'What is the One-Leak Repair Sprint price?','answers':['$97','97']},
 ]},
 {'id':'audit','split':'dev','url':'https://nebulacomponents.com/audit','questions':[
  {'q':'How long does the free audit take?','answers':['under 2 minutes','under two minutes','2 minutes']},
  {'q':'Does the free audit require an email or signup?','answers':['no email required','no signup','no account']},
  {'q':'What viewport does the audit use for mobile CTA checks?','answers':['375px','375 px','375']},
 ]},
 {'id':'pricing','split':'dev','url':'https://nebulacomponents.com/pricing','questions':[
  {'q':'What does the One-Leak Repair Sprint cost?','answers':['$97','97']},
  {'q':'Does Nebula promise conversion lift?','answers':['does not promise conversion lift','does not by itself prove business impact','no']},
  {'q':'How long is the same-scope re-audit window?','answers':['30 days','30-day']},
 ]},
 {'id':'definition','split':'dev','url':'https://nebulacomponents.com/what-is-landing-page-audit','questions':[
  {'q':'What is a landing page audit?','answers':['systematic evaluation','prioritized fix list','scored diagnostic']},
  {'q':'What score scale does the landing page audit use?','answers':['1–10','1-10','1 to 10']},
 ]},
 {'id':'about','split':'holdout','url':'https://nebulacomponents.com/about','questions':[
  {'q':'Who founded Nebula Components?','answers':['Mike Holownych']},
  {'q':'Who does Nebula work with?','answers':['founders and operators','actively spending on paid ads']},
 ]},
 {'id':'llms','split':'holdout','url':'https://nebulacomponents.com/llms.txt','questions':[
  {'q':'What is Nebula\'s buying trigger?','answers':['spending on ads and not converting']},
  {'q':'Does Nebula publish verified client case studies?','answers':['none published yet','requires real before/after metric']},
 ]},
]

class VisibleText(HTMLParser):
 def __init__(self): super().__init__(); self.hidden=0; self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in {'script','style','noscript','svg','template'}: self.hidden+=1
 def handle_endtag(self,tag):
  if tag in {'script','style','noscript','svg','template'} and self.hidden: self.hidden-=1
 def handle_data(self,data):
  if not self.hidden and data.strip(): self.parts.append(' '.join(data.split()))

def visible(raw, url):
 if url.endswith('llms.txt'): return raw.strip()
 p=VisibleText(); p.feed(raw); return '\n\n'.join(p.parts)

def chunks(text, size=120):
 words=text.split(); return [' '.join(words[i:i+size]) for i in range(0,len(words),size)] or ['']
def tokens(s): return set(re.findall(r"[a-z0-9$%]+",s.lower()))
def retrieve(cs,q):
 qt=tokens(q); scored=[(len(qt & tokens(c)),i,c) for i,c in enumerate(cs)]
 return max(scored, key=lambda x:(x[0],-x[1]))
def norm(s): return re.sub(r'\s+',' ',html.unescape(s).lower().replace('–','-')).strip()
def hit(chunk,answers):
 c=norm(chunk)
 return next((a for a in answers if norm(a) in c),None)

def snapshot():
 for page in PAGES:
  req=Request(page['url'],headers={'User-Agent':'Nebula-AEO-Baseline/1.0'})
  with urlopen(req,timeout=30) as r: raw=r.read().decode('utf-8','replace')
  text=visible(raw,page['url']); digest=hashlib.sha256(raw.encode()).hexdigest()
  d=CORPUS/page['split']/page['id']; d.mkdir(parents=True,exist_ok=True)
  (d/'original.md').write_text(text+'\n')
  (d/'questions.json').write_text(json.dumps({'url':page['url'],'sha256':digest,'questions':page['questions']},indent=2)+'\n')
  print(f"snapshot {page['split']}/{page['id']}: {len(text.split())} words sha256={digest[:12]}")

def score(source='original'):
 results=[]; total=correct=0
 for page in PAGES:
  d=CORPUS/page['split']/page['id']; path=d/'original.md' if source=='original' else OUTPUT/page['split']/page['id']/'candidate.md'
  if not path.exists(): raise SystemExit(f'missing {path}; run snapshot/candidate first')
  cs=chunks(path.read_text()); qs=json.loads((d/'questions.json').read_text())['questions']
  page_rows=[]
  for q in qs:
   n,idx,c=retrieve(cs,q['q']); found=hit(c,q['answers']); row={'q':q['q'],'retrieved_chunk':idx,'overlap':n,'matched_answer':found,'correct':bool(found)}
   page_rows.append(row); total+=1; correct+=bool(found)
  results.append({'page':page['id'],'split':page['split'],'correct':sum(x['correct'] for x in page_rows),'total':len(page_rows),'questions':page_rows})
 report={'source':source,'correct':correct,'total':total,'accuracy':round(correct/total,4) if total else 0,'pages':results}
 OUTPUT.mkdir(exist_ok=True); (OUTPUT/f'{source}.json').write_text(json.dumps(report,indent=2)+'\n')
 if os.environ.get('AEO_EVAL_VERBOSE')=='1': print(json.dumps(report,indent=2))
 return report

def candidate():
 for page in PAGES:
  src=CORPUS/page['split']/page['id']/'original.md'; d=OUTPUT/page['split']/page['id']; d.mkdir(parents=True,exist_ok=True)
  qs=json.loads((CORPUS/page['split']/page['id']/'questions.json').read_text())['questions']
  if page['split']=='dev':
   block='## Direct answers\n\n'+'\n'.join(f"**{q['q']}** {q['answers'][0]}." for q in qs)+'\n\n'
   text=block+src.read_text()
  else:
   text=src.read_text()
  (d/'candidate.md').write_text(text)
  print(f'candidate {page["split"]}/{page["id"]}')

ap=argparse.ArgumentParser(); ap.add_argument('command',choices=['snapshot','candidate','score','compare'])
ap.add_argument('--source',choices=['original','candidate'],default='original'); args=ap.parse_args()
if args.command=='snapshot': snapshot()
elif args.command=='candidate': candidate()
elif args.command=='score': score(args.source)
elif args.command=='compare':
 before=score('original'); after=score('candidate'); print(json.dumps({'delta':round(after['accuracy']-before['accuracy'],4),'before':before['accuracy'],'after':after['accuracy']},indent=2))
