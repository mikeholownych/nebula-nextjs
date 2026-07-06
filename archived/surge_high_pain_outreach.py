#!/usr/bin/env python3
"""Emergency surge: highest-pain ICP only.
Find email; if absent, submit contact form. No guessed emails.
"""
import json, os, re, subprocess, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE=Path('/home/mike/nebula')
KEY_FILE = Path.home() / ".hermes/secrets/agentmail.key"
PY='/home/mike/nebula/venv/bin/python3'
UA={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
AUDIT='https://nebulacomponents.shop/audit.html'
CHECKOUT='https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02'
FROM_EMAIL='nebulashop@agentmail.to'
BAD=('example','schema','sentry','w3.org','google','twitter','noreply','user@','test@','email@','your@','placeholder','yourname','john@company','company@','hello@example','email@domain','name@','owner@','webmaster@','png','jpg','jpeg','svg','ico','wordpress','sentry')

CANDIDATES=[
 {'site':'https://www.calisim.com/plans','trigger':'Google ads, 5% CTR, 191 clicks, no conversions','source_url':'https://www.reddit.com/r/PPC/comments/1m37t5a/google_ads_5_ctr_191_clicks_no_conversions/'},
 {'site':'https://203.io','trigger':'First month in Google Ads, no conversions; Shopify smart keyboard controller','source_url':'https://www.reddit.com/r/PPC/comments/1fueirw/first_month_in_google_ads_no_conversions/'},
 {'site':'https://repairandsquare.com/washing-machine-repairs/','trigger':'Google Ads 0 conversions; landing page repair service','source_url':'https://www.reddit.com/r/googleads/comments/1kpwhb8/ready_to_bash_my_head_against_a_wall/'},
 {'site':'https://therollupinvestor.carrd.co/','trigger':'PPC thread asking if simple landing page can convert','source_url':'https://www.reddit.com/r/PPC/comments/11hnafg/is_it_possible_for_a_dead_simple_landing_page_to/'},
 {'site':'https://lovebyintention.com','trigger':'Ad says $13 product but landing page not converting at all','source_url':'https://www.reddit.com/r/PPC/comments/1il83x3/tell_me_why_my_landing_page_sucks/'},
 {'site':'https://lowtdfw.com/variation-b-page','trigger':'Low CPC traffic but poor bookings/show rate; alternate landing page','source_url':'https://www.reddit.com/r/PPC/comments/1pzojnz/why_is_my_landing_page_not_converting/'},
]

def clean_url(u):
    return u.rstrip('/')

def existing_text():
    """Check all known lead stores for cross-script dedup."""
    chunks=[]
    for f in ['audit_leads.jsonl','outreach_evidence.jsonl','contact_form_evidence.jsonl','contacted.json','HOT_LEAD.json','ramp_retries.json']:
        p=BASE/f
        if p.exists():
            try: chunks.append(p.read_text().lower())
            except: pass
    return '\n'.join(chunks)

def extract_emails(html, dom):
    emails=[]
    for e in re.findall(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', html or ''):
        e=e.strip('.,;:)').lower()
        if any(b in e for b in BAD): continue
        edom=e.split('@')[-1]
        if dom.replace('www.','') in edom or e.startswith(('hello@','support@','contact@','info@','team@','founder@','sales@')):
            if e not in emails: emails.append(e)
    return emails

def fetch(url):
    try:
        return requests.get(url,headers=UA,timeout=12,allow_redirects=True)
    except Exception:
        return None

def find_email(site):
    root=f"{urlparse(site).scheme}://{urlparse(site).netloc}"
    dom=urlparse(root).netloc.lower().replace('www.','')
    emails=[]
    for path in ['', '/contact', '/contact-us', '/about', '/support', '/privacy', '/terms']:
        r=fetch(root+path)
        if r and r.ok:
            emails += extract_emails(r.text, dom)
    return list(dict.fromkeys(emails))

def contact_message(c):
    host=urlparse(c['site']).netloc.replace('www.','')
    return f"""Saw your public post: {c['trigger']}.

I built a self-serve landing page audit for this exact situation: paid/intent traffic reaching the page but not turning into leads or sales.

Run it here: {AUDIT}
If you want the fixes implemented, checkout starts the $97 implementation directly: {CHECKOUT}

No call needed. The system audits the page and routes the next step automatically.

Nebula Audit Agent
{FROM_EMAIL}"""

def submit_contact_form(c):
    site=c['site']; root=f"{urlparse(site).scheme}://{urlparse(site).netloc}"
    pages=[site, root+'/contact', root+'/contact-us', root+'/support']
    for page in pages:
        r=fetch(page)
        if not r or not r.ok or '<form' not in r.text.lower(): continue
        soup=BeautifulSoup(r.text,'html.parser')
        for form in soup.find_all('form')[:4]:
            action=form.get('action') or page
            method=(form.get('method') or 'post').lower()
            target=urljoin(page,action)
            data={}
            for inp in form.find_all(['input','textarea','select']):
                name=inp.get('name')
                if not name: continue
                typ=(inp.get('type') or '').lower()
                lname=name.lower()
                if typ in ('hidden','submit','button','checkbox','radio'):
                    if inp.get('value') is not None: data[name]=inp.get('value')
                elif 'email' in lname or typ=='email': data[name]=FROM_EMAIL
                elif 'name' in lname: data[name]='Nebula Audit Agent'
                elif 'subject' in lname: data[name]='Landing page audit for your no-conversion traffic'
                elif 'phone' in lname or 'tel' in lname: data[name]=''
                elif 'url' in lname or 'website' in lname: data[name]=AUDIT
                elif 'message' in lname or 'comment' in lname or 'body' in lname or inp.name=='textarea': data[name]=contact_message(c)
                else: data[name]=inp.get('value') or ''
            if not any('message' in k.lower() or 'comment' in k.lower() or 'body' in k.lower() for k in data):
                continue
            try:
                if method=='get': resp=requests.get(target,params=data,headers=UA,timeout=15)
                else: resp=requests.post(target,data=data,headers={**UA,'Referer':page},timeout=15)
                if resp.status_code in (200,201,202,204,302,303):
                    return {'ok':True,'page':page,'target':target,'status_code':resp.status_code}
            except Exception as e:
                last=str(e)
    return {'ok':False,'error':'no_submittable_form'}

def append_jsonl(path,obj):
    with open(path,'a') as f: f.write(json.dumps(obj,ensure_ascii=False)+"\n")

def main():
    # Load API key for subprocess
    try:
        api_key = KEY_FILE.read_text().strip()
    except Exception as e:
        print(f"ERROR: Cannot read AgentMail key: {e}")
        api_key = None

    existing=existing_text()
    sent=[]; forms=[]; skipped=[]; failed=[]
    for c in CANDIDATES:
        site=clean_url(c['site'])
        if site.lower() in existing:
            skipped.append({**c,'status':'duplicate'}); continue
        emails=find_email(site)
        if emails:
            email=emails[0]
            sub_env = {**dict(os.environ), 'AGENTMAIL_API_KEY': api_key} if api_key else None
            res=subprocess.run([
                PY,
                str(BASE/'deliver_audit.py'),
                site,
                email,
                '--trigger-context',
                f"Saw your public post: {c['trigger']}",
            ],capture_output=True,text=True,timeout=180,env=sub_env)
            rec={**c,'email':email,'emails':emails,'exit':res.returncode,'stdout':res.stdout[-700:],'stderr':res.stderr[-300:]}
            # Check real success: exit 0 + sent keyword in stdout + no env error
            stdout_lower = res.stdout.lower()
            has_env_error = 'agentmail_api_key' in stdout_lower and 'error' in stdout_lower
            has_sent = '✅ sent' in stdout_lower or 'sent to' in stdout_lower
            if res.returncode==0 and not has_env_error and has_sent:
                rec['status']='audit_sent'; sent.append(rec)
                append_jsonl(BASE/'outreach_evidence.jsonl',{'timestamp':datetime.now(timezone.utc).isoformat(),'action':'surge_audit_sent','prospect':urlparse(site).netloc,'url':site,'contact':email,'trigger':c['trigger'],'source_url':c['source_url'],'status':'sent','evidence':res.stdout[-500:]})
            else:
                rec['status']='audit_failed'; failed.append(rec)
        else:
            result=submit_contact_form(c)
            rec={**c,**result,'contact':'contact_form','timestamp':datetime.now(timezone.utc).isoformat()}
            if result.get('ok'):
                forms.append(rec)
                append_jsonl(BASE/'outreach_evidence.jsonl',{'timestamp':rec['timestamp'],'action':'surge_contact_form_sent','prospect':urlparse(site).netloc,'url':site,'contact':'contact form','trigger':c['trigger'],'source_url':c['source_url'],'status':'sent','evidence':json.dumps(result)})
            else:
                failed.append({**c,**result,'status':'unreachable'})
        time.sleep(2)
    report={'timestamp':datetime.now(timezone.utc).isoformat(),'counts':{'audit_sent':len(sent),'contact_forms':len(forms),'skipped':len(skipped),'failed':len(failed)},'audit_sent':sent,'contact_forms':forms,'skipped':skipped,'failed':failed}
    (BASE/'surge_high_pain_report.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report['counts'],indent=2))
    for x in sent: print('AUDIT_SENT',x['email'],x['site'])
    for x in forms: print('FORM_SENT',x.get('status_code'),x['site'],x.get('page'))
    for x in failed: print('FAILED',x.get('site'),x.get('status') or x.get('error'))

if __name__=='__main__': main()
