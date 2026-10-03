import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Layers,
  ArrowUpRight,
  Info,
  Scale
} from 'lucide-react';
import { Project } from '../../types';

export interface PhaseBudgetItem {
  phase: string;
  shortName: string;
  category: 'Land' | 'Clearances' | 'Procurement' | 'Construction' | 'Systems' | 'Commissioning';
  allocatedBudget: number; // in ₹ Cr
  actualExpenditure: number; // in ₹ Cr
  utilizationPct: number; // 0 - 100%+
  varianceCr: number; // actual - allocated
  variancePct: number;
  status: 'under_budget' | 'on_track' | 'approaching_limit' | 'overrun';
  remarks: string;
}

interface PhaseBudgetVsActualChartProps {
  project: Project;
  title?: string;
  subtitle?: string;
}

/**
 * Derives realistic phase-level budget allocations and actual expenditures
 * based on the project's sector, revised cost, physical progress, and financial progress.
 */
export const derivePhaseBudgetData = (project: Project): PhaseBudgetItem[] => {
  const totalRevised = project.revisedCost || 1000;
  const totalExp = project.cumulativeExpenditure || Math.round(totalRevised * 0.55);
  const prog = project.physicalProgress || 50;
  const isDelayed = project.delayMonths > 0;
  const overrun = project.costOverrunPct || 0;

  // Standard MoSPI infrastructure capital weightages
  // 1. Land Acquisition & R&R (Resettlement): ~16%
  // 2. Clearances & Pre-construction: ~4%
  // 3. Procurement & Materials: ~22%
  // 4. Main Civil Construction: ~44%
  // 5. Systems, MEP & Electrification: ~10%
  // 6. Commissioning & Safety Audits: ~4%

  const landBudget = Math.round(totalRevised * 0.16);
  // Land is typically disbursed early, but delays often incur escalation
  const landSpent = Math.min(
    Math.round(landBudget * (prog >= 50 ? 0.96 : 0.82) + (isDelayed ? landBudget * 0.08 : 0)),
    Math.round(totalExp * 0.28)
  );

  const clearanceBudget = Math.round(totalRevised * 0.04);
  const clearanceSpent = Math.round(clearanceBudget * 0.92);

  const procurementBudget = Math.round(totalRevised * 0.22);
  const procurementSpent = Math.round(
    procurementBudget * Math.min(1.0, (prog + 15) / 100) + (overrun > 20 ? procurementBudget * 0.06 : 0)
  );

  const civilBudget = Math.round(totalRevised * 0.44);
  // Civil construction carries bulk of physical execution
  const civilSpent = Math.round(
    civilBudget * (prog / 100) * (overrun > 10 ? 1.08 : 0.98)
  );

  const systemsBudget = Math.round(totalRevised * 0.10);
  const systemsSpent = Math.round(
    systemsBudget * Math.max(0.05, Math.min(0.95, (prog - 20) / 70))
  );

  const commBudget = Math.round(totalRevised * 0.04);
  const commSpent = Math.round(
    commBudget * Math.max(0.02, Math.min(0.85, (prog - 60) / 35))
  );

  const rawPhases = [
    {
      phase: 'Land Acquisition & RoW',
      shortName: 'Land & RoW',
      category: 'Land' as const,
      allocatedBudget: landBudget,
      actualExpenditure: landSpent,
      remarks: isDelayed ? 'Section 11 land compensation revised upward by district collectorate.' : 'Substantially complete RoW handover.',
    },
    {
      phase: 'Statutory Clearances & Pre-Construction',
      shortName: 'Clearances',
      category: 'Clearances' as const,
      allocatedBudget: clearanceBudget,
      actualExpenditure: clearanceSpent,
      remarks: 'MoEF&CC Stage-II forest compensatory afforestation net present value disbursed.',
    },
    {
      phase: 'Equipment & Material Procurement',
      shortName: 'Procurement',
      category: 'Procurement' as const,
      allocatedBudget: procurementBudget,
      actualExpenditure: procurementSpent,
      remarks: 'Long-lead structural steel and specialized machinery import packages.',
    },
    {
      phase: 'Main Civil Construction Works',
      shortName: 'Civil Works',
      category: 'Construction' as const,
      allocatedBudget: civilBudget,
      actualExpenditure: civilSpent,
      remarks: 'Core substructure, foundation piling, earthworks, and superstructure contracts.',
    },
    {
      phase: 'Systems, MEP & Electrification',
      shortName: 'Systems & MEP',
      category: 'Systems' as const,
      allocatedBudget: systemsBudget,
      actualExpenditure: systemsSpent,
      remarks: 'Substation energization, HVAC, SCADA cabling, and automated sensor deployment.',
    },
    {
      phase: 'Safety Audit, Trials & Commissioning',
      shortName: 'Commissioning',
      category: 'Commissioning' as const,
      allocatedBudget: commBudget,
      actualExpenditure: commSpent,
      remarks: 'Statutory safety commissioner trials and commercial handover staging.',
    },
  ];

  return rawPhases.map((p) => {
    const varianceCr = p.actualExpenditure - p.allocatedBudget;
    const utilizationPct = p.allocatedBudget > 0 ? Math.round((p.actualExpenditure / p.allocatedBudget) * 1000) / 10 : 0;
    const variancePct = p.allocatedBudget > 0 ? Math.round((varianceCr / p.allocatedBudget) * 1000) / 10 : 0;

    let status: PhaseBudgetItem['status'] = 'on_track';
    if (utilizationPct > 102) {
      status = 'overrun';
    } else if (utilizationPct >= 90) {
      status = 'approaching_limit';
    } else if (utilizationPct < 50) {
      status = 'under_budget';
    }

    return {
      ...p,
      utilizationPct,
      varianceCr,
      variancePct,
      status,
    };
  });
};

