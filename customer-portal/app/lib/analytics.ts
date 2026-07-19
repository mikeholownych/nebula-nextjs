/**
 * GA4 Analytics Utilities with Consent-First Tracking
 *
 * All events respect cookie consent before firing.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Event types for type-safe tracking
export type GAEventName =
  | "audit_submitted"
  | "audit_completed"
  | "audit_error"
  | "page_view"
  | "scroll_depth"
  | "time_on_page"
  | "checkout_started"
  | "checkout_completed"
  | "checkout_abandoned"
  | "purchase_initiated"
  | "purchase_completed"
  | "email_signup"
  | "cta_click"
  | "outbound_click"
  | "search"
  | "error"
  | "error_page_view"
  | "error_page_email_capture"
  | "form_error"
  | "form_success"
  | "form_submission"
  | "audit_started"
  | "session_start"
  | "first_visit"
  | "engagement_milestone"
  | "intent_signal";

export interface GAEventParams {
  [key: string]: string | number | boolean | undefined;
}

// Check consent before tracking
function hasConsent(): boolean {
  if (typeof window === "undefined") return false;
  
  const stored = localStorage.getItem("nebula-cookie-consent");
  if (!stored) return false;
  
  try {
    const state = JSON.parse(stored);
    return state.level === "all";
  } catch {
    return false;
  }
}

// Safe gtag call with consent check
function safeGtag(command: string, eventName: string, params?: GAEventParams): void {
  if (!hasConsent()) return;
  
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag(command, eventName, params);
  }
}

/**
 * Track custom GA4 events
 */
export function trackEvent(eventName: GAEventName, params?: GAEventParams): void {
  safeGtag("event", eventName, params);
}

/**
 * Track page view (call on route change)
 */
export function trackPageView(url: string, title?: string): void {
  safeGtag("config", process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-KJ9S3450LH", {
    page_location: url,
    page_title: title,
  });
}

/**
 * Track audit form submission
 */
export function trackAuditSubmission(url: string): void {
  trackEvent("audit_submitted", {
    page_url: url,
    page_domain: new URL(url).hostname,
  });
}

/**
 * Track audit completion
 */
export function trackAuditCompletion(url: string, score: number, grade: string): void {
  trackEvent("audit_completed", {
    page_url: url,
    page_domain: new URL(url).hostname,
    audit_score: score,
    audit_grade: grade,
  });
}

/**
 * Track checkout initiation
 */
export function trackCheckoutStarted(product: string, value: number): void {
  trackEvent("checkout_started", {
    currency: "USD",
    value: value,
    item_name: product,
    item_price: value,
  });
}

/**
 * Track purchase completion
 */
export function trackPurchaseCompleted(productId: string, value: number, _email?: string): void {
  trackEvent("purchase_completed", {
    currency: "USD",
    value: value,
    transaction_id: productId,
    item_name: productId,
    item_price: value,
  });
}

/**
 * Track CTA click
 */
export function trackCTAClick(ctaName: string, location: string): void {
  trackEvent("cta_click", {
    cta_name: ctaName,
    cta_location: location,
  });
}

/**
 * Track outbound link click
 */
export function trackOutboundClick(url: string): void {
  trackEvent("outbound_click", {
    link_url: url,
    link_domain: new URL(url).hostname,
  });
}

/**
 * Track scroll depth (call at 25%, 50%, 75%, 100%)
 */
export function trackScrollDepth(percentage: number): void {
  trackEvent("scroll_depth", {
    percent_scrolled: percentage,
  });
}

/**
 * Track time on page (call at 30s, 60s, 120s, 300s)
 */
export function trackTimeOnPage(seconds: number): void {
  trackEvent("time_on_page", {
    time_seconds: seconds,
    time_bucket: seconds <= 30 ? "0-30s" : 
                 seconds <= 60 ? "30-60s" :
                 seconds <= 120 ? "1-2m" : "2m+",
  });
}

/**
 * Track form error
 */
export function trackFormError(fieldName: string, errorMessage: string): void {
  trackEvent("form_error", {
    field_name: fieldName,
    error_message: errorMessage.substring(0, 100), // Truncate
  });
}

/**
 * Track JavaScript error
 */
export function trackError(error: Error, context?: string): void {
  trackEvent("error", {
    error_message: error.message.substring(0, 100),
    error_stack: error.stack?.substring(0, 200),
    error_context: context,
  });
}

/**
 * Initialize scroll depth tracking (call once per page)
 */
export function initScrollTracking(): () => void {
  let maxScroll = 0;
  const thresholds = [25, 50, 75, 100];
  const tracked = new Set<number>();
  
  const handleScroll = () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScroll) {
      maxScroll = scrollPercent;
      
      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !tracked.has(threshold)) {
          tracked.add(threshold);
          trackScrollDepth(threshold);
        }
      });
    }
  };
  
  window.addEventListener("scroll", handleScroll, { passive: true });
  
  return () => window.removeEventListener("scroll", handleScroll);
}

/**
 * Initialize time tracking
 */
export function initTimeTracking(): () => void {
  const intervals = [30, 60, 120, 300];
  const tracked = new Set<number>();
  const startTime = Date.now();
  
  const checkTime = () => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    intervals.forEach(interval => {
      if (elapsed >= interval && !tracked.has(interval)) {
        tracked.add(interval);
        trackTimeOnPage(interval);
      }
    });
  };
  
  const intervalId = setInterval(checkTime, 5000); // Check every 5s
  
  return () => clearInterval(intervalId);
}

/**
 * Track email capture (important conversion micro-action)
 */
export function trackEmailCaptured(source: string, auditId?: string): void {
  trackEvent("email_signup", {
    signup_source: source,
    audit_id: auditId,
  });
}

/**
 * Track engagement milestone
 */
export function trackEngagement(milestone: string): void {
  trackEvent("engagement_milestone", {
    milestone_name: milestone,
  });
}

/**
 * Track revenue (for purchase events)
 */
export function trackRevenue(productId: string, value: number, currency: string = "USD"): void {
  trackEvent("purchase_completed", {
    currency,
    value,
    transaction_id: productId,
    item_id: productId,
    item_name: productId,
    price: value,
    quantity: 1,
  });
}

/**
 * Track abandoned checkout
 */
export function trackCheckoutAbandoned(step: string, value: number): void {
  trackEvent("checkout_abandoned", {
    checkout_step: step,
    value: value,
    currency: "USD",
  });
}

/**
 * Track user intent signals
 */
export function trackIntentSignal(signal: "high" | "medium" | "low", indicator: string): void {
  trackEvent("intent_signal", {
    intent_level: signal,
    intent_indicator: indicator,
  });
}
