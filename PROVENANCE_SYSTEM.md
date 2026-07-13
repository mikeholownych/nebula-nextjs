# Nebula Provenance System

## Purpose
To ensure every insight, recommendation, and finding can be traced back to its original source, building credibility and trust with clients.

## Core Principles
1. **Source Attribution** - Every piece of analysis must cite its source
2. **Immutable Records** - Sources are preserved unchanged
3. **Transparent Tracing** - The path from data to insight is visible
4. **Verifiable Claims** - All recommendations can be validated against sources

## Implementation Framework

### 1. Source Types
- **Documents**: Website copy, marketing materials, competitor assets
- **Interviews**: Stakeholder conversations, recorded and transcribed
- **Data**: Analytics, conversion tracking, performance metrics
- **Third-party**: Industry reports, competitor analysis, market data

### 2. Attribution Format
Each insight must include:
```
[SOURCE TYPE] - [SOURCE ID] - [EXCERPT/QUOTE] - [ANALYSIS]
```

Example:
```
[INTERVIEW] - CEO-2026-07-12 - "Our biggest challenge is getting customers to complete the checkout process" - The checkout friction indicates a trust gap that needs addressing through social proof and clearer value proposition.
```

### 3. Source Repository
Create a structured repository with:
- **Documents Folder**: Organized by client and document type
- **Interview Transcripts**: Timestamped and indexed
- **Data Exports**: CSV/JSON files with metadata
- **Third-party Research**: Cited sources with URLs

### 4. Insight Tracking
Implement a system where:
- Each insight is tagged with its source ID
- Insights are linked to recommendations
- Recommendations include source verification

### 5. Verification Process
Before delivering any recommendation:
1. Trace back to original source
2. Verify the insight still holds
3. Document any changes since source collection
4. Include source excerpts in deliverable

## Benefits
- **Credibility**: Clients can verify your findings
- **Accountability**: Recommendations are grounded in evidence
- **Trust Building**: Transparent process builds long-term relationships
- **Error Reduction**: Easy to spot inconsistencies

## Implementation Roadmap
1. **Week 1**: Set up source repository structure
2. **Week 2**: Implement attribution system in discovery template
3. **Week 3**: Build verification checklist for deliverables
4. **Week 4**: Train team on provenance practices
5. **Ongoing**: Maintain and update source repository