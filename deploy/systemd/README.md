# Nebula production systemd deployment

The production topology has exactly two canonical owners:

- `nebula-nextjs.service` owns `customer-portal` on port 3000.
- `cloudflared-tunnel.service` owns the Cloudflare tunnel.

`nebula-site.service` and `nebula-cloudflared.service` are obsolete aliases and must remain disabled/inactive.

## Install or refresh units

```bash
sudo install -m 0644 deploy/systemd/nebula-nextjs.service /etc/systemd/system/nebula-nextjs.service
sudo install -m 0644 deploy/systemd/cloudflared-tunnel.service /etc/systemd/system/cloudflared-tunnel.service
sudo systemctl daemon-reload
sudo systemctl disable --now nebula-site.service nebula-cloudflared.service
sudo systemctl enable nebula-nextjs.service cloudflared-tunnel.service
```

## Build and restart the site

```bash
scripts/deploy_customer_portal.sh
```

This runs the full sequence atomically — `npm ci`, `npm run ci` (build + lint + typecheck + tests), `systemctl restart nebula-nextjs.service`, then `verify_production_services.sh` — and fails loudly if any step breaks. **Always deploy through this script, not the steps by hand.** It exists because of the 2026-07-26 incident: a build landed (commit `8aa1434a`) but the service was never restarted, so `nebula-nextjs.service` kept serving old HTML against a static-asset directory the new build had already overwritten — every page returned 200 while its CSS 500'd/404'd. Running build and restart as two separate manual steps is exactly what let that gap happen; this script closes it by making the restart+verify non-optional.

If you ever do need to run the steps by hand (e.g. debugging the script itself), they are:

```bash
cd /home/mike/nebula/customer-portal
npm ci --include=dev
npm run ci
sudo systemctl restart nebula-nextjs.service
scripts/verify_production_services.sh
```

**Never run `npm run start` outside systemd** — a manually-started `next start --port 3000` will fight the systemd-managed process for the port and can knock it offline (this happened on 2026-07-26: an unrelated process bound port 3000 outside systemd, and the resulting restart left `nebula-nextjs.service` stuck unable to bind). Before stopping or replacing a live process, confirm its cgroup with:

```bash
systemctl show nebula-nextjs.service -p MainPID -p ControlGroup
sudo ss -ltnp 'sport = :3000'
```

## Verify

```bash
scripts/verify_production_services.sh
```

Beyond checking unit/process health, this also fetches the homepage's linked stylesheet (both locally and through the public edge) and confirms it returns 200 — a page-level 200 alone would not have caught the 2026-07-26 CSS outage, since the broken page itself still returned 200.
