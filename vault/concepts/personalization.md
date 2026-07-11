# Personalization System

## Core Purpose
Make each email feel personal by referencing specific context

## Implementation Rules
- **Reference their specific project/context** in opening line
- **Use insider vocabulary** from ICP Memo when available
- **Address silent objections** proactively in body copy
- **Include specific examples** from their domain

## Prohibited Language
- "Quick question" (overused/filtered)
- Generic marketing phrases without context
- Vague references to "your business" without specifics

## Implementation Pattern
```python
# Deterministic variant selection
url_hash = int(hashlib.md5(lead.get('url', title_snip).encode()).hexdigest(), 16)
v = _PPQ_VARIANTS[url_hash % len(_PPQ_VARIANTS)]  # 0, 1, 2, or 3
# Subjects: "Your {kw} — found something" | "{kw} — worth a look?" | "noticed something re: {kw}" | "Struggling with {kw}?"
```