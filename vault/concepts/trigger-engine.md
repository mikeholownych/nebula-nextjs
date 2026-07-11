# Trigger Engine System

## Core Purpose
Discover and act on buying triggers from social platforms (Reddit, HN, IndieHackers)

## Implementation Rules
1. **Trigger Sources**:
   - Reddit (r/microsaas, r/SideProject, r/SaaS)
   - Hacker News
   - IndieHackers

2. **Trigger Patterns**:
   - "no users", "zero customers", "0 sales", "how to get first customers"
   - "built but no users", "can't get sales", "no paying customers"
   - "roast my landing page", "feedback on my saas"

3. **Scoring System**:
   - **+3**: Direct pain expression
   - **+2**: Indirect pain mention  
   - **+1**: General interest

4. **Action Rules**:
   - **Direct Pain**: Immediate personalized email
   - **Indirect Pain**: Add to warm lead pool
   - **General Interest**: Add to cold lead pool

## Quality Gates
- Trigger patterns must match exactly
- Scoring must be consistent
- Action must be triggered appropriately

## Implementation Pattern
```python
def score_trigger(text):
    score = 0
    if re.search(r'no users|zero customers|0 sales|how to get first customers', text, re.IGNORECASE):
        score += 3
    if re.search(r'built but no users|can\'t get sales|no paying customers', text, re.IGNORECASE):
        score += 2
    if re.search(r'roast my landing page|feedback on my saas', text, re.IGNORECASE):
        score += 1
    return score
```