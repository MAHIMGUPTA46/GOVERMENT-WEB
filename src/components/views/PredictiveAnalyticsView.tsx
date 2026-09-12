import React, { useState } from 'react';
import { 
  TrendingUp, 
  Cpu, 
  Sliders, 
  Sparkles, 
  BarChart2, 
  ShieldCheck, 
  AlertCircle
} from 'lucide-react';
import { MODEL_METRICS, FEATURE_IMPORTANCE, INITIAL_PROJECTS } from '../../data/mockData';
import { Project } from '../../types';
import { ConfusionMatrixChart } from '../charts/ConfusionMatrixChart';
import { ProjectRiskScoreSimulator } from '../ProjectRiskScoreSimulator';

interface PredictiveAnalyticsViewProps {
  projects?: Project[];
  onSelectProject?: (id: string) => void;
}

export const PredictiveAnalyticsView: React.FC<PredictiveAnalyticsViewProps> = ({
  projects = INITIAL_PROJECTS,
  onSelectProject,
}) => {
  const [selectedModelName, setSelectedModelName] = useState('XGBoost Ensemble (Champion)');

  const activeModel =
    MODEL_METRICS.find((m) => m.modelName === selectedModelName) || MODEL_METRICS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Predictive Machine Learning Engine & Explainability
            </h2>
            <span className="text-[10px] font-bold uppercase bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
              v2.4.2 Production
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Ensemble classification models predicting project slippage and capital escalation with 5.4 months forward lead time
          </p>
        </div>

        {/* Model Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
          {MODEL_METRICS.map((m) => (
            <button
              key={m.modelName}
              onClick={() => setSelectedModelName(m.modelName)}
              className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
                selectedModelName === m.modelName
                  ? 'bg-white text-blue-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {m.modelName.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Model Benchmark Comparison Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">ROC-AUC Score</span>
          <span className="text-2xl font-black font-mono text-blue-800">{activeModel.rocAuc.toFixed(3)}</span>
          <span className="text-[10px] text-emerald-700 block font-medium mt-0.5">High Discriminative Power</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Precision (Positive Predictive)</span>
          <span className="text-2xl font-black font-mono text-slate-900">{(activeModel.precision * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Low False Alarm Rate</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Recall / Sensitivity</span>
          <span className="text-2xl font-black font-mono text-slate-900">{(activeModel.recall * 100).toFixed(1)}%</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Catches 85%+ True Slippages</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-slate-400 text-[10px] uppercase font-bold block">Actionable Lead Time</span>
          <span className="text-2xl font-black font-mono text-emerald-700">{activeModel.leadTimeMonths} Mos</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Advance Warning Window</span>
        </div>
      </div>

      {/* Grid: Confusion Matrix & Global Feature Importance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 6 Columns: Confusion Matrix Diagnostics */}
        <div className="lg:col-span-6">
          <ConfusionMatrixChart model={activeModel} />
        </div>

        {/* Right 6 Columns: Global TreeSHAP Feature Ranking */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Global Feature Importance (TreeSHAP Ranking)
                </h3>
                <p className="text-xs text-slate-500">
                  Relative predictive weight across 1,981 historical project outcomes
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                Top 8 Factors
              </span>
            </div>

            <div className="space-y-3">
              {FEATURE_IMPORTANCE.map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {item.factor}
                    </span>
                    <span className="font-mono font-bold text-slate-700">
                      {(item.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${item.importance * 100 * 3.2}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Method: TreeExplainer on Gradient Boosted Trees</span>
              <span className="font-semibold text-blue-700">IPMD AI Lab</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Project Risk Score Simulation Engine */}
      <ProjectRiskScoreSimulator
        projects={projects}
        onSelectProject={onSelectProject}
      />
    </div>
  );
};
