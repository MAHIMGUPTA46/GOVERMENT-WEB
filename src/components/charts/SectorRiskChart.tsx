import React, { useState } from 'react';

interface SectorRiskItem {
  sector: string;
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  costEscalationPct: number;
}

interface SectorRiskChartProps {
  data?: SectorRiskItem[];
  title?: string;
  subtitle?: string;
}

const DEFAULT_SECTOR_DATA: SectorRiskItem[] = [
  { sector: 'Road Transport & Highways', total: 785, critical: 14, high: 98, moderate: 340, low: 333, costEscalationPct: 11.7 },
  { sector: 'Railways', total: 248, critical: 16, high: 84, moderate: 92, low: 56, costEscalationPct: 28.5 },
  { sector: 'Petroleum & Natural Gas', total: 142, critical: 2, high: 18, moderate: 62, low: 60, costEscalationPct: 11.5 },
  { sector: 'Power & Renewable Energy', total: 116, critical: 5, high: 28, moderate: 48, low: 35, costEscalationPct: 24.0 },
  { sector: 'Urban Development & Metro', total: 94, critical: 3, high: 24, moderate: 42, low: 25, costEscalationPct: 19.4 },
  { sector: 'Water Resources / Jal Shakti', total: 68, critical: 2, high: 22, moderate: 31, low: 13, costEscalationPct: 75.6 },
  { sector: 'Ports, Shipping & Waterways', total: 46, critical: 0, high: 6, moderate: 22, low: 18, costEscalationPct: 15.3 },
  { sector: 'Civil Aviation', total: 38, critical: 0, high: 4, moderate: 16, low: 18, costEscalationPct: 10.1 },
];

export const SectorRiskChart: React.FC<SectorRiskChartProps> = ({
  data = DEFAULT_SECTOR_DATA,
  title = 'Sector-Wise Project & Risk Categorization',
  subtitle = 'Distribution of 1,981 Ongoing Projects Across Infrastructure Sectors',
}) => {
  const [hoveredSector, setHoveredSector] = useState<SectorRiskItem | null>(null);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
            <span className="text-[11px] text-slate-600">Critical</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-orange-500" />
            <span className="text-[11px] text-slate-600">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
            <span className="text-[11px] text-slate-600">Moderate</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span className="text-[11px] text-slate-600">Low</span>
          </div>
        </div>
      </div>

      {/* Stacked Horizontal Bars */}
      <div className="space-y-3">
        {data.map((item) => {
          const isHovered = hoveredSector?.sector === item.sector;
          const critPct = (item.critical / item.total) * 100;
          const highPct = (item.high / item.total) * 100;
          const modPct = (item.moderate / item.total) * 100;
          const lowPct = (item.low / item.total) * 100;

          return (
            <div
              key={item.sector}
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                isHovered ? 'bg-slate-50 ring-1 ring-slate-200' : 'hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredSector(item)}
              onMouseLeave={() => setHoveredSector(null)}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-bold text-slate-800 truncate max-w-xs">
                  {item.sector}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    {item.total} projects
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                    +{item.costEscalationPct}% esc.
                  </span>
                </div>
              </div>

              {/* Progress Bar Stack */}
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${critPct}%` }}
                  className="bg-rose-600 h-full transition-all"
                  title={`Critical Risk: ${item.critical} (${critPct.toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${highPct}%` }}
                  className="bg-orange-500 h-full transition-all"
                  title={`High Risk: ${item.high} (${highPct.toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${modPct}%` }}
                  className="bg-amber-400 h-full transition-all"
                  title={`Moderate Risk: ${item.moderate} (${modPct.toFixed(1)}%)`}
                />
                <div
                  style={{ width: `${lowPct}%` }}
                  className="bg-emerald-500 h-full transition-all"
                  title={`Low Risk: ${item.low} (${lowPct.toFixed(1)}%)`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover Readout Tooltip Bar */}
      {hoveredSector && (
        <div className="mt-3 p-2.5 bg-slate-900 text-white rounded-lg text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-100">
          <div className="font-bold text-amber-400">{hoveredSector.sector}</div>
          <div className="flex items-center gap-3 font-mono">
            <span className="text-rose-300 font-semibold">Critical: {hoveredSector.critical}</span>
            <span className="text-orange-300 font-semibold">High: {hoveredSector.high}</span>
            <span className="text-amber-300">Moderate: {hoveredSector.moderate}</span>
            <span className="text-emerald-300">Low: {hoveredSector.low}</span>
          </div>
        </div>
      )}
    </div>
  );
};
