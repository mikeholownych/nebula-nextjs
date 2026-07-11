# Cold Email Strategy

## Hormozi-Style Framework
- **Subject Line**: Direct, benefit-focused ("Your SaaS landing page - ship in 30 minutes")
- **Opening**: Personalize ("I saw you just launched X - congrats!")
- **Body**: Value-first, specific, outcome-focused
- **Offer**: Price anchoring (strikethrough original, show sale price)
- **Risk Reversal**: Strong guarantee ("Ship or I Pay You")
- **CTA**: Direct link to sales page
- **P.S.**: Optional mention of free tools/demos

## Implementation Rules
1. **Pre-Launch Validation**: Ensure payment infrastructure is working before sending
2. **Test Batch**: Send 3-5 emails to known-responsive targets first
3. **Warm Leads**: Prioritize people who posted/asked about their problem
4. **Cold Scrape**: Use only after warm pool is exhausted
5. **Rate Limiting**: Max 1-2 emails per 5-minute window with 3-second delays

## Classification Logic
```python
BUY_SIGNALS = re.compile(r'\b(yes|buy|get it|send link|checkout|purchase|let\'?s do it|fix it|implement|start now|i\'?ll take|sign me up|\$97|97 dollar|pay now|grab it|interested)\b', re.IGNORECASE)
INFO_SIGNALS = re.compile(r'\b(tell me more|how does it|what exactly|how much|show me|demo|example|samples|more info|details about|how it works|what do you|explain)\b', re.IGNORECASE)
```

## Auto-Response Rules
- **Purchase Intent**: Send Stripe checkout link
- **Info Request**: Send free audit tool link
- **Other**: Flag as warm lead for human review

## Critical Rules
- Never auto-post to public threads
- Log every auto-reply to avoid duplicates
- Purchase intent = send link, not a call booking
- Info request = send the tool, not a pitch