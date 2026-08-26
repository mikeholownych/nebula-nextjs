# Data Governance & Lineage Documentation

## Overview

This document describes the data assets, schemas, and lineage for Nebula Components.

## Data Assets

### Primary Data Stores

| Asset | Type | Location | Owner |
|-------|------|----------|-------|
| `lead_store.db` | SQLite | `/home/mike/nebula/lead_store.db` | Product |
| `lead_state.db` | SQLite | `/home/mike/nebula/lead_state.db` | Product |
| `nebula_audit` | PostgreSQL | `localhost:5433` | Data Engineering |
| `nebula_platform` | PostgreSQL | `localhost:5433` | Data Engineering |
| `HOT_LEAD.json` | JSON | `/home/mike/nebula/HOT_LEAD.json` | Product |
| `audit_leads.jsonl` | JSONL | `/home/mike/nebula/audit_leads.jsonl` | Product |
| `mailcheck_beta.db` | SQLite | `/home/mike/nebula/mailcheck_beta.db` | Product |

### Database Schema

#### `nebula_audit` (PostgreSQL)

**Table: `leads`** (canonical)
| Column | Type | Description |
|--------|------|-------------|
| `email` | TEXT | Lead email (PK) |
| `url` | TEXT | Website URL |
| `stage` | TEXT | Lead stage (discovered, contacted, etc.) |
| `source` | TEXT | Source channel |
| `trigger_context` | TEXT | How lead was discovered |
| `vertical` | TEXT | Industry vertical |
| `audit_score` | REAL | Audit score (0-100) |
| `audit_grade` | TEXT | Letter grade |
| `retry_count` | INTEGER | Retry attempts |
| `error_info` | TEXT | Error details |
| `discovered_at` | TEXT | Discovery timestamp |
| `site_found_at` | TEXT | Site verification |
| `contacted_at` | TEXT | First contact |
| `audit_delivered_at` | TEXT | Audit delivery |
| `pitch_sent_at` | TEXT | Pitch sent |
| `paid_at` | TEXT | Payment received |
| `bounced_at` | TEXT | Bounce timestamp |
| `dead_at` | TEXT | Dead lead flag |
| `needs_review_at` | TEXT | Review request |
| `bounce_type` | TEXT | Bounce分类 |
| `bounce_detail` | TEXT | Bounce details |
| `lead_score` | INTEGER | Internal score |
| `score_updated_at` | TEXT | Score timestamp |
| `updated_at` | TEXT | Last update |
| `notes` | TEXT | Additional notes |

**Table: `audit_log`**
Audit trail for all data operations.

**Table: `customers`**
Customer records with subscription info.

#### `nebula_platform` (PostgreSQL)

**Table: `api_keys`**
API key management and usage tracking.

**Table: `crm_feedback`**
Customer feedback and survey responses.

### Data Lineage

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Web Scraper    │────▶│  lead_store.db  │────▶│  PostHog        │
│  (Python)       │     │  (SQLite)       │     │  Analytics      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         │                       ▼                       │
         │               ┌─────────────────┐             │
         │               │  HOT_LEAD.json  │             │
         │               │  (JSON)         │             │
         │               └─────────────────┘             │
         │                       │                       │
         │                       ▼                       │
         │               ┌─────────────────┐             │
         │               │  hot_lead_watcher.py │         │
         │               │  (Cron job)     │             │
         │               └─────────────────┘             │
         │                       │                       │
         │                       ▼                       │
         ▼               ┌─────────────────┐             ���
    ┌───────────────┐   │  deliver_audit.py │        ┌──────────────┐
    │  audit_leads   │   │  (Audit delivery) │        │  nebula_audit  │
    │  (JSONL)       │   └─────────────────┘        │  (PostgreSQL)  │
    └───────────────┘                                 └──────────────┘
```

### Data Quality Dimensions

| Dimension | Definition | Threshold | Monitoring |
|-----------|------------|-----------|------------|
| **Completeness** | % of required fields populated | ≥95% | Scripted checks |
| **Accuracy** | Correct data values | ≥99% | Manual sampling |
| **Consistency** | Uniform formatting | 100% | Schema validation |
| **Timeliness** | Data refresh frequency | <1 hour | Cron job monitoring |
| **Uniqueness** | No duplicate records | 100% | PK enforcement |

### Data Dictionary

| Field | Domain | Description |
|-------|--------|-------------|
| `stage` | ENUM | `discovered`, `contacted`, `site_found`, `audit_delivered`, `pitch_sent`, `warm`, `warm_replied`, `customer_97`, `customer_997`, `subscriber_197`, `customer_sdr`, `bounced`, `dead`, `terminal` |
| `audit_grade` | ENUM | `A`, `B`, `C`, `D`, `F` (based on audit score) |
| `bounce_type` | ENUM | `permanent`, `transient`, `custom`, `unknown` |

## Data Lineage Tracking

### Tools

| Tool | Purpose | Status |
|------|---------|--------|
| `audits` table | Audit execution history | ✅ Active |
| `audit_log` table | Data operation logs | ✅ Active |
| `monitoring_events` | Performance tracking | ✅ Active |
| `api_key_usage` | API usage monitoring | ✅ Active |

### Data Flow

1. **Lead Discovery** (Web scraper → lead_store.db)
2. **Lead Processing** (hot_lead_watcher.py → HOT_LEAD.json)
3. **Audit Delivery** (deliver_audit.py → audit_log)
4. **Analytics** (PostHog → nebula_audit)

## Data Retention Policy

| Data Type | Retention Period | Location |
|-----------|-----------------|----------|
| Active leads | 2 years | lead_store.db |
| Past customers | 7 years | nebula_platform |
| Audit results | Indefinite | nebula_audit |
| Bounced emails | 1 year | lead_store.db |
| Dead leads | 6 months | lead_store.db |

## Compliance

| Regulation | Mapping | Status |
|------------|---------|--------|
| GDPR | Right to deletion (erase leads) | ✅ Supported |
| GDPR | Data portability (export lead data) | ✅ Supported |
| CAN-SPAM | Unsubscribe mechanism | ✅ Implemented |
| CCPA | Opt-out请求 | ✅ Supported |

## Data Access Control

| Role | Access Level |
|------|--------------|
| **Product** | Read/write to lead_store.db |
| **Data Engineering** | Read/write to nebula_audit, nebula_platform |
| **Support** | Read-only to customer data |
| **API** | Read/write via authenticated endpoints |

## Future Enhancements

1. **PostgreSQL migration** - Migrate all SQLite to PostgreSQL
2. **Change Data Capture** - Track data modifications
3. **Data Lineage Dashboard** - Visualize data flow
4. **Data Quality Alerts** - Auto-detect anomalies
5. **Data Catalog** - Document all data assets

## Contacts

- **Data Governance:** Mike
- **Database Admin:** Mike
- **Compliance:** Mike
