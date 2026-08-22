module.exports=[5849,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/components/AnalyticsRuntime.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/components/AnalyticsRuntime.tsx","default")},73538,a=>{"use strict";var b=a.i(5849);a.n(b)},36404,a=>{"use strict";a.s(["default",()=>b]);let b=(0,a.i(11857).registerClientReference)(function(){throw Error("Attempted to call the default export of [project]/app/components/FunnelChrome.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.")},"[project]/app/components/FunnelChrome.tsx","default")},47692,a=>{"use strict";var b=a.i(36404);a.n(b)},33290,a=>{"use strict";var b=a.i(7997),c=a.i(717),d=a.i(58125);let e={className:d.default.className,style:{fontFamily:"'GeistSans', 'GeistSans Fallback'"}};null!=d.default.variable&&(e.variable=d.default.variable);var f=a.i(27471);let g={className:f.default.className,style:{fontFamily:"'GeistMono', ui-monospace, SFMono-Regular, Roboto Mono, Menlo, Monaco, Liberation Mono, DejaVu Sans Mono, Courier New, monospace"}};null!=f.default.variable&&(g.variable=f.default.variable);let h=Array(9).fill("neutral");function i({size:a=24,states:c=h,passColor:d,failColor:e="#f59e0b",neutralColor:f,style:g,...j}){let k=Array.from({length:9},(a,b)=>{let d=Math.floor(b/3),e=c[b]??"neutral";return{cx:1+b%3*8+3,cy:1+8*d+3,state:e}});return(0,b.jsx)("svg",{width:a,height:a,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg","aria-hidden":"true",style:g,...j,children:k.map(({cx:a,cy:c,state:g},h)=>"pass"===g?(0,b.jsx)("circle",{cx:a,cy:c,r:2.2,fill:d??"currentColor"},h):"fail"===g?(0,b.jsx)("circle",{cx:a,cy:c,r:2.2-.5,stroke:e,strokeWidth:"1.2",fill:"none"},h):(0,b.jsx)("circle",{cx:a,cy:c,r:2.2,fill:f??"currentColor",opacity:"0.25"},h))})}function j({size:a=24,...c}){return(0,b.jsx)(i,{size:a,states:["pass","pass","neutral","pass","neutral","neutral","neutral","neutral","neutral"],passColor:"#c7ff2f",neutralColor:"#525750",...c})}let k="text-sm font-medium text-fg-muted hover:text-fg transition-colors duration-[140ms] focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3 rounded-sm",l=()=>(0,b.jsxs)("a",{href:"/",className:"flex items-center gap-2.5 transition-opacity hover:opacity-75 focus:outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-3 rounded-sm","aria-label":"Nebula Components home",children:[(0,b.jsx)(j,{size:20}),(0,b.jsxs)("span",{className:"text-sm font-semibold tracking-tight text-fg",children:["Nebula",(0,b.jsx)("span",{className:"font-light text-fg-muted",children:" Components"})]})]}),m=({mobile:a=!1})=>(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("a",{href:"/teardowns",className:`${k} ${a?"py-3 block":""}`,children:"Teardowns"}),(0,b.jsx)("a",{href:"/repair-sprint",className:`${k} ${a?"py-3 block":""}`,children:"Repair Sprint"}),(0,b.jsx)("a",{href:"/pricing",className:`${k} ${a?"py-3 block":""}`,children:"Pricing"}),(0,b.jsx)("a",{href:"/learning-centre",className:`${k} ${a?"py-3 block":""}`,children:"Learn"}),(0,b.jsx)("a",{href:"/about",className:`${k} ${a?"py-3 block":""}`,children:"About"}),(0,b.jsx)("a",{href:"/workspace",className:`${k} ${a?"py-3 block":""}`,children:"Workspace"}),(0,b.jsx)("a",{href:"/audit?utm_source=site-nav&utm_medium=internal",className:`${a?"mt-3 w-full text-center":""} btn-primary text-sm py-2 px-4 rounded`,children:"Free Audit"})]});function n(){return(0,b.jsx)("header",{className:"sticky top-0 z-50 border-b border-border bg-bg/90 px-6 py-3.5 backdrop-blur-md",children:(0,b.jsxs)("nav",{"aria-label":"Primary",className:"mx-auto flex max-w-wide flex-row items-center justify-between",children:[(0,b.jsx)(l,{}),(0,b.jsx)("div",{className:"hidden items-center gap-8 sm:flex",children:(0,b.jsx)(m,{})}),(0,b.jsxs)("details",{className:"group relative sm:hidden",children:[(0,b.jsxs)("summary",{className:"flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded p-2 text-fg-muted hover:text-fg focus:outline-none focus-visible:outline-2 focus-visible:outline-accent [&::-webkit-details-marker]:hidden","aria-label":"Toggle navigation","aria-controls":"mobile-nav",children:[(0,b.jsx)("svg",{className:"block group-open:hidden",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round","aria-hidden":"true",children:(0,b.jsx)("path",{d:"M4 7h16M4 12h16M4 17h16"})}),(0,b.jsx)("svg",{className:"hidden group-open:block",width:"20",height:"20",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.75",strokeLinecap:"round","aria-hidden":"true",children:(0,b.jsx)("path",{d:"M18 6L6 18M6 6l12 12"})})]}),(0,b.jsx)("div",{id:"mobile-nav",className:"invisible absolute right-0 top-[calc(100%+10px)] w-52 origin-top-right -translate-y-1 scale-95 flex-col gap-0 rounded-lg border border-border bg-bg-panel px-5 py-4 opacity-0 shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none group-open:visible group-open:translate-y-0 group-open:scale-100 group-open:opacity-100 flex",children:(0,b.jsx)(m,{mobile:!0})})]})]})})}var o=a.i(95936);function p(){return(0,b.jsxs)("footer",{className:"border-t border-border/40 bg-bg-muted/5",children:[(0,b.jsxs)("div",{className:"mx-auto max-w-6xl px-6 py-12",children:[(0,b.jsxs)("div",{className:"grid gap-8 md:grid-cols-4",children:[(0,b.jsxs)("div",{children:[(0,b.jsx)("h3",{className:"mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim",children:"Product"}),(0,b.jsxs)("ul",{className:"space-y-2.5 text-sm text-fg-muted",children:[(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/audit",className:"hover:text-accent transition-colors",children:"Free Landing Page Audit"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/repair-sprint",className:"hover:text-accent transition-colors",children:"Repair Sprint"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/pricing",className:"hover:text-accent transition-colors",children:"Pricing"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/benchmarks",className:"hover:text-accent transition-colors",children:"Conversion Benchmarks"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/teardowns",className:"hover:text-accent transition-colors",children:"Public Teardowns"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/case-studies",className:"hover:text-accent transition-colors",children:"Case Studies"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/compare",className:"hover:text-accent transition-colors",children:"Tool Comparisons"})})]})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("h3",{className:"mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim",children:"Audit Types"}),(0,b.jsxs)("ul",{className:"space-y-2.5 text-sm text-fg-muted",children:[(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/ecommerce-landing-page-audit",className:"hover:text-accent transition-colors",children:"Ecommerce"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/saas-landing-page-audit",className:"hover:text-accent transition-colors",children:"SaaS"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/mobile-landing-page-audit",className:"hover:text-accent transition-colors",children:"Mobile"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/lead-generation-landing-page-audit",className:"hover:text-accent transition-colors",children:"Lead Generation"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/landing-page-cta-audit",className:"hover:text-accent transition-colors",children:"CTA"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/landing-page-message-match",className:"hover:text-accent transition-colors",children:"Message Match"})})]})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("h3",{className:"mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim",children:"Learn"}),(0,b.jsxs)("ul",{className:"space-y-2.5 text-sm text-fg-muted",children:[(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/why-is-my-landing-page-not-converting",className:"hover:text-accent transition-colors",children:"Why Pages Don't Convert"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/ads-getting-clicks-but-no-sales",className:"hover:text-accent transition-colors",children:"Ads with No Sales"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/what-is-landing-page-audit",className:"hover:text-accent transition-colors",children:"What Is an Audit?"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/best-landing-page-audit-tools",className:"hover:text-accent transition-colors",children:"Audit Tools Compared"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/playbooks",className:"hover:text-accent transition-colors",children:"Playbooks"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/learning-centre",className:"hover:text-accent transition-colors font-medium",children:"All guides →"})})]})]}),(0,b.jsxs)("div",{children:[(0,b.jsx)("h3",{className:"mb-4 text-[11px] font-semibold uppercase tracking-widest text-fg-dim",children:"Nebula"}),(0,b.jsxs)("ul",{className:"space-y-2.5 text-sm text-fg-muted",children:[(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/workspace",className:"hover:text-accent transition-colors",children:"Client Workspace"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/about",className:"hover:text-accent transition-colors",children:"About"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/press",className:"hover:text-accent transition-colors",children:"Press"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/brand",className:"hover:text-accent transition-colors",children:"Brand Assets"})}),(0,b.jsx)("li",{children:(0,b.jsx)(o.default,{href:"/editorial-standards",className:"hover:text-accent transition-colors",children:"Editorial Standards"})}),(0,b.jsx)("li",{children:(0,b.jsx)("a",{href:"mailto:nebulashop@agentmail.to",className:"hover:text-accent transition-colors",children:"Contact"})})]})]})]}),(0,b.jsxs)("div",{className:"mt-10 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4",children:[(0,b.jsx)("p",{className:"text-sm text-fg-muted",children:"Check your page against 9 conversion signals in under 2 minutes."}),(0,b.jsx)(o.default,{href:"/audit?utm_source=footer&utm_medium=internal",className:"btn-primary shrink-0 px-6 py-2.5 text-sm",children:"Get Your Free Audit →"})]})]}),(0,b.jsx)("div",{className:"border-t border-border/20 px-6 py-4",children:(0,b.jsxs)("div",{className:"mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-fg-dim",children:[(0,b.jsxs)("p",{children:["© ",new Date().getFullYear()," Nebula Components. All rights reserved."]}),(0,b.jsxs)("nav",{"aria-label":"Legal",className:"flex gap-4",children:[(0,b.jsx)(o.default,{href:"/privacy-policy",className:"hover:text-fg-muted transition-colors",children:"Privacy"}),(0,b.jsx)(o.default,{href:"/terms",className:"hover:text-fg-muted transition-colors",children:"Terms"}),(0,b.jsx)(o.default,{href:"/data-rights",className:"hover:text-fg-muted transition-colors",children:"Data Rights"})]})]})})]})}function q(){return(0,b.jsx)("script",{src:"/webmcp.js",defer:!0})}function r(a=null){return String.raw`
  (function () {
    var key = 'nebula-cookie-consent';
    var version = 1;
    var measurementId = 'G-KJ9S3450LH';
    var visitorCountry = ${JSON.stringify(a)};
    var euCountries = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB'];
    var euVisitor = euCountries.indexOf(visitorCountry) !== -1;
    var posthogKey = ${JSON.stringify("phc_tE82te9eTUAKiMhGKTbSPwdGLLNDAvMd9iDe8a2QH9tX")};
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
  `}function s({country:a=null}){return(0,b.jsxs)(b.Fragment,{children:[(0,b.jsx)("div",{id:"cookie-consent-banner",role:"dialog","aria-modal":"true",tabIndex:-1,"aria-labelledby":"cookie-banner-title","aria-describedby":"cookie-banner-description",className:"fixed bottom-0 left-0 right-0 z-50 max-h-[42vh] overflow-y-auto border-t border-border bg-bg-panel p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] opacity-100 motion-reduce:transition-none [&.consent-dismissing]:translate-y-full [&.consent-dismissing]:opacity-0 [&.consent-dismissing]:transition-[opacity,transform] [&.consent-dismissing]:duration-300 [&.consent-dismissing]:ease-out md:max-h-none md:p-6",children:(0,b.jsx)("div",{className:"mx-auto max-w-5xl",children:(0,b.jsxs)("div",{className:"flex flex-col gap-4 md:flex-row md:items-center md:gap-8",children:[(0,b.jsxs)("div",{className:"flex-1",children:[(0,b.jsx)("h2",{id:"cookie-banner-title",className:"mb-1 text-base font-semibold text-fg",children:"We use cookies"}),(0,b.jsxs)("p",{id:"cookie-banner-description",className:"text-sm leading-relaxed text-fg-muted",children:["We use cookies for analytics to improve our site. Essential cookies keep your session active. You can accept all cookies or only essential ones."," ",(0,b.jsx)("a",{href:"/privacy-policy",className:"text-accent underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel",children:"Privacy Policy"})]})]}),(0,b.jsxs)("div",{className:"flex flex-row gap-2",children:[(0,b.jsx)("button",{id:"cookie-consent-essential",type:"button",className:"rounded-lg border border-border bg-bg px-5 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-bg-panel focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel",children:"Essential only"}),(0,b.jsx)("button",{id:"cookie-consent-all",type:"button",className:"rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-panel",children:"Accept all"})]})]})})}),(0,b.jsx)("script",{dangerouslySetInnerHTML:{__html:r(a)}})]})}function t(){return(0,b.jsx)(s,{country:null})}function u(){return(0,b.jsx)("meta",{property:"og:url",content:"https://nebulacomponents.com/"})}r(null);var v=a.i(73538),w=a.i(47692),x=a.i(60880),y=a.i(57010);let z={width:"device-width",initialScale:1,viewportFit:"cover",themeColor:y.brand.metadata.themeColor,colorScheme:y.brand.metadata.colorScheme},A={metadataBase:new URL("https://nebulacomponents.com"),title:{default:"Find Failed Page Conditions on Your Landing Page | Nebula Components",template:"%s"},description:"Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.",alternates:{canonical:"https://nebulacomponents.com/"},openGraph:{title:"Find Failed Page Conditions on Your Landing Page | Nebula Components",description:"Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.",siteName:y.brand.name,locale:"en_US",type:"website",images:[{url:y.brand.assets.ogDefault,width:1200,height:630,alt:"Nebula Components - inspect failed page conditions before spending more on ads"}]},twitter:{card:"summary_large_image",title:"Find Failed Page Conditions on Your Landing Page | Nebula Components",description:"Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.",creator:"@NebulaCRO",images:[y.brand.assets.ogDefault]},icons:{icon:[{url:y.brand.assets.faviconSvg,type:"image/svg+xml"},{url:y.brand.assets.favicon32,sizes:"32x32",type:"image/png"},{url:y.brand.assets.favicon16,sizes:"16x16",type:"image/png"}],shortcut:y.brand.assets.faviconSvg,apple:y.brand.assets.appleTouchIcon}};a.s(["default",0,function({children:a}){return(0,b.jsxs)("html",{lang:"en",suppressHydrationWarning:!0,className:`${e.variable} ${g.variable}`,children:[(0,b.jsxs)("head",{children:[(0,b.jsx)(c.Suspense,{fallback:(0,b.jsx)("meta",{property:"og:url",content:"https://nebulacomponents.com/"}),children:(0,b.jsx)(u,{})}),(0,b.jsx)("link",{rel:"describedby",href:"/llms.txt",type:"text/plain"}),(0,b.jsx)("script",{dangerouslySetInnerHTML:{__html:`
              (function() {
                try {
                  var raw = localStorage.getItem('nebula-cookie-consent');
                  if (!raw) return;
                  var state = JSON.parse(raw);
                  if (state && state.version >= 1 && (state.level === 'all' || state.level === 'necessary')) {
                    document.documentElement.setAttribute('data-cookie-consent', 'given');
                  }
                } catch (e) {}
              })();
            `}}),(0,b.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(x.organizationSchema)}}),(0,b.jsx)("script",{type:"application/ld+json",dangerouslySetInnerHTML:{__html:JSON.stringify(x.websiteSchema)}})]}),(0,b.jsxs)("body",{children:[(0,b.jsx)("a",{href:"#main-content",className:"skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-bg focus:rounded",children:"Skip to main content"}),(0,b.jsx)(n,{}),a,(0,b.jsx)(p,{}),(0,b.jsx)(c.Suspense,{fallback:null,children:(0,b.jsx)(t,{})}),(0,b.jsx)(c.Suspense,{fallback:null,children:(0,b.jsx)(v.default,{})}),(0,b.jsx)(c.Suspense,{fallback:null,children:(0,b.jsx)(w.default,{})}),(0,b.jsx)(q,{})]})]})},"metadata",0,A,"viewport",0,z],33290)},70864,function(a){a.n(a.i(33290))},27471,a=>{a.v({className:"geistmono_157ca88a-module__iaM1Ya__className",variable:"geistmono_157ca88a-module__iaM1Ya__variable"})},58125,a=>{a.v({className:"geistsans_d5a4f12f-module__Ur3q_a__className",variable:"geistsans_d5a4f12f-module__Ur3q_a__variable"})}];

//# sourceMappingURL=_05k1yv5._.js.map