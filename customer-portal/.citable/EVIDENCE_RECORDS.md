# Citable Evidence Records

The directories below are immutable evidence packages and are intentionally
versioned with the source changes they evaluate:

- `runs/<run-id>/` - manifests, environment metadata, detector findings,
  captured headers, robots and sitemap observations, schema/link artifacts,
  checksums, and human-readable reports.
- `snapshots/<snapshot-id>/` - bounded comparison snapshots derived from runs.

## Retention policy

1. Never edit a completed run in place.
2. Generate a new run when the target, detector version, configuration, or
   observation date changes.
3. Preserve failed and partial runs when they document a material verification
   boundary.
4. Do not store credentials, authorization headers, cookies, or private payloads
   in an evidence package.
5. Commit a run only with the source/configuration change it verifies, or in a
   dedicated evidence-record commit that names the evaluated commit and target.
6. Treat checksums as tamper-evidence; regenerate the entire run rather than
   rewriting individual artifacts.

## Current evidence boundary

The 2026-07-25 packages capture deterministic Citable and Lighthouse
observations against `https://nebulacomponents.shop`. They are evidence of the
conditions observed at collection time, not guarantees of current indexing,
ranking, citation, performance, or conversion outcomes.
