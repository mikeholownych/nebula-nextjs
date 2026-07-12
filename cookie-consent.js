/**
 * GDPR/CCPA Cookie Consent Banner
 * Lightweight, no external dependencies
 * Complies with GDPR, CCPA, and ePrivacy Directive
 */

(function() {
  const CONSENT_KEY = 'nebula_cookie_consent';
  const CONSENT_VERSION = '1.0';
  
  // Check if consent already given
  const existingConsent = localStorage.getItem(CONSENT_KEY);
  if (existingConsent) {
    const consent = JSON.parse(existingConsent);
    if (consent.version === CONSENT_VERSION) {
      // Consent already granted, initialize analytics
      if (consent.analytics) {
        window['ga-disable-' + window.GA_MEASUREMENT_ID] = false;
      }
      return;
    }
  }
  
  // Disable analytics until consent
  window['ga-disable-' + (window.GA_MEASUREMENT_ID || 'G-KJ9S3450LH')] = true;
  
  // Create banner
  const banner = document.createElement('div');
  banner.id = 'cookie-consent-banner';
  banner.innerHTML = `
    <div class="cookie-consent-content">
      <div class="cookie-consent-text">
        <strong>We respect your privacy.</strong>
        <p>We use cookies to analyze traffic and improve your experience. No tracking for marketing or ad targeting. 
        <a href="/privacy-policy" target="_blank" rel="noopener">Privacy Policy</a></p>
      </div>
      <div class="cookie-consent-actions">
        <button id="cookie-accept" class="cookie-btn accept">Accept Analytics</button>
        <button id="cookie-decline" class="cookie-btn decline">Decline</button>
      </div>
    </div>
  `;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #cookie-consent-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(8, 9, 10, 0.95);
      backdrop-filter: blur(8px);
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding: 16px 20px;
      z-index: 99999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @media (prefers-reduced-motion: reduce) {
      #cookie-consent-banner { animation: none; }
    }
    
    .cookie-consent-content {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
    }
    
    @media (max-width: 640px) {
      .cookie-consent-content {
        flex-direction: column;
        align-items: stretch;
        gap: 16px;
      }
    }
    
    .cookie-consent-text {
      flex: 1;
      color: #d0d6e0;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .cookie-consent-text strong {
      color: #f7f8f8;
      font-size: 15px;
      display: block;
      margin-bottom: 4px;
    }
    
    .cookie-consent-text p {
      margin: 0;
    }
    
    .cookie-consent-text a {
      color: #10b981;
      text-decoration: underline;
      transition: color 0.2s;
    }
    
    .cookie-consent-text a:hover {
      color: #34d399;
    }
    
    .cookie-consent-actions {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }
    
    @media (max-width: 640px) {
      .cookie-consent-actions {
        width: 100%;
      }
    }
    
    .cookie-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      min-width: 120px;
    }
    
    .cookie-btn.accept {
      background: #10b981;
      color: #000;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
    }
    
    .cookie-btn.accept:hover {
      background: #059669;
      transform: translateY(-1px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }
    
    .cookie-btn.decline {
      background: transparent;
      color: #8a8f98;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .cookie-btn.decline:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    @media (max-width: 640px) {
      .cookie-btn {
        flex: 1;
      }
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(banner);
  
  // Handle button clicks
  document.getElementById('cookie-accept').addEventListener('click', function() {
    const consent = {
      version: CONSENT_VERSION,
      analytics: true,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    
    // Enable Google Analytics
    window['ga-disable-' + (window.GA_MEASUREMENT_ID || 'G-KJ9S3450LH')] = false;
    
    // Remove banner
    banner.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
    setTimeout(() => banner.remove(), 300);
  });
  
  document.getElementById('cookie-decline').addEventListener('click', function() {
    const consent = {
      version: CONSENT_VERSION,
      analytics: false,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    
    // Remove banner
    banner.style.animation = 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) reverse';
    setTimeout(() => banner.remove(), 300);
  });
})();
