# Workspace Cutover Runbook (execute when new app passes vetting)

Preconditions:
- [ ] workspace-app feature-complete against docs/workspace/REQUIREMENTS-v1.md Phase 0-2 scope
- [ ] Mike OAuth redirect URI added in Google Cloud Console: https://app.nebulacomponents.com/api/auth/google/callback
- [ ] Magic-link email base URL switched to app. host (workspace-app/.env NEXT_PUBLIC_URL)
- [ ] Tenant isolation tests green; regression set green on :3005
- [ ] E2E pass by Mike personally

Cutover sequence (single flip):
1. systemctl enable --now nebula-workspace-app.service  (verify :3005 200)
2. Add ingress rule to ~/.cloudflared/config.yml ABOVE catch-all:
   - hostname: app.nebulacomponents.com
     service: http://localhost:3005
3. CF API: create CNAME app -> <tunnel-id>.cfargotunnel.com proxied (zone 6c3cbc0c403d0c1b9fd58e46143eedf3)
4. sudo systemctl restart cloudflared-tunnel.service
5. Verify https://app.nebulacomponents.com 200 + headers + login flow end to end
6. Apex redirect: add middleware/route in customer-portal /workspace/* -> 301 app host
7. Rebuild customer-portal, verify apex regression set
8. Remove SHARE FREEZE guards (customer-portal/app/api/workspace/team/route.ts + platform_api/routes/organizations.py invite_member) ONLY if new team features are live in the new app; otherwise keep frozen until they are

Rollback (if anything breaks post-flip):
- cloudflared config revert + restart = instant (DNS record can stay)
