# Citable controlled-surface projections

These files are byte-exact copies of the release assets published on
`github.com/mikeholownych/citable` for the deployed Citable version. They are
release governance surfaces, not marketing content:

- `resource-data.json` — its sha256 is emitted as the
  `x-citable-projection-sha256` response header on `/resources/citable`
  (wired in `next.config.ts`).
- `llms.txt` — served byte-exact at `/resources/citable/llms.txt`.

Deployment receipts collected by the citable release process verify the live
responses against the release manifest, so finalizing a citable release
requires these files to match that release's assets **and** the site to be
redeployed within the release's finalization dwell window.

To update for a new release:

```sh
gh release download vX.Y.Z --repo mikeholownych/citable \
  --pattern resource-data.json --pattern llms.txt \
  --dir customer-portal/public/resources/citable --clobber
```

Do not edit these files by hand — any byte difference invalidates the receipt.
