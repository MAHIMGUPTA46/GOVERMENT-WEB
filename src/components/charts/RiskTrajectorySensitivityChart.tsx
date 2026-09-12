import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Sliders, 
  Layers, 
  Clock, 
  AlertTriangle, 
  Info,
  Maximize2
} from 'lucide-react';
import { Project } from '../../types';

interface RiskTrajectorySensitivityChartProps {
  project?: Project | null;
  baselineScore: number;
  simulatedScore: number;
  landDelayMonths: number;
  fundingAvailabilityPct: number;
  clearanceLagMonths: number;
  contractorCapacityPct: number;
  materialInflationPct: number;
}

export const RiskTrajectorySensitivityChart: React.FC<RiskTrajectorySensitivityChartProps> = ({
  project,
  baselineScore,
  simulatedScore,
  landDelayMonths,
  fundingAvailabilityPct,
  clearanceLagMonths,
  contractorCapacityPct,
  materialInflationPct,
}) => {
  const [chartMode, setChartMode] = useState<'trajectory' | 'tornado'>('trajectory');

  // Month labels starting from current month (Oct 2026) to 12 months ahead (Oct 2027)
  const monthLabels = [
    'Current (T+0)',
    'T+1 (Nov 26)',
    'T+2 (Dec 26)',
    'T+3 (Jan 27)',
    'T+4 (Feb 27)',
    'T+5 (Mar 27)',
    'T+6 (Apr 27)',
    'T+7 (May 27)',
    'T+8 (Jun 27)',
    'T+9 (Jul 27)',
    'T+10 (Aug 27)',
    'T+11 (Sep 27)',
    'T+12 (Oct 27)',
  ];

  // Calculate 12-month forward risk trajectory based on current simulation variables
  const trajectoryData = useMemo(() => {
    const scoreShift = simulatedScore - baselineScore;
    
    // Growth factor per month based on land delay & funding deficit
    // Land delays compound as contractors idle; funding shortages compound quarterly
    const monthlyCompoundFactor = (landDelayMonths * 0.08) + ((100 - fundingAvailabilityPct) * 0.04);

    return monthLabels.map((month, idx) => {
      // Baseline trajectory: slight natural evolution towards project completion or gradual drift
      const baseTrajectory = Math.min(
        95,
        Math.max(15, Math.round(baselineScore + (idx * 0.35) * (baselineScore > 60 ? 0.8 : -0.4)))
      );

      // Simulated trajectory: reflects user variable adjustments plus compound escalation over forward horizon
      const forwardEscalation = (idx / 12) * monthlyCompoundFactor;
      const simTrajectory = Math.min(
        100,
        Math.max(10, Math.round(simulatedScore + forwardEscalation + (idx > 6 ? (scoreShift > 0 ? 3 : -2) : 0)))
      );

      // Best-case trajectory with aggressive statutory PMG fast-track and frontloaded budget
      const fastTrackTrajectory = Math.min(
        100,
        Math.max(15, Math.round(Math.min(baseTrajectory, simTrajectory) - (idx * 2.2)))
      );

      // Unmitigated risk trajectory (if secondary bottlenecks cascade)
      const worstCaseTrajectory = Math.min(
        100,
        Math.max(baseTrajectory, Math.round(Math.max(baseTrajectory, simTrajectory) + (idx * 2.5)))
      );

      return {
        month,
        shortMonth: idx === 0 ? 'T+0' : `+${idx}m`,
        baseline: baseTrajectory,
        simulated: simTrajectory,
        fastTrack: fastTrackTrajectory,
        worstCase: worstCaseTrajectory,
      };
    });
  }, [
    baselineScore, 
    simulatedScore, 
    landDelayMonths, 
    fundingAvailabilityPct,
    clearanceLagMonths, 
    contractorCapacityPct, 
    materialInflationPct
  ]);

  // Sensitivity Tornado Data: How much each variable swings the project risk score across its plausible min-max range
  const tornadoData = useMemo(() => {
    // 1. Land Acquisition (0 to 36 mos, baseline = 0m)
    const landImpactLow = -(landDelayMonths * 1.65); // If reduced to 0
    const landImpactHigh = +(36 - landDelayMonths) * 1.65; // If maxed to 36m

    // 2. Funding Availability (30% to 150%)
    const fundingLow = -(fundingAvailabilityPct > 100 ? (fundingAvailabilityPct - 100) * 0.22 : 0) - (150 - Math.max(100, fundingAvailabilityPct)) * 0.22;
    const fundingHigh = +((Math.max(0, 100 - fundingAvailabilityPct) * 0.48) + ((Math.min(100, fundingAvailabilityPct) - 30) * 0.48));

    // 3. Clearances Lag (0 to 24 mos)
    const clearanceLow = -(clearanceLagMonths * 1.15);
    const clearanceHigh = +(24 - clearanceLagMonths) * 1.15;

    // 4. Contractor Velocity (50% to 130%)
    const contractorLow = -(130 - contractorCapacityPct) * 0.2;
    const contractorHigh = +(contractorCapacityPct - 50) * 0.35;

    // 5. Input Material Inflation (0% to 15%)
    const inflationLow = -(materialInflationPct - 0) * 1.2;
    const inflationHigh = +(15 - materialInflationPct) * 1.2;

    return [
      {
        variable: 'Land Acquisition Delay',
        currentSetting: `+${landDelayMonths} Mos`,
        downsideRisk: Math.abs(Number(landImpactHigh.toFixed(1))),
        upsideMitigation: -Math.abs(Number(landImpactLow.toFixed(1))),
        netSwing: Number((landImpactHigh - landImpactLow).toFixed(1)),
        color: '#e11d48',
      },
      {
        variable: 'Funding Availability',
        currentSetting: `${fundingAvailabilityPct}%`,
        downsideRisk: Math.abs(Number(fundingHigh.toFixed(1))),
        upsideMitigation: -Math.abs(Number(fundingLow.toFixed(1))),
        netSwing: Number((fundingHigh - fundingLow).toFixed(1)),
        color: '#059669',
      },
      {
        variable: 'Contractor Velocity',
        currentSetting: `${contractorCapacityPct}%`,
        downsideRisk: Math.abs(Number(contractorHigh.toFixed(1))),
        upsideMitigation: -Math.abs(Number(contractorLow.toFixed(1))),
        netSwing: Number((contractorHigh - contractorLow).toFixed(1)),
        color: '#6366f1',
      },
      {
        variable: 'Clearance Lag',
        currentSetting: `+${clearanceLagMonths} Mos`,
        downsideRisk: Math.abs(Number(clearanceHigh.toFixed(1))),
        upsideMitigation: -Math.abs(Number(clearanceLow.toFixed(1))),
        netSwing: Number((clearanceHigh - clearanceLow).toFixed(1)),
        color: '#2563eb',
      },
      {
        variable: 'Material Inflation (WPI)',
        currentSetting: `${materialInflationPct}%`,
        downsideRisk: Math.abs(Number(inflationHigh.toFixed(1))),
        upsideMitigation: -Math.abs(Number(inflationLow.toFixed(1))),
        netSwing: Number((inflationHigh - inflationLow).toFixed(1)),
        color: '#d97706',
      },
    ].sort((a, b) => b.netSwing - a.netSwing);
  }, [
    landDelayMonths, 
    fundingAvailabilityPct, 
    clearanceLagMonths, 
    contractorCapacityPct, 
    materialInflationPct
  ]);

  // Custom tooltip for Trajectory Chart
  const CustomTrajectoryTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg border border-slate-700 shadow-xl text-xs space-y-1.5 z-50">
          <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">{label}</p>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 font-mono">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: item.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-bold text-white text-xs">{item.value} / 100</span>
            </div>
          ))}
          <div className="pt-1 text-[10px] text-slate-400">
            {payload[0]?.value >= 80 ? '⚠️ Critical Risk Zone' : payload[0]?.value >= 60 ? '⚡ High Risk Zone' : '✅ Controlled Tolerance'}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="sensitivity-analysis-diagram" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-700" />
            <h4 className="text-sm font-bold text-slate-900">
              Sensitivity Analysis Diagram: Dynamic Risk Trajectory & Elasticity
            </h4>
            <span className="text-[10px] font-bold uppercase bg-indigo-50 text-indigo-800 border border-indigo-200 px-1.5 py-0.5 rounded">
              Recharts Analytics
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Visualizing the forward risk path and parameter elasticity based on active input adjustments
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setChartMode('trajectory')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              chartMode === 'trajectory'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Forward Risk Trajectory
          </button>
          <button
            onClick={() => setChartMode('tornado')}
            className={`px-3 py-1 rounded-md font-semibold transition-all ${
              chartMode === 'tornado'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parameter Sensitivity Tornado
          </button>
        </div>
      </div>

      {/* Mode 1: Forward Risk Trajectory Line Chart */}
      {chartMode === 'trajectory' && (
        <div className="space-y-3">
          {/* Key Trajectory Highlights Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Baseline T+0</span>
              <span className="text-base font-black font-mono text-slate-800">{baselineScore}</span>
              <span className="text-[10px] text-slate-500 block">Sanctioned MoSPI plan</span>
            </div>

            <div className="p-2.5 bg-blue-50/70 rounded-lg border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-800 block">Simulated T+0</span>
              <span className="text-base font-black font-mono text-blue-900">{simulatedScore}</span>
              <span className="text-[10px] text-blue-700 block">
                {simulatedScore - baselineScore > 0 ? `+${simulatedScore - baselineScore} pts drift` : `${simulatedScore - baselineScore} pts drift`}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/70 rounded-lg border border-rose-200">
              <span className="text-[10px] uppercase font-bold text-rose-800 block">Projected T+12</span>
              <span className="text-base font-black font-mono text-rose-900">
                {trajectoryData[trajectoryData.length - 1].simulated}
              </span>
              <span className="text-[10px] text-rose-700 block">Horizon compound risk</span>
            </div>

            <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 block">Fast-Track Potential</span>
              <span className="text-base font-black font-mono text-emerald-900">
                {trajectoryData[trajectoryData.length - 1].fastTrack}
              </span>
              <span className="text-[10px] text-emerald-700 block">With PMG interventions</span>
            </div>
          </div>

          {/* Main Recharts Area / Line Chart */}
          <div className="h-[280px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trajectoryData}
                margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />

                {/* Risk Category Threshold Reference Lines */}
                <ReferenceLine 
                  y={80} 
                  stroke="#f43f5e" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Critical (≥80)', fill: '#e11d48', fontSize: 10, position: 'insideTopRight' }} 
                />
                <ReferenceLine 
                  y={60} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: 'High Risk (≥60)', fill: '#d97706', fontSize: 10, position: 'insideTopRight' }} 
                />
                <ReferenceLine 
                  y={35} 
                  stroke="#3b82f6" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Moderate (≥35)', fill: '#2563eb', fontSize: 10, position: 'insideTopRight' }} 
                />

                <XAxis
                  dataKey="shortMonth"
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  ticks={[0, 20, 40, 60, 80, 100]}
                />

                <Tooltip content={<CustomTrajectoryTooltip />} />
                
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '0px' }}
                />

                {/* Active Simulated Trajectory (Dynamic user slider response) */}
                <Line
                  type="monotone"
                  dataKey="simulated"
                  name="Simulated Trajectory (Live Inputs)"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#2563eb', strokeWidth: 1 }}
                  activeDot={{ r: 6, stroke: '#1d4ed8', strokeWidth: 2 }}
                />

                {/* Baseline Trajectory */}
                <Line
                  type="monotone"
                  dataKey="baseline"
                  name="Sanctioned Baseline Path"
                  stroke="#64748b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />

                {/* Fast-Track Intervention Potential */}
                <Line
                  type="monotone"
                  dataKey="fastTrack"
                  name="PMG Fast-Track Horizon"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                />

                {/* Worst-Case Unmitigated */}
                <Line
                  type="monotone"
                  dataKey="worstCase"
                  name="Cascading Bottleneck (Worst-Case)"
                  stroke="#f43f5e"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300"></span>
                Critical (80-100)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-300"></span>
                High Risk (60-80)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-300"></span>
                Moderate (35-60)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300"></span>
                Low Risk (0-35)
              </span>
            </div>
            <span className="italic">
              *Model recalibrates continuously as input variables are adjusted
            </span>
          </div>
        </div>
      )}

      {/* Mode 2: Parameter Sensitivity Tornado Diagram */}
      {chartMode === 'tornado' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span>
              <strong>Sensitivity Elasticity Ranking:</strong> Measures the maximum point swing in overall risk score generated by each variable across its permissible operational boundary.
            </span>
            <span className="text-[11px] font-mono text-blue-700 font-semibold whitespace-nowrap">
              Sorted by Net Impact Swing
            </span>
          </div>

          {/* Tornado Bar Chart */}
          <div className="h-[260px] w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={tornadoData}
                margin={{ top: 10, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 65]} 
                  stroke="#94a3b8" 
                  fontSize={11}
                  unit=" pts" 
                />
                <YAxis 
                  dataKey="variable" 
                  type="category" 
                  stroke="#475569" 
                  fontSize={11} 
                  tickLine={false}
                  width={150}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `${value} pts swing`,
                    name === 'downsideRisk' ? 'Downside Risk Potential' : 'Net Total Swing'
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={30} 
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar 
                  dataKey="netSwing" 
                  name="Maximum Point Swing across Variable Range" 
                  fill="#2563eb" 
                  radius={[0, 4, 4, 0]}
                  barSize={18}
                >
                  {tornadoData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Itemized Sensitivity Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
            {tornadoData.map((item, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">#{idx + 1} Factor</span>
                  <span className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-800">
                    {item.currentSetting}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 truncate text-[11px]" title={item.variable}>
                  {item.variable}
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 font-mono font-bold">
                  <span className="text-slate-500">Max Swing:</span>
                  <span style={{ color: item.color }}>±{item.netSwing} pts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
