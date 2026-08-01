// CookieConsent renders as a plain server component so the consent runtime
// script lands in the initial HTML and always executes. It must NOT be
// dynamic(ssr:false): client-side injection of dangerouslySetInnerHTML
// scripts never runs, which previously left the banner permanently visible
// and consent-gated analytics never loading.
export { default } from './CookieConsent'
