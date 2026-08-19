import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Menu, X, ArrowUpRight, Sparkles } from 'lucide-react';
import { NebulaLogo } from './NebulaLogo';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diagnosticsDropdownOpen, setDiagnosticsDropdownOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
        setDiagnosticsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setDiagnosticsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header
      ref={navRef}
      className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6"
    >
      <div className="flex h-14 items-center justify-between rounded-full bg-[#0d0f0e]/85 backdrop-blur-md border border-[#1f2422] px-4 sm:px-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)]">
        {/* Left: Brand Logo */}
        <a
          href="/"
          className="group flex items-center gap-2 text-inherit no-underline transition-opacity hover:opacity-90"
          aria-label="Nebula Components Home"
        >
          <NebulaLogo />
        </a>

        {/* Center: Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-6 text-sm text-[#7a8078]"
          aria-label="Main Navigation"
        >
          {/* Diagnostics Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDiagnosticsDropdownOpen(!diagnosticsDropdownOpen)}
              className="flex items-center gap-1.5 hover:text-[#e8ebe7] transition-colors focus:outline-none focus-visible:text-[#c7ff2f]"
              aria-expanded={diagnosticsDropdownOpen}
            >
              <span>Diagnostics</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform duration-200 ${
                  diagnosticsDropdownOpen ? 'rotate-180 text-[#c7ff2f]' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {diagnosticsDropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-56 rounded-xl bg-[#131615] border border-[#1f2422] p-2 shadow-2xl animate-fade-down z-50">
                <a
                  href="#signals"
                  onClick={() => setDiagnosticsDropdownOpen(false)}
                  className="block rounded-lg px-3 py-2 text-xs text-[#e8ebe7] hover:bg-[#191c1a] hover:text-[#c7ff2f] transition-colors"
                >
                  <p className="font-medium">9 Governed Signals</p>
                  <p className="text-[11px] text-[#7a8078]">
                    Inspectable signal definitions
                  </p>
                </a>
                <a
                  href="#priority-model"
                  onClick={() => setDiagnosticsDropdownOpen(false)}
                  className="block rounded-lg px-3 py-2 text-xs text-[#e8ebe7] hover:bg-[#191c1a] hover:text-[#c7ff2f] transition-colors"
                >
                  <p className="font-medium">Priority Score Heuristic</p>
                  <p className="text-[11px] text-[#7a8078]">
                    Deterministic condition ranking
                  </p>
                </a>
                <a
                  href="#teardowns"
                  onClick={() => setDiagnosticsDropdownOpen(false)}
                  className="block rounded-lg px-3 py-2 text-xs text-[#e8ebe7] hover:bg-[#191c1a] hover:text-[#c7ff2f] transition-colors"
                >
                  <p className="font-medium">SaaS Teardowns</p>
                  <p className="text-[11px] text-[#7a8078]">
                    Real DOM diagnostic evaluations
                  </p>
                </a>
              </div>
            )}
          </div>

          <a
            href="#benchmarks"
            className="hover:text-[#e8ebe7] transition-colors"
          >
            Benchmarks
          </a>

          <a
            href="#repair-sprints"
            className="hover:text-[#e8ebe7] transition-colors flex items-center gap-1"
          >
            <span>Repair Sprints</span>
            <span className="rounded bg-[#c7ff2f]/10 text-[#c7ff2f] px-1.5 py-0.2 text-[10px] font-mono">
              $97
            </span>
          </a>

          <a
            href="#pricing"
            className="hover:text-[#e8ebe7] transition-colors"
          >
            Pricing
          </a>
        </nav>

        {/* Right: Primary CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <a
            href="#audit"
            className="hidden sm:inline-flex items-center gap-2 rounded-full bg-[#c7ff2f] px-4 py-2 text-xs font-semibold text-[#080909] shadow-sm hover:bg-[#b5eb25] hover:shadow-[0_0_20px_rgba(199,255,47,0.3)] transition-all"
          >
            <span>Audit Landing Page</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </a>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#7a8078] hover:text-[#e8ebe7] focus:outline-none"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-2xl bg-[#0d0f0e]/95 backdrop-blur-xl border border-[#1f2422] p-4 shadow-2xl animate-fade-down">
          <nav className="flex flex-col gap-3 text-sm">
            <a
              href="#signals"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#e8ebe7] hover:bg-[#131615] flex items-center justify-between"
            >
              <span>9 Governed Signals</span>
              <span className="text-xs font-mono text-[#c7ff2f]">Active</span>
            </a>
            <a
              href="#benchmarks"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#e8ebe7] hover:bg-[#131615]"
            >
              Benchmarks
            </a>
            <a
              href="#repair-sprints"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#e8ebe7] hover:bg-[#131615] flex items-center justify-between"
            >
              <span>One-Leak Repair Sprint</span>
              <span className="text-xs font-mono text-[#c7ff2f]">$97</span>
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-[#e8ebe7] hover:bg-[#131615]"
            >
              Pricing
            </a>
            <div className="pt-2 border-t border-[#1f2422]">
              <a
                href="#audit"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#c7ff2f] py-2.5 text-xs font-semibold text-[#080909]"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Audit Landing Page Free</span>
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
