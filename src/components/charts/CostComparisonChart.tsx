import React, { useState } from 'react';

interface CostComparisonChartProps {
  originalCost: number; // in Cr or Lakh Cr
  revisedCost: number;
  expenditure: number;
  unit?: string; // e.g. "₹ Lakh Cr" or "₹ Cr"
  title?: string;
  subtitle?: string;
}

export const CostComparisonChart: React.FC<CostComparisonChartProps> = ({
  originalCost,
  revisedCost,
  expenditure,
  unit = '₹ Lakh Cr',
  title = 'Aggregate Capital Allocation & Expenditure Profile',
  subtitle = 'Comparison of Sanctioned vs Revised Outlays vs Cumulative Expenditure',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const escalation = revisedCost - originalCost;
  const escalationPct = originalCost > 0 ? ((escalation / originalCost) * 100).toFixed(1) : '0';
  const expenditurePct = revisedCost > 0 ? ((expenditure / revisedCost) * 100).toFixed(1) : '0';

  const maxVal = Math.max(originalCost, revisedCost, expenditure) * 1.15 || 100;

  const data = [
    {
      label: 'Original Sanctioned Cost',
      shortLabel: 'Original',
      value: originalCost,
      color: '#1565C0', // Blue
      description: 'Initial CCEA / Ministry Cabinet Sanction',
    },
    {
      label: 'Anticipated Revised Cost',
      shortLabel: 'Revised',
      value: revisedCost,
      color: '#F59E0B', // Saffron / Amber
      description: `Includes cost overrun of ${unit} ${escalation.toFixed(2)} (+${escalationPct}%)`,
    },
    {
      label: 'Cumulative Expenditure',
      shortLabel: 'Expended',
      value: expenditure,
      color: '#00897B', // Teal
      description: `${expenditurePct}% of revised capital allocation disbursed`,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
            Escalation: +{escalationPct}%
          </span>
          <span className="text-[11px] font-semibold bg-teal-50 text-teal-900 border border-teal-300 px-2 py-0.5 rounded">
            Utilisation: {expenditurePct}%
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-56 relative flex items-end justify-around pt-6 pb-6 px-4">
        {/* Background Grid Lines */}
        <div className="absolute inset-x-4 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-20">
          <div className="border-b border-slate-400 w-full" />
          <div className="border-b border-slate-400 w-full" />
          <div className="border-b border-slate-400 w-full" />
          <div className="border-b border-slate-400 w-full" />
        </div>

        {data.map((item, idx) => {
          const heightPct = Math.min(100, Math.max(10, (item.value / maxVal) * 100));
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={item.label}
              className="relative flex flex-col items-center flex-1 max-w-[120px] h-full justify-end cursor-pointer group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              tabIndex={0}
              role="button"
              aria-label={`${item.label}: ${item.value.toLocaleString()} ${unit}`}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div className="absolute bottom-full mb-2 z-20 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 left-1/2">
                  <div className="font-bold text-slate-100">{item.label}</div>
                  <div className="text-amber-400 font-mono text-sm font-semibold">
                    {unit} {item.value.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-300 max-w-xs mt-0.5">
                    {item.description}
                  </div>
                </div>
              )}

              {/* Bar Value Display */}
              <div
                className={`text-xs font-bold font-mono transition-transform duration-200 mb-1.5 ${
                  isHovered ? 'text-slate-900 scale-110' : 'text-slate-700'
                }`}
              >
                {item.value.toLocaleString()}
              </div>

              {/* Bar Pillar */}
              <div
                className="w-full rounded-t-md transition-all duration-300 relative overflow-hidden"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: item.color,
                  filter: isHovered ? 'brightness(1.15)' : 'none',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
              </div>

              {/* Label */}
              <div className="text-center mt-2">
                <span className="text-xs font-semibold text-slate-800 block">
                  {item.shortLabel}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accessible Legend & Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          {data.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-xs shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-700 font-medium text-[11px]">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="text-[11px] text-slate-500 italic">
          Data source: IPMD Monthly Progress Appraisal System
        </div>
      </div>
    </div>
  );
};
