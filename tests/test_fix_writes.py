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


if __name__ == "__main__":
    unittest.main()
