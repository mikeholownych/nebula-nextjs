# Wave 5 Report — Performance
| Item | Outcome |
| --- | --- |
| PERF-4 | /audit/run waiters back off 0.25s→2.0s exponential (~5x event-loop pressure cut at depth) — delivered in Wave 2 batch A |
| PERF-3/DATA-7 | Ledger access paths verified indexed; volume measured (4.7k events); growth curve documented — time-bounds deferred until volume warrants (tracked in perf baseline note) |
| PERF-1 | Homepage/audit/pricing/checkout HTML measured 94–168KB @ TTFB 0.08–0.15s from CF edge; Lighthouse lab budgets already enforced in CI. Field-data (CrUX/RUM) review recorded as the gate for any future weight work — no optimization applied per scope discipline |
