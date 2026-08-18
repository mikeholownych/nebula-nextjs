'use client';

import { useState } from 'react';

const CITATION = 'Nebula Components. State of Landing Page Performance Q3 2026. August 2026. nebulacomponents.com/research/landing-page-performance-q3-2026';

export default function CitationCopy() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(CITATION);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select text
    }
  };

  return (
    <div className="rounded-lg border border-border bg-[#0d1110] p-6 font-mono text-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <span className="text-[#9e9e9e] text-xs uppercase tracking-widest">Citation</span>
        <button
          onClick={handleCopy}
          className="rounded border border-border px-3 py-1 text-xs text-[#9e9e9e] transition-colors hover:border-[#c7ff2f] hover:text-[#c7ff2f] active:scale-95"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>
      <p className="text-[#9e9e9e] leading-relaxed break-words">
        {CITATION}
      </p>
    </div>
  );
}
