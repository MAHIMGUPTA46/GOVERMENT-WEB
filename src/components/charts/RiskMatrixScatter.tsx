import React, { useState } from 'react';
import { Project } from '../../types';
import { RiskBadge } from '../RiskBadge';

interface RiskMatrixScatterProps {
  projects: Project[];
  onSelectProject: (id: string) => void;
  title?: string;
  subtitle?: string;
}

export const RiskMatrixScatter: React.FC<RiskMatrixScatterProps> = ({
  projects,
  onSelectProject,
  title = 'Risk Quadrant Matrix: Cost Escalation vs Schedule Delay',
  subtitle = 'Dual-Axis Clustering of 1,981 Monitored Capital Projects',
}) => {
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  // Chart bounds
  const maxDelay = 120; // 10 years capped for axis
  const maxCostOverrun = 120; // 120% capped for view

  const svgWidth = 600;
  const svgHeight = 280;
  const padLeft = 55;
  const padBottom = 40;
  const padTop = 25;
  const padRight = 30;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const getX = (delay: number) => {
    const clamped = Math.min(maxDelay, Math.max(0, delay));
    return padLeft + (clamped / maxDelay) * chartW;
  };

  const getY = (overrun: number) => {
    const clamped = Math.min(maxCostOverrun, Math.max(0, overrun));
    return padTop + chartH - (clamped / maxCostOverrun) * chartH;
  };

  // Critical threshold lines: Delay > 24 months, Cost Overrun > 20%
  const thresholdX = getX(24);
  const thresholdY = getY(20);

  // Get pin color based on risk level
  const getColor = (level: string) => {
    switch (level) {
      case 'critical':
        return '#DC2626'; // Red
      case 'high':
        return '#EA580C'; // Orange
      case 'moderate':
        return '#D97706'; // Amber
      case 'low':
        return '#16A34A'; // Green
      default:
        return '#64748B';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded">
            Upper Right = Critical Cabinet Focus
          </span>
        </div>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-72 select-none"
          aria-label="Scatter chart of cost escalation versus schedule delay"
        >
          {/* Quadrant Background Tints */}
          {/* Healthy: Bottom-Left */}
          <rect
            x={padLeft}
            y={thresholdY}
            width={thresholdX - padLeft}
            height={padTop + chartH - thresholdY}
            fill="#ECFDF5"
            opacity="0.4"
          />
          {/* Critical: Top-Right */}
          <rect
            x={thresholdX}
            y={padTop}
            width={padLeft + chartW - thresholdX}
            height={thresholdY - padTop}
            fill="#FFF1F2"
            opacity="0.5"
          />

          {/* Grid lines */}
          {[0, 30, 60, 90, 120].map((val) => {
            const y = getY(val);
            return (
              <g key={`y-${val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="2 2"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9px] fill-slate-400 font-mono font-medium"
                >
                  +{val}%
                </text>
              </g>
            );
          })}

          {[0, 24, 48, 72, 96, 120].map((val) => {
            const x = getX(val);
            return (
              <g key={`x-${val}`}>
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={padTop + chartH}
                  stroke="#E2E8F0"
                  strokeDasharray="2 2"
                />
                <text
                  x={x}
                  y={padTop + chartH + 16}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-mono font-medium"
                >
                  {val}m
                </text>
              </g>
            );
          })}

          {/* Threshold marker lines */}
          <line
            x1={thresholdX}
            y1={padTop}
            x2={thresholdX}
            y2={padTop + chartH}
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={thresholdY}
            x2={padLeft + chartW}
            y2={thresholdY}
            stroke="#EA580C"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Quadrant Labels */}
          <text
            x={thresholdX + 8}
            y={padTop + 14}
            className="text-[9px] font-bold fill-rose-700 uppercase tracking-wider"
          >
            Critical Dual Escalation Zone
          </text>
          <text
            x={padLeft + 8}
            y={padTop + chartH - 8}
            className="text-[9px] font-bold fill-emerald-700 uppercase tracking-wider"
          >
            Controlled Execution Zone
          </text>

          {/* Project Scatter Dots */}
          {projects.map((proj) => {
            const cx = getX(proj.delayMonths);
            const cy = getY(proj.costOverrunPct);
            const isHovered = hoveredProject?.id === proj.id;
            const pinColor = getColor(proj.riskLevel);

            return (
              <g
                key={proj.id}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectProject(proj.id)}
                onMouseEnter={() => setHoveredProject(proj)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                {isHovered && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill={pinColor}
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7 : 5}
                  fill={pinColor}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="shadow-sm transition-all duration-150"
                />
                <text
                  x={cx + 7}
                  y={cy - 4}
                  className={`text-[8px] font-mono font-bold select-none pointer-events-none ${
                    isHovered ? 'fill-slate-900 font-extrabold' : 'fill-slate-500'
                  }`}
                >
                  {proj.projectCode}
                </text>
              </g>
            );
          })}

          {/* Axis Labels */}
          <text
            x={padLeft + chartW / 2}
            y={svgHeight - 8}
            textAnchor="middle"
            className="text-[10px] font-bold fill-slate-700 uppercase tracking-wider"
          >
            Schedule Delay (Months from Original Sanction) →
          </text>
          <text
            x={16}
            y={padTop + chartH / 2}
            textAnchor="middle"
            transform={`rotate(-90, 16, ${padTop + chartH / 2})`}
            className="text-[10px] font-bold fill-slate-700 uppercase tracking-wider"
          >
            Cost Escalation (%) →
          </text>
        </svg>

        {/* Hover Floating Details Card */}
        {hoveredProject && (
          <div className="absolute top-2 right-4 z-20 bg-slate-900 text-white rounded-xl p-3.5 shadow-2xl border border-slate-700 max-w-xs text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-2 mb-1.5 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-amber-400 font-mono text-sm">
                [{hoveredProject.projectCode}]
              </span>
              <RiskBadge level={hoveredProject.riskLevel} score={hoveredProject.riskScore} size="sm" />
            </div>
            <h4 className="font-bold text-slate-100 line-clamp-2 text-xs mb-2">
              {hoveredProject.name}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-800/80 p-2 rounded-lg mb-2">
              <div>
                <span className="text-slate-400 block">Cost Escalation:</span>
                <span className="font-mono font-bold text-rose-400">
                  +{hoveredProject.costOverrunPct.toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Schedule Delay:</span>
                <span className="font-mono font-bold text-amber-400">
                  {hoveredProject.delayMonths} Months
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Revised Outlay:</span>
                <span className="font-mono text-slate-200">
                  ₹{hoveredProject.revisedCost.toLocaleString()} Cr
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Sector:</span>
                <span className="text-slate-200 truncate block">
                  {hoveredProject.sector}
                </span>
              </div>
            </div>
            <div className="text-[10px] text-blue-300 flex items-center justify-between">
              <span>Click dot to view full dossier</span>
              <span className="text-slate-400">IPMD Database</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
            <span className="text-[11px]">Critical (75-100)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600" />
            <span className="text-[11px]">High (50-74)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <span className="text-[11px]">Moderate (25-49)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            <span className="text-[11px]">Low (0-24)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Threshold benchmarks: 24-month delay & 20% escalation
        </div>
      </div>
    </div>
  );
};
