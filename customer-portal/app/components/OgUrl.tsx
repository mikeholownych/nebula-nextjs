/**
 * OgUrl — static fallback for OG URL meta tag.
 *
 * Per-page OG URLs are set in each page's metadata.openGraph.url.
 * This root-level fallback uses the homepage URL. It does NOT call
 * headers() — keeping the layout statically renderable.
 *
 * Individual pages override this via their own metadata export.
 */
export default function OgUrl() {
  return (
    <meta property="og:url" content="https://nebulacomponents.com/" />
  )
}
