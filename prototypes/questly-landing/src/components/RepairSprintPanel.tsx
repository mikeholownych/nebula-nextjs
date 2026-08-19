import React from 'react';
import { Wrench, ArrowRight, ShieldCheck, Clock, FileCode } from 'lucide-react';
import { REPAIR_SPRINT_OFFER } from '../config/product';

interface RepairSprintPanelProps {
  topFindingId?: string;
  className?: string;
}

export const RepairSprintPanel: React.FC<RepairSprintPanelProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-xl border border-white/10 bg-gradient-to-b from-[#131615] to-[#0d0f0e] p-4 text-left relative overflow-hidden ${className}`}>
      {/* Subtle top indicator */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#c7ff2f]" />

      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#e8ebe7]">
          <Wrench className="w-3.5 h-3.5 text-[#c7ff2f]" />
          <span>{REPAIR_SPRINT_OFFER.name}</span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-bold text-[#c7ff2f]">{REPAIR_SPRINT_OFFER.price}</span>
          <span className="text-[10px] text-[#7a8078]">one-time</span>
        </div>
      </div>

      <p className="text-[11px] text-[#7a8078] leading-relaxed mb-3">
        {REPAIR_SPRINT_OFFER.delivery}
      </p>

      {/* Deliverable bullets */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-[10px] font-mono text-white/70 bg-[#080909]/60 p-2 rounded-lg border border-white/5">
        <div className="flex items-center gap-1.5">
          <FileCode className="w-3 h-3 text-[#c7ff2f] shrink-0" />
          <span>Exact code patch</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#3b82f6] shrink-0" />
          <span>Delivered in 48h</span>
        </div>
      </div>

      <a
        href="#repair-sprint"
        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#c7ff2f] text-[#080909] font-medium text-xs hover:bg-[#b5eb25] transition-colors shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c7ff2f]"
      >
        <span>See Repair Sprint</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>

      <div className="mt-2.5 flex items-center justify-center gap-1 text-[10px] text-[#525750]">
        <ShieldCheck className="w-3 h-3 text-[#7a8078]" />
        <span>{REPAIR_SPRINT_OFFER.disclaimer}</span>
      </div>
    </div>
  );
};

export default RepairSprintPanel;
