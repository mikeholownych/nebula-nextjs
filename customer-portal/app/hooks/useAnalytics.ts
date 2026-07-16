"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  trackPageView,
  initScrollTracking,
  initTimeTracking,
  trackEvent,
} from "../lib/analytics";

/**
 * Hook for automatic page tracking and manual event tracking
 */
export function useAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const cleanupRef = useRef<(() => void)[]>([]);

  // Track page views on route change
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    trackPageView(url);
    
    // Re-init scroll and time tracking on new page
    cleanupRef.current.forEach(cleanup => cleanup());
    cleanupRef.current = [];
    
    const cleanupScroll = initScrollTracking();
    const cleanupTime = initTimeTracking();
    cleanupRef.current.push(cleanupScroll, cleanupTime);
    
    return () => {
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
    };
  }, [pathname, searchParams]);

  return {
    trackEvent,
    trackPageView,
  };
}

/**
 * Hook for tracking CTA clicks
 */
export function useCTATracking() {
  return (ctaName: string, location: string) => {
    trackEvent("cta_click", { cta_name: ctaName, cta_location: location });
  };
}

/**
 * Hook for tracking form submissions
 */
export function useFormTracking() {
  return {
    trackSubmission: (formName: string) => {
      trackEvent("form_submission", { form_name: formName });
    },
    trackError: (fieldName: string, errorMessage: string) => {
      trackEvent("form_error", { field_name: fieldName, error_message: errorMessage });
    },
    trackSuccess: (formName: string) => {
      trackEvent("form_success", { form_name: formName });
    },
  };
}
