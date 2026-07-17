"use client";

import { useState, useEffect } from "react";

const CONSENT_KEY = "nebula-cookie-consent";
const CONSENT_VERSION = 1;

type ConsentLevel = "all" | "necessary" | null;

interface ConsentState {
  level: ConsentLevel;
  version: number;
  timestamp: string;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check existing consent
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const state: ConsentState = JSON.parse(stored);
        // Re-show banner if consent version is outdated
        if (state.version < CONSENT_VERSION) {
          setShowBanner(true);
        }
      } catch {
        setShowBanner(true);
      }
    } else {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const state: ConsentState = {
      level: "all",
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShowBanner(false);
    
    // Initialize GA4 if consented
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: "granted",
        ad_storage: "denied", // We don't run ads
        functionality_storage: "granted",
        personalization_storage: "denied",
        security_storage: "granted",
      });
    }
    
    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: state }));
  };

  const handleAcceptNecessary = () => {
    const state: ConsentState = {
      level: "necessary",
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(state));
    setShowBanner(false);
    
    // Keep analytics disabled
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        functionality_storage: "granted",
        personalization_storage: "denied",
        security_storage: "granted",
      });
    }
    
    window.dispatchEvent(new CustomEvent("cookie-consent-update", { detail: state }));
  };

  if (!mounted || !showBanner) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-description"
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-emerald-500/20 p-4 md:p-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
          {/* Content */}
          <div className="flex-1">
            <h2
              id="cookie-banner-title"
              className="text-base font-semibold text-white mb-1"
            >
              We use cookies
            </h2>
            <p
              id="cookie-banner-description"
              className="text-sm text-gray-400 leading-relaxed"
            >
              We use cookies for analytics to improve our site. Essential cookies keep your session active.
              You can accept all cookies or only essential ones.{" "}
              <a
                href="/privacy-policy"
                className="text-emerald-400 hover:underline focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
              >
                Privacy Policy
              </a>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleAcceptNecessary}
              className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
            >
              Essential only
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-5 py-2.5 text-sm font-semibold text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to check consent
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  
  const stored = localStorage.getItem(CONSENT_KEY);
  if (!stored) return false;
  
  try {
    const state: ConsentState = JSON.parse(stored);
    return state.level === "all" && state.version >= CONSENT_VERSION;
  } catch {
    return false;
  }
}
