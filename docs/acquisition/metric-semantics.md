# Acquisition Metric Directionality, Materiality & Semantics

## 1. Directionality Taxonomy

Not all acquisition metrics follow a naive "higher is better" model. The system defines four explicit directionality classes in `metric_semantics_registry`:

| Directionality Class | Meaning | Example Metrics |
|:---|:---|:---|
| `HIGHER_IS_BETTER` | Positive delta indicates improving performance | `gsc_total_impressions`, `gsc_total_clicks`, `ga4_organic_sessions`, `internal_purchases` |
| `LOWER_IS_BETTER` | Negative delta indicates improving rank/performance | `gsc_aggregate_position`, `dimensioned_impression_weighted_position` |
| `TARGET_RANGE` | Optimal performance lies within a bounded interval | `page_load_time_seconds` (ideal 0.5s to 1.5s) |
| `NON_DIRECTIONAL` | Movement reflects vocabulary/indexing dynamics, not value | `unique_visible_queries` |

---

## 2. Materiality Evaluation Models

To prevent false alarms caused by microscopic noise or misleading percentages on small denominators, the system supports three materiality models:

### 1. `PERCENTAGE_DELTA` (Standard Volumetric Metrics)
- Used for high-volume metrics such as `gsc_total_impressions` and `ga4_organic_sessions`.
- Evaluates:
  $$\Delta\% = \frac{\text{post} - \text{pre}}{\text{pre}}$$
- Materiality threshold: $\ge 10.0\%$ relative movement.

### 2. `POSITION_AWARE` (Search Position Ranking)
- Used for `gsc_aggregate_position` and `dimensioned_impression_weighted_position`.
- Evaluates absolute position delta:
  $$\Delta\text{pos} = \text{post} - \text{pre}$$
- Materiality threshold: $\ge 3.0$ positions.
- Movement from $64.3 \rightarrow 44.4$ ($\Delta\text{pos} = -19.9$) is evaluated as `IMPROVING` and material.
- Movement from $44.4 \rightarrow 64.3$ ($\Delta\text{pos} = +19.9$) is evaluated as `REGRESSING` and material.

### 3. `ABSOLUTE_FIRST` (Low-Volume Denominator Protection)
- Used for low-frequency conversion events such as `internal_purchases` (count $< 5$).
- When baseline counts are small, percentage deltas (e.g. $1 \rightarrow 2 = +100\%$) are statistically deceptive.
- Evaluates absolute unit movement first: $+1$ purchase is reported as absolute delta with a mandatory small-sample uncertainty note.

---

## 3. Zero Search Visibility Ranking Semantics

A measurement period with zero search impressions possesses no ranking exposure.

- If `gsc_total_impressions == 0`, average search position is represented strictly as `NULL` (`Unobserved`), never as `0.00`.
- When comparing period $A$ (0 impressions, position `NULL`) to period $B$ (1,072 impressions, position 44.4), the ranking delta is `NEWLY_ESTABLISHED`, not a numeric difference.
