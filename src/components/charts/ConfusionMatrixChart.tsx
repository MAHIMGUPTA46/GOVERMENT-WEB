import React from 'react';
import { ModelMetrics } from '../../types';

interface ConfusionMatrixChartProps {
  model: ModelMetrics;
}

export const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({ model }) => {
  const { confusionMatrix } = model;
  const total =
    confusionMatrix.truePositive +
    confusionMatrix.falsePositive +
    confusionMatrix.trueNegative +
    confusionMatrix.falseNegative;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900">
            Model Validation Matrix & Decision Diagnostics
          </h3>
          <p className="text-xs text-slate-500">
            Confusion matrix evaluated on hold-out validation set of {total.toLocaleString()} projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-bold">
            ROC-AUC: {model.rocAuc.toFixed(3)}
          </span>
          <span className="text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-bold">
            PR-AUC: {model.prAuc.toFixed(3)}
          </span>
        </div>
      </div>

      {/* 2x2 Grid Representation */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* True Positive */}
        <div className="p-3.5 rounded-lg bg-emerald-50/80 border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase">
              True Positives (TP)
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.2 rounded">
              High Risk Correct
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-900">
              {confusionMatrix.truePositive}
            </span>
            <span className="text-xs text-emerald-700 font-mono font-medium">
              {((confusionMatrix.truePositive / total) * 100).toFixed(1)}% of total
            </span>
          </div>
          <p className="text-[10px] text-emerald-800 mt-1">
            Correctly anticipated severe cost/time overrun with ≥ 5 months lead time.
          </p>
        </div>

        {/* False Positive */}
        <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase">
              False Positives (FP)
            </span>
            <span className="text-[10px] text-amber-700 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
              False Alarm
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-900">
              {confusionMatrix.falsePositive}
            </span>
            <span className="text-xs text-amber-700 font-mono font-medium">
              {((confusionMatrix.falsePositive / total) * 100).toFixed(1)}% of total
            </span>
          </div>
          <p className="text-[10px] text-amber-800 mt-1">
            Flagged for review but recovered via contractor intervention.
          </p>
        </div>

        {/* False Negative */}
        <div className="p-3.5 rounded-lg bg-rose-50/80 border border-rose-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-900 uppercase">
              False Negatives (FN)
            </span>
            <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-1.5 py-0.2 rounded">
              Missed Slippage
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-rose-900">
              {confusionMatrix.falseNegative}
            </span>
            <span className="text-xs text-rose-700 font-mono font-medium">
              {((confusionMatrix.falseNegative / total) * 100).toFixed(1)}% of total
            </span>
          </div>
          <p className="text-[10px] text-rose-800 mt-1">
            Unpredicted overrun caused by unforeseen force majeure or sudden litigation.
          </p>
        </div>

        {/* True Negative */}
        <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase">
              True Negatives (TN)
            </span>
            <span className="text-[10px] text-blue-700 font-semibold bg-blue-100 px-1.5 py-0.2 rounded">
              Controlled Project
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-blue-900">
              {confusionMatrix.trueNegative}
            </span>
            <span className="text-xs text-blue-700 font-mono font-medium">
              {((confusionMatrix.trueNegative / total) * 100).toFixed(1)}% of total
            </span>
          </div>
          <p className="text-[10px] text-blue-800 mt-1">
            Correctly predicted on-track execution without statutory intervention.
          </p>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-xs">
        <div className="p-2 bg-slate-50 rounded-md">
          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Precision</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{(model.precision * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-slate-50 rounded-md">
          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Recall / Sensitivity</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{(model.recall * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-slate-50 rounded-md">
          <span className="text-slate-500 text-[10px] uppercase font-semibold block">F1-Score</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{(model.f1Score * 100).toFixed(1)}%</span>
        </div>
        <div className="p-2 bg-slate-50 rounded-md">
          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Lead Time Window</span>
          <span className="font-mono font-bold text-slate-900 text-sm">{model.leadTimeMonths} Months</span>
        </div>
      </div>
    </div>
  );
};
