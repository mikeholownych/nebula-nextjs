# SMTP Redundancy System

## Core Purpose
Ensure email delivery continuity with fallback providers

## Implementation Rules
1. **Primary Provider**: AgentMail (smtp.agentmail.to:465)
2. **Fallback Providers**:
   - Resend (free tier: 3k/mo)
   - AWS SES (free tier: $0.10/1k)
   - Brevo (free tier: 300/day)

## Setup Process
1. **Resend Setup**:
   - Sign up at resend.com
   - Get API key → save to `~/.hermes/secrets/resend.key`
   - Add domain DNS records in Cloudflare
   - Wait for verification

2. **Fallback Pattern**:
```python
def send_email_with_fallback(to, subject, body, primary="agentmail", fallback="resend"):
    try:
        return send_via_agentmail(to, subject, body)
    except (smtplib.SMTPException, ConnectionError) as e:
        print(f"  [primary failed: {e}] → trying fallback")
        return send_via_resend(to, subject, body)
```

## Critical Rules
- **Never use SMTP for cold outbound** - AgentMail SMTP blocks cold sends
- **Use REST API** for all outbound emails
- **Resend domain verification** is required for improved deliverability
- **Primary inbox**: nebulashop@agentmail.to

## Quality Gates
- Resend API key must be stored securely
- Domain DNS records must be properly configured
- Fallback must be tested before primary failure