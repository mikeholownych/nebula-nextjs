# Bounce Handling System

## Core Purpose
Clean up invalid addresses and track bounce rates

## Implementation Rules
1. **Some emails will bounce** (invalid addresses) — track them silently
2. **No need to retry** bounced addresses
3. **High bounce rate (>20%)** means your list quality is poor — guessed emails like `hello@domain.com`, `contact@domain.com`

## Bounce Rate Signal
High bounce rate (>20%) means your list quality is poor — guessed emails like `hello@domain.com`, `contact@domain.com`. These are worth trying but expect 40-60% bounce on guessed addresses. Focus on founders who published their email publicly.

## Reading Bounce Recipients
When you get a bounce, extract the failed address for list cleanup:
```python
import re
body = get_email_body(msg)
failed = re.findall(r'Final-Recipient:.*?<?([\\w.+-]+@[\\w.-]+)>?', body)
# Add to bounce list, do not retry
```

## Critical Rules
- **Never retry** bounced addresses
- **Track silently** — no need to retry
- **Focus on** founders who published their email publicly