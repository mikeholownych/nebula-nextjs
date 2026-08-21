export function getConsentRuntime(country: string | null = null) {
  return String.raw`
  (function () {
    var key = 'nebula-cookie-consent';
    var version = 1;
    var measurementId = 'G-KJ9S3450LH';
    var visitorCountry = ${JSON.stringify(country)};
    var euCountries = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB'];
    var euVisitor = euCountries.indexOf(visitorCountry) !== -1;
    var posthogKey = ${JSON.stringify(process.env.NEXT_PUBLIC_POSTHOG_KEY || '')};
    var banner = document.getElementById('cookie-consent-banner');
    if (!banner) return;
    var previouslyFocused = document.activeElement;
    var focusable = function () {
      return Array.prototype.slice.call(banner.querySelectorAll('button, a[href]'));
    };
    var focusFirst = function () {
      var controls = focusable();
      if (controls[0] && typeof controls[0].focus === 'function') controls[0].focus();
    };

    function loadGoogleAnalytics() {
      if (document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) return;
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('consent', 'default', {
        analytics_storage: euVisitor ? 'denied' : 'granted',
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
        try {
          var current = JSON.parse(localStorage.getItem(key) || 'null');
          if (current && current.version >= version && current.level === 'necessary') return;
        } catch (error) {}
        if (!window.posthog) return;
        window.posthog.init(posthogKey, {
          api_host: '/ingest',
          ui_host: 'https://us.posthog.com',
          defaults: '2026-08-05',
          autocapture: true,
          capture_exceptions: false,
          capture_pageleave: true,
          capture_dead_clicks: false,
          disable_surveys: true,
          disable_session_recording: true,
          capture_performance: false,
          person_profiles: 'identified_only'
        });
        window.dispatchEvent(new CustomEvent('nebula-posthog-ready'));
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
      document.documentElement.setAttribute('data-analytics-default', level === 'all' ? 'accepted' : 'declined');
      document.documentElement.setAttribute('data-cookie-consent', 'given');
      banner.classList.add('consent-dismissing');
      var hide = function () {
        banner.hidden = true;
        if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
      };
      // transitionend gives the fast path; the timeout is a backstop so the
      // banner can never get stuck visible-but-dismissed if the transition
      // doesn't fire (e.g. the element is display:none for some other reason).
      banner.addEventListener('transitionend', hide, { once: true });
      setTimeout(hide, 350);
      if (level === 'all') {
        loadAnalytics();
        if (window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'granted',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
          });
        }
        if (window.posthog && window.posthog.opt_in_capturing) window.posthog.opt_in_capturing();
      }
      if (window.gtag && level === 'necessary') {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          functionality_storage: 'granted',
          personalization_storage: 'denied',
          security_storage: 'granted'
        });
      }
      if (level === 'necessary' && window.posthog && window.posthog.opt_out_capturing) {
        window.posthog.opt_out_capturing();
      }
      window.dispatchEvent(new CustomEvent('cookie-consent-update', { detail: state }));
    }

    banner.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        save('necessary');
        return;
      }
      if (event.key !== 'Tab') return;
      var controls = focusable();
      if (!controls.length) return;
      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof Element)) return;
      var button = target.closest('#cookie-consent-essential, #cookie-consent-all');
      if (!button) return;
      save(button.id === 'cookie-consent-all' ? 'all' : 'necessary');
    });

    window.addEventListener('storage', function (event) {
      if (event.key !== key) return;
      try {
        var next = JSON.parse(event.newValue || 'null');
        if (!next || next.version < version) return;
        document.documentElement.setAttribute('data-analytics-default', next.level === 'all' ? 'accepted' : 'declined');
        document.documentElement.setAttribute('data-cookie-consent', 'given');
        banner.hidden = true;
        if (next.level === 'all') loadAnalytics();
      } catch (error) {}
    });

    try {
      var stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored && stored.version >= version) {
        document.documentElement.setAttribute('data-analytics-default', stored.level === 'all' ? 'accepted' : 'declined');
        banner.hidden = true;
        if (stored.level === 'all') loadAnalytics();
      } else {
        document.documentElement.setAttribute('data-analytics-default', euVisitor ? 'required' : 'accepted');
        if (!euVisitor) loadAnalytics();
        focusFirst();
      }
    } catch (error) {}
  })();
  `
}

export const CONSENT_RUNTIME = getConsentRuntime(null)

export default function CookieConsent({ country = null }: { country?: string | null }) {
  return (
    <>
      <div
        id="cookie-consent-banner"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-0 left-0 right-0 z-50 max-h-[42vh] overflow-y-auto border-t border-border bg-bg-panel p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] opacity-100 motion-reduce:transition-none [&.consent-dismissing]:translate-y-full [&.consent-dismissing]:opacity-0 [&.consent-dismissing]:transition-[opacity,transform] [&.consent-dismissing]:duration-300 [&.consent-dismissing]:ease-out md:max-h-none md:p-6"
      >
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <div className="flex-1">
              <h2 id="cookie-banner-title" className="mb-1 text-base font-semibold text-fg">
                We use cookies
              </h2>
              <p id="cookie-banner-description" className="text-sm leading-relaxed text-fg-muted">
                We use cookies for analytics to improve our site. Essential cookies keep your
                session active. You can accept all cookies or only essential ones.{' '}
                <a
                  href="/privacy-policy"
                  className="text-accent underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
            <div className="flex flex-row gap-2">
              <button
                id="cookie-consent-essential"
                type="button"
                className="rounded-lg border border-border bg-bg px-5 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel"
              >
                Essential only
              </button>
              <button
                id="cookie-consent-all"
                type="button"
                className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: getConsentRuntime(country) }} />
    </>
  )
}
