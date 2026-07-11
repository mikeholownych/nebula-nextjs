# Lead Scoring System

## Scoring Model
- **+3**: Reply to cold email
- **+3**: Audit consumed
- **+5**: Audit requested
- **+1**: Email sent
- **-5**: Hard bounce
- **-10**: Spam complaint
- **-2/cycle**: 30-day decay

## Segments
- **Cold**: 0-7 points
- **Warm**: 8-20 points
- **Hot**: 21+ points
- **Terminal**: Bounced/dead

## Implementation Rules
1. **TrustOS Steal**: Use same scoring model as TrustOS
2. **Segment-Based Actions**:
   - Cold: Trigger-aware outreach
   - Warm: Audit delivery
   - Hot: Pitch sequence
   - Terminal: Retire lead
3. **Decay Mechanism**: Score decreases by 2 points per 30-day cycle
4. **Seed Scores**: Start from stage on migration

## Quality Gates
- Score calculation must match TrustOS model exactly
- Segments must trigger appropriate actions
- Decay must be applied consistently