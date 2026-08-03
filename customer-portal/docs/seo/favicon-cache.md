# Favicon cache note

The canonical favicon assets are the bare public paths `/favicon.svg`, `/favicon.ico`, `/favicon.png`, `/favicon-16x16.png`, and `/favicon-32x32.png`. The application metadata and Next.js build serve those same paths without query-string cache busting.

A deploy updates the origin assets, but a CDN may continue serving an older immutable favicon response until its cache lifetime expires. This repository cannot purge a production CDN cache: purge requires the separately configured CDN account/API and is intentionally not performed by the build. If an old icon remains after deploy, purge the favicon paths in the CDN provider or wait for expiry, then verify the response body and `ETag`/`Last-Modified` at the public hostname.
