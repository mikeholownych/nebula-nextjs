#!/usr/bin/env python3
"""Task 7: server-side monitor gates by plan.

Adapted to the REAL audit_api signatures:
  - POST   -> audit_api.create_monitor(body: MonitorCreate, principal)
  - PATCH  -> audit_api.update_monitor(monitor_id, body: MonitorUpdate, principal)
  - entitlement seam is the module-level coroutine resolve_for_email(email)
  - audit_db is a module-level singleton, patched as a symbol
"""
import unittest
from unittest.mock import AsyncMock, MagicMock, patch


def asyncio_run(coro):
    import asyncio
    return asyncio.new_event_loop().run_until_complete(coro)


def _principal(email):
    from platform_api.auth.principal import Principal
    return Principal(
        principal_type="user",
        principal_id="u1",
        email=email,
        workspace_email=email,
        scopes=frozenset({"workspace:write"}),
    )


class MonitorGateTests(unittest.TestCase):
    def _routes(self):
        from platform_api.routes import audit_api as r
        return r

    def _ent(self, plan="free", urls=0, hours=None):
        from platform_api.services.entitlements import Entitlements
        audits = None if plan in ("growth", "agency") else (
            20 if plan == "pro" else 1)
        u = {"pro": 3, "growth": 10, "agency": None}.get(plan, 0)
        h = {"pro": 720}.get(plan, 168 if plan in ("growth", "agency") else None)
        return Entitlements(plan=plan, status="active",
                            audits_per_month=audits,
                            monitored_urls=u if urls == 0 else urls,
                            min_interval_hours=hours or h)

    def _db(self, **kw):
        db = AsyncMock()
        for k, v in kw.items():
            setattr(db, k, AsyncMock(return_value=v))
        return db

    def test_free_cannot_create(self):
        from fastapi import HTTPException
        r = self._routes()
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("free"))), \
             patch("platform_api.routes.audit_api.audit_db",
                   new=self._db()):
            body = r.MonitorCreate(email="free@user.com",
                                   url="https://x.com", cadence="monthly")
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.create_monitor(
                    body, principal=_principal("free@user.com")))
        self.assertEqual(cm.exception.status_code, 403)
        self.assertEqual(cm.exception.detail.get("upgrade_url"), "/pricing")
        self.assertIn("paid feature", cm.exception.detail.get("message", ""))

    def test_pro_monthly_ok_weekly_rejected(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db(count_monitors=0, list_monitors=[],
                      create_monitor={"id": "m1", "email": "p@pro.com",
                                      "url": "https://x.com",
                                      "cadence": "monthly", "active": True})
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("pro"))), \
             patch("platform_api.routes.audit_api.audit_db", new=db):
            ok = asyncio_run(r.create_monitor(
                r.MonitorCreate(email="p@pro.com", url="https://x.com",
                                cadence="monthly"),
                principal=_principal("p@pro.com")))
            self.assertEqual(ok["id"], "m1")
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.create_monitor(
                    r.MonitorCreate(email="p@pro.com", url="https://y.com",
                                    cadence="weekly"),
                    principal=_principal("p@pro.com")))
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Cadence not available",
                      cm.exception.detail.get("message", ""))

    def test_cap_enforced_atomically(self):
        from fastapi import HTTPException
        r = self._routes()
        at_cap = self._db(count_monitors=3, list_monitors=[],  # pro cap = 3
                          create_monitor={})
        exempt = self._db(count_monitors=3,
                          list_monitors=[{"id": "m0", "url": "https://x.com"}],
                          create_monitor={"id": "m1"})
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("pro"))), \
             patch("platform_api.routes.audit_api.audit_db", new=at_cap):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.create_monitor(
                    r.MonitorCreate(email="p@pro.com", url="https://new.com",
                                    cadence="monthly"),
                    principal=_principal("p@pro.com")))
        self.assertEqual(cm.exception.status_code, 429)
        self.assertEqual(cm.exception.detail.get("limit"), 3)
        # already-has-this-url exemption lets the idempotent re-create through
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("pro"))), \
             patch("platform_api.routes.audit_api.audit_db", new=exempt):
            out = asyncio_run(r.create_monitor(
                r.MonitorCreate(email="p@pro.com", url="https://x.com",
                                cadence="monthly"),
                principal=_principal("p@pro.com")))
        self.assertEqual(out["id"], "m1")

    def test_agency_unlimited_skips_cap(self):
        """Founder seed rides through: founder = agency (unlimited urls)."""
        r = self._routes()
        db = self._db(create_monitor={"id": "m9"})
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("agency"))), \
             patch("platform_api.routes.audit_api.audit_db", new=db):
            out = asyncio_run(r.create_monitor(
                r.MonitorCreate(email="founder@nebula.com",
                                url="https://z.com", cadence="weekly"),
                principal=_principal("founder@nebula.com")))
        self.assertEqual(out["id"], "m9")
        db.count_monitors.assert_not_called()

    def test_patch_gates_cadence_and_plan(self):
        from fastapi import HTTPException
        r = self._routes()
        db = self._db(get_monitor=None,
                      update_monitor={"email": "p@pro.com", "cadence": "monthly"})
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("free"))), \
             patch("platform_api.routes.audit_api.audit_db",
                   new=self._db(get_monitor=None)):
            with self.assertRaises(HTTPException) as cm_free:
                asyncio_run(r.update_monitor(
                    "mid", r.MonitorUpdate(cadence="monthly"),
                    principal=_principal("free@user.com")))
        self.assertEqual(cm_free.exception.status_code, 403)
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=self._ent("pro"))), \
             patch("platform_api.routes.audit_api.audit_db", new=db):
            with self.assertRaises(HTTPException) as cm_wk:
                asyncio_run(r.update_monitor(
                    "mid", r.MonitorUpdate(cadence="weekly"),
                    principal=_principal("p@pro.com")))
            out = asyncio_run(r.update_monitor(
                "mid", r.MonitorUpdate(active=False),
                principal=_principal("p@pro.com")))
        self.assertEqual(cm_wk.exception.status_code, 400)
        self.assertEqual(out["cadence"], "monthly")

    def test_error_status_gated_as_free(self):
        """resolve status 'error' must be treated as free (premium closed)."""
        from fastapi import HTTPException
        from platform_api.services.entitlements import Entitlements
        r = self._routes()
        err = Entitlements(plan="pro", status="error", audits_per_month=20,
                           monitored_urls=3, min_interval_hours=720)
        with patch("platform_api.routes.audit_api.resolve_for_email",
                   new=AsyncMock(return_value=err)), \
             patch("platform_api.routes.audit_api.audit_db",
                   new=self._db()):
            with self.assertRaises(HTTPException) as cm:
                asyncio_run(r.create_monitor(
                    r.MonitorCreate(email="x@y.com", url="https://x.com",
                                    cadence="monthly"),
                    principal=_principal("x@y.com")))
        self.assertEqual(cm.exception.status_code, 403)


if __name__ == "__main__":
    unittest.main()
