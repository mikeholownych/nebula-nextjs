#!/usr/bin/env python3
import unittest


class FixWriteSQLTests(unittest.TestCase):
    def test_mark_sql_contains_score_before_capture(self):
        import inspect
        from platform_api.services import audit_db
        src = inspect.getsource(audit_db.AuditDB.mark_finding_implemented)
        self.assertIn("score_before", src)
        self.assertIn("ON CONFLICT", src)

    def test_backfill_targets_unscored_rows(self):
        import inspect
        from platform_api.services import audit_db
        src = inspect.getsource(audit_db.AuditDB.backfill_fix_scores)
        self.assertIn("score_after IS NULL", src)


class MarkImplementedRouteTests(unittest.TestCase):
    AUDIT_ID = "11111111-2222-3333-4444-555555555555"

    def _route(self):
        import asyncio

        from platform_api.routes import audit_api as r

        def run(coro):
            return asyncio.new_event_loop().run_until_complete(coro)

        return r, run

    def _happypath_mocks(self, score=None):
        from unittest.mock import AsyncMock, MagicMock, patch

        r, run = self._route()
        audit_db = AsyncMock()
        audit_db.get_audit.return_value = {
            "id": self.AUDIT_ID,
            "url": "https://nebulacomponents.com/pricing",
            "email": "mike.holownych@gmail.com",
        }
        if score is None:
            audit_db.mark_finding_implemented.side_effect = ValueError(
                "audit not found")
        else:
            audit_db.mark_finding_implemented.return_value = {"ok": True}
        teardown_db = AsyncMock()
        user = {"user": MagicMock(email="mike.holownych@gmail.com")}
        ctx = [
            patch("platform_api.routes.audit_api.get_audit_db",
                  new=MagicMock(return_value=audit_db)),
            patch("platform_api.routes.audit_api.get_teardown_db",
                  new=MagicMock(return_value=teardown_db)),
        ]
        return r, run, ctx, user, audit_db

    def test_unscored_audit_maps_to_409(self):
        from fastapi import HTTPException

        r, run, ctx, user, audit_db = self._happypath_mocks(score=None)
        for c in ctx:
            c.start()
        try:
            with self.assertRaises(HTTPException) as cm:
                run(r.mark_implemented(
                    body=r.MarkImplementedBody(
                        audit_id=self.AUDIT_ID, finding_key="above_fold"),
                    current_user=user))
        finally:
            for c in ctx:
                c.stop()
        self.assertEqual(cm.exception.status_code, 409)
        self.assertIn("not scored", cm.exception.detail)

    def test_scored_audit_returns_row(self):
        r, run, ctx, user, audit_db = self._happypath_mocks(score=62)
        for c in ctx:
            c.start()
        try:
            out = run(r.mark_implemented(
                body=r.MarkImplementedBody(
                    audit_id=self.AUDIT_ID, finding_key="above_fold"),
                current_user=user))
        finally:
            for c in ctx:
                c.stop()
        self.assertEqual(out, {"ok": True})


if __name__ == "__main__":
    unittest.main()
