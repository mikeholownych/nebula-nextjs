# Attribution Tracking System

## Core Principles
- **UTM Parameters**: Standard source/medium/campaign/content structure
- **No Pixel Tracking**: Avoid email tracking pixels due to deliverability issues
- **Site-Side Tracking**: Observe prospect behavior after clicking through

## Implementation
1. **UTM Parameters**:
   - `utm_source=cold_email`
   - `utm_medium=email` 
   - `utm_campaign={sequence_name}`
   - `utm_content={step_id}`

2. **Attribution Sources**:
   - Google Analytics
   - Stripe (for paid conversions)
   - Free tool signups

3. **Tracking Rules**:
   - Every email link must have UTM parameters
   - Use clean direct links with UTM params (no redirects)
   - Attribute conversions to specific email steps via `utm_content`

## Critical Rules
- **Never embed pixels** in cold emails (hurts deliverability)
- **Use UTM parameters** instead of tracking pixels
- **Track on your site**, not in your email
- **Attribute conversions** to specific email steps

## Quality Gates
- All email links must have UTM parameters
- Attribution must be visible in GA/Stripe
- No pixel tracking in emails