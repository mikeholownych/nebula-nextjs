"use client";

import { useState } from "react";
import Head from "next/head";

export default function CheckoutImpulsePage() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would integrate with Stripe
    alert("Checkout submitted! In production, this would process payment via Stripe.");
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Head>
        <title>Complete Your Purchase — Nebula Components</title>
        <meta
          name="description"
          content="Secure checkout for Nebula Components. 256-bit encryption. 30-day refund."
        />
        <link rel="canonical" href="https://nebulacomponents.shop/checkout-impulse" />
      </Head>

      <div className="min-h-screen bg-[#0a0f1a] text-[#f3f4f6] font-sans">
        {/* Gradient background */}
        <div className="fixed inset-0 bg-gradient-to-br from-[#0a0f1a] to-[#1a1f2e] -z-10" />

        <div className="max-w-[1100px] mx-auto px-5 py-10">
          <div className="grid gap-10 lg:grid-cols-[1fr_420px]">
            {/* Left: Form */}
            <div className="bg-[#141923] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8">
              <h1 className="text-[28px] font-bold mb-2">Secure Checkout</h1>
              <p className="text-[#9ca3af] mb-6">
                Complete your purchase. 256-bit encryption. 30-day refund.
              </p>

              <form onSubmit={handleSubmit}>
                {/* Contact Information */}
                <SectionTitle>Contact Information</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <Field
                    label="First Name *"
                    value={formData.firstName}
                    onChange={(v) => updateField("firstName", v)}
                    required
                  />
                  <Field
                    label="Last Name *"
                    value={formData.lastName}
                    onChange={(v) => updateField("lastName", v)}
                    required
                  />
                </div>
                <div className="mb-6">
                  <Field
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(v) => updateField("email", v)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                {/* Billing Information */}
                <SectionTitle>Billing Information</SectionTitle>
                <div className="mb-4">
                  <Field
                    label="Street Address *"
                    value={formData.address}
                    onChange={(v) => updateField("address", v)}
                    required
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mb-4">
                  <div>
                    <label className="block text-[13px] font-semibold text-[#9ca3af] mb-[6px]">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateField("country", e.target.value)}
                      className="w-full px-4 py-[14px] bg-[#0a0f1a] border border-[rgba(255,255,255,0.12)] rounded-[10px] text-[#f3f4f6] text-[16px] focus:outline-none focus:border-[#79f2c0]"
                    >
                      <option value="">Select Country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                  <Field
                    label="State/Province"
                    value={formData.state}
                    onChange={(v) => updateField("state", v)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 mb-6">
                  <Field
                    label="City *"
                    value={formData.city}
                    onChange={(v) => updateField("city", v)}
                    required
                  />
                  <Field
                    label="ZIP/Postal Code *"
                    value={formData.zip}
                    onChange={(v) => updateField("zip", v)}
                    required
                  />
                </div>

                {/* Payment Method */}
                <SectionTitle>Payment Method</SectionTitle>

                <PaymentOption
                  active={paymentMethod === "card"}
                  onClick={() => setPaymentMethod("card")}
                  label="Credit/Debit Card"
                />

                {paymentMethod === "card" && (
                  <div className="bg-[#0a0f1a] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-4 mb-3">
                    <Field
                      label="Card Number"
                      value={formData.cardNumber}
                      onChange={(v) => updateField("cardNumber", v)}
                      placeholder="4242 4242 4242 4242"
                      monospace
                    />
                    <div className="grid gap-3 sm:grid-cols-2 mt-3">
                      <Field
                        label="Expiry"
                        value={formData.expiry}
                        onChange={(v) => updateField("expiry", v)}
                        placeholder="MM/YY"
                      />
                      <Field
                        label="CVC"
                        value={formData.cvc}
                        onChange={(v) => updateField("cvc", v)}
                        placeholder="123"
                      />
                    </div>
                  </div>
                )}

                <PaymentOption
                  active={paymentMethod === "paypal"}
                  onClick={() => setPaymentMethod("paypal")}
                  label="PayPal"
                />

                {/* Card Logos */}
                <div className="flex gap-2 flex-wrap mt-3 mb-6">
                  <VisaLogo />
                  <MastercardLogo />
                  <StripeLogo />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-[18px] bg-[#79f2c0] text-[#0a0f0a] rounded-[10px] text-[17px] font-extrabold cursor-pointer hover:translate-y-[-2px] transition-transform duration-150"
                >
                  Complete Purchase →
                </button>

                {/* Trust Badge */}
                <div className="flex items-center justify-center gap-2 text-[13px] text-[#9ca3af] mt-4">
                  <LockIcon />
                  <span>All payments are secured by 256-bit encryption</span>
                </div>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="bg-[#141923] border border-[rgba(255,255,255,0.08)] rounded-2xl p-8 h-fit">
              {/* Product */}
              <div className="border-b border-[rgba(255,255,255,0.08)] pb-5 mb-5">
                <div className="text-[18px] font-bold mb-1">Nebula Conversion Fix Pack</div>
                <div className="text-[14px] text-[#9ca3af] leading-relaxed">
                  Audit results turned into implementation-ready fixes: headline, CTA, trust proof,
                  offer, FAQ — rewritten and prioritized
                </div>
              </div>

              {/* Pricing */}
              <div className="flex justify-between mb-2 text-[15px]">
                <span>Regular Price</span>
                <span className="line-through text-[#9ca3af]">$490</span>
              </div>
              <div className="flex justify-between mb-2 text-[15px] text-[#79f2c0]">
                <span className="font-bold">Early-Adopter Discount</span>
                <span>-$393</span>
              </div>
              <div className="flex justify-between mb-2 text-[15px]">
                <span>Subtotal</span>
                <span className="font-bold">$147</span>
              </div>
              <div className="flex justify-between text-[24px] font-extrabold text-[#79f2c0] mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <span>Total</span>
                <span>$147</span>
              </div>

              {/* Testimonial */}
              <div className="bg-[rgba(110,231,183,0.06)] border border-[rgba(110,231,183,0.15)] rounded-xl p-4 mt-5">
                <p className="text-[14px] leading-relaxed mb-2">
                  "It's like having an SEO team working in house. The results genuinely blew me
                  away."
                </p>
                <div className="text-[13px] text-[#9ca3af]">— Simon Hood, Founder, SooperBooks</div>
              </div>

              {/* Guarantee */}
              <div className="bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] rounded-[10px] px-4 py-3 mt-4 text-center text-[14px]">
                <strong className="text-[#fbbf24]">🛡️ 30-Day Money-Back Guarantee</strong>
                <p className="mt-2 text-[13px]">
                  No questions asked. No hoops. We back the product completely.
                </p>
              </div>

              {/* What You Get */}
              <div className="mt-5">
                <div className="text-[13px] font-bold mb-2">What You Get:</div>
                <ul className="list-disc pl-5 space-y-1">
                  <Bullet>✓</Bullet>
                  <Bullet>✓ Audit-to-fix checklist</Bullet>
                  <Bullet>✓ Rewritten headline copy</Bullet>
                  <Bullet>✓ CTA optimization</Bullet>
                  <Bullet>✓ Trust section rewrite</Bullet>
                  <Bullet>✓ Offer refinement</Bullet>
                  <Bullet>✓ FAQ block templates</Bullet>
                  <Bullet>✓ Implementation guide</Bullet>
                  <Bullet>✓ One revision pass</Bullet>
                </ul>
              </div>

              {/* Discount Badge */}
              <div className="bg-[rgba(110,231,183,0.06)] rounded-[10px] px-3 py-3 mt-4 text-center text-[14px]">
                <strong className="text-[#79f2c0]">Huge Discount!</strong>
                <br />
                <span className="text-[#9ca3af]">Pay $147 today. No monthly fees ever.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-10 px-5 text-[#9ca3af] text-[13px]">
          <p>© 2026 Nebula Components. All rights reserved.</p>
          <p className="mt-2">
            <a href="/privacy" className="text-[#9ca3af] hover:underline">
              Privacy Policy
            </a>{" "}
            ·{" "}
            <a href="/terms" className="text-[#9ca3af] hover:underline">
              Terms of Service
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}

// Helper Components
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[18px] text-[#9ca3af] uppercase tracking-[0.06em] mt-6 mb-3">
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  monospace,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  monospace?: boolean;
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-[#9ca3af] mb-[6px]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-4 py-[14px] bg-[#0a0f1a] border border-[rgba(255,255,255,0.12)] rounded-[10px] text-[#f3f4f6] text-[16px] focus:outline-none focus:border-[#79f2c0] ${
          monospace ? "font-mono" : ""
        }`}
      />
    </div>
  );
}

function PaymentOption({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center px-[14px] py-[14px] bg-[#0a0f1a] border rounded-[10px] mb-3 cursor-pointer transition-colors duration-150 ${
        active
          ? "border-[#79f2c0]"
          : "border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
      }`}
    >
      <input
        type="radio"
        checked={active}
        onChange={onClick}
        className="mr-3"
      />
      <label className="font-semibold text-[#f3f4f6] cursor-pointer">{label}</label>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="text-[14px] py-[6px]">
      <strong className="text-[#79f2c0]">{children}</strong>
    </li>
  );
}

function LockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#79f2c0" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function VisaLogo() {
  return (
    <svg height="24" viewBox="0 0 50 16" xmlns="http://www.w3.org/2000/svg">
      <rect width="50" height="16" rx="3" fill="#1a1f71" />
      <text x="4" y="12" fontFamily="Arial" fontSize="10" fontWeight="900" fill="white" letterSpacing="1">
        VISA
      </text>
    </svg>
  );
}

function MastercardLogo() {
  return (
    <svg height="24" viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg">
      <rect width="38" height="24" rx="4" fill="#252525" />
      <circle cx="15" cy="12" r="7" fill="#eb001b" />
      <circle cx="23" cy="12" r="7" fill="#f79e1b" />
      <path d="M19 6.8a7 7 0 0 1 0 10.4A7 7 0 0 1 19 6.8z" fill="#ff5f00" />
    </svg>
  );
}

function StripeLogo() {
  return (
    <svg height="24" viewBox="0 0 50 16" xmlns="http://www.w3.org/2000/svg">
      <rect width="50" height="16" rx="3" fill="#635bff" />
      <text x="5" y="12" fontFamily="Arial" fontSize="9" fontWeight="700" fill="white">
        stripe
      </text>
    </svg>
  );
}
