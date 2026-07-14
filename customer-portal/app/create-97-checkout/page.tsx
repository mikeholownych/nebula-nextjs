"use client";

import Head from "next/head";

const STRIPE_LINK = "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b";

export default function Create97CheckoutPage() {
  const handleCheckout = () => {
    window.location.href = STRIPE_LINK;
  };

  return (
    <>
      <Head>
        <title>Managed Outreach Audit - $147</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/styles/nebula-design-system.css" />
      </Head>

      <div className="min-h-screen bg-[#0a0e27] text-[#e0e0e0] font-sans flex items-center justify-center p-5">
        <div className="max-w-[500px] w-full bg-[#1a1f3a] border border-[#2a2f4a] rounded-xl p-10">
          <h1 className="text-[28px] font-bold mb-[10px]">Managed Outreach Audit</h1>
          <p className="text-[#888] text-[14px] mb-[30px]">
            Get results in 72 hours. Or get your money back.
          </p>

          <div className="text-[48px] font-bold text-[#4ade80] my-[30px]">
            $<span className="text-[24px] text-[#888]">147</span>
          </div>

          <ul className="list-none my-[30px]">
            <FeatureItem>Prospect list review (ICP quality check)</FeatureItem>
            <FeatureItem>Email template optimization</FeatureItem>
            <FeatureItem>10 test emails sent on your behalf</FeatureItem>
            <FeatureItem>Reply analysis + conversion report</FeatureItem>
            <FeatureItem>Next 100 email recommendations</FeatureItem>
          </ul>

          <button
            onClick={handleCheckout}
            className="block w-full py-4 bg-[#4ade80] text-[#0a0e27] border-none rounded-lg font-bold text-[16px] cursor-pointer text-center mt-[30px] hover:bg-[#22c55e] transition-colors duration-300"
          >
            Buy Now - $147
          </button>

          <div className="mt-5 p-[15px] bg-[#2a2f4a] border-l-[3px] border-l-[#4ade80] rounded text-[13px] text-[#aaa]">
            <strong>30-day refund guarantee:</strong> If we don&apos;t generate any replies from your list, full refund. No questions.
          </div>
        </div>
      </div>
    </>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="py-[10px] border-b border-[#2a2f4a] text-[14px] flex items-start gap-[10px] last:border-b-0">
      <span className="text-[#4ade80] font-bold shrink-0">✓</span>
      <span>{children}</span>
    </li>
  );
}
