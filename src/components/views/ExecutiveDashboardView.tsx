import React from 'react';
import { 
  FolderKanban, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  ArrowUpRight, 
  CheckCircle2, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  MapPin
} from 'lucide-react';
import { Project, Alert } from '../../types';
import { RiskBadge } from '../RiskBadge';
import { StatusBadge } from '../StatusBadge';
import { DataQualityBadge } from '../DataQualityBadge';
import { CostComparisonChart } from '../charts/CostComparisonChart';
import { RiskMatrixScatter } from '../charts/RiskMatrixScatter';
import { SectorRiskChart } from '../charts/SectorRiskChart';

interface ExecutiveDashboardViewProps {
  projects: Project[];
  alerts: Alert[];
  onSelectProject: (id: string) => void;
  onNavigateTab: (tab: any) => void;
  reportingMonth: string;
}

export const ExecutiveDashboardView: React.FC<ExecutiveDashboardViewProps> = ({
  projects,
  alerts,
  onSelectProject,
  onNavigateTab,
  reportingMonth,
}) => {
  const criticalProjects = projects.filter((p) => p.riskLevel === 'critical');
  const delayedProjects = projects.filter((p) => p.delayMonths > 0);
  const overrunProjects = projects.filter((p) => p.costOverrunPct > 0);

  const totalOriginalCr = 2756400; // ₹27.56 Lakh Cr
  const totalRevisedCr = 3218900;  // ₹32.18 Lakh Cr
  const totalSpentCr = 1689200;    // ₹16.89 Lakh Cr
  const aggregateOverrunPct = ((totalRevisedCr - totalOriginalCr) / totalOriginalCr) * 100;

  return (
    <div className="space-y-6">
      {/* Executive Policymaker Summary Banner */}
      <div className="bg-gradient-to-r from-[#0B1F3A] via-[#102a4e] to-[#153e70] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-15 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                Executive Briefing · {reportingMonth}
              </span>
              <span className="text-[11px] text-slate-300">
                1,981 Monitored Central Sector Projects (≥ ₹150 Cr)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              National Infrastructure Execution & Predictive Risk Portfolio
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              ML early warning models identify <strong className="text-amber-300">43 projects under critical slippage risk</strong>, with an anticipated systemic lead time advantage of <strong>5.4 months</strong> prior to contractual default.
            </p>
          </div>

          {/* Quick Cabinet Action Pill */}
          <div className="flex items-center gap-3 bg-blue-950/80 border border-blue-800/80 p-3.5 rounded-xl shrink-0 backdrop-blur-xs">
            <ShieldAlert className="w-8 h-8 text-rose-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Cabinet Attention Required
              </div>
              <div className="text-base font-bold font-mono text-white">
                43 Critical Projects
              </div>
              <button
                onClick={() => onNavigateTab('alerts')}
                className="text-[11px] text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1 mt-0.5"
              >
                <span>View Early Warnings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('map')}
                className="text-[11px] text-blue-200 hover:text-white font-medium flex items-center gap-1 mt-1 cursor-pointer"
              >
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Geospatial Map (Kanpur)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Portfolio Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Capital Outlay */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Total Revised Capital Outlay
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-slate-900">
                  ₹32.19
                </span>
                <span className="text-xs font-semibold text-slate-500">Lakh Cr</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Original: ₹27.56 Lakh Cr</span>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              +{aggregateOverrunPct.toFixed(1)}% (+₹4.62L Cr)
            </span>
          </div>
        </div>

        {/* Metric 2: Delayed Projects */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Delayed Projects
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-amber-700">
                  824
                </span>
                <span className="text-xs font-semibold text-slate-500">/ 1,981 (41.6%)</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Mean Delay: 36.4 Months</span>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              Max: 264 Months
            </span>
          </div>
        </div>

        {/* Metric 3: Cumulative Expenditure */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Cumulative Disbursal
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-teal-700">
                  ₹16.89
                </span>
                <span className="text-xs font-semibold text-slate-500">Lakh Cr</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Fund Absorption:</span>
            <span className="font-mono font-bold text-teal-800">
              52.5% of Revised Outlay
            </span>
          </div>
        </div>

        {/* Metric 4: Predictive Model Lead Time */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                ML Early Warning Lead Time
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-black font-mono text-blue-700">
                  5.4
                </span>
                <span className="text-xs font-semibold text-slate-500">Months Lead</span>
              </div>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Model ROC-AUC: 0.892</span>
            <span className="text-[11px] font-mono text-emerald-700 font-bold">
              XGBoost v2.4
            </span>
          </div>
        </div>
      </div>

      {/* Primary Analytics Visuals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Risk Matrix Scatter */}
        <div className="lg:col-span-7 space-y-6">
          <RiskMatrixScatter
            projects={projects}
            onSelectProject={onSelectProject}
            title="Executive Risk Matrix: Cost Escalation vs Time Slippage"
            subtitle="Plotting monitored projects. Red cluster (top-right) indicates severe cabinet priority."
          />

          {/* Aggregate Capital Comparison */}
          <CostComparisonChart
            originalCost={27.56}
            revisedCost={32.19}
            expenditure={16.89}
            unit="₹ Lakh Cr"
            title="National Capital Outlay & Disbursal Progression"
            subtitle="Comparing Sanctioned Baseline against Current Estimates and Disbursed Capital"
          />
        </div>

        {/* Right 5 Columns: Sector Risk Distribution & Urgent Projects */}
        <div className="lg:col-span-5 space-y-6">
          <SectorRiskChart
            title="Sectoral Project Exposure & Risk Tiers"
            subtitle="Breakdown of monitored projects by sector and risk classification"
          />

          {/* Urgent Projects Watchlist Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Top Urgent Projects Requiring Review
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('projects')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {criticalProjects.slice(0, 4).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => onSelectProject(proj.id)}
                  className="py-2.5 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-mono font-bold text-xs text-blue-800">
                      [{proj.projectCode}]
                    </span>
                    <div className="flex items-center gap-1.5">
                      {proj.missingMandatoryFields && proj.missingMandatoryFields.length > 0 && (
                        <DataQualityBadge
                          score={proj.dataQualityScore}
                          missingMandatoryFields={proj.missingMandatoryFields}
                          issues={proj.dataQualityIssues}
                          size="xs"
                        />
                      )}
                      <RiskBadge level={proj.riskLevel} score={proj.riskScore} size="sm" />
                    </div>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 line-clamp-1">
                    {proj.name}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                    <span>Delay: {proj.delayMonths} mos</span>
                    <span className="text-rose-600 font-bold">+{proj.costOverrunPct.toFixed(1)}% esc.</span>
                    <span>₹{proj.revisedCost.toLocaleString()} Cr</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
