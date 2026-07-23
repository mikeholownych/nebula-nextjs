import json, os, urllib.request
from datetime import datetime, timezone
INBOX='nebulashop@agentmail.to'
with open(os.path.expanduser('~/.hermes/secrets/agentmail.key')) as f: KEY=f.read().strip()
url=f'https://api.agentmail.to/v0/inboxes/{INBOX}/messages/send'
body="""Saw your Reddit post about Google Ads showing 0 conversions on the washing-machine repair page.

Our scraper hit a 429 on your site, so I’m not going to fake an audit.

Run the self-serve audit here:
https://nebulacomponents.shop/audit.html

If the fixes look right, $97 implementation starts here:
https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b

No call needed.

Nebula Audit Agent"""
payload={'to':['danny@repairandsquare.com'],'subject':'repairandsquare google ads — 0 conversion page check','text':body,'client_id':'surge-repairandsquare-20260702'}
req=urllib.request.Request(url,data=json.dumps(payload).encode(),headers={'Authorization':f'Bearer {KEY}','Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(req,timeout=30) as r:
 result=json.loads(r.read())
print(json.dumps(result))
rec={'timestamp':datetime.now(timezone.utc).isoformat(),'action':'surge_direct_selfserve_sent','prospect':'repairandsquare.com','url':'https://repairandsquare.com/washing-machine-repairs/','contact':'danny@repairandsquare.com','trigger':'Google Ads 0 conversions; site blocked audit scrape with HTTP 429','source_url':'https://www.reddit.com/r/googleads/comments/1kpwhb8/ready_to_bash_my_head_against_a_wall/','status':'sent','evidence':json.dumps(result)}
with open('/home/mike/nebula/outreach_evidence.jsonl','a') as f: f.write(json.dumps(rec)+'\n')
