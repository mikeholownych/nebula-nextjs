# Acquisition Learning System: Data Integrity, Immutability & Provenance Controls

**Phase:** Phase 3 (Canonical Data Layer, Database Implementation, Historical Migration, and Integrity Controls)  
**Date:** September 2, 2026  
**Status:** Approved & Implemented Specification  
**Authority:** Technical Architecture & Governance  

---

## 1. Executive Summary

This document establishes the data integrity and cryptographic provenance controls for the Acquisition Learning System. It defines the database-level protections preventing modification of historical measurements, the cryptographic hashing standards for definitions and evidence, and the boundary separating immutable evidence from mutable operational lifecycles.

---

## 2. Database-Level Immutability Controls

To ensure historical measurement facts cannot be rewritten, modified, or silently deleted, PostgreSQL triggers enforce immutability at the engine level.

### 2.1 Trigger Function Implementation

```sql
CREATE OR REPLACE FUNCTION trg_prevent_mutation_acq_facts()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'Deletion of historical acquisition facts is strictly prohibited (table: %)', TG_TABLE_NAME;
    ELSIF (TG_OP = 'UPDATE') THEN
        RAISE EXCEPTION 'Mutation of historical acquisition facts is strictly prohibited (table: %)', TG_TABLE_NAME;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

### 2.2 Table Protection Matrix

| Table Name | Entity Class | Update Policy | Delete Policy | Immutability Trigger Attached |
| :--- | :--- | :--- | :--- | :--- |
| `acquisition_measurements` | Measurement Fact | Blocked | Blocked | `trg_acq_meas_immutable` |
| `page_measurements` | Measurement Fact | Blocked | Blocked | `trg_page_meas_immutable` |
| `query_measurements` | Measurement Fact | Blocked | Blocked | `trg_query_meas_immutable` |
| `measurement_versions` | Version Provenance | Blocked | Blocked | `trg_meas_versions_immutable` |
| `decision_rule_sets` | Rule Provenance | Blocked | Blocked | `trg_decision_rules_immutable` |
| `acquisition_state_transitions` | Historical Event | Blocked | Blocked | `trg_state_trans_immutable` |
| `acquisition_anomalies` | Operational Lifecycle | Permitted | Blocked | Custom status lifecycle |
| `acquisition_changes` | Operational Audit | Permitted | Blocked | Custom status lifecycle |
| `acquisition_experiments` | Experiment Lifecycle | Permitted | Blocked | State machine transitions |

---

## 3. Cryptographic Provenance & Definition Hashing

Every version definition, rule set, and raw ingestion payload is hashed using **SHA-256** to guarantee tamper-evident provenance.

### 3.1 Hash Standards

1. **Measurement Definition Hash:**
   Generated from canonical JSON representation with sorted keys and compact separators:
   $$\text{Hash} = \text{SHA-256}(\text{json.dumps}(D, \text{sort\_keys}=\text{True}, \text{separators}=(',', ':')))$$
2. **Decision Rule Set Hash:**
   Covers `min_holdout_days`, `min_impression_gate`, `evidence_states`, `action_classes`, and statistical noise parameters.
3. **Payload Verification Hash:**
   Stored in `acquisition_source_runs.payload_hash` to record the exact byte content returned by Google APIs.

---

## 4. Idempotency Guarantees

Ingestion workers and historical migration scripts are strictly idempotent. Re-executing an ingestion run against the same period and source revision will never create duplicate records or alter existing metrics.

### 4.1 Uniqueness Constraints
- `acquisition_measurements(id)`
- `measurement_versions(version_code)` and `measurement_versions(definition_hash)`
- `decision_rule_sets(version_code)` and `decision_rule_sets(definition_hash)`
- `page_registry(canonical_url)` and `page_registry(route_path)`
- `page_cohort_assignments(page_id, cohort_name, cohort_definition_version)`
- `page_measurements(measurement_id, page_id)`
- `query_measurements(measurement_id, page_id, query_text)`

---

## 5. Null Semantics & Anonymization Transparency

1. **Unknown is Not Zero:**
   If a metric was not measured or unavailable from a source API, it is stored as `NULL` (e.g. `best_position IS NULL`), never as `0.0`.
2. **Query Row Incompleteness:**
   Due to Google's privacy anonymization of rare queries, the sum of `query_measurements.impressions` will typically be less than `acquisition_measurements.gsc_total_impressions`. The schema explicitly records `is_anonymized_subset = TRUE` on query records to document this property.
