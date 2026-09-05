# Supervised local content workflow

The pipeline is local and fail-closed. It does not call an external content service, write analytics, deploy, or publish on a schedule.

## Lifecycle

1. **Recommendation**: source collection and opportunity scoring produce a report only.
2. **Brief and draft**: `create_draft.py --brief <validated.json>` or `--opportunity <id>` creates `content/drafts/<slug>/v001.md` and a JSON provenance sidecar.
3. **Review**: `review_draft.py --draft <path> --output <readiness.json>` emits named findings. It never edits the draft. Only a PASS report is eligible for approval.
4. **Edit**: `apply_edits.py --draft <path> --edits <edits.json>` writes `v002.md`, preserving v001 and recording parent hash and each replacement.
5. **Approval**: a human writes a separate JSON record. Approval is not a recommendation and is not execution.
6. **Execution**: `publish_article.py --draft <path> --approval <approval.json> --readiness <readiness.json>` requires `approved: true`, the exact SHA-256 draft hash, non-empty reviewer and an ISO-8601 timestamp, and a PASS readiness report. Use `--dry-run` or `--report-only` for a no-write proof.

Readiness reports are not caller-shaped authorization JSON. They must have the exact `nebula.local.review-readiness.v1` schema, the fixed local review producer marker, all 14 declared requirements, the complete validator output and empty findings, the exact draft hash, a parseable `generated_at`, and the workflow HMAC signature emitted by `review_draft.py`. Publication verifies every field and the signature. A copied or minimally forged report, an invalid timestamp, a stale hash, or a report from another producer is blocked.

## Approval record

```json
{
  "approved": true,
  "draft_hash": "exact sha256 of the immutable markdown file",
  "reviewer": "named human reviewer",
  "timestamp": "2026-09-05T12:00:00Z",
  "readiness_report": "path/to/readiness.json"
}
```

Missing approval, malformed records, hash mismatch, missing reviewer or timestamp, and non-PASS readiness block execution. The hash is computed from the draft at execution time, so editing after approval invalidates the record.

## Rollback

Publication is a copy into the local published root and writes a publication receipt. Roll back by removing the published copy and receipt, or restore the prior published artifact from version control. Draft revisions are immutable and must not be overwritten. Revision allocation retains a lock-only `.revision.lock` file because unlinking after unlock can split concurrent creators across lock inodes. Failed validation occurs before the lock directory is created, and the workflow regression test covers that cleanup boundary. No production rollback is performed by these scripts.

## Scheduled/report-only operation

Scheduled runs may collect evidence, create briefs, and write readiness reports. They must use `--report-only` and cannot publish. CI runs content checks before the application build. Analytics and customer data are read-only throughout this workflow.
