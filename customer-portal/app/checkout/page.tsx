"use client";

import { useState, useEffect } from "react";
import Head from "next/head";

// Stripe Payment Links
const STRIPE_LINKS = {
  fixPack: "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b", // $147
  aiPromptPack: "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00", // $7
};

export default function CheckoutPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" | "loading" } | null>(null);

  // Handle email query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) {
      navigator.sendBeacon("/api/checkout-visit", JSON.stringify({ email: emailParam }));
    }
  }, []);

  const handleFreeKitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ message: "Sending…", type: "loading" });

    try {
      const response = await fetch("/api/free-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "checkout_free_kit_card" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setStatus({ message: "✅ Sent! Check your inbox.", type: "success" });
      setEmail("");
    } catch (err: any) {
      setStatus({
        message: `❌ ${err.message} — email ops@launchcrate.io and we'll send it manually.`,
        type: "error",
      });
    }
  };

  return (
    <>
      <Head>
        <title>Conversion Fix Pack — Nebula Components</title>
        <meta
          name="description"
          content="Your landing page is built. Now make it convert. $147 fix in 24h — headline, CTA, social proof, mobile, speed. No calls, no retainer."
        />
        <link rel="canonical" href="https://nebulacomponents.shop/checkout" />
        <meta property="og:title" content="Your landing page is built. Now make it convert." />
        <meta
          property="og:description"
          content="$147 Conversion Fix Pack. We fix the 1–3 things killing your conversion rate. Delivered in 24h."
        />
        <meta property="og:url" content="https://nebulacomponents.shop/checkout" />
        <meta property="og:type" content="product" />
      </Head>

      <div className="min-h-screen bg-[#0a0a0a] text-[#e8e8e8] font-sans">
        {/* Header */}
        <header className="border-b border-[#1f1f1f] px-6 py-[18px] flex items-center gap-3">
          <div className="w-[30px] h-[30px] bg-[#10b981] rounded-md flex items-center justify-center font-black text-[13px] text-black shrink-0">
            N
          </div>
          <div className="font-bold text-[14px]">Nebula Components</div>
        </header>

        <div className="max-w-[620px] mx-auto px-5 pb-20">
          {/* Hero */}
          <section className="py-[52px] border-b border-[#1f1f1f]">
            <div className="text-[11px] tracking-[1.5px] uppercase text-[#10b981] font-semibold mb-[14px]">
              Conversion Fix Pack
            </div>
            <h1 className="text-[clamp(24px,5vw,34px)] font-extrabold leading-tight tracking-[-0.5px] mb-[14px]">
              Your page is built.
              <br />
              <em className="not-italic text-[#10b981]">Now make it convert.</em>
            </h1>
            <p className="text-[16px] text-[#888] max-w-[520px]">
              Traffic is coming in. Sales aren't. We find the 1–3 things killing your conversion
              rate and fix them in 24 hours — no calls, no retainer.
            </p>
          </section>

          {/* Problem Section */}
          <section className="py-9 border-b border-[#1f1f1f]">
            <h2 className="text-[13px] uppercase tracking-[1.3px] text-[#888] mb-[18px] font-semibold">
              Sound familiar?
            </h2>
            <div className="grid gap-[10px]">
              <PainItem
                icon="📉"
                title="You're spending on ads and getting nothing back"
                description="Clicks are coming. Sales aren't. The ad isn't the problem — the page is."
              />
              <PainItem
                icon="🔧"
                title="You've tweaked the page and nothing moved"
                description="Button color, font, headline — small fixes with no real effect. You're guessing."
              />
              <PainItem
                icon="😩"
                title="You built it on Lovable / Buildy / Webflow — but it's not converting"
                description="The builder gave you a page. No one told you why visitors aren't buying."
              />
            </div>
          </section>

          {/* Separator */}
          <div className="text-center py-6 text-[12px] text-[#888] tracking-widest uppercase border-b border-[#1f1f1f]">
            ↓ &nbsp; this is what we fix &nbsp; ↓
          </div>

          {/* Offer Card - $147 Fix Pack */}
          <section className="py-9 border-b border-[#1f1f1f]">
            <div className="bg-[#111] border border-[rgba(16,185,129,0.3)] rounded-xl p-7">
              <div className="text-[11px] uppercase tracking-[1.3px] text-[#10b981] font-bold mb-4">
                Conversion Fix Pack
              </div>
              <div className="text-[44px] font-black tracking-[-2px] text-[#10b981] leading-none">
                <sup className="text-[20px]">$</sup>147
              </div>
              <div className="text-[13px] text-[#888] mt-1 mb-[22px]">
                one-time · 24h delivery · 30-day money-back guarantee
              </div>

              <ul className="list-none m-0 mb-6">
                <CheckItem>5-dimension audit scored 1–10 (Headline, CTA, Social Proof, Mobile, Speed)</CheckItem>
                <CheckItem>Implementation-ready Fix Pack for every score under 7</CheckItem>
                <CheckItem>Rewritten headline copy — paste it straight in</CheckItem>
                <CheckItem>CTA fix — placement, copy, contrast</CheckItem>
                <CheckItem>Mobile layout patches + compressed images</CheckItem>
                <CheckItem>One-paragraph explanation of root cause</CheckItem>
                <CheckItem>No production changes without your sign-off</CheckItem>
              </ul>

              <a
                href={STRIPE_LINKS.fixPack}
                className="block w-full bg-[#10b981] text-black font-extrabold text-[16px] text-center py-4 px-5 rounded-lg tracking-[-0.2px] hover:opacity-88 transition-opacity duration-150"
              >
                Get my Fix Pack — $147 →
              </a>
              <p className="text-center text-[12px] text-[#888] mt-[10px]">
                Stripe checkout · 30 seconds · No call required
              </p>
              <p className="text-center mt-[14px] text-[13px] text-[#888]">
                Questions first?{" "}
                <a href="/primer" className="text-[#10b981] hover:underline">
                  Read the full breakdown →
                </a>
              </p>
            </div>
          </section>

          {/* AI Prompt Pack Card - $7 */}
          <section className="py-9 border-b border-[#1f1f1f]">
            <div className="bg-[#111] border border-[rgba(16,185,129,0.3)] rounded-xl p-7">
              <div className="text-[11px] uppercase tracking-[1.3px] text-[#10b981] font-bold mb-4">
                AI Prompt Pack
              </div>
              <div className="text-[44px] font-black tracking-[-2px] text-[#10b981] leading-none">
                <sup className="text-[20px]">$</sup>7
              </div>
              <div className="text-[13px] text-[#888] mt-1 mb-[22px]">
                instant delivery · lifetime access · no subscription
              </div>

              <ul className="list-none m-0 mb-6">
                <CheckItem>Battle-tested prompts for landing page optimization</CheckItem>
                <CheckItem>Headline rewrite templates that convert</CheckItem>
                <CheckItem>CTA optimization prompts</CheckItem>
                <CheckItem>Social proof placement strategies</CheckItem>
                <CheckItem>Mobile UX quick fixes</CheckItem>
                <CheckItem>Speed optimization checklist</CheckItem>
              </ul>

              <a
                href={STRIPE_LINKS.aiPromptPack}
                className="block w-full bg-[#10b981] text-black font-extrabold text-[16px] text-center py-4 px-5 rounded-lg tracking-[-0.2px] hover:opacity-88 transition-opacity duration-150"
              >
                Get the AI Prompt Pack — $7 →
              </a>
              <p className="text-center text-[12px] text-[#888] mt-[10px]">
                Stripe checkout · instant download
              </p>
            </div>
          </section>

          {/* Free Kit */}
          <section className="py-9 border-b border-[#1f1f1f]">
            <h2 className="text-[18px] font-extrabold mb-[6px]">🎁 Free Fix Kit — not ready to buy?</h2>
            <p className="text-[14px] text-[#888] mb-5">
              Get the 60-Minute Landing Page Fix Kit delivered to your inbox. DIY version of what we
              do.
            </p>
            <ul className="list-none m-0 mb-5">
              <li className="text-[13px] text-[#ccc] py-[5px] flex gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                5-step audit-to-fix checklist
              </li>
              <li className="text-[13px] text-[#ccc] py-[5px] flex gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                Headline rewrite prompts
              </li>
              <li className="text-[13px] text-[#ccc] py-[5px] flex gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                CTA and trust-section templates
              </li>
              <li className="text-[13px] text-[#ccc] py-[5px] flex gap-2">
                <span className="text-[#10b981] font-bold">✓</span>
                FAQ block templates and examples
              </li>
            </ul>

            <form onSubmit={handleFreeKitSubmit} className="flex gap-2 max-[480px]:flex-col">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="flex-1 bg-[#111] border border-[#1f1f1f] text-[#e8e8e8] rounded-lg px-[14px] py-3 text-[15px] outline-none focus:border-[rgba(16,185,129,0.4)] max-[480px]:w-full"
              />
              <button
                type="submit"
                className="bg-[#1f1f1f] text-[#10b981] border border-[#1f1f1f] rounded-lg px-4 py-3 text-[14px] font-bold cursor-pointer whitespace-nowrap hover:bg-[#2a2a2a] transition-colors max-[480px]:w-full"
              >
                Send it →
              </button>
            </form>

            {status && (
              <p
                className={`mt-[10px] text-[13px] ${
                  status.type === "success"
                    ? "text-[#10b981]"
                    : status.type === "error"
                      ? "text-[#ef4444]"
                      : "text-[#888]"
                }`}
              >
                {status.message}
              </p>
            )}
          </section>

          {/* Trust Indicators */}
          <section className="py-9 border-b border-[#1f1f1f]">
            <h3 className="text-[13px] uppercase tracking-[1.2px] text-[#888] mb-[14px] font-semibold">
              Trust & Security
            </h3>
            <ul className="list-none">
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#10b981]">🔒</span>
                Secure checkout via Stripe (PCI DSS Level 1 certified)
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#10b981]">💳</span>
                No credit card stored on our servers
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#10b981]">↩️</span>
                30-day money-back guarantee, no questions asked
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#10b981]">📧</span>
                Email support at ops@launchcrate.io
              </li>
            </ul>
          </section>

          {/* Policy */}
          <section className="py-8">
            <h3 className="text-[13px] uppercase tracking-[1.2px] text-[#888] mb-[14px] font-semibold">
              Buyer-safe policy
            </h3>
            <ul className="list-none">
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#444] flex-shrink-0">–</span>
                No production changes without explicit buyer authorization.
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#444] flex-shrink-0">–</span>
                Least-privilege access only if direct implementation is requested.
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#444] flex-shrink-0">–</span>
                If direct implementation is unsupported, you receive copy + instructions instead.
              </li>
              <li className="text-[13px] text-[#888] py-[5px] flex gap-2">
                <span className="text-[#444] flex-shrink-0">–</span>
                One revision if stated scope is missed; full refund if nothing fixable is found.
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}

// Helper Components
function PainItem({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="flex gap-3 items-start bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-[14px]">
      <div className="text-[18px] shrink-0 mt-[1px]">{icon}</div>
      <div>
        <strong className="block text-[14px] text-[#e8e8e8] mb-[2px]">{title}</strong>
        <p className="text-[14px] text-[#ccc] m-0">{description}</p>
      </div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-[14px] py-2 border-b border-[#1a1a1a] flex gap-[10px] items-start last:border-b-0">
      <span className="text-[#10b981] font-bold shrink-0">✓</span>
      <span>{children}</span>
    </li>
  );
}
