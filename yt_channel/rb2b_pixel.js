// RB2B Visitor Identification Pixel
// Injected into: nebulacomponents.com layout (next.js _app or layout.tsx)
// Purpose: Track company reverse-DNS, pages visited, dwell time
// Sends: POST /api/lead-gen/rb2b-event with visitor profile

(function() {
  const RB2B_CLIENT_ID = 'nebula-components-001';
  const WEBHOOK_URL = '/api/lead-gen/rb2b-event';

  const trackPageVisit = () => {
    const pagePath = window.location.pathname;
    let pageCategory = 'other';
    if (pagePath.includes('/audit')) pageCategory = 'audit';
    else if (pagePath.includes('/fix-pack') || pagePath.includes('/checkout')) pageCategory = 'fix-pack';
    else if (pagePath.includes('/pricing')) pageCategory = 'pricing';

    if (!window.rb2bPageVisits) window.rb2bPageVisits = [];
    window.rb2bPageVisits.push(pageCategory);
    window.rb2bSessionStart = window.rb2bSessionStart || Date.now();

    console.debug(`[RB2B] Tracked visit: ${pageCategory}`);
  };

  const sendVisitorProfile = async () => {
    if (!window.rb2bPageVisits || window.rb2bPageVisits.length === 0) return;

    const totalDwell = Math.round((Date.now() - (window.rb2bSessionStart || Date.now())) / 1000);
    const pages = [...new Set(window.rb2bPageVisits)];

    const payload = {
      client_id: RB2B_CLIENT_ID,
      pages_visited: pages,
      total_dwell_s: totalDwell,
      last_visit: new Date().toISOString(),
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'organic',
    };

    try {
      const resp = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (resp.ok) console.debug('[RB2B] Profile sent');
      else console.debug('[RB2B] Webhook returned', resp.status);
    } catch (err) {
      console.debug('[RB2B] Webhook post error:', err.message);
    }
  };

  window.rb2bSessionStart = Date.now();
  window.addEventListener('load', trackPageVisit);
  window.addEventListener('beforeunload', sendVisitorProfile);
  setTimeout(sendVisitorProfile, 300000); // Also send after 5 minutes

  console.debug('[RB2B] Pixel initialized');
})();
