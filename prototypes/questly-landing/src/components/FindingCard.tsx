import React from 'react';
import { AlertTriangle, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import { Finding } from '../config/product';

interface FindingCardProps {
  finding: Finding;
  isSelected?: boolean;
  onSelect?: () => void;
}

export const FindingCard: React.FC<FindingCardProps> = ({
  finding,
  isSelected = false,
  onSelect,
}) => {
  const getStatusBadge = () => {
    switch (finding.status) {
      case 'FAIL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
            <AlertTriangle className="w-2.5 h-2.5" />
            FAIL
          </span>
        );
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20">
            <AlertCircle className="w-2.5 h-2.5" />
            REVIEW
          </span>
        );
      case 'PASS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#c7ff2f]/10 text-[#c7ff2f] border border-[#c7ff2f]/20">
            <CheckCircle2 className="w-2.5 h-2.5" />
            PASS
          </span>
        );
    }
  };

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left p-3.5 rounded-xl transition-all border ${
        isSelected
          ? 'bg-[#191c1a] border-[#c7ff2f]/40 shadow-sm ring-1 ring-[#c7ff2f]/20'
          : 'bg-[#0d0f0e] border-white/5 hover:border-white/15 hover:bg-[#131615]'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[11px] font-semibold text-[#e8ebe7]">
            P{finding.priorityScore.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#7a8078]">
            {finding.category}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      <h4 className="text-xs sm:text-[13px] font-medium text-[#e8ebe7] leading-snug mb-1 line-clamp-2">
        {finding.title}
      </h4>

      <p className="text-[11px] text-[#7a8078] line-clamp-1 mb-2 font-sans">
        {finding.summary}
      </p>

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] font-mono text-[#525750]">
        <span>Selector: {finding.evidence.selector}</span>
        <span className={`inline-flex items-center gap-0.5 ${isSelected ? 'text-[#c7ff2f]' : 'text-[#7a8078]'}`}>
          Inspect Evidence <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </button>
  );
};

export default FindingCard;
