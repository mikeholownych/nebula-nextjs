import React, { useState } from 'react';
import {
  Gauge,
  ListChecks,
  Fingerprint,
  BarChart3,
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  Monitor,
  RotateCw,
  Share2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { NebulaMark } from './NebulaLogo';
import { FindingCard } from './FindingCard';
import { EvidenceAtom } from './EvidenceAtom';
import { RepairSprintPanel } from './RepairSprintPanel';
import {
  SAMPLE_AUDIT_DATA,
  SIGNALS,
  PRIORITY_SCORE_META,
  Finding,
} from '../config/product';

export const AuditPreview: React.FC = () => {
  const [selectedFindingId, setSelectedFindingId] = useState<string>(
    SAMPLE_AUDIT_DATA.findings[0].id
  );
  const [activeTab, setActiveTab] = useState<'findings' | 'evidence' | 'signals'>('findings');
  const [showTooltip, setShowTooltip] = useState(false);

  const selectedFinding: Finding =
    SAMPLE_AUDIT_DATA.findings.find((f) => f.id === selectedFindingId) ||
    SAMPLE_AUDIT_DATA.findings[0];

  const markStates = SIGNALS.map((s) => (s.passing ? 'pass' : 'fail'));

  return (
    <div className="rounded-t-2xl overflow-hidden bg-[#0d0f0e] border-t border-x border-white/10 shadow-[0_-24px_100px_rgba(0,0,0,0.6)] text-left select-none">
      {/* ── Browser Chrome Title Bar ── */}
      <div className="bg-[#131615] border-b border-white/10 px-4 py-2.5 flex items-center justify-between">
        {/* Left: Window controls & nav buttons */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f06b6b]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#c7ff2f]/80 inline-block" />
          </div>

          <div className="flex items-center gap-2">
            <PanelLeft className="w-3.5 h-3.5 text-[#525750] hover:text-[#7a8078] transition-colors" />
            <ChevronLeft className="w-3.5 h-3.5 text-[#525750]" />
            <ChevronRight className="w-3.5 h-3.5 text-[#525750]/50" />
          </div>
        </div>

        {/* Center: URL Bar */}
        <div className="bg-[#080909] rounded-md px-5 py-1 text-[11px] text-[#7a8078] flex items-center gap-2 border border-white/5 font-mono max-w-sm w-full justify-center">
          <Monitor className="w-3.5 h-3.5 text-[#525750]" />
          <span className="text-[#e8ebe7]/80 truncate">nebulacomponents.com/audit/sample-ecommerce</span>
        </div>

        {/* Right: Window actions */}
        <div className="flex items-center gap-3">
          <RotateCw className="w-3.5 h-3.5 text-[#525750] hover:text-[#7a8078] transition-colors" />
          <Share2 className="w-3.5 h-3.5 text-[#525750] hover:text-[#7a8078] transition-colors" />
        </div>
      </div>

      {/* ── Main Application Body ── */}
      <div className="flex">
        {/* Left Sidebar (20% width) */}
        <aside className="w-[20%] shrink-0 border-r border-white/10 bg-[#080909] p-3 flex flex-col justify-between hidden sm:flex">
          <div className="space-y-4">
            {/* Logo in sidebar */}
            <div className="flex items-center gap-2 px-1">
              <NebulaMark size={18} states={markStates} />
              <span className="text-xs font-semibold text-[#e8ebe7] tracking-tight">Nebula</span>
            </div>

            {/* Target audited domain badge */}
            <div className="rounded-lg bg-[#131615] border border-white/5 p-2 space-y-0.5">
              <span className="text-[9px] uppercase font-mono text-[#525750] block">AUDITED DOMAIN</span>
              <span className="text-[11px] font-mono font-medium text-[#e8ebe7] truncate block">
                {SAMPLE_AUDIT_DATA.url}
              </span>
            </div>

            {/* Diagnostic Sidebar Nav */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('findings')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'findings'
                    ? 'bg-[#191c1a] text-[#c7ff2f] border border-[#c7ff2f]/20'
                    : 'text-[#7a8078] hover:text-[#e8ebe7] hover:bg-white/5'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('findings')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'findings'
                    ? 'text-[#e8ebe7] bg-white/5'
                    : 'text-[#7a8078] hover:text-[#e8ebe7]'
                }`}
              >
                <ListChecks className="w-3.5 h-3.5" />
                <span>Findings (3)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'evidence'
                    ? 'bg-[#191c1a] text-[#c7ff2f] border border-[#c7ff2f]/20'
                    : 'text-[#7a8078] hover:text-[#e8ebe7] hover:bg-white/5'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Evidence Atom</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('signals')}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'signals'
                    ? 'bg-[#191c1a] text-[#c7ff2f] border border-[#c7ff2f]/20'
                    : 'text-[#7a8078] hover:text-[#e8ebe7] hover:bg-white/5'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>9 Signal Grid</span>
              </button>
            </nav>
          </div>

          {/* Sidebar footer */}
          <div className="pt-3 border-t border-white/5 text-[9px] font-mono text-[#525750] space-y-1">
            <div>{SAMPLE_AUDIT_DATA.registryVersion}</div>
            <div>{SAMPLE_AUDIT_DATA.priorityModel}</div>
          </div>
        </aside>

        {/* ── Main Content Area (80% width) ── */}
        <main className="flex-1 p-4 sm:p-5 space-y-4 overflow-hidden bg-[#0d0f0e]">
          {/* Header Row: Target URL, Status, and Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#131615] border border-white/10">
                <NebulaMark size={20} states={markStates} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#e8ebe7] font-mono">
                    {SAMPLE_AUDIT_DATA.url}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#c7ff2f]/10 text-[#c7ff2f] border border-[#c7ff2f]/25">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c7ff2f] animate-pulse" />
                    {SAMPLE_AUDIT_DATA.status}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#7a8078] mt-0.5">
                  Single-run diagnostic evaluation • Governed Signal Registry v2.0
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-[#7a8078]">
              <span>Verified DOM snapshot</span>
              <ShieldCheck className="w-3.5 h-3.5 text-[#c7ff2f]" />
            </div>
          </div>

          {/* ── 4-Cell Summary Strip ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-[#080909] p-3 border border-white/5">
            {/* Cell 1: Score */}
            <div className="p-2 rounded-lg bg-[#131615]/70 border border-white/5">
              <span className="text-[9px] uppercase font-mono tracking-wider text-[#7a8078] block">
                CONVERSION SCORE
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#c7ff2f]">
                  {SAMPLE_AUDIT_DATA.score}
                </span>
                <span className="text-[11px] font-mono text-[#7a8078]">/ 100</span>
                <span className="ml-auto text-xs font-mono font-semibold px-1.5 py-0.2 rounded bg-white/5 text-[#e8ebe7]">
                  {SAMPLE_AUDIT_DATA.grade}
                </span>
              </div>
            </div>

            {/* Cell 2: Signals passing */}
            <div className="p-2 rounded-lg bg-[#131615]/70 border border-white/5">
              <span className="text-[9px] uppercase font-mono tracking-wider text-[#7a8078] block">
                SIGNALS CHECKED
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#e8ebe7]">
                  {SAMPLE_AUDIT_DATA.signalsPassing}
                </span>
                <span className="text-[11px] font-mono text-[#7a8078]">
                  / {SAMPLE_AUDIT_DATA.signalsTotal} passing
                </span>
              </div>
            </div>

            {/* Cell 3: Findings */}
            <div className="p-2 rounded-lg bg-[#131615]/70 border border-white/5">
              <span className="text-[9px] uppercase font-mono tracking-wider text-[#7a8078] block">
                ACTIONABLE FINDINGS
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#f59e0b]">
                  {SAMPLE_AUDIT_DATA.findingsCount}
                </span>
                <span className="text-[11px] font-mono text-[#7a8078]">conditions</span>
              </div>
            </div>

            {/* Cell 4: Highest Priority */}
            <div className="p-2 rounded-lg bg-[#131615]/70 border border-white/5 relative">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase font-mono tracking-wider text-[#7a8078]">
                  HIGHEST PRIORITY
                </span>
                <div className="relative">
                  <button
                    type="button"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    aria-label="Priority Score definition"
                    className="text-[#7a8078] hover:text-[#c7ff2f] transition-colors"
                  >
                    <HelpCircle className="w-3 h-3" />
                  </button>
                  {showTooltip && (
                    <div className="absolute right-0 top-5 z-30 w-56 p-2 rounded-lg bg-[#191c1a] border border-white/10 text-[10px] text-[#e8ebe7] shadow-xl font-sans">
                      <div className="font-semibold text-[#c7ff2f] mb-0.5 font-mono">
                        {PRIORITY_SCORE_META.name}
                      </div>
                      <div className="leading-snug text-[#7a8078]">
                        {PRIORITY_SCORE_META.tooltip}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-bold font-mono text-[#f06b6b]">
                  {SAMPLE_AUDIT_DATA.highestPriority.toFixed(1)}
                </span>
                <span className="text-[11px] font-mono text-[#7a8078]">/ 10</span>
              </div>
            </div>
          </div>

          {/* ── 9 Governed Signal Micro-Strip ── */}
          <div className="rounded-lg bg-[#131615] border border-white/5 px-3 py-2">
            <div className="flex items-center justify-between mb-1.5 text-[9px] font-mono text-[#7a8078]">
              <span className="uppercase tracking-wider">GOVERNED SIGNAL STATUS (9 / 9)</span>
              <span>{SAMPLE_AUDIT_DATA.signalsPassing} Pass • {SAMPLE_AUDIT_DATA.findingsCount} Attention</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 text-[10px] font-mono">
              {SIGNALS.map((sig) => (
                <div
                  key={sig.key}
                  title={`${sig.label}: ${sig.passing ? 'PASS' : 'FAIL'}`}
                  className={`flex items-center gap-1 px-1.5 py-1 rounded border text-[9px] truncate ${
                    sig.passing
                      ? 'bg-[#c7ff2f]/5 border-[#c7ff2f]/20 text-[#c7ff2f]'
                      : 'bg-[#f59e0b]/5 border-[#f59e0b]/20 text-[#f59e0b]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      sig.passing ? 'bg-[#c7ff2f]' : 'bg-[#f59e0b]'
                    }`}
                  />
                  <span className="truncate">{sig.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Interactive Split: Findings & Evidence Atom ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Left Col: Priority Findings List (7 cols) */}
            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7a8078] px-1">
                <span className="uppercase tracking-wider">
                  PRIORITY-RANKED REMEDIATION ORDER
                </span>
                <span>Select to inspect evidence</span>
              </div>

              <div className="space-y-2">
                {SAMPLE_AUDIT_DATA.findings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    isSelected={f.id === selectedFindingId}
                    onSelect={() => setSelectedFindingId(f.id)}
                  />
                ))}
              </div>
            </div>

            {/* Right Col: Evidence Atom + Repair Sprint Offer (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-[#7a8078] px-1">
                <span className="uppercase tracking-wider">
                  INSPECTABLE EVIDENCE ATOM
                </span>
                <span className="text-[#c7ff2f]">Verified</span>
              </div>

              {/* Active Evidence Atom Panel */}
              <EvidenceAtom
                evidence={selectedFinding.evidence}
                findingTitle={selectedFinding.title}
                priorityScore={selectedFinding.priorityScore}
                status={selectedFinding.status}
              />

              {/* One-Leak Repair Sprint Panel */}
              <RepairSprintPanel topFindingId={selectedFindingId} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuditPreview;
