import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Share2, 
  Calendar, 
  Building2, 
  MapPin, 
  AlertTriangle, 
  FileText, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Layers, 
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Project, Intervention } from '../types';
import { RiskBadge } from './RiskBadge';
import { StatusBadge } from './StatusBadge';
import { DataQualityBadge } from './DataQualityBadge';
import { CostComparisonChart } from './charts/CostComparisonChart';
import { MonthlyProgressChart } from './charts/MonthlyProgressChart';
import { ShapWaterfallChart } from './charts/ShapWaterfallChart';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
  onAddIntervention?: (intervention: Partial<Intervention>) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  onBack,
  onAddIntervention,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'progress' | 'risk_shap' | 'milestones' | 'interventions' | 'audit'
  >('overview');

  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [newInterventionTitle, setNewInterventionTitle] = useState('');
  const [newInterventionType, setNewInterventionType] = useState('Inter-Ministerial PMG');
  const [newInterventionDesc, setNewInterventionDesc] = useState('');

  const costEscalationCr = project.revisedCost - project.originalCost;

  const handleSaveIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterventionTitle.trim()) return;

    if (onAddIntervention) {
      onAddIntervention({
        projectId: project.id,
        projectName: project.name,
        actionType: newInterventionType as any,
        title: newInterventionTitle,
        description: newInterventionDesc,
        currentStatus: 'under_review',
        assignedMinistry: project.ministry,
        targetResolutionDate: '2026-11-30',
        impactExpected: 'Expedite pending forest diversion clearance',
      });
    }

    setShowInterventionModal(false);
    setNewInterventionTitle('');
    setNewInterventionDesc('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            className="flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 transition-colors p-1 -ml-1 rounded hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Monitored Registry</span>
          </button>
          <span>/</span>
          <span className="text-slate-400 font-mono">{project.projectCode}</span>
          <span>/</span>
          <span className="text-slate-800 font-medium truncate max-w-xs">{project.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors shadow-2xs"
            title="Export / Print Executive PDF Dossier"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Dossier</span>
          </button>

          <button
            onClick={() => {
              const text = `PAIMANA Dossier: [${project.projectCode}] ${project.name} | Risk Score: ${project.riskScore}/100`;
              navigator.clipboard.writeText(text);
              alert('Dossier executive link copied to clipboard.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Share</span>
          </button>

          <button
            onClick={() => setShowInterventionModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Initiate Intervention</span>
          </button>
        </div>
      </div>

      {/* Project Header Dossier Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded">
                {project.projectCode}
              </span>
              <RiskBadge level={project.riskLevel} score={project.riskScore} size="md" />
              <StatusBadge status={project.projectStatus} size="md" />
              <DataQualityBadge
                score={project.dataQualityScore}
                missingMandatoryFields={project.missingMandatoryFields}
                issues={project.dataQualityIssues}
                size="md"
              />
              <span className="text-xs text-slate-400 font-mono">
                Sanctioned: {project.sanctionDate}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {project.implementingAgency}
              </span>
              <span className="text-slate-300">•</span>
              <span>{project.ministry}</span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.state} ({project.district})
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-mono">
                Reporting Month: {project.reportingMonth}
              </span>
            </div>
          </div>

          {/* Quick Critical Metric Pillar */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl shrink-0">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Cost Escalation
              </span>
              <span className="font-mono font-extrabold text-base text-rose-600">
                +{project.costOverrunPct.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-500 block font-mono">
                +₹{costEscalationCr.toLocaleString()} Cr
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Schedule Delay
              </span>
              <span className="font-mono font-extrabold text-base text-amber-700">
                {project.delayMonths} mos
              </span>
              <span className="text-[10px] text-slate-500 block">
                Anticipated: {project.anticipatedCompletionDate.substring(0, 7)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality Statutory Warning Callout */}
      {project.missingMandatoryFields && project.missingMandatoryFields.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold text-amber-900">
              Statutory Ingestion Warning: Missing Mandatory Project Attributes
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              This project record is missing mandatory statutory parameter(s):{' '}
              {project.missingMandatoryFields.map((field) => (
                <code key={field} className="bg-amber-100 text-amber-950 px-1.5 py-0.5 rounded font-mono font-bold text-[11px] mr-1">
                  {field}
                </code>
              ))}
              . Schedule slippage baseline calculation and IPMD quarterly risk attribution are impaired until this parameter is uploaded.
            </p>
          </div>
        </div>
      )}

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Original Sanction
          </span>
          <span className="text-base font-bold font-mono text-slate-800">
            ₹{project.originalCost.toLocaleString()} Cr
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Cabinet Sanction</span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Anticipated Outlay
          </span>
          <span className="text-base font-bold font-mono text-amber-700">
            ₹{project.revisedCost.toLocaleString()} Cr
          </span>
          <span className="text-[10px] text-rose-600 block mt-0.5 font-medium">
            +₹{costEscalationCr.toLocaleString()} Cr
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Cumulative Expenditure
          </span>
          <span className="text-base font-bold font-mono text-teal-700">
            ₹{project.cumulativeExpenditure.toLocaleString()} Cr
          </span>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {((project.cumulativeExpenditure / project.revisedCost) * 100).toFixed(1)}% disbursed
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Physical Progress
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-blue-700">
              {project.physicalProgress}%
            </span>
            <span className="text-[10px] text-slate-400">/ 100%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${project.physicalProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Financial Progress
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold font-mono text-teal-700">
              {project.financialProgress}%
            </span>
            <span className="text-[10px] text-slate-400">/ 100%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-teal-600 h-full rounded-full" style={{ width: `${project.financialProgress}%` }} />
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Target Commissioning
          </span>
          <span className="text-xs font-bold font-mono text-slate-900 block truncate">
            {project.anticipatedCompletionDate}
          </span>
          <span className="text-[10px] text-amber-700 block mt-0.5">
            Original: {project.originalCompletionDate}
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto text-xs no-print">
        {[
          { id: 'overview', label: 'Executive Dossier & Narrative' },
          { id: 'progress', label: 'S-Curve Progress & Capital' },
          { id: 'risk_shap', label: 'Explainable AI Risk Engine (SHAP)' },
          { id: 'milestones', label: `Milestones (${project.milestones.length})` },
          { id: 'interventions', label: `Interventions (${project.interventions.length})` },
          { id: 'audit', label: 'Data Quality & Audit Trail' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.id
                ? 'border-blue-700 text-blue-800 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Analytical Narrative */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-700" />
                  IPMD Project Synthesis & Background
                </h3>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {project.description}
                </p>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Systemic Bottlenecks & Delay Factors:
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200">
                    {project.delayReasons || 'No chronic systemic impediment logged in current cycle.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900">
                    Remedial Actions Initiated:
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/60 p-3 rounded-lg border border-blue-200">
                    {project.remedialActions || 'Periodic site inspections by Project Director and Divisional Railway Manager.'}
                  </p>
                </div>
              </div>

              {/* Cost Comparison Visual */}
              <CostComparisonChart
                originalCost={project.originalCost}
                revisedCost={project.revisedCost}
                expenditure={project.cumulativeExpenditure}
                unit="₹ Cr"
                title="Capital Outlay Escalation Profile"
                subtitle="Approved Sanction vs Anticipated Completion vs Cumulative Outflow"
              />
            </div>

            {/* Right: Key Risk Drivers & Recommended Interventions */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Key Predictive Risk Drivers
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Model: {project.riskAssessment.modelVersion}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {project.riskAssessment.topDrivers.map((driver, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-slate-800">{driver.factorName}</span>
                        <span className={`font-mono font-bold text-[11px] ${
                          driver.direction === 'increasing' ? 'text-rose-600' : 'text-emerald-600'
                        }`}>
                          {driver.direction === 'increasing' ? `+${driver.contribution}%` : `-${driver.contribution}%`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {driver.description}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-1">
                    Cabinet Recommended Action:
                  </h4>
                  <p className="text-xs text-blue-900 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 font-medium">
                    {project.riskAssessment.recommendedAction}
                  </p>
                </div>
              </div>

              {/* Administrative Dossier Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900">
                  Statutory & Administrative Particulars
                </h3>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Nodal Officer:</span>
                    <span className="font-medium text-slate-900">{project.nodalOfficer.name}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Designation:</span>
                    <span className="text-slate-700">{project.nodalOfficer.designation}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Contact Email:</span>
                    <span className="font-mono text-blue-700">{project.nodalOfficer.email}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Contractor / Lead EPC:</span>
                    <span className="text-slate-800 font-medium">{project.contractorName || 'Joint Venture'}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Geo Coordinates:</span>
                    <span className="font-mono text-slate-600">{project.latitude.toFixed(4)}°N, {project.longitude.toFixed(4)}°E</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Progress & S-Curve */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <MonthlyProgressChart
            snapshots={project.monthlyHistory}
            title={`${project.name} - Monthly Execution Trajectory`}
            subtitle="Comparing Planned vs Actual Milestones (Physical) and Budget Disbursal (Financial)"
          />

          {/* Historical Data Table */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              12-Month Audited Progress Register
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Month</th>
                    <th className="p-2.5 text-right">Physical Plan</th>
                    <th className="p-2.5 text-right">Physical Actual</th>
                    <th className="p-2.5 text-right">Financial Plan</th>
                    <th className="p-2.5 text-right">Financial Actual</th>
                    <th className="p-2.5 text-right">Monthly Outlay</th>
                    <th className="p-2.5">Remarks / Bottlenecks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-xs">
                  {project.monthlyHistory.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">{s.reportingMonth}</td>
                      <td className="p-2.5 text-right text-slate-500">{s.plannedPhysicalProgress}%</td>
                      <td className="p-2.5 text-right font-bold text-blue-700">{s.actualPhysicalProgress}%</td>
                      <td className="p-2.5 text-right text-slate-500">{s.plannedFinancialProgress}%</td>
                      <td className="p-2.5 text-right font-bold text-teal-700">{s.actualFinancialProgress}%</td>
                      <td className="p-2.5 text-right">₹{s.monthlyExpenditure} Cr</td>
                      <td className="p-2.5 font-sans text-slate-600 truncate max-w-xs">{s.remarks || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Explainable AI (SHAP) */}
      {activeTab === 'risk_shap' && (
        <div className="space-y-6">
          <ShapWaterfallChart
            factors={project.riskAssessment.topDrivers}
            overallScore={project.riskScore}
            confidenceScore={project.riskAssessment.predictionConfidence}
            modelVersion={project.riskAssessment.modelVersion}
            assessmentDate={project.riskAssessment.assessmentDate}
          />

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h4 className="text-sm font-bold text-slate-900">
              Prescriptive Recommendations & Mitigation Pathways
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                <span className="font-bold text-blue-900 block">
                  Short-Term Escalation (30 Days):
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Convene bilateral review between Ministry of Railways, NHSRCL, and State Forest Department to clear residual clearances. Link milestone disbursals to Stage-II handover.
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <span className="font-bold text-emerald-900 block">
                  Medium-Term Contractual Recourse (90 Days):
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Establish dispute resolution committee for price escalation claims under Clause 70 (FIDIC / EPC standard) to prevent arbitration halts and contractor demobilization.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Milestones Timeline */}
      {activeTab === 'milestones' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Contractual Key Milestones & Completion Schedule
            </h3>
            <span className="text-xs text-slate-500">
              {project.milestones.filter((m) => m.status === 'completed').length} of {project.milestones.length} Completed
            </span>
          </div>

          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200 pt-2">
            {project.milestones.map((m, idx) => {
              const isDone = m.status === 'completed';
              const isDelayed = m.status === 'delayed';

              return (
                <div key={m.id} className="relative flex items-start gap-4 pl-8">
                  <div
                    className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white shrink-0 ${
                      isDone
                        ? 'bg-emerald-600'
                        : isDelayed
                        ? 'bg-rose-600'
                        : 'bg-blue-600'
                    }`}
                  />
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{m.title}</span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isDelayed
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {m.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px] text-slate-600 my-2">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Planned:</span>
                        <span>{m.plannedDate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Actual / Revised:</span>
                        <span className={isDelayed ? 'text-rose-600 font-bold' : ''}>
                          {m.actualDate || 'In Progress'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Delay Variance:</span>
                        <span className={m.varianceDays > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                          {m.varianceDays > 0 ? `+${m.varianceDays} days` : 'On Time'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-600 text-xs mt-1">
                      {m.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 5: Interventions */}
      {activeTab === 'interventions' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Intervention & Dispute Escalation Matrix
              </h3>
              <p className="text-xs text-slate-500">
                High-level inter-ministerial actions tracked via Project Monitoring Group (PMG)
              </p>
            </div>
            <button
              onClick={() => setShowInterventionModal(true)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-medium text-xs rounded-lg transition-colors"
            >
              + Log New Action
            </button>
          </div>

          <div className="space-y-3">
            {project.interventions.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                No active interventions currently open for this project.
              </p>
            ) : (
              project.interventions.map((item) => (
                <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                          {item.actionType}
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          Target: {item.targetResolutionDate}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.title}</h4>
                    </div>

                    <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      {item.currentStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-slate-700 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                    <span>Assigned Ministry: <strong>{item.assignedMinistry}</strong></span>
                    <span>Expected Impact: <strong className="text-emerald-700">{item.impactExpected}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-sm font-bold text-slate-900">
            Data Provenance, Quality & Statutory Sign-Off
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase block font-semibold">Data Freshness</span>
              <span className="font-mono font-bold text-slate-800">Last Synced: {project.lastUpdated}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block font-semibold">Reporting Frequency</span>
              <span className="font-bold text-slate-800">Monthly Statutory Submission</span>
            </div>
            <div>
              <span className="text-slate-400 text-[10px] uppercase block font-semibold">Verification Standard</span>
              <span className="font-bold text-emerald-700">Digital Signature Verified (NIC)</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Event / Revision</th>
                  <th className="p-2.5">Authorized Officer</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td className="p-2.5 font-mono">2026-08-15</td>
                  <td className="p-2.5 font-medium text-slate-900">Monthly Flash Report Submission (August 2026)</td>
                  <td className="p-2.5">{project.nodalOfficer.name}</td>
                  <td className="p-2.5"><span className="text-emerald-700 font-semibold">Approved</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">2026-07-14</td>
                  <td className="p-2.5 font-medium text-slate-900">ML Risk Rescoring & SHAP Feature Weight Re-evaluation</td>
                  <td className="p-2.5">IPMD Predictive Engine (Automated)</td>
                  <td className="p-2.5"><span className="text-blue-700 font-semibold">Indexed</span></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-mono">2026-06-10</td>
                  <td className="p-2.5 font-medium text-slate-900">Revised Cost Estimate (RCE-III) Approval</td>
                  <td className="p-2.5">Cabinet Committee on Economic Affairs</td>
                  <td className="p-2.5"><span className="text-slate-900 font-semibold">Statutory Sanction</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Intervention Modal */}
      {showInterventionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Log Inter-Ministerial Escalation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Direct submission to the Cabinet Secretariat Project Monitoring Group (PMG)
            </p>

            <form onSubmit={handleSaveIntervention} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Intervention Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Expedite Section 11 Forest Rights Act NOC"
                  value={newInterventionTitle}
                  onChange={(e) => setNewInterventionTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Escalation Mechanism
                </label>
                <select
                  value={newInterventionType}
                  onChange={(e) => setNewInterventionType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Inter-Ministerial PMG">Inter-Ministerial PMG (Cabinet Sec)</option>
                  <option value="Land Acquisition Fast-Track">Land Acquisition / State Chief Secretary</option>
                  <option value="Statutory Clearance Push">MoEF&CC Environmental Clearance</option>
                  <option value="Contractor Dispute Mediation">Contractor Dispute & Price Arbitration</option>
                  <option value="Cabinet Note">Cabinet Note on Revised Outlay (RCE)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Justification & Specific Action Requested
                </label>
                <textarea
                  rows={3}
                  placeholder="Detail the critical impediment and exact inter-agency coordination needed..."
                  value={newInterventionDesc}
                  onChange={(e) => setNewInterventionDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInterventionModal(false)}
                  className="px-3.5 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-semibold shadow-xs"
                >
                  Submit Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
