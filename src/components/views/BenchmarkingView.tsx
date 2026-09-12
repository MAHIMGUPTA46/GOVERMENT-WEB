import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Building2, CheckCircle2 } from 'lucide-react';
import { SectorRiskChart } from '../charts/SectorRiskChart';

interface SectorBenchmark {
  sector: string;
  agency: string;
  totalProjects: number;
  totalCostCr: number;
  costOverrunPct: number;
  avgDelayMonths: number;
  onTimeRatioPct: number;
  criticalCount: number;
}

const BENCHMARKS: SectorBenchmark[] = [
  {
    sector: 'Road Transport & Highways',
    agency: 'NHAI / MoRTH',
    totalProjects: 785,
    totalCostCr: 845200,
    costOverrunPct: 11.7,
    avgDelayMonths: 22.4,
    onTimeRatioPct: 62.4,
    criticalCount: 14,
  },
  {
    sector: 'Railways',
    agency: 'Indian Railways / RVNL / IRCON',
    totalProjects: 248,
    totalCostCr: 689400,
    costOverrunPct: 28.5,
    avgDelayMonths: 48.6,
    onTimeRatioPct: 38.2,
    criticalCount: 16,
  },
  {
    sector: 'Petroleum & Natural Gas',
    agency: 'IOCL / ONGC / GAIL',
    totalProjects: 142,
    totalCostCr: 412500,
    costOverrunPct: 11.5,
    avgDelayMonths: 18.2,
    onTimeRatioPct: 74.5,
    criticalCount: 2,
  },
  {
    sector: 'Power & Renewable Energy',
    agency: 'NTPC / PowerGrid / NHPC',
    totalProjects: 116,
    totalCostCr: 395000,
    costOverrunPct: 24.0,
    avgDelayMonths: 34.1,
    onTimeRatioPct: 58.6,
    criticalCount: 5,
  },
  {
    sector: 'Urban Development & Metro',
    agency: 'DMRC / MMRDA / BMRCL',
    totalProjects: 94,
    totalCostCr: 312000,
    costOverrunPct: 19.4,
    avgDelayMonths: 26.5,
    onTimeRatioPct: 66.0,
    criticalCount: 3,
  },
  {
    sector: 'Water Resources (Jal Shakti)',
    agency: 'CWC / State Irrigation Depts',
    totalProjects: 68,
    totalCostCr: 185600,
    costOverrunPct: 75.6,
    avgDelayMonths: 84.2,
    onTimeRatioPct: 22.1,
    criticalCount: 2,
  },
];

export const BenchmarkingView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-700" />
          Sectoral Execution & Agency Benchmarking
        </h2>
        <p className="text-xs text-slate-500">
          Comparative efficiency analysis across major infrastructure portfolios and implementing agencies
        </p>
      </div>

      <SectorRiskChart
        title="Comprehensive Sector Risk Profile"
        subtitle="Comparing volume and severity distribution across top central portfolios"
      />

      {/* Sector Comparative Matrix Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Sector Efficiency Matrix (MoSPI IPMD Analytics)
          </h3>
          <span className="text-xs text-slate-500">
            1,453 Core Projects Evaluated
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#0B1F3A] text-slate-200 uppercase text-[10px] font-semibold">
              <tr>
                <th className="p-3">Sector & Lead Agency</th>
                <th className="p-3 text-right">Projects</th>
                <th className="p-3 text-right">Outlay (₹ Cr)</th>
                <th className="p-3 text-right">Cost Escalation</th>
                <th className="p-3 text-right">Avg Delay</th>
                <th className="p-3 text-right">On-Time Ratio</th>
                <th className="p-3 text-center">Critical Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-mono text-xs">
              {BENCHMARKS.map((b) => (
                <tr key={b.sector} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-sans">
                    <div className="font-bold text-slate-900">{b.sector}</div>
                    <div className="text-[11px] text-slate-500">{b.agency}</div>
                  </td>
                  <td className="p-3 text-right text-slate-800">{b.totalProjects}</td>
                  <td className="p-3 text-right font-bold text-slate-900">
                    ₹{b.totalCostCr.toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-bold ${
                    b.costOverrunPct > 25 ? 'text-rose-600' : 'text-amber-700'
                  }`}>
                    +{b.costOverrunPct}%
                  </td>
                  <td className="p-3 text-right text-slate-800">{b.avgDelayMonths} mos</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      b.onTimeRatioPct > 60 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {b.onTimeRatioPct}%
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {b.criticalCount > 0 ? (
                      <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-xs">
                        {b.criticalCount} projects
                      </span>
                    ) : (
                      <span className="text-emerald-700 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
