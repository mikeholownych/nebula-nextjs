# CI/CD Runbook

## Overview

Nebula Components uses GitHub Actions for CI/CD with automated:
- Build verification
- Lighthouse performance budgets
- Type checking
- Test execution
- Production deployments

## Pipeline Stages

### 1. Test Stage
**Trigger:** Every push/pull request to `main`

**Jobs:**
- **test:** Validates code quality
  - Checks out code
  - Sets up Node.js 24
  - Installs dependencies (`npm ci`)
  - Runs TypeScript check (`npx tsc --noEmit`)
  - Runs tests (`npm test`)

**Pass criterion:** All checks complete successfully

### 2. Build Stage
**Trigger:** After test stage passes

**Jobs:**
- **build:** Creates production build
  - Checks out code
  - Sets up Node.js 24
  - Installs dependencies
  - Runs Next.js build (`npm run build`)
  - Uploads `.next` artifact

**Pass criterion:** Build completes without errors

### 3. Deploy Stage
**Trigger:** After build stage completes

**Jobs:**
- **deploy:** Deploys to production
  - Downloads `.next` artifact
  - Deploys via systemd restart
  - Verifies health endpoints

**Environment:** `production` (requires review)

## Performance Budgets

| Metric | Threshold | Aggregation |
|--------|-----------|-------------|
| LCP (Largest Contentful Paint) | <2.5s | P75 |
| CLS (Cumulative Layout Shift) | <0.1 | P75 |
| INP (Interaction to Next Paint) | <3.8s | P75 |

**Action on budget breach:** PR blocked, require justification

## Deployment Process

### Manual Production Release

```bash
# 1. Ensure branch is up-to-date
git checkout main
git pull origin main

# 2. Verify all tests pass locally
cd customer-portal
npm ci
npm run build
npm test

# 3. Check health endpoints
curl -s https://nebulacomponents.com/healthz | jq .
curl -s https://nebulacomponents.com/readyz | jq .

# 4. Merge to main (triggers CI/CD)
git merge your-feature-branch
git push origin main

# 5. Monitor deployment
journalctl -u nebula-nextjs.service -f
```

### Emergency Rollback

```bash
# 1. Identify last known-good commit
git log --oneline -20

# 2. Revert to last good commit
git revert <bad-commit>^..HEAD

# 3. Push to trigger rollback
git push origin main

# 4. Monitor recovery
journalctl -u nebula-nextjs.service -f
```

## Feature Flags

### List Current Flags
```bash
python3 /home/mike/nebula/scripts/feature_flags.py
```

### Enable Feature for 10% of Users
```python
# In Python REPL or script
from scripts.feature_flags import enable_feature
enable_feature('canary_deployments', rollout_percentage=10)
```

### Disable Feature
```python
from scripts.feature_flags import disable_feature
disable_feature('analytics_v2')
```

## Monitoring

### Build Status
- **GitHub Actions UI:** View pipeline status
- **Email notifications:** Failed builds

### Production Health
- **Health endpoint:** `https://nebulacomponents.com/healthz`
- **Ready endpoint:** `https://nebulacomponents.com/readyz`
- **Logs:** `journalctl -u nebula-nextjs.service -f`

### Performance
- **Lighthouse reports:** Uploaded to temporary storage after each PR
- **Core Web Vitals:** Google Search Console

## Troubleshooting

### Build Fails
1. Check Node version: `node -v` should be `v24.x.x`
2. Clear cache: `rm -rf customer-portal/node_modules`
3. Reinstall: `cd customer-portal && npm ci`

### Deploy Hangs
1. Check if service is running: `systemctl status nebula-nextjs`
2. Review logs: `journalctl -u nebula-nextjs -n 100`
3. Manual restart: `sudo systemctl restart nebula-nextjs`

### Health Check Fails
1. Verify `.next` build exists
2. Check port 3000: `ss -tuln | grep :3000`
3. Review app logs: `journalctl -u nebula-nextjs -f`

## Configuration Files

- **Build config:** `.github/workflows/build.yml`
- **Lighthouse config:** `lighthouse.config.js`
- **Feature flags:** `scripts/feature_flags.py`

## contacts

- **Infra:** Mike (primary)
- **Deployment support:** Mike
- **Emergency:** PagerDuty
