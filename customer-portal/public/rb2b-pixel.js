<!-- RB2B Visitor Identification Pixel -->
<!-- Deploys to: nebulacomponents.com (all pages) -->
<!-- Purpose: Track company reverse-DNS when prospects visit audit/fix-pack/pricing pages -->
<!-- Triggers: POST to /webhook/rb2b-event with company + pages + dwell_time -->
<script>
  (function() {
    // RB2B API endpoint (configure in production)
    const RB2B_CLIENT_ID = 'nebula-components-001'; // From RB2B dashboard
    const WEBHOOK_URL = 'https://nebulacomponents.com/api/lead-gen/rb2b-event'; // Our receiver

    // Track page visit
    const trackPageVisit = () => {
      const pagePath = window.location.pathname;
      const pageTitle = document.title;
      const sessionStartTime = window.sessionStartTime || Date.now();
      const dwell = Math.round((Date.now() - sessionStartTime) / 1000);

      // Map page to audit/fix-pack/pricing category
      let pageCategory = 'other';
      if (pagePath.includes('/audit')) pageCategory = 'audit';
      else if (pagePath.includes('/fix-pack') || pagePath.includes('/checkout')) pageCategory = 'fix-pack';
      else if (pagePath.includes('/pricing')) pageCategory = 'pricing';

      // Store in session
      if (!window.pageVisits) window.pageVisits = [];
      window.pageVisits.push({ page: pageCategory, dwell, timestamp: Date.now() });

      // Log
      console.debug(`[RB2B] Tracked visit to ${pageCategory} (dwell: ${dwell}s)`);
    };

    // Send visitor profile to webhook on page unload or after 5 minutes
    const sendVisitorProfile = async () => {
      if (!window.pageVisits || window.pageVisits.length === 0) return;

      const totalDwell = window.pageVisits.reduce((sum, p) => sum + p.dwell, 0);
      const pages = [...new Set(window.pageVisits.map(p => p.page))]; // Unique pages

      const payload = {
        client_id: RB2B_CLIENT_ID,
        pages_visited: pages,
        total_dwell_s: totalDwell,
        last_visit: new Date().toISOString(),
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'organic',
        referrer: document.referrer,
        user_agent: navigator.userAgent,
      };

      try {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        console.debug('[RB2B] Profile sent to webhook');
      } catch (err) {
        console.debug('[RB2B] Webhook post failed (expected if webhook not deployed yet):', err.message);
      }
    };

    // Initialize session timing
    window.sessionStartTime = Date.now();

    // Track on page load
    window.addEventListener('load', trackPageVisit);

    // Send profile on unload (user leaves site)
    window.addEventListener('beforeunload', sendVisitorProfile);

    // Also send profile after 5 minutes (for long-dwell visitors)
    setTimeout(sendVisitorProfile, 300000);

    console.debug('[RB2B] Pixel loaded');
  })();
</script>
