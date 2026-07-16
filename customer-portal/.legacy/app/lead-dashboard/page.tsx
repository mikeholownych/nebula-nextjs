'use client';

import { useEffect, useState } from 'react';

interface LeadStats {
  total_leads: number;
  active_leads: number;
  non_customer_count: number;
  opted_out_count: number;
  by_stage: Record<string, number>;
  by_stage_labels: Record<string, string>;
}

export default function LeadDashboard() {
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [error, setError] = useState(false);
  const [exportStage, setExportStage] = useState('all');

  const loadStats = async () => {
    try {
      const resp = await fetch('/api/leads/stats');
      const data = await resp.json();
      setStats(data);
      setError(false);
    } catch {
      setError(true);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const exportCSV = (stage?: string) => {
    const s = stage || exportStage;
    const query = s === 'all' ? '' : '?stage=' + s;
    window.open('/api/leads/export' + query, '_blank');
  };

  const stageClassMap: Record<string, string> = {
    lead_free_kit: 'stage-free_kit',
    lead_audit: 'stage-audit',
    lead_warm: 'stage-warm',
    customer_97: 'stage-97',
    customer_997: 'stage-997',
    customer_197: 'stage-197',
    sdr: 'stage-sdr',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-[Inter,sans-serif]">
      <div className="max-w-[960px] mx-auto px-5 py-8 pb-20">
        {/* Header */}
        <header className="border-b border-[#1e1e2e] pb-5 mb-8 flex justify-between items-center">
          <a href="/" className="text-[#6366f1] font-bold text-sm tracking-widest uppercase no-underline">
            Nebula Components
          </a>
          <nav className="flex gap-4">
            <a href="/" className="text-[#64748b] text-[13px] no-underline hover:text-[#e2e8f0]">Home</a>
            <a href="/checkout" className="text-[#64748b] text-[13px] no-underline hover:text-[#e2e8f0]">Checkout</a>
          </nav>
        </header>

        {/* Title */}
        <h1 className="text-2xl font-extrabold text-[#f8fafc] mb-2">Lead Segmentation Dashboard</h1>
        <p className="text-[#94a3b8] text-sm mb-8">
          Mailing list broken down by buyer stage.{' '}
          <button onClick={loadStats} className="text-[#64748b] text-sm cursor-pointer hover:text-[#e2e8f0]">
            ↻ Refresh
          </button>
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-3 mb-8 max-sm:grid-cols-2">
          <div className="bg-[#12121c] border border-[#6366f1] rounded-xl p-5 text-center">
            <div className={`text-3xl font-extrabold ${error ? 'text-red-500' : 'text-[#6366f1]'}`}>
              {error ? 'Error' : stats?.total_leads ?? '-'}
            </div>
            <div className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mt-1">Total Leads</div>
          </div>
          <div className="bg-[#12121c] border border-[#22c55e] rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-[#22c55e]">{stats?.active_leads ?? '-'}</div>
            <div className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mt-1">Active</div>
          </div>
          <div className="bg-[#12121c] border border-[#f59e0b] rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-[#f59e0b]">{stats?.non_customer_count ?? '-'}</div>
            <div className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mt-1">Non-Customers</div>
          </div>
          <div className="bg-[#12121c] border border-[#ef4444] rounded-xl p-5 text-center">
            <div className="text-3xl font-extrabold text-[#ef4444]">{stats?.opted_out_count ?? '-'}</div>
            <div className="text-xs text-[#64748b] uppercase tracking-wider font-semibold mt-1">Opted Out</div>
          </div>
        </div>

        {/* Stage Table */}
        <table className="w-full border-collapse bg-[#12121c] border border-[#1e1e2e] rounded-xl overflow-hidden mb-6">
          <thead>
            <tr>
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#0d1117] border-b border-[#1e1e2e]">Stage</th>
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#0d1117] border-b border-[#1e1e2e]">Count</th>
              <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-[#64748b] bg-[#0d1117] border-b border-[#1e1e2e]">Action</th>
            </tr>
          </thead>
          <tbody>
            {stats?.by_stage && Object.entries(stats.by_stage).map(([stage, count]) => {
              const label = stats.by_stage_labels?.[stage] || stage;
              const cls = stageClassMap[stage] || '';
              return (
                <tr key={stage} className={`${cls} border-b border-[#1a1a2a] last:border-b-0`}>
                  <td className="py-3 px-4 text-sm">{label}</td>
                  <td className="py-3 px-4 text-sm font-bold text-center">{count}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => exportCSV(stage)}
                      className="text-[#818cf8] text-xs no-underline hover:underline bg-transparent border-none cursor-pointer"
                    >
                      Export
                    </button>
                  </td>
                </tr>
              );
            })}
            {!stats && !error && (
              <tr>
                <td colSpan={3} className="py-4 px-4 text-[#64748b] text-sm">Loading...</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Export Bar */}
        <div className="flex flex-wrap gap-3 items-center bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5 mb-6">
          <span className="text-[#94a3b8] text-sm">Export segment:</span>
          <select
            value={exportStage}
            onChange={(e) => setExportStage(e.target.value)}
            className="bg-[#0d1117] text-[#e2e8f0] border border-[#2d2d4e] rounded-lg py-2.5 px-4 text-sm font-[Inter,sans-serif]"
          >
            <option value="all">All leads</option>
            <option value="active">Active leads</option>
            <option value="non_customer">Non-customers (upsell)</option>
            <option value="lead_free_kit">Free kit only</option>
            <option value="lead_audit">Ran audit</option>
            <option value="lead_warm">Warm</option>
            <option value="customer_97">$147 customers</option>
            <option value="customer_997">$997 customers</option>
          </select>
          <button
            onClick={() => exportCSV()}
            className="bg-[#6366f1] text-white font-semibold py-2.5 px-4 text-sm rounded-lg border-none cursor-pointer hover:bg-[#5254cc]"
          >
            Download CSV ↓
          </button>
        </div>

        {/* Recent Opt-outs */}
        <div className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5">
          <h3 className="text-sm font-bold text-[#f1f5f9] mb-2">Recent Opt-Outs</h3>
          <ul className="list-none mt-3">
            {stats ? (
              <li className="py-2 px-3 text-[#94a3b8] text-sm border-b border-[#1a1a2a] last:border-b-0">
                {stats.opted_out_count} lead(s) opted out.{' '}
                <a href="/api/leads/export?stage=all" className="text-[#818cf8]">Full CSV</a> has details.
              </li>
            ) : (
              <li className="py-2 px-3 text-[#64748b] text-sm">Load stats to see...</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
