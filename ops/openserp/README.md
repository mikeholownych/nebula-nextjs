# OpenSERP project tracking

OpenSERP runs locally as Docker container `openserp-nebula`, bound only to `127.0.0.1:7000`.

- Upstream: https://github.com/karust/openserp
- Image: `karust/openserp:latest`
- Verified digest: `sha256:9f5c5736fc7434862fa23dd0955e53d4003ffe42f151a5e1297085decf3100b7`
- Observed upstream revision: `29c7b0fbe09640160efcfc1f1e04e60e0fbe60e9`
- Container health: `http://127.0.0.1:7000/health`
- Readiness: `http://127.0.0.1:7000/ready`

## Project collector

Configuration: `config/openserp_tracking.json`

Collector:

```bash
python3 scripts/openserp_rank_tracker.py
```

Smoke test:

```bash
python3 scripts/openserp_rank_tracker.py \
  --keywords 'landing page audit' \
  --engines google bing
```

Each run writes raw responses, normalized rows, and failures under `seo-reports/openserp/`.
Persistent empty SERPs are failures. A `NULL` position is only emitted when a non-empty SERP was observed and the target domain was absent.

The rows preserve query, engine, US market, EN language, desktop device, timestamp, run ID, theory/cohort/experiment attribution, ranking URL, and result count. They are compatible with the existing competitor reconciliation layer after transforming the engine-specific rows as needed.

## Schedule

Install the user timer:

```bash
mkdir -p "$HOME/.config/systemd/user"
cp ops/openserp/openserp-rank-tracker.{service,timer} "$HOME/.config/systemd/user/"
systemctl --user daemon-reload
systemctl --user enable --now openserp-rank-tracker.timer
```

Current schedule: daily at 06:00 UTC, with up to 15 minutes of randomized delay.

## Proof boundary

OpenSERP observations prove only what appeared in the requested SERP snapshot. They do not prove search demand, impressions, clicks, conversions, revenue, causal impact, or AI visibility.

Google may intermittently return an HTTP 200 response with zero parsed results in the browser-backed container. The collector records that as a failure rather than a rank loss. Use the failure report and container logs to investigate before interpreting the Google series.
