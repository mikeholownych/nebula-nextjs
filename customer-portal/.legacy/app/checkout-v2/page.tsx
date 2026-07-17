"use client";

import { useState, useEffect } from "react";
import Head from "next/head";

// Stripe Payment Link for $147 Fix Pack
const STRIPE_FIX_PACK_LINK = "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b";

type ViewState = "loading" | "content" | "error";

export default function CheckoutV2Page() {
  const [viewState, setViewState] = useState<ViewState>("loading");
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [stripeLink, setStripeLink] = useState("#");
  const [errorMessage, setErrorMessage] = useState(
    "We need your email and landing page URL to proceed. Please check the link you received."
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    const urlParam = params.get("url");

    // Check if both parameters exist
    if (!emailParam || !urlParam) {
      setViewState("error");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailParam)) {
      setErrorMessage("Invalid email format. Please check the link.");
      setViewState("error");
      return;
    }

    // Log checkout visit with both parameters
    navigator.sendBeacon("/api/checkout-visit", JSON.stringify({ email: emailParam, url: urlParam }));

    // Set state
    setEmail(emailParam);
    setUrl(urlParam);

    // Create Stripe checkout link with pre-fill
    const checkoutUrl = new URL(STRIPE_FIX_PACK_LINK);
    checkoutUrl.searchParams.set("customer_email", encodeURIComponent(emailParam));
    setStripeLink(checkoutUrl.toString());

    // Store in localStorage for reference
    localStorage.setItem("nebula_checkout_email", emailParam);
    localStorage.setItem("nebula_checkout_url", urlParam);

    // Short delay then show content
    setTimeout(() => {
      setViewState("content");
    }, 500);
  }, []);

  return (
    <>
      <Head>
        <title>Claim Your Fix Pack — Nebula Components</title>
        <meta
          name="description"
          content="Your landing page fix is ready. $147 implementation with 24h delivery. Pre-filled with your audit details."
        />
        <link rel="canonical" href="https://nebulacomponents.shop/checkout-v2" />
      </Head>

      <div className="min-h-screen bg-[#050505] text-[#e8e8e8] font-sans">
        {/* Header */}
        <header className="border-b border-[#1f1f1f] px-6 py-[18px] flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[#10b981] rounded-md flex items-center justify-center font-black text-[13px] text-black shrink-0">
            N
          </div>
          <div className="font-bold text-[14px]">Nebula Components</div>
        </header>

        <div className="max-w-[620px] mx-auto px-5 pb-20">
          {/* Loading State */}
          {viewState === "loading" && (
            <div className="text-center py-[60px] px-5">
              <div className="w-10 h-10 border-[3px] border-[#1f1f1f] border-t-[#10b981] rounded-full animate-spin mx-auto mb-5" />
              <p className="text-[#888]">Preparing your checkout...</p>
            </div>
          )}

          {/* Error State */}
          {viewState === "error" && (
            <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-lg p-5 my-8">
              <h2 className="text-[#ef4444] text-[16px] mb-2 font-semibold">Missing Information</h2>
              <p className="text-[14px] text-[#888]">{errorMessage}</p>
            </div>
          )}

          {/* Main Content */}
          {viewState === "content" && (
            <>
              {/* Hero */}
              <section className="py-[52px] border-b border-[#1f1f1f] text-center">
                <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold leading-tight mb-[14px]">
                  Your <em className="not-italic text-[#10b981]">Fix Pack</em> is Ready
                </h1>
                <p className="text-[#888]">
                  Implementation for your landing page, delivered in 24 hours.
                </p>
              </section>

              {/* Pre-filled Info Card */}
              <div className="bg-[#111] border border-[#1f1f1f] rounded-xl p-6 my-8">
                <div className="text-[11px] uppercase tracking-[1.3px] text-[#888] mb-2 font-semibold">
                  Your Landing Page
                </div>
                <div className="text-[14px] text-[#10b981] break-all mb-4">{url}</div>

                <div className="text-[11px] uppercase tracking-[1.3px] text-[#888] mb-2 font-semibold">
                  Delivery Email
                </div>
                <div className="text-[14px] text-[#e8e8e8]">{email}</div>
              </div>

              {/* Price Card */}
              <div className="bg-[linear-gradient(135deg,rgba(16,185,129,0.08)_0%,rgba(16,185,129,0.02)_100%)] border-[2px] border-[#10b981] rounded-xl p-8 my-8">
                <div className="text-[56px] font-black tracking-[-2px] text-[#10b981] leading-none">
                  <sup className="text-[24px]">$</sup>147
                </div>
                <div className="text-[14px] text-[#888] mt-2">
                  one-time · 24h delivery · 30-day refund guarantee
                </div>

                <ul className="list-none my-6">
                  <CheckItem>Full 5-dimension audit (Headline, CTA, Social Proof, Mobile, Speed)</CheckItem>
                  <CheckItem>Prioritized fix list with copy you can paste</CheckItem>
                  <CheckItem>Rewritten headline for your specific page</CheckItem>
                  <CheckItem>CTA placement + copy + contrast fixes</CheckItem>
                  <CheckItem>Mobile layout patches + speed optimization</CheckItem>
                  <CheckItem>Root cause explanation + next steps</CheckItem>
                  <CheckItem last>No changes without your approval</CheckItem>
                </ul>

                <a
                  href={stripeLink}
                  className="block w-full bg-[#10b981] text-black font-extrabold text-[18px] text-center py-[18px] px-5 rounded-lg hover:[transform:translateY(-2px)] hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all duration-150"
                >
                  Claim My Fix Pack →
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// Helper Component
function CheckItem({ children, last = false }: { children: React.ReactNode; last?: boolean }) {
  return (
    <li
      className={`text-[14px] py-[10px] flex gap-3 items-start ${
        last ? "" : "border-b border-[rgba(255,255,255,0.08)]"
      }`}
    >
      <span className="text-[#10b981] font-bold shrink-0 text-[16px]">✓</span>
      <span>{children}</span>
    </li>
  );
}
