# MAILER-DAEMON Bounce Handling

## Core Purpose
Extract failed addresses from MAILER-DAEMON replies for list cleanup

## Implementation Pattern
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

## Bounce Rate Signal
High bounce rate (>20%) means your list quality is poor — guessed emails like `hello@domain.com`, `contact@domain.com`. These are worth trying but expect 40-60% bounce on guessed addresses. Focus on founders who published their email publicly.