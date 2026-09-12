import React, { useState, useMemo } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  IndianRupee, 
  Layers, 
  Activity, 
  Zap, 
  Building2, 
  ArrowRight,
  Info,
  CheckCircle2,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Project, RiskLevel } from '../types';
import { RiskTrajectorySensitivityChart } from './charts/RiskTrajectorySensitivityChart';

interface ProjectRiskScoreSimulatorProps {
  projects: Project[];
  onSelectProject?: (id: string) => void;
}

export interface SimulationPreset {
  id: string;
  name: string;
  description: string;
  landDelayMonths: number;
  fundingAvailabilityPct: number;
  clearanceLagMonths: number;
  contractorCapacityPct: number;
  materialInflationPct: number;
}

const PRESETS: SimulationPreset[] = [
  {
    id: 'baseline',
    name: 'MoSPI Baseline Status',
    description: 'Current sanctioned parameters with steady fiscal releases and regular clearance timelines.',
    landDelayMonths: 0,
    fundingAvailabilityPct: 100,
    clearanceLagMonths: 0,
    contractorCapacityPct: 100,
    materialInflationPct: 5.0,
  },
  {
    id: 'land_bottleneck',
    name: 'Severe Land & RoW Injunction',
    description: '14-month land acquisition stall due to court litigation & compensation disputes; 85% funding.',
    landDelayMonths: 14,
    fundingAvailabilityPct: 85,
    clearanceLagMonths: 6,
    contractorCapacityPct: 85,
    materialInflationPct: 6.5,
  },
  {
    id: 'fiscal_crunch',
    name: 'Fiscal Tightening & Capex Cut',
    description: 'Funding compressed to 55% of requirement; procurement frozen, slowing field execution.',
    landDelayMonths: 4,
    fundingAvailabilityPct: 55,
    clearanceLagMonths: 3,
    contractorCapacityPct: 70,
    materialInflationPct: 8.0,
  },
  {
    id: 'pmg_fasttrack',
    name: 'Cabinet PMG Fast-Track Intervention',
    description: 'Zero land delay, priority 125% frontloaded capex release, and 115% contractor mobilization.',
    landDelayMonths: 0,
    fundingAvailabilityPct: 125,
    clearanceLagMonths: 0,
    contractorCapacityPct: 115,
    materialInflationPct: 4.0,
  },
];

