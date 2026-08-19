import React, { useState } from 'react';
import {
  Globe,
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Navbar } from './Navbar';
import { ScaledDashboard } from './ScaledDashboard';
import { SignalHorizon } from './SignalHorizon';
import { NebulaMark } from './NebulaLogo';

export const Hero: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const scanSteps = [
    'Fetching static DOM snapshot...',
    'Evaluating 9 governed signals...',
    'Calculating Priority Score heuristic...',
    'Preserving evidence atoms...',
  ];

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScanning(true);
    setScanStep(0);

    const interval = setInterval(() => {
      setScanStep((prev) => {
        if (prev >= scanSteps.length - 1) {
          clearInterval(interval);
          setTimeout(() => setIsScanning(false), 800);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
  };

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-[#080909] text-[#e8ebe7] flex flex-col justify-between selection:bg-[#c7ff2f] selection:text-[#080909]"
      aria-label="Nebula Components Hero"
    >
      {/* 1. Atmospheric Ambient Background Lighting & Calibration Grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
      >
        {/* Central Radial Glow in Chartreuse (#c7ff2f) */}
        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] sm:w-[900px] h-[450px] rounded-full bg-[#c7ff2f]/[0.06] blur-[120px]" />

        {/* Deep ambient cyan gradient */}
        <div className="absolute top-[15%] right-[20%] w-[400px] h-[300px] rounded-full bg-[#3b82f6]/[0.03] blur-[100px]" />

        {/* Diagnostic Hairline Calibration Grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #e8ebe7 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Viewport Boundary Calibration Corners */}
        <div className="absolute top-4 left-4 w-3 h-3 border-t border-l border-[#525750]/40" />
        <div className="absolute top-4 right-4 w-3 h-3 border-t border-r border-[#525750]/40" />
      </div>

      {/* 2. Top Navigation Bar */}
      <Navbar />

      {/* Flexible spacer */}
      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16 shrink-0" />

      {/* 3. Center Hero Content Block (Adapted from Questly template) */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 text-center">
        {/* Eyebrow / Governed Signal Status */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#131615] border border-[#1f2422] text-xs text-[#7a8078] mb-4 sm:mb-6 animate-fade-down shadow-inner">
          <span className="h-2 w-2 rounded-full bg-[#c7ff2f] animate-pulse" />
          <span className="font-mono text-[#e8ebe7]">9 Governed Signals</span>
          <span className="text-[#525750]">|</span>
          <span>Deterministic Priority Ranking</span>
        </div>

        {/* Large 2-Line Headline (Questly typography scale adapted for Nebula) */}
        <h1 className="font-sans font-normal leading-[1.04] tracking-tight text-[38px] min-[400px]:text-[44px] sm:text-6xl lg:text-7xl xl:text-[76px] text-[#e8ebe7]">
          <span className="block animate-fade-up">Find page-side leaks.</span>
          <span className="block animate-fade-up text-[#7a8078] mt-1 sm:mt-2">
            Before blaming the traffic.
          </span>
        </h1>

        {/* Centered Pill Search / URL Audit Bar */}
        <div className="mt-6 sm:mt-8 max-w-xl mx-auto">
          <form
            onSubmit={handleAuditSubmit}
            className="relative flex items-center rounded-full bg-[#131615]/90 backdrop-blur-xl border border-[#1f2422] p-1.5 pl-4 sm:pl-5 shadow-[0_12px_40px_rgba(0,0,0,0.7),0_0_30px_rgba(199,255,47,0.08)] focus-within:border-[#c7ff2f]/60 focus-within:shadow-[0_0_35px_rgba(199,255,47,0.18)] transition-all"
          >
            <Globe className="h-4 w-4 text-[#7a8078] shrink-0 mr-2.5" />
            <label htmlFor="landing-url" className="sr-only">
              Landing Page URL
            </label>
            <input
              id="landing-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yourlandingpage.com/pricing"
              disabled={isScanning}
              className="w-full bg-transparent text-sm sm:text-base text-[#e8ebe7] placeholder:text-[#525750] focus:outline-none disabled:opacity-50"
            />

            {/* Circular Chartreuse Submit Button */}
            <button
              type="submit"
              disabled={isScanning}
              aria-label="Run Diagnostic Audit"
              className="group relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-[#c7ff2f] text-[#080909] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isScanning ? (
                <div className="h-4 w-4 rounded-full border-2 border-[#080909] border-t-transparent animate-spin" />
              ) : (
                <ArrowUp className="h-5 w-5 rotate-45 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
          </form>

          {/* Real-time Scanning Step Feedback */}
          {isScanning && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono text-[#c7ff2f] animate-fade-up">
              <span className="h-2 w-2 rounded-full bg-[#c7ff2f] animate-ping" />
              <span>{scanSteps[scanStep]}</span>
            </div>
          )}
        </div>

        {/* 2-Line Description with Inline Diagnostic Mark (Questly structure) */}
        <p className="mt-5 text-sm sm:text-base text-[#7a8078] max-w-xl mx-auto leading-relaxed flex items-center justify-center flex-wrap gap-1.5">
          <span>Inspect observable DOM conditions against 9 conversion signals</span>
          <span className="inline-flex items-center gap-1 text-[#e8ebe7] font-medium">
            <NebulaMark size={14} />
            with inspectable evidence
          </span>
          <span>before spending more on ads.</span>
        </p>

        {/* Dual Action Group */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <a
            href="#audit"
            className="inline-flex items-center gap-2 rounded-full bg-[#c7ff2f] px-6 py-2.5 text-xs sm:text-sm font-semibold text-[#080909] shadow-sm hover:bg-[#b5eb25] hover:shadow-[0_0_24px_rgba(199,255,47,0.3)] transition-all"
          >
            <span>Run Free Audit</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href="#teardowns"
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs sm:text-sm font-medium text-[#e8ebe7] ring-1 ring-[#1f2422] bg-[#131615]/50 hover:bg-[#131615] hover:ring-white/20 transition-all"
          >
            <span>Explore Teardowns</span>
          </a>
        </div>

        {/* Diagnostic Trust Signals Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-mono text-[#525750]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-[#c7ff2f]" />
            <span>Inspectable findings</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[#c7ff2f]" />
            <span>Preserved DOM evidence</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#c7ff2f]" />
            <span>$97 One-Leak Sprint option</span>
          </div>
        </div>
      </div>

      {/* Flexible spacer */}
      <div className="flex-1 min-h-8 sm:min-h-12 lg:min-h-16 shrink-0" />

      {/* 4. Bottom Docked Dashboard Mockup & Diagnostic Horizon */}
      <div className="relative z-10 w-full overflow-visible -mb-10 sm:-mb-20 lg:-mb-32">
        <ScaledDashboard />
      </div>

      {/* 5. Unique Signal Horizon Foreground Overlay Layer */}
      <SignalHorizon />
    </section>
  );
};

export default Hero;
