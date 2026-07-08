#!/usr/bin/env python3
"""Auto-responder for dual sender inboxes (templates@ and audits@)"""
import os, json, requests
from datetime import datetime

MASTER_KEY = os.environ.get("AGENTMAIL_MASTER_KEY", "am_us_...6d4a")

# Only the verified inbox to monitor
INBOXES = [
    {"email": "ops@launchcrate.io", "type": "general"}
]

def check_inbox_and_respond(inbox_email, inbox_type):
    """Check specific inbox and respond appropriately using AgentMail API"""
    responses = []
    
    try:
        # Get new messages from the inbox using AgentMail API
        api_url = f"https://api.agentmail.to/inboxes/{inbox_email}/messages"
        headers = {
            "Authorization": f"Bearer {MASTER_KEY}",
            "Content-Type": "application/json"
        }
        params = {
            "status": "unread"
        }
        
        response = requests.get(api_url, headers=headers, params=params)
        response.raise_for_status()
        messages = response.json()
        
        if not messages:
            return {"inbox": inbox_email, "status": "no_new_messages"}
        
        # If there are messages, process them
        for msg in messages:
            from_addr = msg.get("from", "")
            subject = msg.get("subject", "")
            body = msg.get("body", "")
            
            # Route response based on the content of the message
            if "Interested in $7 template" in subject or "Interested in $7 template" in body:
                response_body = "Thanks for your interest in the template pack!\n\nHere's what's included:\n- Hero section (high-converting hooks)\n- Pricing comparison layouts\n- Social proof sections\n- CTA variants\n\nDownload link: [TEMPLATE_LINK]\n\nWant help executing cold email to drive traffic? I offer a $147 audit where I review your prospect list, email copy, and send 10 test emails on your behalf.\n\nEither way, money-back guarantee.\n\n-\nMike"
            elif "Interested in $147 audit" in subject or "Interested in $147 audit" in body:
                response_body = "Great! You're interested in the audit.\n\nHere's what you'll get:\n- Review your prospect list for targeting quality\n- Feedback on your email subject line + body copy\n- 10 test emails sent on your behalf\n- Analysis of replies + next steps\n\n$97, money-back guarantee.\n\nWant to start with the $7 template pack first to see the quality of my work? That's an option too.\n\nReady to move forward?\n\n-\nMike"
            else:
                response_body = "Hi, thanks for reaching out!\n\nI offer a $7 template pack or a $147 audit service.\n\nLet me know which you're interested in, and I'll send you the details.\n\n-\nMike"
            
            send_response(inbox_email, from_addr, response_body)
            
            responses.append({
                "from": from_addr,
                "subject": subject,
                "inbox_type": inbox_type,
                "responded": True
            })
            
            # Mark message as read using AgentMail API
            msg_id = msg.get("id")
            if msg_id:
                mark_read_url = f"https://api.agentmail.to/inboxes/{inbox_email}/messages/{msg_id}/read"
                mark_read_response = requests.post(mark_read_url, headers=headers)
                mark_read_response.raise_for_status()
        
        return {"inbox": inbox_email, "status": "processed", "responses": responses}
    
    except Exception as e:
        # Print the full response for debugging
        if 'response' in locals():
            print(f"[DEBUG] API Response for {inbox_email}: Status {response.status_code}, Body: {response.text}")
        return {"inbox": inbox_email, "status": "error", "error": str(e)}

def send_response(from_inbox, to_email, body):
    """Send auto-response from correct inbox using AgentMail API"""
    
    api_url = f"https://api.agentmail.to/inboxes/{from_inbox}/messages/send"
    headers = {
        "Authorization": f"Bearer {MASTER_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "to": [to_email],
        "subject": "Re: Your Interest",
        "text": body,
        "from": from_inbox
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=data)
        response.raise_for_status()
        return True
    except Exception as e:
        print(f"Failed to send from {from_inbox} to {to_email}: {e}")
        return False

def main():
    """Check both inboxes and respond"""
    
    all_results = []
    
    for inbox_config in INBOXES:
        result = check_inbox_and_respond(inbox_config["email"], inbox_config["type"])
        all_results.append(result)
    
    # Log
    with open("/home/mike/nebula/auto_responder_dual_inbox.log", "a") as f:
        f.write(json.dumps({
            "timestamp": datetime.now().isoformat(),
            "inboxes_checked": len(INBOXES),
            "results": all_results
        }) + "\n")
    
    print(f"[AUTO-RESPONDER] Checked {len(INBOXES)} inboxes")
    for result in all_results:
        print(f"  {result['inbox']}: {result['status']}")

if __name__ == "__main__":
    main()