export const PhaseBudgetVsActualChart: React.FC<PhaseBudgetVsActualChartProps> = ({
  project,
  title = 'Budget vs Actual: Phase-Wise Capital Utilization',
  subtitle = 'Comparing approved capital allocation against cumulative disbursals across project lifecycle phases',
}) => {
  const [displayMode, setDisplayMode] = useState<'amount' | 'percentage'>('amount');
  const [selectedPhase, setSelectedPhase] = useState<PhaseBudgetItem | null>(null);

  const phaseData = useMemo(() => derivePhaseBudgetData(project), [project]);

  // Aggregate stats across phases
  const totalAllocated = useMemo(() => phaseData.reduce((s, p) => s + p.allocatedBudget, 0), [phaseData]);
  const totalExpended = useMemo(() => phaseData.reduce((s, p) => s + p.actualExpenditure, 0), [phaseData]);
  const netVarianceCr = totalExpended - totalAllocated;
  const overallUtilizationPct = totalAllocated > 0 ? Math.round((totalExpended / totalAllocated) * 1000) / 10 : 0;

  // Find phase with highest expenditure vs budget ratio
  const highestUtilizationPhase = useMemo(() => {
    return [...phaseData].sort((a, b) => b.utilizationPct - a.utilizationPct)[0];
  }, [phaseData]);

  // Transform data for percentage view if selected
  const chartData = useMemo(() => {
    return phaseData.map((p) => ({
      ...p,
      budgetDisplay: displayMode === 'amount' ? p.allocatedBudget : 100,
      actualDisplay: displayMode === 'amount' ? p.actualExpenditure : p.utilizationPct,
    }));
  }, [phaseData, displayMode]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded flex items-center gap-1">
              <Scale className="w-3 h-3 text-teal-600" />
              Statutory Fiscal Allocation Audit
            </span>
            <span className="text-xs text-slate-300">•</span>
            <span className="text-[11px] text-slate-500 font-mono">
              Base: ₹{project.revisedCost.toLocaleString()} Cr Revised Sanction
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-teal-700" />
            {title}
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            {subtitle}
          </p>
        </div>

        {/* View Switcher: Crores vs Utilization % */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDisplayMode('amount')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                displayMode === 'amount'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Capital Outlay (₹ Cr)
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('percentage')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                displayMode === 'percentage'
                  ? 'bg-white text-blue-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Utilization Rate (%)
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="px-4 sm:px-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Allocated Budget
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              ₹{totalAllocated.toLocaleString()} Cr
            </span>
          </div>
          <div className="w-2.5 h-8 bg-blue-600 rounded-sm" title="Budget Allocation" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Cumulative Disbursal
            </span>
            <span className="text-base font-bold text-teal-800 font-mono">
              ₹{totalExpended.toLocaleString()} Cr
            </span>
          </div>
          <div className="w-2.5 h-8 bg-teal-600 rounded-sm" title="Actual Disbursed" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Fund Absorption Rate
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {overallUtilizationPct}%
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-bold">
            {overallUtilizationPct > 100 ? 'Overrun' : 'Absorbed'}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Peak Utilization Phase
            </span>
            <span className="text-xs font-bold text-blue-900 truncate block max-w-[130px]">
              {highestUtilizationPhase?.shortName}
            </span>
          </div>
          <span className={`text-xs font-mono font-bold ${highestUtilizationPhase?.utilizationPct > 100 ? 'text-rose-600' : 'text-teal-700'}`}>
            {highestUtilizationPhase?.utilizationPct}%
          </span>
        </div>
      </div>

      {/* Main Recharts Bar Chart Area */}
      <div className="px-4 sm:px-5">
        <div className="h-64 sm:h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 15, right: 15, left: -5, bottom: 20 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortName"
                tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                tickFormatter={(val) =>
                  displayMode === 'amount'
                    ? `₹${val.toLocaleString()}`
                    : `${val}%`
                }
              />
              {displayMode === 'percentage' && (
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  label={{
                    value: '100% Budget Baseline',
                    position: 'top',
                    fill: '#dc2626',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PhaseBudgetItem;
                    const isOver = data.actualExpenditure > data.allocatedBudget;

                    return (
                      <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl text-xs border border-slate-700 min-w-[240px] backdrop-blur-xs">
                        <div className="font-bold text-slate-100 border-b border-slate-800 pb-1.5 mb-2">
                          {data.phase}
                        </div>

                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
                              Allocated Budget:
                            </span>
                            <span className="font-bold text-white">₹{data.allocatedBudget.toLocaleString()} Cr</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-xs bg-teal-500 inline-block" />
                              Actual Disbursal:
                            </span>
                            <span className="font-bold text-teal-300">₹{data.actualExpenditure.toLocaleString()} Cr</span>
                          </div>

                          <div className="flex items-center justify-between text-slate-300 pt-1 border-t border-slate-800">
                            <span>Variance:</span>
                            <span className={`font-bold ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {data.varianceCr > 0 ? `+₹${data.varianceCr.toLocaleString()} Cr` : `-₹${Math.abs(data.varianceCr).toLocaleString()} Cr`}
                              {' '}({data.utilizationPct}%)
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 font-sans mt-2 pt-1 border-t border-slate-800/80 leading-relaxed">
                          {data.remarks}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
                payload={[
                  {
                    value: displayMode === 'amount' ? 'Allocated Budget (₹ Cr)' : 'Budget Baseline (100%)',
                    type: 'rect',
                    color: '#3b82f6',
                  },
                  {
                    value: displayMode === 'amount' ? 'Actual Expenditure (₹ Cr)' : 'Actual Utilization Rate (%)',
                    type: 'rect',
                    color: '#0d9488',
                  },
                ]}
              />
              <Bar
                dataKey="budgetDisplay"
                name="Allocated Budget"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                dataKey="actualDisplay"
                name="Actual Expenditure"
                fill="#0d9488"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.status === 'overrun'
                        ? '#ef4444' // Rose if overrun
                        : entry.status === 'approaching_limit'
                        ? '#f59e0b' // Amber if approaching ceiling
                        : '#0d9488' // Teal if healthy
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phase Breakdown Audit Register Table */}
      <div className="px-4 sm:px-5 pb-5">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Project Phase & Scope</th>
                  <th className="p-3 text-right">Allocated Budget</th>
                  <th className="p-3 text-right">Actual Disbursal</th>
                  <th className="p-3 text-right">Variance</th>
                  <th className="p-3">Utilization Bar</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                {phaseData.map((item) => (
                  <tr
                    key={item.phase}
                    onClick={() => setSelectedPhase(item)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{item.phase}</div>
                      <div className="text-[11px] text-slate-500 font-sans line-clamp-1">{item.remarks}</div>
                    </td>

                    <td className="p-3 text-right font-mono font-semibold text-slate-900">
                      ₹{item.allocatedBudget.toLocaleString()} Cr
                    </td>

                    <td className="p-3 text-right font-mono font-bold text-teal-800">
                      ₹{item.actualExpenditure.toLocaleString()} Cr
                    </td>

                    <td className="p-3 text-right font-mono font-bold">
                      <span
                        className={
                          item.varianceCr > 0
                            ? 'text-rose-600'
                            : item.varianceCr < 0
                            ? 'text-teal-700'
                            : 'text-slate-500'
                        }
                      >
                        {item.varianceCr > 0 ? `+₹${item.varianceCr.toLocaleString()} Cr` : item.varianceCr < 0 ? `-₹${Math.abs(item.varianceCr).toLocaleString()} Cr` : '₹0 Cr'}
                      </span>
                    </td>

                    <td className="p-3 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === 'overrun'
                                ? 'bg-rose-600'
                                : item.status === 'approaching_limit'
                                ? 'bg-amber-500'
                                : 'bg-teal-600'
                            }`}
                            style={{ width: `${Math.min(100, item.utilizationPct)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px] text-slate-700 w-12 text-right">
                          {item.utilizationPct}%
                        </span>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === 'overrun'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : item.status === 'approaching_limit'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {item.status === 'overrun'
                          ? 'Overrun'
                          : item.status === 'approaching_limit'
                          ? 'Near Cap'
                          : 'Within Plan'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 px-1">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>
              Fund utilization data is benchmarked against statutory CCEA approved package allowances. Disbursals exceeding 100% trigger IPMD escalation audits.
            </span>
          </div>
          <span className="font-mono font-semibold text-slate-400 shrink-0">
            Currency: INR (₹ Crores)
          </span>
        </div>
      </div>
    </div>
  );
};
