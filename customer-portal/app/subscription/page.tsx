"use client";

import { useState } from "react";
import Link from "next/link";

export default function SubscriptionPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (productId: string) => {
    setLoading(productId);
    // Stripe checkout will be implemented in next phase
    alert("Stripe checkout integration coming in next phase");
    setLoading(null);
  };

  const products = [
    {
      id: "fix-pack",
      name: "Fix Pack",
      price: "$147",
      description: "One-time landing page optimization",
      features: [
        "Technical SEO audit",
        "Conversion optimization",
        "WCAG accessibility review",
        "Performance audit",
        "Prioritized action items",
      ],
      stripeUrl: "https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b",
    },
    {
      id: "agency-partner",
      name: "Agency Partner",
      price: "$497",
      period: "/month",
      description: "Monthly partnership for agencies",
      features: [
        "Unlimited audits",
        "White-label reports",
        "Priority support",
        "Custom branding",
        "Team access (up to 5)",
      ],
      stripeUrl: "https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S10d",
    },
    {
      id: "ai-ops-retainer",
      name: "AI Ops Retainer",
      price: "$1,497",
      period: "/month",
      description: "Full-service AI-powered optimization",
      features: [
        "Everything in Agency Partner",
        "Dedicated AI operations",
        "24/7 monitoring",
        "A/B testing",
        "Conversion tracking setup",
        "Monthly strategy calls",
      ],
      stripeUrl: "https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                Nebula Components
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/audits" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                Audits
              </Link>
              <Link href="/organization" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                Organization
              </Link>
              <Link href="/subscription" className="text-blue-600 px-3 py-2">
                Subscription
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the plan that fits your needs
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {product.price}
                  </span>
                  {product.period && (
                    <span className="text-gray-600">{product.period}</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{product.description}</p>

                <ul className="space-y-3 mb-6">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5"
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
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-gray-50">
                <a
                  href={product.stripeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded font-semibold transition-colors"
                >
                  {loading === product.id ? "Loading..." : "Get Started"}
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-gray-600">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards via Stripe. All payments are securely processed and encrypted.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600">
                We offer a 30-day money-back guarantee for the Fix Pack. For monthly subscriptions, you can cancel anytime.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need more help?
              </h3>
              <p className="text-gray-600">
                Contact us at{" "}
                <a
                  href="mailto:support@nebulacomponents.shop"
                  className="text-blue-600 hover:text-blue-800"
                >
                  support@nebulacomponents.shop
                </a>{" "}
                for any questions.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
