# Acquisition Learning System: Source Ingestion Contracts & SLAs

**Phase:** Phase 4 (Automated Ingestion, Route Synchronization, Rolling Windows, State Evaluation, and Trend Computation)  
**Date:** September 2, 2026  
**Status:** Approved Specification  
**Authority:** Technical Architecture & Governance  

---

## 1. Executive Summary

This document establishes the interface contracts, timing SLAs, data finalization constraints, and failure modes for all source systems feeding the Acquisition Learning System.

---

## 2. Source System Contracts Matrix

| Source System | Integration Method | Auth / Credentials | Canonical Window | Lag Requirement | Authoritative Metric Scope |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Search Console (GSC)** | Google API Client (`searchconsole/v1`) | Service Account OAuth (`~/.hermes/.env` / `claude-seo`) | $[T-31, T-3]$ (28 days) | **3 Days** (Mandatory finalization lag) | Sitewide search impressions, clicks, aggregate SERP position, page/query rankings. |
| **Google Analytics 4 (GA4)** | Google Analytics Data API (`v1beta`) | Service Account (`544419051`) | $[T-29, T-1]$ (28 days) | **1 Day** | Channel session grouping, landing page traffic, bounce/engagement rates. |
| **Platform Event Ledger** | PostgreSQL (`analytics_event_ledger`) | Peer / Unix socket on port 5433 | Real-time / Timestamped | **0 Seconds** | Discrete user journey events, audit intake, completed audits, Stripe checkouts, purchases. |
| **PostHog Analytics** | PostHog API / Query endpoint | Project API Key | Rolling time series | **0 Seconds** | Supporting UX observations (pageviews, visitor duration, client engagement). |

---

## 3. Google Search Console Finalization Rules

Google Search Console Search Analytics data undergoes continuous algorithmic reconciliation during the first 72 hours after observation:
- Any window ending $< 3\text{ days}$ prior to execution date ($T_{\text{end}} > \text{NOW}() - 3\text{ days}$) contains unfinalized data.
- **Enforcement Rule:** If an ingestion run requests unfinalized data, the engine automatically records `source_finalization_status = 'PROVISIONAL'` and sets trend evaluation to `BLOCKED` to prevent false regression alarms.

---

## 4. GA4 Attribution Contract & `/checkout` Handling

- GA4 Last Non-Direct Click lookback will periodically attribute sessions starting on non-indexed utility or conversion pages to `Organic Search`.
- **Contract Boundary:** When `landing_page == '/checkout'`, the session is persisted in `acquisition_measurements.ga4_downstream_checkout_sessions` and categorized as `KNOWN_ATTRIBUTION_BEHAVIOR`. It is never counted as an `organic_search_entry_session`.
