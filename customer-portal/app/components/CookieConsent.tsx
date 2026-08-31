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
          persistence: 'localStorage',
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

    // Honor-decline teardown (D6): a visitor who declines analytics must not
    // keep being tracked by loaders that already fired under the geo default.
    // - ga-disable-{id} is Google's official kill switch: gtag drops every
    //   queued and subsequent hit.
    // - Removing the gtag script node stops new fetches of the loader.
    // - PostHog opt-out happens below where the instance exists.
    function disableAnalytics() {
      try {
        window['ga-disable-' + measurementId] = true;
      } catch (error) {}
      var gtagScript = document.getElementById('gtag-src');
      if (gtagScript && gtagScript.parentNode) {
        gtagScript.parentNode.removeChild(gtagScript);
      }
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
      if (level === 'necessary') {
        if (window.gtag) {
          window.gtag('consent', 'update', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            functionality_storage: 'granted',
            personalization_storage: 'denied',
            security_storage: 'granted'
          });
        }
        disableAnalytics();
        if (window.posthog && window.posthog.opt_out_capturing) {
          window.posthog.opt_out_capturing();
        }
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
        else disableAnalytics();
      } catch (error) {}
    });

    try {
      var stored = JSON.parse(localStorage.getItem(key) || 'null');
      if (stored && stored.version >= version) {
        document.documentElement.setAttribute('data-analytics-default', stored.level === 'all' ? 'accepted' : 'declined');
        banner.hidden = true;
        if (stored.level === 'all') loadAnalytics();
        else disableAnalytics();
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
        className="fixed bottom-0 left-3 right-3 z-50 max-h-[42vh] overflow-y-auto border border-border-strong bg-bg-panel p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] opacity-100 shadow-[0_20px_70px_rgba(0,0,0,0.62)] motion-reduce:transition-none [&.consent-dismissing]:translate-y-full [&.consent-dismissing]:opacity-0 [&.consent-dismissing]:transition-[opacity,transform] [&.consent-dismissing]:duration-300 [&.consent-dismissing]:ease-out sm:left-auto sm:right-5 sm:max-h-none sm:w-[520px] sm:p-5"
      >
        <div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="cookie-banner-title" className="text-sm font-semibold text-fg">
                  Cookie controls
                </h2>
                <a
                  href="/privacy-policy"
                  className="shrink-0 text-xs text-accent underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Privacy
                </a>
              </div>
              <p id="cookie-banner-description" className="mt-1 text-xs leading-5 text-fg-muted">
                Analytics help us improve Nebula. Essential cookies keep the audit working.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="cookie-consent-essential"
                type="button"
                className="min-h-11 border border-border-strong bg-bg px-4 py-2.5 text-xs font-semibold text-fg transition-colors hover:border-fg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Essential only
              </button>
              <button
                id="cookie-consent-all"
                type="button"
                className="min-h-11 bg-accent px-4 py-2.5 text-xs font-bold text-bg transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel"
              >
                Accept all analytics
              </button>
            </div>
          </div>
        </div>
      </div>
      <script dangerouslySetInnerHTML={{ __html: getConsentRuntime(country) }} />
    </>
  )
}
