export const CONSENT_RUNTIME = String.raw`
  (function () {
    var key = 'nebula-cookie-consent';
    var version = 1;
    var measurementId = 'G-KJ9S3450LH';
    var posthogKey = ${JSON.stringify(process.env.NEXT_PUBLIC_POSTHOG_KEY || '')};
    var banner = document.getElementById('cookie-consent-banner');
    if (!banner) return;

    function loadGoogleAnalytics() {
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: 'granted',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        functionality_storage: 'granted',
        security_storage: 'granted'
      });
      window.gtag('js', new Date());
      window.gtag('config', measurementId, { send_page_view: false });
      var script = document.createElement('script');
      script.id = 'gtag-src';
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
      document.head.appendChild(script);
    }

    function loadPostHog() {
      if (!posthogKey || document.querySelector('script[data-nebula-posthog]')) return;
      var script = document.createElement('script');
      script.async = true;
      script.dataset.nebulaPosthog = 'true';
      script.src = '/ingest/static/array.js';
      script.addEventListener('load', function () {
        if (!window.posthog) return;
        window.posthog.init(posthogKey, {
          api_host: '/ingest',
          ui_host: 'https://us.posthog.com',
          defaults: '2026-01-30',
          capture_exceptions: true,
          capture_pageleave: true,
          capture_dead_clicks: true,
          person_profiles: 'identified_only'
        });
      }, { once: true });
      document.head.appendChild(script);
    }

    function loadAnalytics() {
      loadGoogleAnalytics();
      loadPostHog();
    }

    function save(level) {
      var state = {
        level: level,
        version: version,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(key, JSON.stringify(state));
      banner.classList.add('consent-dismissing');
      var hide = function () { banner.hidden = true; };
      // transitionend gives the fast path; the timeout is a backstop so the
      // banner can never get stuck visible-but-dismissed if the transition
      // doesn't fire (e.g. the element is display:none for some other reason).
      banner.addEventListener('transitionend', hide, { once: true });
      setTimeout(hide, 350);
      if (level === 'all') loadAnalytics();
      if (window.gtag && level === 'necessary') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          functionality_storage: 'granted',
          personalization_storage: 'denied',
          security_storage: 'granted'
        });
      }
      window.dispatchEvent(new CustomEvent('cookie-consent-update', { detail: state }));
    }

    document.getElementById('cookie-consent-essential').addEventListener(
      'click',
      function () { save('necessary'); }
    );
    document.getElementById('cookie-consent-all').addEventListener(
      'click',
      function () { save('all'); }
    );

    try {
      var stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored && stored.version >= version) {
        banner.hidden = true;
        if (stored.level === 'all') loadAnalytics();
      }
    } catch (error) {}
  })();
`

export default function CookieConsent() {
  return (
    <>
      <div
        id="cookie-consent-banner"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-0 left-0 right-0 z-50 translate-y-0 border-t border-emerald-500/20 bg-[#0a0a0a] p-4 opacity-100 transition-[opacity,transform] duration-300 ease-out [&.consent-dismissing]:translate-y-full [&.consent-dismissing]:opacity-0 md:p-6"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <div className="flex-1">
              <h2 id="cookie-banner-title" className="mb-1 text-base font-semibold text-white">
                We use cookies
              </h2>
              <p id="cookie-banner-description" className="text-sm leading-relaxed text-gray-400">
                We use cookies for analytics to improve our site. Essential cookies keep your
                session active. You can accept all cookies or only essential ones.{' '}
                <a
                  href="/privacy-policy"
                  className="text-emerald-400 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
              <button
                id="cookie-consent-essential"
                type="button"
                className="rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Essential only
              </button>
              <button
                id="cookie-consent-all"
                type="button"
                className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_RUNTIME }} />
    </>
  )
}
