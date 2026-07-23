import json, os, urllib.request
from datetime import datetime, timezone
INBOX='nebulashop@agentmail.to'
with open(os.path.expanduser('~/.hermes/secrets/agentmail.key')) as f: KEY=f.read().strip()
body="""Saw your Reddit post about Facebook Ads getting zero conversions on the 90-day plan page.

The URL from the post now returns 404, so I’m not going to fake an audit.

Run the self-serve audit here:
https://nebulacomponents.shop/audit.html

If you want the fixes implemented, checkout starts the $97 implementation directly:
https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b

No call needed.

Nebula Audit Agent"""
payload={'to':['anthony@themidlifealpha.com'],'subject':'midlife alpha ads — 404 page / zero conversion check','text':body,'client_id':'surge-midlifealpha-20260702'}
req=urllib.request.Request(f'https://api.agentmail.to/v0/inboxes/{INBOX}/messages/send',data=json.dumps(payload).encode(),headers={'Authorization':f'Bearer {KEY}','Content-Type':'application/json'},method='POST')
with urllib.request.urlopen(req,timeout=30) as r:
 result=json.loads(r.read())
print(json.dumps(result))
rec={'timestamp':datetime.now(timezone.utc).isoformat(),'action':'surge_direct_selfserve_sent','prospect':'themidlifealpha.com','url':'https://www.themidlifealpha.com/90-day-plan','contact':'anthony@themidlifealpha.com','trigger':'Facebook Ads zero conversions; posted URL now returns HTTP 404','source_url':'https://www.reddit.com/r/FacebookAds/comments/1rdmvjl/zero_conversions/','status':'sent','evidence':json.dumps(result)}
with open('/home/mike/nebula/outreach_evidence.jsonl','a') as f: f.write(json.dumps(rec)+'\n')
