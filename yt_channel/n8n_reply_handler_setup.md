# n8n Reply Handler Setup — Sep 2 Launch Configuration

**Objective**: Configure n8n workflow to receive prospect replies, classify them, and post to `/api/lead-gen/outbound-reply` webhook.

**Workflow name**: `lead-gen-reply-handler`  
**Trigger**: Email reply received (Gmail API, Outlook, or manual forwarding)  
**Endpoint**: POST https://nebulacomponents.com/api/lead-gen/outbound-reply

---

## n8n Nodes (Simplified Flow)

### 1. Gmail Trigger (or Manual Webhook)
- **Node type**: Gmail / Webhook
- **Trigger event**: New email received from prospect_id@domain (label: "prospect-replies")
- **Output**: `email_id`, `from_email`, `subject`, `body`, `timestamp`

### 2. Extract Prospect Info
- **Node type**: Function
- **Logic**:
  ```javascript
  // Extract prospect_id from email subject or body
  // Email subject template: "Re: Your Nebula audit — {prospect_id}"
  const subjectMatch = $input.first().json.subject.match(/prospect_id:\s*(\w+)/);
  const prospect_id = subjectMatch ? subjectMatch[1] : null;
  const email = $input.first().json.from_email;
  const reply_text = $input.first().json.body;
  
  return {
    prospect_id,
    email,
    reply_text,
    reply_timestamp: new Date($input.first().json.timestamp).toISOString(),
  };
  ```
- **Output**: `{prospect_id, email, reply_text, reply_timestamp}`

### 3. HTTP POST to Lead Gen Webhook
- **Node type**: HTTP Request
- **Method**: POST
- **URL**: https://nebulacomponents.com/api/lead-gen/outbound-reply
- **Headers**: `Content-Type: application/json`
- **Body**: From Step 2 output
  ```json
  {
    "prospect_id": "{{ $node['Extract Prospect Info'].json.prospect_id }}",
    "email": "{{ $node['Extract Prospect Info'].json.email }}",
    "reply_text": "{{ $node['Extract Prospect Info'].json.reply_text }}",
    "reply_timestamp": "{{ $node['Extract Prospect Info'].json.reply_timestamp }}"
  }
  ```
- **Error handling**: Continue on error (webhook is eventually-consistent)

### 4. Parse Response
- **Node type**: Function
- **Logic**:
  ```javascript
  const result = $input.first().json;
  return {
    success: result.success,
    classification: result.classification,
    confidence: result.confidence,
  };
  ```
- **Output**: `{success, classification, confidence}`

### 5. Notify SDR (Sedrick Murphy)
- **Node type**: Slack / Email / Manual Queue
- **Condition**: Only if `classification === 'interested'`
- **Message template**:
  ```
  🔥 **Interested Lead**: 
  Prospect: {{ prospect_id }}
  Email: {{ email }}
  Classification: {{ classification }} ({{ confidence }}% confidence)
  Reply: "{{ reply_text }}"
  
  👉 Follow up now: lead_state.db → prospects → status='interested'
  ```
- **Recipient**: Sedrick Murphy (Slack @sedrick or email sedrick@nebula.internal)

---

## Implementation Checklist

### Pre-Setup
- [ ] n8n instance running on 10.0.8.220:5678 (per memory)
- [ ] Gmail API credentials configured in n8n
- [ ] Test email received to @nebulacomponents.com (SMTP configured)

### Workflow Setup
- [ ] Create new workflow: "lead-gen-reply-handler"
- [ ] Add Gmail trigger: listen for emails in "prospect-replies" label
- [ ] Add extract node (Step 2 logic above)
- [ ] Add HTTP POST node (Step 3 URL + body)
- [ ] Add parse node (Step 4)
- [ ] Add notification node (Step 5, Slack or email)

### Testing
- [ ] Mock email received: subject "Re: Your Nebula audit — prospect_id:test_founder1"
- [ ] Body: "Yeah, interested. Can you send more details?"
- [ ] Check webhook logs: `/api/lead-gen/outbound-reply` received POST
- [ ] Verify lead_state.db updated: `contacts.reply_status = 'interested'`
- [ ] Notification sent to Sedrick Murphy

### Deployment (Sep 2)
- [ ] Workflow set to "paused" (not active yet)
- [ ] Week 1 (Sep 2–9): No actual replies expected, but workflow ready
- [ ] Week 2 (Sep 9–16): Activate workflow for manual email testing
- [ ] Week 3+ (Sep 16+): Full automation (all emails classified + notified)

---

## Email Template (for Outbound Emails)

When AgentMail sends cold email (lead_gen/outbound.py), include prospect_id in reply-to or subject:

```
From: outbound@nebulacomponents.com
To: {prospect_email}
Subject: Your {company} landing page audit — prospect_id:{prospect_id}

Hi {first_name},

I analyzed {company}'s landing page and found 3 specific leaks costing you money:

1. {fix_1}
2. {fix_2}
3. {fix_3}

I put together a free audit: [link]

No credit card, no call. Just the truth.

—
Nebula Components
nebulacomponents.com
```

When prospect replies to this email, Gmail labels it "prospect-replies" → n8n triggers → webhook posts.

---

## Fallback: Manual Reply Processing

If n8n workflow fails, manually process replies:

```bash
cd /home/mike/nebula
python3 -c "
from lead_gen.n8n_reply_handler import handle_reply_webhook
import json

payload = {
    'prospect_id': 'stripe_founder1',
    'email': 'patrick@stripe.com',
    'reply_text': 'Yeah, interested. Can you send more details?',
    'reply_timestamp': '2026-08-10T09:15:00Z'
}

result = handle_reply_webhook(payload)
print(json.dumps(result, indent=2))
"
```

---

## Monitoring

### Daily Checks (Sep 2–30)
- [ ] Check lead_state.db for new visitor_events (RB2B pixel firing)
- [ ] Check prospects.intent_score updates (intent scoring background job)
- [ ] Check contacts.reply_status for "interested" prospects (n8n webhook working)

### Metrics Dashboard
Create a simple JSON API endpoint for monitoring:

```python
@app.get("/api/lead-gen/metrics")
async def get_metrics():
    """Return real-time lead-gen pipeline metrics."""
    from lead_gen.discover import list_prospects
    from lead_gen.score_intent import get_high_intent_prospects
    from lead_gen.n8n_reply_handler import get_interested_prospects
    
    prospects = list_prospects()
    high_intent = get_high_intent_prospects(threshold=75)
    interested = get_interested_prospects()
    
    return {
        "total_prospects": len(prospects),
        "high_intent_prospects": len(high_intent),
        "interested_prospects": len(interested),
        "status": "Week 1: discovery + intent scoring"
    }
```

Access at: https://nebulacomponents.com/api/lead-gen/metrics

---

## Go-Live Timeline

- **Aug 9 (Today)**: Code deployed, webhooks ready, n8n paused
- **Sep 2 (Launch)**: RB2B pixel live, intent scoring background job active, n8n paused
- **Sep 9 (Week 2)**: Activate n8n for manual reply testing
- **Sep 16 (Week 3)**: Full automation (sends + reply classification live)
- **Sep 30 (Gate)**: Metrics review → decide on Oct 1 scaling