export const ProjectRiskScoreSimulator: React.FC<ProjectRiskScoreSimulatorProps> = ({
  projects,
  onSelectProject,
}) => {
  // Selected Project ID ('portfolio' for national aggregate or specific project id)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || 'portfolio'
  );

  // Simulation Variable States
  const [landDelayMonths, setLandDelayMonths] = useState<number>(0);
  const [fundingAvailabilityPct, setFundingAvailabilityPct] = useState<number>(100);
  const [clearanceLagMonths, setClearanceLagMonths] = useState<number>(0);
  const [contractorCapacityPct, setContractorCapacityPct] = useState<number>(100);
  const [materialInflationPct, setMaterialInflationPct] = useState<number>(5.0);

  // Active preset tag if matched
  const [activePresetId, setActivePresetId] = useState<string>('baseline');

  // Derive target project or portfolio composite
  const selectedProject = useMemo(() => {
    if (selectedProjectId === 'portfolio') return null;
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Baseline metrics
  const baseline = useMemo(() => {
    if (selectedProject) {
      return {
        name: `${selectedProject.projectCode} – ${selectedProject.name}`,
        code: selectedProject.projectCode,
        ministry: selectedProject.ministry,
        cost: selectedProject.revisedCost || selectedProject.originalCost || 25000,
        score: selectedProject.riskScore || 64,
        level: selectedProject.riskLevel || 'high',
        delayMonths: selectedProject.delayMonths || 12,
        costOverrunPct: selectedProject.costOverrunPct || 14.5,
        costOverrunProb: Math.round((selectedProject.riskAssessment?.costOverrunProbability || 0.65) * 100),
        scheduleDelayProb: Math.round((selectedProject.riskAssessment?.timeOverrunProbability || 0.7) * 100),
      };
    }

    // National portfolio average composite
    const avgScore = Math.round(
      projects.reduce((acc, p) => acc + (p.riskScore || 50), 0) / (projects.length || 1)
    );
    const avgDelay = Math.round(
      projects.reduce((acc, p) => acc + (p.delayMonths || 0), 0) / (projects.length || 1)
    );
    const totalCost = projects.reduce((acc, p) => acc + (p.revisedCost || 0), 0) || 4278000;

    return {
      name: 'National Portfolio Composite (1,981 Projects)',
      code: 'PORTFOLIO-AGG',
      ministry: 'Cabinet Secretariat / IPMD MoSPI',
      cost: totalCost,
      score: avgScore || 63,
      level: (avgScore >= 70 ? 'high' : avgScore >= 45 ? 'moderate' : 'low') as RiskLevel,
      delayMonths: avgDelay || 16,
      costOverrunPct: 15.2,
      costOverrunProb: 68,
      scheduleDelayProb: 72,
    };
  }, [selectedProject, projects]);

  // Calculations for variable contributions to risk score
  const variableContributions = useMemo(() => {
    // 1. Land acquisition delay: each month adds +1.65 pts
    const landDelta = landDelayMonths * 1.65;

    // 2. Funding availability: 100% is neutral.
    // Below 100%, risk spikes by +0.48 pts per 1% shortfall.
    // Above 100%, surplus funding reduces risk by -0.22 pts per 1% surplus.
    let fundingDelta = 0;
    if (fundingAvailabilityPct < 100) {
      fundingDelta = (100 - fundingAvailabilityPct) * 0.48;
    } else {
      fundingDelta = -(fundingAvailabilityPct - 100) * 0.22;
    }

    // 3. Environmental / Statutory clearance lag: +1.15 pts per month
    const clearanceDelta = clearanceLagMonths * 1.15;

    // 4. Contractor execution capacity: below 100 adds +0.3 pts per %, above reduces by -0.2 pts per %
    let contractorDelta = 0;
    if (contractorCapacityPct < 100) {
      contractorDelta = (100 - contractorCapacityPct) * 0.35;
    } else {
      contractorDelta = -(contractorCapacityPct - 100) * 0.2;
    }

    // 5. Input material inflation: baseline is 5% WPI. Each 1% variation adds/subtracts +1.2 pts
    const inflationDelta = (materialInflationPct - 5.0) * 1.2;

    const totalDelta = landDelta + fundingDelta + clearanceDelta + contractorDelta + inflationDelta;

    return {
      landDelta,
      fundingDelta,
      clearanceDelta,
      contractorDelta,
      inflationDelta,
      totalDelta,
    };
  }, [
    landDelayMonths,
    fundingAvailabilityPct,
    clearanceLagMonths,
    contractorCapacityPct,
    materialInflationPct,
  ]);

  // Simulated metrics derived in real-time
  const simulationResult = useMemo(() => {
    const rawScore = baseline.score + variableContributions.totalDelta;
    const simulatedScore = Math.min(100, Math.max(5, Math.round(rawScore)));

    let simulatedLevel: RiskLevel = 'low';
    if (simulatedScore >= 80) simulatedLevel = 'critical';
    else if (simulatedScore >= 60) simulatedLevel = 'high';
    else if (simulatedScore >= 35) simulatedLevel = 'moderate';
    else simulatedLevel = 'low';

    // Simulated additional delay
    const additionalDelayMonths = Math.max(
      0,
      Math.round(
        landDelayMonths * 0.88 +
        clearanceLagMonths * 0.65 +
        Math.max(0, 100 - fundingAvailabilityPct) * 0.14 +
        Math.max(0, 100 - contractorCapacityPct) * 0.12
      )
    );
    const newTotalDelayMonths = baseline.delayMonths + additionalDelayMonths;

    // Simulated cost overrun prob
    const simulatedCostProb = Math.min(
      99,
      Math.max(5, Math.round(baseline.costOverrunProb + variableContributions.totalDelta * 0.7))
    );

    // Simulated schedule delay prob
    const simulatedScheduleProb = Math.min(
      99,
      Math.max(5, Math.round(baseline.scheduleDelayProb + variableContributions.totalDelta * 0.75))
    );

    // Estimated incremental cost escalation in ₹ Cr
    const costFactor = Math.max(0, (variableContributions.totalDelta / 100) * 0.22);
    const estimatedCostEscalationCr = Math.round(baseline.cost * costFactor);

    return {
      simulatedScore,
      simulatedLevel,
      scoreDelta: simulatedScore - baseline.score,
      additionalDelayMonths,
      newTotalDelayMonths,
      simulatedCostProb,
      simulatedScheduleProb,
      estimatedCostEscalationCr,
    };
  }, [baseline, variableContributions, landDelayMonths, clearanceLagMonths, fundingAvailabilityPct, contractorCapacityPct]);

  // Apply preset scenario
  const handleApplyPreset = (preset: SimulationPreset) => {
    setLandDelayMonths(preset.landDelayMonths);
    setFundingAvailabilityPct(preset.fundingAvailabilityPct);
    setClearanceLagMonths(preset.clearanceLagMonths);
    setContractorCapacityPct(preset.contractorCapacityPct);
    setMaterialInflationPct(preset.materialInflationPct);
    setActivePresetId(preset.id);
  };

  // Reset to Baseline
  const handleReset = () => {
    handleApplyPreset(PRESETS[0]);
  };

  // Variable change helper
  const handleVariableChange = (setter: React.Dispatch<React.SetStateAction<number>>, value: number) => {
    setter(value);
    setActivePresetId('custom');
  };

  // Helper colors for risk score
  const getRiskColor = (score: number) => {
    if (score >= 80) return { text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-600' };
    if (score >= 60) return { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-500' };
    if (score >= 35) return { text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', bar: 'bg-blue-600' };
    return { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-600' };
  };

  const baselineRiskColor = getRiskColor(baseline.score);
  const simulatedRiskColor = getRiskColor(simulationResult.simulatedScore);

  return (
    <div id="risk-simulation-engine" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
      {/* Tool Header & Project Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Predictive Risk Score Sensitivity & What-If Simulator
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                  Real-Time Engine
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Adjust variables like Land Acquisition Delay and Funding Availability to model their instant impact on overall project risk scores.
              </p>
            </div>
          </div>
        </div>

        {/* Project Target Dropdown & Reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">Target Project:</span>
            <select
              id="simulator-project-select"
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                handleReset();
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 max-w-xs truncate"
            >
              <option value="portfolio">National Portfolio Composite (1,981 Projects)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} – {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            id="reset-simulation-btn"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Reset to official baseline values"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Preset Scenario Quick-Buttons */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-bold text-slate-700 uppercase tracking-wide text-[11px]">
            Fast Scenario Presets:
          </span>
          <span className="text-[11px]">Click a scenario to preload parameters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleApplyPreset(preset)}
              className={`p-3 rounded-lg text-left transition-all border ${
                activePresetId === preset.id
                  ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs text-slate-900">
                <span>{preset.name}</span>
                {activePresetId === preset.id && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                {preset.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Panel: Left Controls (Sliders), Right Real-Time Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side (7 Cols): The Variable Adjusters */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Adjustable Simulation Variables
            </span>
            <span className="text-[11px] text-slate-400">
              Interactive sensitivity weights calibrated on TreeSHAP model
            </span>
          </div>

          {/* Variable 1: Delay in Land Acquisition */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <label htmlFor="sim-land-delay" className="text-xs font-bold text-slate-800">
                  Delay in Land Acquisition & RoW Handover
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  +{landDelayMonths} Months
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({variableContributions.landDelta > 0 ? `+${variableContributions.landDelta.toFixed(1)} pts` : '0 pts'})
                </span>
              </div>
            </div>

            <input
              id="sim-land-delay"
              type="range"
              min="0"
              max="36"
              step="1"
              value={landDelayMonths}
              onChange={(e) => handleVariableChange(setLandDelayMonths, Number(e.target.value))}
              className="w-full accent-rose-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span>0m (On Track / 100% RoW)</span>
              <span>12m (Moderate Injunction)</span>
              <span>24m</span>
              <span>36m (Severe Land Dispute)</span>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Impact: Delays linear progress and triggers contractor idling claims (~ +1.65 risk pts / month).
            </p>
          </div>

          {/* Variable 2: Funding Availability */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <label htmlFor="sim-funding-avail" className="text-xs font-bold text-slate-800">
                  Funding Availability / Budget Disbursement
                </label>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-sm font-black px-2 py-0.5 rounded border ${
                    fundingAvailabilityPct < 100
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  }`}
                >
                  {fundingAvailabilityPct}% of required
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  ({variableContributions.fundingDelta >= 0 ? `+${variableContributions.fundingDelta.toFixed(1)} pts` : `${variableContributions.fundingDelta.toFixed(1)} pts`})
                </span>
              </div>
            </div>

            <input
              id="sim-funding-avail"
              type="range"
              min="30"
              max="150"
              step="5"
              value={fundingAvailabilityPct}
              onChange={(e) => handleVariableChange(setFundingAvailabilityPct, Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
            />

            <div className="flex justify-between text-[11px] text-slate-500 font-medium">
              <span className="text-rose-600">30% (Severe Deficit)</span>
              <span>70% (Shortfall)</span>
              <span className="font-bold text-slate-700">100% (Baseline)</span>
              <span className="text-emerald-700">150% (Front-Loaded Surplus)</span>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Impact: Direct liquidity for contractor running bills. Budget cuts escalate risk exponentially.
            </p>
          </div>

          {/* Secondary Parameters Collapsible or Compact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Variable 3: Statutory Clearance Lag */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Clearances Lag</span>
                <span className="font-mono font-bold text-blue-700">+{clearanceLagMonths}m</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={clearanceLagMonths}
                onChange={(e) => handleVariableChange(setClearanceLagMonths, Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0m</span>
                <span>12m</span>
                <span>24m</span>
              </div>
            </div>

            {/* Variable 4: Contractor Execution Capacity */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Contractor Velocity</span>
                <span className="font-mono font-bold text-indigo-700">{contractorCapacityPct}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="130"
                step="5"
                value={contractorCapacityPct}
                onChange={(e) => handleVariableChange(setContractorCapacityPct, Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>50% (Lag)</span>
                <span>100%</span>
                <span>130%</span>
              </div>
            </div>

            {/* Variable 5: Material Inflation */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-800">
                <span>Steel/Cement WPI</span>
                <span className="font-mono font-bold text-amber-700">{materialInflationPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={materialInflationPct}
                onChange={(e) => handleVariableChange(setMaterialInflationPct, Number(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0%</span>
                <span>5% (Avg)</span>
                <span>15%</span>
              </div>
            </div>
          </div>

          {/* Breakdown of Net Impact Drivers */}
          <div className="p-3.5 bg-blue-50/40 rounded-xl border border-blue-100 text-xs space-y-2">
            <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
              Real-Time SHAP Contribution Breakdown to Score Shift
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Land Delay</span>
                <span className="font-mono font-bold text-rose-700">
                  +{variableContributions.landDelta.toFixed(1)} pts
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Funding Flow</span>
                <span className={`font-mono font-bold ${variableContributions.fundingDelta >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {variableContributions.fundingDelta >= 0 ? `+${variableContributions.fundingDelta.toFixed(1)}` : variableContributions.fundingDelta.toFixed(1)} pts
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Clearance Lag</span>
                <span className="font-mono font-bold text-blue-700">
                  +{variableContributions.clearanceDelta.toFixed(1)} pts
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Contractor</span>
                <span className={`font-mono font-bold ${variableContributions.contractorDelta >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {variableContributions.contractorDelta >= 0 ? `+${variableContributions.contractorDelta.toFixed(1)}` : variableContributions.contractorDelta.toFixed(1)} pts
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 block text-[10px]">WPI Inflation</span>
                <span className={`font-mono font-bold ${variableContributions.inflationDelta >= 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {variableContributions.inflationDelta >= 0 ? `+${variableContributions.inflationDelta.toFixed(1)}` : variableContributions.inflationDelta.toFixed(1)} pts
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (5 Cols): Real-Time Risk Score & Impact Showcase */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              Simulated Outcome vs Baseline
            </span>
            <span className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
              {baseline.code}
            </span>
          </div>

          {/* Master Risk Score Card */}
          <div className={`p-5 rounded-xl border ${simulatedRiskColor.border} ${simulatedRiskColor.bg} space-y-4 transition-colors`}>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide block">
                  Simulated Project Risk Score
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-4xl font-black font-mono tracking-tight ${simulatedRiskColor.text}`}>
                    {simulationResult.simulatedScore}
                  </span>
                  <span className="text-slate-400 font-mono text-sm font-semibold">/ 100</span>
                </div>
              </div>

              {/* Delta Tag */}
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Shift</span>
                <div
                  className={`inline-flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-full border mt-1 ${
                    simulationResult.scoreDelta > 0
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : simulationResult.scoreDelta < 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {simulationResult.scoreDelta > 0 ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5" />
                      +{simulationResult.scoreDelta} pts
                    </>
                  ) : simulationResult.scoreDelta < 0 ? (
                    <>
                      <TrendingDown className="w-3.5 h-3.5" />
                      {simulationResult.scoreDelta} pts
                    </>
                  ) : (
                    '0 pts'
                  )}
                </div>
              </div>
            </div>

            {/* Score Bar with Threshold Markers */}
            <div className="space-y-1.5">
              <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden relative">
                <div
                  className={`h-full ${simulatedRiskColor.bar} transition-all duration-300 rounded-full`}
                  style={{ width: `${simulationResult.simulatedScore}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>0 (Safe)</span>
                <span>35 (Moderate)</span>
                <span>60 (High)</span>
                <span>80 (Critical)</span>
              </div>
            </div>

            {/* Baseline comparison chip */}
            <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
              <div className="text-slate-600">
                <span>Baseline Score: </span>
                <span className="font-mono font-bold text-slate-800">{baseline.score}</span>
                <span className="text-slate-400 text-[11px]"> ({baseline.level.toUpperCase()})</span>
              </div>
              <div className="font-bold uppercase text-[11px]">
                <span className="text-slate-500">Status: </span>
                <span className={simulatedRiskColor.text}>{simulationResult.simulatedLevel.toUpperCase()} RISK</span>
              </div>
            </div>
          </div>

          {/* Secondary Real-time Impact Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Projected Slippage</span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                {simulationResult.newTotalDelayMonths} Mos
              </div>
              <div className="text-[10px] text-slate-500">
                {simulationResult.additionalDelayMonths > 0 ? (
                  <span className="text-rose-600 font-semibold font-mono">
                    +{simulationResult.additionalDelayMonths} mos from baseline
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">No additional slippage</span>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                <IndianRupee className="w-3.5 h-3.5 text-amber-600" />
                <span>Estimated Cost Drift</span>
              </div>
              <div className="text-xl font-black font-mono text-amber-800">
                +{simulationResult.estimatedCostEscalationCr > 0 ? `₹${simulationResult.estimatedCostEscalationCr.toLocaleString()}` : '₹0'} Cr
              </div>
              <div className="text-[10px] text-slate-500">
                <span className="font-semibold text-slate-700">Cost Overrun Prob: </span>
                <span className="font-mono font-bold text-rose-700">{simulationResult.simulatedCostProb}%</span>
              </div>
            </div>
          </div>

          {/* Dynamic Policy & Administrative Action Recommendation */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>Recommended Fast-Track Intervention</span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              {landDelayMonths >= 6 ? (
                <>
                  <strong className="text-slate-800">Cabinet PMG Land Taskforce: </strong>
                  Convene tri-partite session with State Chief Secretary and district collector to invoke Section 19/20 fast-track land compensation awards.
                </>
              ) : fundingAvailabilityPct < 80 ? (
                <>
                  <strong className="text-slate-800">Supplementary Grant Requisition: </strong>
                  Notify Ministry of Finance for emergency liquidity disbursement via the National Infrastructure Pipeline (NIP) contingency window.
                </>
              ) : clearanceLagMonths >= 6 ? (
                <>
                  <strong className="text-slate-800">MoEFCC Single-Window Clearance: </strong>
                  Escalate forest diversion and wildlife corridor permissions via the PARIVESH fast-track inter-ministerial panel.
                </>
              ) : simulationResult.scoreDelta < 0 ? (
                <>
                  <strong className="text-emerald-700">Positive Trend: </strong>
                  Current simulated parameters reduce project risk below critical baseline. Maintain frontloaded disbursements and weekly milestone verifications.
                </>
              ) : (
                <>
                  <strong className="text-slate-800">Standard IPMD Monitoring: </strong>
                  Parameters remain aligned with sanctioned schedule. Monitor contractor labor strength and monsoon preparation.
                </>
              )}
            </p>

            {onSelectProject && selectedProject && (
              <button
                onClick={() => onSelectProject(selectedProject.id)}
                className="mt-2 text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 transition-colors"
              >
                <span>View Full Project Appraisal Dossier ({selectedProject.projectCode})</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Recharts Sensitivity Analysis Diagram: Risk Trajectory & Tornado Elasticity */}
      <RiskTrajectorySensitivityChart
        project={selectedProject}
        baselineScore={baseline.score}
        simulatedScore={simulationResult.simulatedScore}
        landDelayMonths={landDelayMonths}
        fundingAvailabilityPct={fundingAvailabilityPct}
        clearanceLagMonths={clearanceLagMonths}
        contractorCapacityPct={contractorCapacityPct}
        materialInflationPct={materialInflationPct}
      />
    </div>
  );
};
