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
cd /home/mike/nebula/customer-portal
npm ci --include=dev
npm run ci
sudo systemctl restart nebula-nextjs.service
```

Do not run `npm run start` outside systemd. Before stopping or replacing a live process, confirm its cgroup with:

```bash
systemctl show nebula-nextjs.service -p MainPID -p ControlGroup
sudo ss -ltnp 'sport = :3000'
```

## Verify

```bash
scripts/verify_production_services.sh
```
