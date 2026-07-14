"use client";

import { useState, useEffect, Suspense } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function GrowthLaunchConfirmationContent() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    url: "",
    offer: "",
    target: "",
    product_stage: "live",
    extra: "",
  });
  
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Pre-fill email from URL param
  useEffect(() => {
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: emailParam }));
    }
  }, [emailParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Submission failed");

      setStatus({
        message: `✅ Got it! You'll receive your audit within 24 hours at ${formData.email}. Check your inbox — we're starting now.`,
        type: "success",
      });
      setSubmitted(true);
    } catch (err: any) {
      setStatus({
        message: `❌ ${err.message} — Please email ops@launchcrate.io with your details and we'll process it manually.`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Growth Launch — You're In | Nebula Components</title>
        <meta
          name="description"
          content="Your Growth Launch purchase is confirmed. Here's what happens next and how to submit your project details."
        />
      </Head>

      <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-sans text-[17px] leading-relaxed">
        {/* Nav */}
        <nav className="flex justify-between items-center px-6 py-5 max-w-[1100px] mx-auto">
          <Link href="/" className="text-[#a5b4fc] font-bold tracking-[0.1em] uppercase text-sm">
            Nebula
          </Link>
          <div className="flex gap-4">
            <Link href="/" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-colors">
              Home
            </Link>
            <Link href="/growth-launch" className="text-[#94a3b8] text-sm hover:text-[#e2e8f0] transition-colors">
              Growth Launch
            </Link>
          </div>
        </nav>

        <div className="max-w-[720px] mx-auto px-6 pb-20">
          {/* Confirmation Header */}
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-[#22c55e] rounded-full flex items-center justify-center text-[2.4rem] mx-auto mb-6 text-[#0a0a0f]">
              ✓
            </div>
            <h1 className="text-[2rem] font-extrabold text-[#f8fafc] mb-3">
              You're In. Let's Get You Customers.
            </h1>
            <p className="text-[#94a3b8] max-w-[500px] mx-auto">
              Your Growth Launch purchase is confirmed. Here's exactly what happens next — and the information we need from you to start.
            </p>
          </div>

          {/* Timeline Card */}
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-[14px] p-8 mb-8">
            <h2 className="text-[1.3rem] font-bold text-[#f1f5f9] mb-4">📋 The Timeline</h2>
            <ul className="list-none p-0 m-0">
              <li className="py-3 pl-9 ml-3 border-l-2 border-[#1e1e2e] relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 1 — Right now
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">Fill out the intake form below.</strong> Takes 5 minutes. Tell us your URL, what you sell, and who you sell to.
                </div>
              </li>
              <li className="py-3 pl-9 ml-3 border-l-2 border-[#1e1e2e] relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 2 — Within 24 hours
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">Landing page audit delivered.</strong> We'll send you the full audit report with the top 5 conversion leaks identified.
                </div>
              </li>
              <li className="py-3 pl-9 ml-3 border-l-2 border-[#1e1e2e] relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 3 — Within 48 hours
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">Landing page rewrite delivered.</strong> Rewritten copy for every section, implemented or ready to deploy. Your call.
                </div>
              </li>
              <li className="py-3 pl-9 ml-3 border-l-2 border-[#1e1e2e] relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 4 — Within 72 hours
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">200 triggered prospects delivered.</strong> The prospect list with buying signals annotated. You can review before we send.
                </div>
              </li>
              <li className="py-3 pl-9 ml-3 border-l-2 border-[#1e1e2e] relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 5 — Day 3-17
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">Outreach campaign runs.</strong> We send value-first emails to all 200 prospects. Replies managed daily. You get warm handoffs.
                </div>
              </li>
              <li className="py-3 pl-9 ml-3 border-l-2 border-transparent relative">
                <div className="absolute w-3 h-3 bg-[#4f46e5] rounded-full left-[-7px] top-4" />
                <div className="text-[#818cf8] text-xs font-bold uppercase tracking-[0.05em]">
                  Step 6 — Day 60
                </div>
                <div className="text-[#cbd5e1] text-[0.95rem]">
                  <strong className="text-[#f1f5f9]">You have a customer or we keep working free.</strong> That's the guarantee. No expiration.
                </div>
              </li>
            </ul>
          </div>

          {/* Intake Form Card */}
          <div className="bg-[#12121c] border border-[#1e1e2e] rounded-[14px] p-8 mb-8" id="intake-form-card">
            <h2 className="text-[1.3rem] font-bold text-[#f1f5f9] mb-2">
              {submitted ? "✅ Submitted!" : "📝 Your Project Details"}
            </h2>
            <p className="text-[#94a3b8] mb-6">
              Fill this out and we'll start within the hour. Every field helps us deliver a better result.
            </p>

            {!submitted && (
              <form onSubmit={handleSubmit}>
                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="name">
                  Your name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Jane Smith"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc]"
                />

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="email">
                  Email (we'll use this for delivery)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc]"
                />

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="url">
                  Your landing page URL
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://your-product.com"
                  value={formData.url}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc]"
                />
                <p className="text-[#94a3b8] text-[13px] mt-1">
                  If you don't have one yet, write "need one built" — we'll build from scratch.
                </p>

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="offer">
                  What do you sell? (one sentence)
                </label>
                <input
                  id="offer"
                  name="offer"
                  type="text"
                  required
                  placeholder="e.g. A scheduling tool for freelancers"
                  value={formData.offer}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc]"
                />

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="target">
                  Who is your target customer? (describe them)
                </label>
                <textarea
                  id="target"
                  name="target"
                  required
                  placeholder="e.g. Freelance designers who bill by the hour and struggle to manage client schedules"
                  value={formData.target}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc] resize-y min-h-[100px]"
                />

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="product_stage">
                  Product stage
                </label>
                <select
                  id="product_stage"
                  name="product_stage"
                  value={formData.product_stage}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc]"
                >
                  <option value="live">Live — ready to accept customers</option>
                  <option value="beta">Beta — free tier available, paid coming soon</option>
                  <option value="prelaunch">Pre-launch — taking pre-orders or interest</option>
                  <option value="idea">Just an idea (not yet ready)</option>
                </select>

                <label className="block font-semibold mt-5 mb-1.5 text-[#e2e8f0]" htmlFor="extra">
                  Anything else? (competitors, past outreach attempts, specific goals)
                </label>
                <textarea
                  id="extra"
                  name="extra"
                  placeholder="Optional, but the more context the better."
                  value={formData.extra}
                  onChange={handleChange}
                  rows={3}
                  className="w-full p-3.5 bg-[#0d1117] border border-[#2d2d4e] rounded-[10px] text-[16px] text-[#e2e8f0] focus:outline-none focus:border-[#a5b4fc] resize-y min-h-[100px]"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-block bg-[#22c55e] text-[#0a0a0f] font-bold text-[1rem] py-4 px-9 border-0 rounded-[10px] cursor-pointer mt-6 transition-colors hover:bg-[#16a34a] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Submitting..." : "Submit & Start My Growth Launch →"}
                </button>
              </form>
            )}

            {status && (
              <div
                className={`mt-4 p-3 rounded-[8px] ${
                  status.type === "success"
                    ? "bg-[#0a1a0f] border border-[#22c55e] text-[#22c55e]"
                    : "bg-[#1c1010] border border-[#ef4444] text-[#ef4444]"
                }`}
              >
                {status.message}
              </div>
            )}
          </div>

          {/* Guarantee Card */}
          <div className="bg-[#12121c] border-2 border-[#fbbf24] rounded-[14px] p-8 text-center">
            <h2 className="text-[1.3rem] font-bold text-[#f1f5f9] mb-2">🛡️ Your Guarantee Is Active</h2>
            <p className="text-[#94a3b8] mb-0">
              If you haven't closed a paying customer within 60 days of today, we keep working — at no additional cost — until you do. You keep every deliverable. No clawback. No fine print.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function GrowthLaunchConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-[#94a3b8]">
          Loading...
        </div>
      }
    >
      <GrowthLaunchConfirmationContent />
    </Suspense>
  );
}
