"use client";

import Link from "next/link";
import Breadcrumb from "./components/Breadcrumb";

interface Issue {
  title: string;
  description: string;
}

interface CaseStudyPageProps {
  category: string;
  domain: string;
  score: number;
  gradeClass: string;
  gradeLetter: string;
  issues: Issue[];
  patternText: string;
  jsonLd: object | null;
}

export default function CaseStudyPage({
  category,
  domain,
  score,
  gradeClass,
  gradeLetter,
  issues,
  patternText,
  jsonLd,
}: CaseStudyPageProps) {
  const gradeColorMap: Record<string, string> = {
    "grade-a": "bg-emerald-900/30 border-emerald-500 text-emerald-300",
    "grade-b": "bg-blue-900/30 border-blue-500 text-blue-300",
    "grade-c": "bg-amber-900/30 border-amber-500 text-amber-300",
    "grade-d": "bg-red-900/30 border-red-500 text-red-300",
  };

  const formatDate = () => {
    const d = new Date();
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {/* JSON-LD Schema */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <div className="min-h-screen bg-gray-950 text-gray-100">
        {/* Navigation */}
        <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-14 items-center">
              <Link href="/" className="text-lg font-semibold text-white">
                Nebula
              </Link>
              <Link
                href="/audit"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Get Free Audit
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <Breadcrumb />
          
          {/* Badge */}
          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-violet-900/50 text-violet-300 border border-violet-700">
              Case Study · {category}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
            How a {category} Landing Page Scored{" "}
            <span className="text-violet-400">{score}/10</span> on Conversion
            Audit
          </h1>

          {/* Meta */}
          <p className="text-gray-400 text-sm mb-8">
            Published {formatDate()} ·{" "}
            <span className="italic opacity-70">
              Domain anonymized for privacy
            </span>
          </p>

          {/* Score Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
              {/* Score Circle */}
              <div
                className={`flex-shrink-0 w-24 h-24 rounded-full border-3 flex items-center justify-center ${
                  gradeColorMap[gradeClass] || gradeColorMap["grade-b"]
                }`}
              >
                <span className="text-3xl font-extrabold">{score}</span>
              </div>

              {/* Score Details */}
              <div className="flex-1">
                <p className="text-white font-semibold text-lg mb-1">
                  Overall Grade: {gradeLetter}
                </p>
                <p className="text-gray-400 text-sm">Industry: {category}</p>
                <p className="text-gray-400 text-sm">
                  Audit Date: {formatDate()}
                </p>
                <p className="text-gray-500 text-sm italic mt-1">
                  Original URL: {domain} (anonymized)
                </p>
              </div>
            </div>
          </div>

          {/* What the Audit Found */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-gray-800">
              What the Audit Found
            </h2>
            <div className="space-y-4">
              {issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="py-4 border-b border-gray-800 last:border-0"
                >
                  <h3 className="font-semibold text-white mb-1">
                    {issue.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{issue.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* The Pattern */}
          <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-4 pb-3 border-b border-gray-800">
              The Pattern
            </h2>
            <p className="text-gray-300 leading-relaxed">{patternText}</p>
          </section>

          {/* CTA Box */}
          <div className="bg-gradient-to-br from-violet-950 to-gray-900 border border-violet-800 rounded-xl p-8 text-center">
            <h3 className="text-xl font-bold text-white mb-2">
              Audit Your Own Page in 60 Seconds
            </h3>
            <p className="text-violet-300 mb-6">
              Paste your URL → get a full conversion scorecard with exact fixes.
            </p>
            <Link
              href="/audit"
              className="inline-flex items-center px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
            >
              Run Free Audit →
            </Link>
          </div>

          {/* Footer Note */}
          <footer className="mt-12 text-center text-gray-500 text-sm">
            <p>
              This case study is based on a real automated audit. Domain and
              identifying details anonymized.
            </p>
            <p className="mt-2 text-gray-600">
              Nebula Components — landing page components that convert.
            </p>
          </footer>
        </main>
      </div>
    </>
  );
}
