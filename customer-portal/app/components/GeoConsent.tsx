/**
 * CookieConsentStatic — static version of GeoConsent.
 *
 * Renders the CookieConsent banner with country=null (EU-conservative default).
 * Country detection moved to the consent runtime script itself, which reads
 * the CF-IPCountry cookie written by Cloudflare Workers if available, or
 * defaults to showing the banner (opt-in required).
 *
 * This is the privacy-correct default: show the banner to everyone.
 * Analytics only load after explicit "Accept all" click.
 *
 * Does NOT call headers() — keeps the layout statically renderable.
 */
import CookieConsent from './CookieConsent'

export default function GeoConsent() {
  // null = conservative default: show banner, require explicit consent
  // The runtime script handles EU-specific logic client-side
  return <CookieConsent country={null} />
}
