import React, { useState } from 'react';
import { ProjectMonthlySnapshot } from '../../types';

interface MonthlyProgressChartProps {
  snapshots: ProjectMonthlySnapshot[];
  title?: string;
  subtitle?: string;
}

export const MonthlyProgressChart: React.FC<MonthlyProgressChartProps> = ({
  snapshots,
  title = '12-Month S-Curve: Physical vs Financial Execution Trajectory',
  subtitle = 'Comparing Planned vs Actual Milestones and Capital Drawdown',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!snapshots || snapshots.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
        No monthly snapshot records available for this project.
      </div>
    );
  }

  // Chart dimensions in SVG viewbox coordinates
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // X coordinate calculation
  const getX = (index: number) => {
    if (snapshots.length <= 1) return paddingX + chartWidth / 2;
    return paddingX + (index / (snapshots.length - 1)) * chartWidth;
  };

  // Y coordinate calculation (0% at bottom, 100% at top)
  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return paddingY + chartHeight - (clamped / 100) * chartHeight;
  };

  // Generate SVG path for a metric series
  const makePath = (accessor: (s: ProjectMonthlySnapshot) => number) => {
    return snapshots.reduce((acc, curr, idx) => {
      const x = getX(idx);
      const y = getY(accessor(curr));
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  const plannedPhysicalPath = makePath((s) => s.plannedPhysicalProgress);
  const actualPhysicalPath = makePath((s) => s.actualPhysicalProgress);
  const plannedFinancialPath = makePath((s) => s.plannedFinancialProgress);
  const actualFinancialPath = makePath((s) => s.actualFinancialProgress);

  const latest = snapshots[snapshots.length - 1];
  const physicalGap = (latest.plannedPhysicalProgress - latest.actualPhysicalProgress).toFixed(1);
  const financialGap = (latest.plannedFinancialProgress - latest.actualFinancialProgress).toFixed(1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
            Number(physicalGap) > 5 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            Physical Variance: {Number(physicalGap) > 0 ? `-${physicalGap}%` : `+${Math.abs(Number(physicalGap))}%`}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
            Number(financialGap) > 5 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}>
            Disbursement Gap: {Number(financialGap) > 0 ? `-${financialGap}%` : `+${Math.abs(Number(financialGap))}%`}
          </span>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-56 select-none"
          aria-label="S-Curve chart of physical and financial progress over 12 months"
        >
          {/* Y-Axis Grid Lines & Labels */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = getY(pct);
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono font-medium"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Series Lines */}
          {/* Planned Physical (Dashed Dark Blue) */}
          <path
            d={plannedPhysicalPath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Planned Financial (Dashed Teal) */}
          <path
            d={plannedFinancialPath}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Actual Financial (Solid Teal) */}
          <path
            d={actualFinancialPath}
            fill="none"
            stroke="#00897B"
            strokeWidth="2.5"
          />

          {/* Actual Physical (Solid Navy/Blue) */}
          <path
            d={actualPhysicalPath}
            fill="none"
            stroke="#1565C0"
            strokeWidth="3"
          />

          {/* Monthly Data Points & Hover Targets */}
          {snapshots.map((s, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={s.id} className="cursor-pointer" onMouseEnter={() => setHoveredIndex(idx)}>
                {/* Vertical Cursor Line on Hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingY}
                    x2={x}
                    y2={svgHeight - paddingY}
                    stroke="#0B1F3A"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Actual Physical Dot */}
                <circle
                  cx={x}
                  cy={getY(s.actualPhysicalProgress)}
                  r={isHovered ? 6 : 3.5}
                  fill="#1565C0"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* Actual Financial Dot */}
                <circle
                  cx={x}
                  cy={getY(s.actualFinancialProgress)}
                  r={isHovered ? 5 : 3}
                  fill="#00897B"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* X-axis tick label (every alternate or spaced) */}
                <text
                  x={x}
                  y={svgHeight - paddingY + 16}
                  textAnchor="middle"
                  className={`text-[9px] font-mono transition-colors ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-400'
                  }`}
                >
                  {s.reportingMonth.substring(5)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Snapshot Detail Card */}
        {hoveredIndex !== null && snapshots[hoveredIndex] && (
          <div className="absolute top-2 right-4 z-10 bg-slate-900/95 text-white rounded-lg p-3 text-xs shadow-xl backdrop-blur-xs border border-slate-700 min-w-56 pointer-events-none">
            <div className="font-bold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex justify-between">
              <span>Month: {snapshots[hoveredIndex].reportingMonth}</span>
              <span className="text-amber-400 font-mono">₹{snapshots[hoveredIndex].monthlyExpenditure} Cr exp.</span>
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1565C0]" />
                  Actual Physical:
                </span>
                <span className="font-mono font-bold text-blue-300">
                  {snapshots[hoveredIndex].actualPhysicalProgress}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-0.5 bg-slate-400" />
                  Planned Physical:
                </span>
                <span className="font-mono">
                  {snapshots[hoveredIndex].plannedPhysicalProgress}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00897B]" />
                  Actual Financial:
                </span>
                <span className="font-mono font-bold text-teal-300">
                  {snapshots[hoveredIndex].actualFinancialProgress}%
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-0.5 bg-slate-500" />
                  Planned Financial:
                </span>
                <span className="font-mono">
                  {snapshots[hoveredIndex].plannedFinancialProgress}%
                </span>
              </div>
            </div>
            {snapshots[hoveredIndex].remarks && (
              <div className="mt-1.5 pt-1 border-t border-slate-800 text-[10px] text-slate-400 italic">
                "{snapshots[hoveredIndex].remarks}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend & Analytical Narrative */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#1565C0] rounded-xs" />
            <span className="text-slate-800 font-semibold text-[11px]">Actual Physical (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-b-2 border-dashed border-slate-400" />
            <span className="text-slate-600 text-[11px]">Planned Physical (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-[#00897B] rounded-xs" />
            <span className="text-slate-800 font-semibold text-[11px]">Actual Financial (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 border-b-2 border-dashed border-slate-300" />
            <span className="text-slate-600 text-[11px]">Planned Financial (%)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500">
          Showing 12-month historical monthly audit reports
        </div>
      </div>
    </div>
  );
};
