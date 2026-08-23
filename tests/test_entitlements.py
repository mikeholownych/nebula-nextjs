#!/usr/bin/env python3
import unittest
from unittest.mock import MagicMock, patch


class EntitlementMatrixTests(unittest.TestCase):
    def _svc(self):
        from platform_api.services import entitlements as e
        return e

    def _row(self, plan="pro", status="active", period_end=None,
             cancel_at=False, livemode=True):
        m = MagicMock()
        m.plan, m.status = plan, status
        m.current_period_end = period_end
        m.cancel_at_period_end = cancel_at
        m.livemode = livemode
        return m

    def test_active_pro_grants_pro_limits(self):
        import datetime as dt
        from zoneinfo import ZoneInfo
        e = self._svc()
        future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=10)
        ent = e._entitlements_from_rows([self._row(period_end=future)])
        self.assertEqual(ent.plan, "pro")
        self.assertEqual(ent.audits_per_month, 20)
        self.assertEqual(ent.monitored_urls, 3)
        self.assertEqual(ent.min_interval_hours, 720)

    def test_deleted_with_future_period_still_grants(self):
        import datetime as dt
        e = self._svc()
        future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=5)
        ent = e._entitlements_from_rows([self._row(status="canceled", period_end=future)])
        self.assertEqual(ent.plan, "pro")

    def test_canceled_past_period_grants_free(self):
        import datetime as dt
        e = self._svc()
        past = dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=1)
        ent = e._entitlements_from_rows([self._row(status="canceled", period_end=past)])
        self.assertEqual(ent.plan, "free")
        self.assertEqual(ent.monitored_urls, 0)

    def test_past_due_grants_free(self):
        e = self._svc()
        ent = e._entitlements_from_rows([self._row(status="past_due")])
        self.assertEqual(ent.plan, "free")

    def test_past_due_with_future_period_grants_free(self):
        import datetime as dt
        e = self._svc()
        future = dt.datetime.now(dt.timezone.utc) + dt.timedelta(days=10)
        ent = e._entitlements_from_rows(
            [self._row(status="past_due", period_end=future)])
        self.assertEqual(ent.plan, "free")
        self.assertEqual(ent.monitored_urls, 0)

    def test_unknown_plan_falls_back_to_free(self):
        e = self._svc()
        ent = e._entitlements_from_rows([self._row(plan="mystery")])
        self.assertEqual(ent.plan, "free")

    def test_best_plan_wins_across_orgs(self):
        import datetime as dt
        e = self._svc()
        rows = [self._row(plan="pro"), self._row(plan="growth")]
        ent = e._entitlements_from_rows(rows)
        self.assertEqual(ent.plan, "growth")

    def test_limits_match_fixture(self):
        import json
        from pathlib import Path
        e = self._svc()
        fx = json.loads(
            (Path(__file__).resolve().parents[1]
             / "tests/billing_fixtures/plan_limits.json").read_text())
        for plan in ("free", "pro", "growth", "agency"):
            ent = e._entitlements_from_rows([self._row(plan=plan)])
            f = fx[plan]
            self.assertEqual(ent.audits_per_month, f["auditsPerMonth"], plan)
            self.assertEqual(ent.monitored_urls, f["monitoredUrls"], plan)
            self.assertEqual(ent.min_interval_hours, f["minIntervalHours"], plan)


if __name__ == "__main__":
    unittest.main()
