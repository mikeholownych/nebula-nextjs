"use client";

import { useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ThankYouContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const productId = searchParams.get("product");

  // Track conversion event on mount
  useEffect(() => {
    // Track audit completion conversion
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "audit_complete", {
        event_category: "funnel",
        event_label: productId || "purchase_completed",
      });
    }
  }, [productId]);

  const getProductInfo = () => {
    switch (productId) {
      case "fix-pack":
        return {
          name: "Fix Pack",
          price: "$147",
          description: "Your detailed landing page fix recommendations",
        };
      case "retainer":
        return {
          name: "Monthly Retainer",
          price: "$1,497/mo",
          description: "Ongoing optimization support",
        };
      case "agency-partner":
        return {
          name: "Agency Partner",
          price: "$497",
          description: "Partner program access",
        };
      default:
        return {
          name: "Purchase",
          price: "",
          description: "Your order is confirmed",
        };
    }
  };

  const productInfo = getProductInfo();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Success Badge */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3">
          Your {productInfo.name} is{" "}
          <span className="text-emerald-600">confirmed</span>.
        </h1>

        {/* Subheading */}
        <p className="text-gray-600 text-center text-lg mb-8">
          {productInfo.description}. Check your inbox in about 60 seconds for
          your detailed breakdown.
        </p>

        {/* Next Steps Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            What happens next
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Confirmation email</p>
                <p className="text-sm text-gray-500">
                  Check your inbox for your receipt and next steps.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Audit processing</p>
                <p className="text-sm text-gray-500">
                  Your landing page analysis is running right now.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Results delivered</p>
                <p className="text-sm text-gray-500">
                  Scored fixes ranked by dollar impact, delivered to your inbox.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Session Info (if available) */}
        {sessionId && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Order Reference:</span>{" "}
              <span className="font-mono text-xs">{sessionId.slice(-8).toUpperCase()}</span>
            </p>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-emerald-700 hover:bg-emerald-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
          >
            Go to Dashboard →
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center text-gray-600 hover:text-gray-800 font-medium px-6 py-3"
          >
            Return to Home
          </Link>
        </div>

        {/* Guarantee */}
        <p className="text-center text-sm text-gray-500">
          30-day money-back guarantee. No sales call required.
        </p>

        {/* Support Contact */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Need help or have questions?
          </p>
          <a
            href="mailto:support@nebulacomponents.shop"
            className="text-emerald-700 hover:text-emerald-800 font-medium"
          >
            Contact Support →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      }
    >
      <ThankYouContent />
    </Suspense>
  );
}
