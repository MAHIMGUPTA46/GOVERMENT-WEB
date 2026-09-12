import React from 'react';
import { RiskFactor } from '../../types';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

interface ShapWaterfallChartProps {
  factors: RiskFactor[];
  baseRiskScore?: number;
  overallScore: number;
  confidenceScore: number;
  modelVersion: string;
  assessmentDate: string;
}

export const ShapWaterfallChart: React.FC<ShapWaterfallChartProps> = ({
  factors,
  overallScore,
  confidenceScore,
  modelVersion,
  assessmentDate,
}) => {
  const maxContribution = Math.max(...factors.map((f) => Math.abs(f.contribution)), 1);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              SHAP Explainability & Risk Attribution Engine
            </h3>
            <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
              Feature Attribution
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Additive Shapley contribution of technical, geological, and statutory features toward overall risk score
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
            Model: {modelVersion}
          </span>
          <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
            Confidence: {(confidenceScore * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Model Diagnostic Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs">
        <div>
          <span className="text-slate-500 text-[10px] uppercase block font-semibold">
            Overall Predicted Risk
          </span>
          <span className="text-base font-bold font-mono text-slate-900">
            {overallScore} / 100
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] uppercase block font-semibold">
            Primary Driver Weight
          </span>
          <span className="text-base font-bold font-mono text-rose-600">
            +{factors[0]?.contribution || 0}% impact
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] uppercase block font-semibold">
            Assessment Date
          </span>
          <span className="text-xs font-semibold text-slate-700">
            {assessmentDate}
          </span>
        </div>
        <div>
          <span className="text-slate-500 text-[10px] uppercase block font-semibold">
            Methodology
          </span>
          <span className="text-xs font-semibold text-slate-700">
            TreeSHAP (Lundberg et al.)
          </span>
        </div>
      </div>

      {/* Factors List with Horizontal Diverging Bars */}
      <div className="space-y-3.5">
        {factors.map((factor, idx) => {
          const isIncreasing = factor.direction === 'increasing';
          const barWidth = Math.min(100, (Math.abs(factor.contribution) / maxContribution) * 100);

          return (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2 truncate">
                  <span className={`p-1 rounded-sm shrink-0 ${
                    isIncreasing ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isIncreasing ? (
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowDownRight className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <span className="font-bold text-slate-800 truncate">
                    {factor.factorName}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0 hidden sm:inline">
                    {factor.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-slate-500">
                    Observed: {factor.factorValue}
                  </span>
                  <span className={`font-mono font-bold text-xs ${
                    isIncreasing ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {isIncreasing ? `+${factor.contribution}%` : `-${factor.contribution}%`}
                  </span>
                </div>
              </div>

              {/* Bar visualization */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isIncreasing ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-600 pl-6 leading-relaxed">
                {factor.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Contributions calculate incremental deviation from historical sector baseline</span>
        </div>
        <span className="font-semibold text-slate-700">Validated against IPMD Project Registry</span>
      </div>
    </div>
  );
};
