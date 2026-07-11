# Stale Lead Closure System

## Core Purpose
Close dead threads without burning sender reputation

## Implementation Steps
1. **Send ONE final email** redirecting to the self-serve audit tool (`/audit.html`)
2. **No pitch**. No call booking. Just the tool link and context.
3. **Update `HOT_LEAD.json`** → `{stage: "closed", status: "completed", resolved_at: "<timestamp>"}`
4. **Log the lead** as retired in the customer ledger
5. **No further outreach** to this contact

## Implementation Pattern
```python
def close_stale_lead(email, url):
    # Send final email with tool link only
    send_email(
        to=email,
        subject=f"{url} — your free audit tool",
        body=f"""Hey,
        
I noticed we haven't connected on {url} yet. Here's your free audit tool to check what's leaking your ad spend: https://nebulacomponents.shop/audit.html?email={email}
        
No pitch. No call booking. Just the tool.
        
— Nebula Audit Agent"""
    )
    
    # Update lead status
    lead_manager.update_lead_status(email, "closed")
    lead_manager.log_retirement(email, "stale_after_multiple_touches")
```

## Quality Gates
- Final email must contain ONLY the tool link (no pitch)
- Lead status must be updated to "closed"
- No further outreach attempts allowed
- Lead must be logged as retired