# Secret rotation runbook

**Purpose.** Document how to rotate production secrets. This file is a checklist, not an execution log. Do not put secret values here.

**Assessment date:** 2026-08-20

Live material must live only in systemd `EnvironmentFile` drop-ins. `.env.local` in the working tree is for local placeholders. It must not hold live Stripe keys, JWT signing material, webhook secrets, or unlock HMAC secrets.

---

## Secrets in scope

| Secret | Used by | Units |
|---|---|---|
| Stripe live secret key (`STRIPE_SECRET_KEY`) | Checkout + fulfillment | `nebula-nextjs.service` |
| Stripe webhook signing secret (`STRIPE_WEBHOOK_SECRET`) | Signature verify on inbound Stripe events | `nebula-nextjs.service`, `nebula-platform-api.service` (separate endpoint secrets) |
| JWT signing key (`SECRET_KEY`) | FastAPI session/JWT | `nebula-platform-api.service` |
| Portal auth secret (`AUTH_SECRET`) | Next auth primitives that share JWT verification with the API | `nebula-nextjs.service` |
| Audit unlock HMAC (`AUDIT_UNLOCK_SECRET`) | `audit_unlock_{id}` cookie sign/verify | `nebula-nextjs.service` |

Rotate any of these if they ever lived in the git working tree, a backup of `.env.local`, agent logs, or world-readable files.

---

## Storage

- Inject via systemd `EnvironmentFile=` drop-ins under `/etc/systemd/system/<unit>.service.d/`.
- File mode **`0400`**, owner **root**. Not `0644`, not group-readable, not in the repo.
- Example layout (names only; values stay off-disk in this doc):
  - `/etc/systemd/system/nebula-nextjs.service.d/stripe.conf`
  - `/etc/systemd/system/nebula-nextjs.service.d/auth.conf`
  - `/etc/systemd/system/nebula-platform-api.service.d/stripe.conf`
  - `/etc/systemd/system/nebula-platform-api.service.d/jwt.conf`
- After editing a drop-in: `sudo chmod 0400 <file> && sudo systemctl daemon-reload`.
- Confirm the unit sees the file: `systemctl show <unit> -p EnvironmentFiles`.

---

## Rotation sequence (operator)

1. **Inventory.** Confirm which unit(s) consume the secret. Stripe live key is Next; JWT `SECRET_KEY` is FastAPI; webhook secrets are per-endpoint; `AUDIT_UNLOCK_SECRET` is Next.
2. **Issue new material** in the vendor console (Stripe Dashboard for keys/webhook secrets; `openssl rand -base64 32` for JWT/`AUDIT_UNLOCK_SECRET`).
3. **Write the new value** into the `0400` `EnvironmentFile` only. Do not paste into chat, git, `.env.local`, or shell history files that are backed up.
4. **Do not** copy the new value into `customer-portal/.env.local`. Local dev uses test/restricted keys or empty placeholders from `.env.example`.
5. **Restart the owning unit(s)** so the process re-reads env:
   - Stripe live key or `AUDIT_UNLOCK_SECRET` or `AUTH_SECRET` → `sudo systemctl restart nebula-nextjs.service`
   - JWT `SECRET_KEY` → `sudo systemctl restart nebula-platform-api.service`
   - Webhook secret → restart the unit that verifies that endpoint. If both Next and FastAPI verify Stripe, rotate and restart **both**, and update the matching Stripe Dashboard endpoint secret.
6. **Verify.** Stripe: send a test event or wait for the next live event (signature must 2xx). Auth: a new login issues a token; old tokens are expected to fail after `SECRET_KEY` rotation. Unlock cookies signed with the old `AUDIT_UNLOCK_SECRET` will not verify — that is intended.
7. **Revoke the old Stripe key** in the Dashboard only after the new key is confirmed on a live request.
8. **Sweep working tree.** `git status` / `rg` for `sk_live_`, `whsec_`, `rk_live_`. If `.env.local` still has live material, delete those lines (do not commit the file).

---

## Overlap window

JWT and unlock HMAC have no dual-secret reader today. Rotation is a hard cut: restart, then old tokens/cookies fail. Prefer a low-traffic window. Stripe key rotation can overlap if the Dashboard still accepts the old key until you revoke it.

---

## Out of scope for agents

Do not rotate live Stripe keys, JWT `SECRET_KEY`, webhook secrets, or `AUDIT_UNLOCK_SECRET` from an agent session. Do not `systemctl restart` production as part of a docs/CI change. This runbook is executed by an operator.
