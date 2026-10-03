import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CircleDot, 
  Calendar, 
  Layers, 
  TrendingUp, 
  ChevronRight,
  ShieldAlert,
  Building2,
  Info,
  Check,
  FileCheck,
  Landmark,
  Hammer,
  Truck,
  Zap,
  Flag
} from 'lucide-react';
import { Project, Milestone } from '../types';

export interface MilestoneStage {
  id: string;
  name: string;
  category: 'Clearance' | 'Land' | 'Finance' | 'Procurement' | 'Construction' | 'Commissioning';
  plannedDate: string;
  actualDate?: string;
  status: 'completed' | 'in_progress' | 'delayed' | 'upcoming';
  progressPct: number;
  delayDays: number;
  description: string;
  responsibleAgency?: string;
  isCriticalPath?: boolean;
}

interface ProjectTimelineProps {
  project: Project;
  onUpdateMilestone?: (milestoneId: string, status: string) => void;
}

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project }) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [timelineMode, setTimelineMode] = useState<'lifecycle' | 'contractual'>('lifecycle');

  // Derive standardized lifecycle milestones combining statutory gates (Land Acquisition, Financial Closure, Construction, etc.)
  const lifecycleMilestones = useMemo<MilestoneStage[]>(() => {
    const startDate = project.originalStartDate || '2022-01-01';
    const targetDate = project.currentCompletionDate || project.anticipatedCompletionDate || '2027-12-31';
    const physicalProg = project.physicalProgress || 0;
    const isDelayed = project.delayMonths > 0;

    // Estimate realistic lifecycle phase completions based on physical progress & project attributes
    const stages: MilestoneStage[] = [
      {
        id: 'stage-1-dpr',
        name: 'DPR & Feasibility Sanction',
        category: 'Clearance',
        plannedDate: startDate,
        actualDate: startDate,
        status: 'completed',
        progressPct: 100,
        delayDays: 0,
        description: 'Comprehensive Detailed Project Report (DPR) approved by Line Ministry and Expenditure Finance Committee (EFC).',
        responsibleAgency: project.ministry,
        isCriticalPath: false,
      },
      {
        id: 'stage-2-land',
        name: 'Land Acquisition & RoW',
        category: 'Land',
        plannedDate: '2022-09-30',
        actualDate: physicalProg >= 40 ? '2023-04-15' : undefined,
        status: physicalProg >= 85 ? 'completed' : physicalProg >= 30 ? 'in_progress' : isDelayed ? 'delayed' : 'in_progress',
        progressPct: Math.min(100, Math.max(35, Math.round(physicalProg * 1.05))),
        delayDays: isDelayed ? Math.min(project.delayMonths * 12, 180) : 0,
        description: 'Right of Way (RoW) acquisition, Section 11 compensation disbursement, and physical site handover.',
        responsibleAgency: `${project.state} State Revenue Dept / NHAI / Railways`,
        isCriticalPath: true,
      },
      {
        id: 'stage-3-statutory',
        name: 'Statutory Clearances',
        category: 'Clearance',
        plannedDate: '2023-03-31',
        actualDate: physicalProg >= 70 ? '2023-11-20' : undefined,
        status: physicalProg >= 75 ? 'completed' : isDelayed ? 'delayed' : 'in_progress',
        progressPct: Math.min(100, Math.max(45, Math.round(physicalProg * 0.95))),
        delayDays: isDelayed ? Math.min(project.delayMonths * 18, 270) : 0,
        description: 'Stage-II Forest diversion, wildlife sanctuary eco-sensitive buffer clearance, and MoEF&CC environmental sanction.',
        responsibleAgency: 'MoEF&CC / State Forest Dept',
        isCriticalPath: true,
      },
      {
        id: 'stage-4-finance',
        name: 'Financial Closure & Budgetary Sanction',
        category: 'Finance',
        plannedDate: '2023-06-30',
        actualDate: '2023-08-15',
        status: 'completed',
        progressPct: 100,
        delayDays: 45,
        description: `Cabinet Committee on Economic Affairs (CCEA) capital grant allocated. Sanctioned outlay: ₹${project.originalCost.toLocaleString()} Cr (Revised: ₹${project.revisedCost.toLocaleString()} Cr).`,
        responsibleAgency: 'Ministry of Finance / PMO',
        isCriticalPath: false,
      },
      {
        id: 'stage-5-epc',
        name: 'EPC Tendering & Award',
        category: 'Procurement',
        plannedDate: '2023-12-15',
        actualDate: '2024-02-10',
        status: 'completed',
        progressPct: 100,
        delayDays: 55,
        description: 'FIDIC/HAM EPC civil works package bidding awarded to Tier-1 infrastructure contracting consortia.',
        responsibleAgency: project.implementingAgency || 'Central Executing Agency',
        isCriticalPath: false,
      },
      {
        id: 'stage-6-construction',
        name: 'Main Civil Construction',
        category: 'Construction',
        plannedDate: '2025-12-31',
        actualDate: physicalProg >= 98 ? targetDate : undefined,
        status: physicalProg >= 95 ? 'completed' : physicalProg >= 20 ? 'in_progress' : 'upcoming',
        progressPct: physicalProg,
        delayDays: isDelayed ? project.delayMonths * 30 : 0,
        description: 'Core structural execution: earthworks, tunneling, viaducts, sub-grade ballast, and heavy MEP installation.',
        responsibleAgency: project.implementingAgency || 'EPC Contractor Consortia',
        isCriticalPath: true,
      },
      {
        id: 'stage-7-testing',
        name: 'Integration, Trial Runs & Safety Audit',
        category: 'Commissioning',
        plannedDate: targetDate,
        status: physicalProg >= 95 ? 'in_progress' : 'upcoming',
        progressPct: physicalProg >= 90 ? Math.round((physicalProg - 90) * 10) : 0,
        delayDays: isDelayed ? Math.min(project.delayMonths * 8, 120) : 0,
        description: 'Signaling synchronization, statutory Commission of Railway Safety (CRS) or statutory safety inspection.',
        responsibleAgency: 'Commissioner of Metro / Railway Safety / CEA',
        isCriticalPath: true,
      },
      {
        id: 'stage-8-cod',
        name: 'Commercial Commissioning (COD)',
        category: 'Commissioning',
        plannedDate: targetDate,
        status: project.projectStatus === 'Completed' ? 'completed' : 'upcoming',
        progressPct: project.projectStatus === 'Completed' ? 100 : 0,
        delayDays: isDelayed ? project.delayMonths * 30 : 0,
        description: 'Final commercial operation handover, project dedication to the nation, and asset capitalization on OCMS register.',
        responsibleAgency: project.ministry,
        isCriticalPath: true,
      },
    ];

    return stages;
  }, [project]);

  // Contractual milestones from project.milestones
  const contractualMilestones = useMemo<MilestoneStage[]>(() => {
    if (!project.milestones || project.milestones.length === 0) {
      return lifecycleMilestones;
    }

    return project.milestones.map((m: any, idx) => {
      const isDone = m.status === 'completed';
      const isDelayed = m.status === 'delayed' || m.delayDays > 0 || (m.varianceDays && m.varianceDays > 0);
      const delay = m.delayDays || m.varianceDays || 0;

      return {
        id: m.id || `m-${idx}`,
        name: m.name || m.title || `Milestone ${idx + 1}`,
        category: 'Construction',
        plannedDate: m.plannedDate || '2025-06-30',
        actualDate: m.actualDate || (isDone ? m.plannedDate : undefined),
        status: isDone ? 'completed' : isDelayed ? 'delayed' : 'in_progress',
        progressPct: isDone ? 100 : 60,
        delayDays: delay,
        description: m.description || m.remarks || 'Contractual schedule milestone delivery target monitored under OCMS guidelines.',
        responsibleAgency: project.implementingAgency,
        isCriticalPath: idx === 0 || idx === project.milestones.length - 1,
      };
    });
  }, [project, lifecycleMilestones]);

  const activeMilestoneList = timelineMode === 'lifecycle' ? lifecycleMilestones : contractualMilestones;

  // Selected or first milestone
  const activeSelected = useMemo(() => {
    if (!selectedMilestoneId) return activeMilestoneList[1] || activeMilestoneList[0];
    return activeMilestoneList.find((m) => m.id === selectedMilestoneId) || activeMilestoneList[0];
  }, [activeMilestoneList, selectedMilestoneId]);

  // Overall timeline track progress calculation
  const completedCount = activeMilestoneList.filter((m) => m.status === 'completed').length;
  const inProgressCount = activeMilestoneList.filter((m) => m.status === 'in_progress').length;
  const delayedCount = activeMilestoneList.filter((m) => m.status === 'delayed').length;
  const overallTrackProgress = Math.round((completedCount / activeMilestoneList.length) * 100);

  const getStageIcon = (category: string) => {
    switch (category) {
      case 'Land':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'Finance':
        return <FileCheck className="w-3.5 h-3.5" />;
      case 'Clearance':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'Procurement':
        return <Truck className="w-3.5 h-3.5" />;
      case 'Construction':
        return <Hammer className="w-3.5 h-3.5" />;
      case 'Commissioning':
        return <Flag className="w-3.5 h-3.5" />;
      default:
        return <CircleDot className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-6">
      {/* Top Header Card */}
      <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              Milestone Delivery Engine
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">
              Statutory Critical Path Tracker
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-700" />
            Project Milestone Timeline & Progress Track
          </h3>

          <p className="text-xs text-slate-500 mt-0.5">
            Sequential execution pipeline tracking statutory clearances, land acquisition, financial closure, and commissioning targets.
          </p>
        </div>

        {/* View Toggle & Summary Metrics */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTimelineMode('lifecycle');
                setSelectedMilestoneId(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timelineMode === 'lifecycle'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lifecycle Track (8 Stages)
            </button>
            <button
              type="button"
              onClick={() => {
                setTimelineMode('contractual');
                setSelectedMilestoneId(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                timelineMode === 'contractual'
                  ? 'bg-white text-blue-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contractual Milestones ({project.milestones.length})
            </button>
          </div>
        </div>
      </div>

      {/* Timeline High-Level Metrics Summary Strip */}
      <div className="px-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Stage Completion
            </span>
            <span className="text-base font-bold text-slate-900 font-mono">
              {completedCount} / {activeMilestoneList.length}
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-blue-700">
              {overallTrackProgress}%
            </span>
            <span className="text-[10px] text-slate-400 block">Progress</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Active Stage
            </span>
            <span className="text-xs font-bold text-blue-800 line-clamp-1">
              {activeMilestoneList.find((m) => m.status === 'in_progress')?.name || 'Civil Works'}
            </span>
          </div>
          <CircleDot className="w-4 h-4 text-blue-600 shrink-0 animate-pulse" />
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Delayed Milestones
            </span>
            <span className={`text-base font-bold font-mono ${delayedCount > 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              {delayedCount} Stage{delayedCount === 1 ? '' : 's'}
            </span>
          </div>
          {delayedCount > 0 ? (
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Net Schedule Drift
            </span>
            <span className={`text-base font-bold font-mono ${project.delayMonths > 0 ? 'text-amber-700' : 'text-slate-800'}`}>
              {project.delayMonths > 0 ? `+${project.delayMonths} Months` : 'On Target'}
            </span>
          </div>
          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </div>

      {/* --- VISUAL PROGRESS TRACK --- */}
      <div className="px-5 pt-2 pb-4 overflow-x-auto">
        <div className="min-w-[760px] pb-4">
          {/* Track Nodes Bar */}
          <div className="relative flex items-center justify-between">
            {/* Background Connecting Line */}
            <div className="absolute left-6 right-6 top-5 h-1 bg-slate-200 -z-0" />

            {/* Active Colored Progress Line */}
            <div
              className="absolute left-6 top-5 h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 transition-all duration-500 -z-0"
              style={{
                width: `${Math.max(0, Math.min(100, (completedCount / (activeMilestoneList.length - 1)) * 100))}%`,
              }}
            />

            {/* Stage Steps */}
            {activeMilestoneList.map((stage, idx) => {
              const isSelected = activeSelected.id === stage.id;
              const isDone = stage.status === 'completed';
              const isCurrent = stage.status === 'in_progress';
              const isDelayed = stage.status === 'delayed';

              return (
                <div
                  key={stage.id}
                  className="flex flex-col items-center relative z-10 cursor-pointer group"
                  onClick={() => setSelectedMilestoneId(stage.id)}
                  style={{ width: `${100 / activeMilestoneList.length}%` }}
                >
                  {/* Step Node Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs border-2 ${
                      isSelected
                        ? 'ring-4 ring-blue-500/20 scale-110'
                        : 'group-hover:scale-105'
                    } ${
                      isDone
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : isDelayed
                        ? 'bg-rose-500 border-rose-500 text-white animate-pulse'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white ring-4 ring-blue-200'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                    title={`${stage.name} - ${stage.status.toUpperCase()}`}
                  >
                    {isDone ? (
                      <Check className="w-5 h-5 stroke-[3]" />
                    ) : isDelayed ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : isCurrent ? (
                      <span className="font-mono text-xs font-bold">{idx + 1}</span>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-slate-400">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Label */}
                  <div className="text-center mt-3 px-1 w-full">
                    <span
                      className={`block text-[11px] font-bold line-clamp-2 leading-tight transition-colors ${
                        isSelected
                          ? 'text-blue-900 font-extrabold'
                          : isDone
                          ? 'text-slate-800'
                          : isCurrent
                          ? 'text-blue-700 font-bold'
                          : 'text-slate-500'
                      }`}
                    >
                      {stage.name}
                    </span>

                    <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                      {stage.plannedDate.substring(0, 7)}
                    </span>

                    {/* Status Pill Indicator */}
                    <span
                      className={`inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded mt-1 ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDelayed
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : isCurrent
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {stage.status === 'in_progress' ? 'Active' : stage.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- DETAILED INSPECTOR CARD FOR SELECTED MILESTONE --- */}
      {activeSelected && (
        <div className="mx-5 mb-5 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                  {getStageIcon(activeSelected.category)}
                  <span>{activeSelected.category} Stage</span>
                </span>
                {activeSelected.isCriticalPath && (
                  <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                    Statutory Critical Path
                  </span>
                )}
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                    activeSelected.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : activeSelected.status === 'delayed'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {activeSelected.status.replace('_', ' ')}
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900">
                {activeSelected.name}
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                {activeSelected.description}
              </p>
            </div>

            {/* Quick Metrics on Right */}
            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Stage Execution Progress
              </span>
              <span className="text-xl font-bold font-mono text-blue-700">
                {activeSelected.progressPct}%
              </span>
              <div className="w-28 bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1 sm:ml-auto">
                <div
                  className="bg-blue-600 h-full rounded-full"
                  style={{ width: `${activeSelected.progressPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Key Schedule Attributes Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Planned Date
              </span>
              <span className="text-slate-800 font-semibold block mt-0.5">
                {activeSelected.plannedDate}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Actual / Revised
              </span>
              <span className={`font-semibold block mt-0.5 ${activeSelected.status === 'delayed' ? 'text-rose-600' : 'text-slate-800'}`}>
                {activeSelected.actualDate || (activeSelected.status === 'completed' ? activeSelected.plannedDate : 'In Execution')}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Delay Slippage
              </span>
              <span className={`font-semibold block mt-0.5 ${activeSelected.delayDays > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                {activeSelected.delayDays > 0 ? `+${activeSelected.delayDays} days` : '0 days (On Schedule)'}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">
                Responsible Agency
              </span>
              <span className="text-slate-800 text-[11px] block mt-0.5 truncate" title={activeSelected.responsibleAgency}>
                {activeSelected.responsibleAgency || project.implementingAgency}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
