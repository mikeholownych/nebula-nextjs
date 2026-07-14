"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface DimensionData {
  score: number;
  issue: string;
  fix: string;
}

interface AuditData {
  url: string;
  overall: number;
  overall_grade: string;
  dimensions: Record<string, DimensionData>;
}

// Sample audit data (will be replaced by API)
const sampleAuditData: AuditData = {
  url: "https://example.com",
  overall: 5.2,
  overall_grade: "C",
  dimensions: {
    headline: { score: 4, issue: "Headline does not state the buyer outcome clearly", fix: "Lead with the concrete buyer result in first sentence" },
    cta: { score: 6, issue: "CTA language is vague", fix: "Use action + outcome: 'Run my free teardown'" },
    social_proof: { score: 3, issue: "Trust proof missing before conversion ask", fix: "Add testimonial or metric near first CTA" },
    speed: { score: 8, issue: "Page weight reasonable", fix: "No fix needed" },
    mobile: { score: 5, issue: "Mobile viewport may be missing", fix: "Ensure responsive viewport testing" }
  }
};

function classifyImpact(score: number): 'critical' | 'high' | 'medium' | 'low' {
  if (score <= 3) return 'critical';
  if (score <= 5) return 'high';
  if (score <= 7) return 'medium';
  return 'low';
}

function classifyEffort(dimension: string): 'low' | 'medium' | 'high' {
  const highEffort = ['social_proof', 'headline', 'mobile'];
  return highEffort.includes(dimension) ? 'medium' : 'low';
}

export default function AuditDashboardPage() {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [auditData] = useState<AuditData>(sampleAuditData);

  // Auto-unlock for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setPassword("audit2026");
      setIsLocked(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const validPasswords = ['audit2026', 'nebula147', 'test123'];

  const handleUnlock = () => {
    if (validPasswords.includes(password)) {
      setIsLocked(false);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  const dims = Object.entries(auditData.dimensions);
  const criticalCount = dims.filter(([, v]) => v.score <= 3).length;
  
  const projected = dims.reduce((acc, [, v]) => {
    const gain = Math.min(10, v.score + 4) - v.score;
    return acc + gain / dims.length;
  }, auditData.overall);

  const sortedDims = [...dims].sort((a, b) => a[1].score - b[1].score);

  const impactColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-amber-500',
    medium: 'bg-blue-500',
    low: 'bg-emerald-400'
  };

  const impactBadges: Record<string, string> = {
    critical: 'bg-red-900/50 text-red-200',
    high: 'bg-amber-900/50 text-amber-200',
    medium: 'bg-blue-900/50 text-blue-200',
    low: 'bg-emerald-900/50 text-emerald-200'
  };

  if (isLocked) {
    return (
      <div className="fixed inset-0 bg-[#0a0a0f]/95 flex items-center justify-center z-50">
        <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-8 max-w-md w-[90%]">
          <h2 className="text-xl font-bold mb-2">🔒 Password Required</h2>
          <p className="text-sm text-gray-400 mb-6">
            Enter the audit password sent to your email.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full bg-[#0a0a0f] border border-gray-700 text-gray-100 px-4 py-3 rounded-lg mb-4 focus:outline-none focus:border-emerald-400"
          />
          <button
            onClick={handleUnlock}
            className="w-full bg-emerald-400 text-[#0a0a0f] font-semibold py-3 rounded-lg hover:bg-emerald-500 transition-colors"
          >
            View Dashboard
          </button>
          {error && (
            <p className="text-red-400 text-sm mt-4">Incorrect password. Try again.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-gray-100 p-6">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Landing Page Audit Report</h1>
          <p className="text-sm text-gray-400">
            Prepared for <span className="text-gray-200">{auditData.url}</span> · July 14, 2026
          </p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-8">
          {/* Overall Grade */}
          <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Overall Grade</p>
            <p className="text-6xl font-bold text-emerald-400">{auditData.overall_grade}</p>
            <p className="text-sm text-gray-500 mt-2">Score: {auditData.overall}/10</p>
          </div>

          {/* Critical Issues */}
          <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Critical Issues</p>
            <p className="text-5xl font-bold text-emerald-400">{criticalCount}</p>
            <p className="text-sm text-gray-500 mt-2">Must fix first</p>
          </div>

          {/* Projected Score */}
          <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Projected Score</p>
            <p className="text-5xl font-bold text-emerald-400">{projected.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-2">After fixes</p>
          </div>

          {/* Implementation Time */}
          <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-6">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Implementation Time</p>
            <p className="text-5xl font-bold text-emerald-400">4h</p>
            <p className="text-sm text-gray-500 mt-2">Estimated effort</p>
          </div>
        </div>

        {/* Fix Priority Stack */}
        <div className="bg-[#13131a] border border-[#1e1e2a] rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-6">Fix Priority Stack</h2>
          <div className="space-y-0">
            {sortedDims.map(([dim, data]) => {
              const impact = classifyImpact(data.score);
              const effort = classifyEffort(dim);
              const pct = (data.score / 10) * 100;

              return (
                <div
                  key={dim}
                  className="grid grid-cols-[80px_1fr_auto_auto] gap-4 items-center py-4 border-b border-[#1e1e2a] last:border-b-0"
                >
                  {/* Score bar */}
                  <div>
                    <div className="h-2 bg-gray-800 rounded overflow-hidden">
                      <div
                        className={`h-full ${impactColors[impact]} transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{data.score}/10</p>
                  </div>

                  {/* Issue */}
                  <div>
                    <p className="font-semibold capitalize">{dim.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-400">{data.issue}</p>
                  </div>

                  {/* Impact badge */}
                  <span className={`text-xs px-3 py-1 rounded-full font-semibold ${impactBadges[impact]}`}>
                    {impact}
                  </span>

                  {/* Effort */}
                  <span className="text-xs text-gray-500">{effort} effort</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA Box */}
        <div className="bg-gradient-to-br from-gray-900 to-[#0f172a] border border-gray-700 rounded-xl p-8 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to implement?</h3>
          <p className="text-sm text-gray-400 mb-6">
            Get the Conversion Fix Pack with step-by-step implementation guides.
          </p>
          <a
            href="https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b"
            className="inline-block bg-emerald-400 text-[#0a0a0f] font-semibold px-8 py-3 rounded-lg hover:bg-emerald-500 transition-all hover:-translate-y-0.5"
          >
            Get Fix Pack — $147
          </a>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-gray-500">
          <p>
            Generated by{' '}
            <Link href="https://nebulacomponents.shop" className="text-gray-400 hover:text-gray-300">
              Nebula Components
            </Link>{' '}
            · Trigger-aware landing page audits
          </p>
        </footer>
      </div>
    </div>
  );
}
