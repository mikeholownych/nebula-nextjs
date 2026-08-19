import React from 'react';
import { Fingerprint, Terminal, ShieldAlert } from 'lucide-react';
import { EvidenceAtomData } from '../config/product';

interface EvidenceAtomProps {
  evidence: EvidenceAtomData;
  findingTitle: string;
  priorityScore: number;
  status: 'FAIL' | 'REVIEW' | 'PASS';
}

export const EvidenceAtom: React.FC<EvidenceAtomProps> = ({
  evidence,
  findingTitle,
  priorityScore,
  status,
}) => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d0f0e] p-4 sm:p-5 text-left text-xs font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3.5">
        <div className="flex items-center gap-2 text-white/90 font-sans font-medium text-xs sm:text-sm">
          <Fingerprint className="w-4 h-4 text-[#c7ff2f]" />
          <span>Evidence Atom</span>
          <span className="text-[10px] text-[#7a8078] font-mono">[{evidence.rule}]</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-[#7a8078]">Priority:</span>
          <span className="font-semibold text-[#c7ff2f]">{priorityScore.toFixed(1)}/10</span>
        </div>
      </div>

      {/* Observation */}
      <div className="space-y-3 font-sans">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a8078]">
              OBSERVATION
            </span>
            <span className="text-[10px] font-mono text-[#525750]">
              Status: <strong className={status === 'FAIL' ? 'text-[#f59e0b]' : 'text-[#eab308]'}>{status}</strong>
            </span>
          </div>
          <p className="text-[#e8ebe7] text-xs sm:text-[13px] leading-relaxed font-medium">
            {findingTitle}
          </p>
          <p className="text-[#7a8078] text-xs leading-relaxed mt-1">
            {evidence.observation}
          </p>
        </div>

        {/* Technical Key-Value Metrics & Selector */}
        <div className="rounded-lg bg-[#080909] border border-white/5 p-3 space-y-2 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-[#7a8078] pb-1.5 border-b border-white/5">
            <Terminal className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span className="text-[10px] uppercase tracking-wider">MEASURED STATE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[#525750]">Target Selector:</span>{' '}
              <span className="text-[#c7ff2f]">{evidence.selector}</span>
            </div>
            {evidence.metrics.map((m, i) => (
              <div key={i}>
                <span className="text-[#525750]">{m.label}:</span>{' '}
                <span className="text-[#e8ebe7]">{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Interpretation */}
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#7a8078] block mb-1">
            DIAGNOSTIC INTERPRETATION
          </span>
          <p className="text-[#7a8078] text-xs leading-relaxed">
            {evidence.interpretation}
          </p>
        </div>

        {/* Explicit Boundary / Limitation */}
        <div className="rounded-md border border-white/5 bg-[#131615] px-3 py-2.5 flex items-start gap-2 text-[11px] text-[#7a8078]">
          <ShieldAlert className="w-3.5 h-3.5 text-[#f59e0b] shrink-0 mt-0.5" />
          <p className="leading-snug">
            <span className="text-white/70 font-medium">Evidence Boundary:</span> {evidence.limitation}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EvidenceAtom;
