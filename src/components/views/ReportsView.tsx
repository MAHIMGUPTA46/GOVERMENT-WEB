import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Building2,
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  FileCheck,
  Search,
  Sparkles,
  Layers,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { Project } from '../../types';
import { RiskBadge } from '../RiskBadge';
import { StatusBadge } from '../StatusBadge';
import { generateProjectPdfBrief, generateGenericReportPdf } from '../../utils/generatePdfBrief';

interface ReportsViewProps {
  projects: Project[];
  reportingMonth: string;
  onSelectProject?: (id: string) => void;
}

type ReportType = 'project_brief' | 'flash' | 'parliament' | 'ccea';

export const ReportsView: React.FC<ReportsViewProps> = ({ 
  projects, 
  reportingMonth,
  onSelectProject 
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('project_brief');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    // Default to first critical project or first available project
    const critical = projects.find((p) => p.riskLevel === 'critical' || p.riskScore >= 75);
    return critical ? critical.id : projects[0]?.id || '';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Active selected project
  const selectedProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0] || null;
  }, [projects, selectedProjectId]);

  // Filtered project list for selector dropdown
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;
    const term = searchTerm.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.projectCode.toLowerCase().includes(term) ||
        p.ministry.toLowerCase().includes(term) ||
        p.sector.toLowerCase().includes(term)
    );
  }, [projects, searchTerm]);

  // Priority projects for quick chip selection
  const priorityProjects = useMemo(() => {
    return projects
      .filter((p) => p.riskLevel === 'critical' || p.costOverrunPct > 20 || p.delayMonths > 24)
      .slice(0, 5);
  }, [projects]);

  // Handlers for PDF generation
  const handleGenerateProjectPdf = () => {
    if (!selectedProject) return;
    setIsGeneratingPdf(true);
    try {
      generateProjectPdfBrief(selectedProject, reportingMonth);
      setPdfSuccessMessage(`Generated PDF Brief for [${selectedProject.projectCode}]`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate project PDF brief:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleGenerateGenericPdf = () => {
    setIsGeneratingPdf(true);
    try {
      const title =
        selectedReportType === 'flash'
          ? `MoSPI Monthly Flash Report - ${reportingMonth}`
          : selectedReportType === 'parliament'
          ? `Parliamentary Question Brief - ${reportingMonth}`
          : `CCEA Cabinet Memorandum - ${reportingMonth}`;
      
      generateGenericReportPdf(title, generateReportText(), reportingMonth);
      setPdfSuccessMessage(`Generated PDF Brief for ${title}`);
      setTimeout(() => setPdfSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to generate report PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const generateReportText = () => {
    if (selectedReportType === 'flash') {
      return `GOVERNMENT OF INDIA
MINISTRY OF STATISTICS AND PROGRAMME IMPLEMENTATION (MoSPI)
INFRASTRUCTURE AND PROJECT MONITORING DIVISION (IPMD)
------------------------------------------------------------
MONTHLY FLASH REPORT ON CENTRAL SECTOR PROJECTS (₹150 CRORE & ABOVE)
REPORTING CYCLE: ${reportingMonth.toUpperCase()}

1. EXECUTIVE OVERVIEW
   - Total Projects Monitored: 1,981 Projects
   - Original Sanctioned Cost: ₹27,56,400 Crore (₹27.56 Lakh Cr)
   - Anticipated Revised Cost: ₹32,18,900 Crore (₹32.18 Lakh Cr)
   - Total Anticipated Cost Escalation: ₹4,62,500 Crore (+16.76%)
   - Cumulative Expenditure to Date: ₹16,89,200 Crore (52.48% of revised outlays)

2. SCHEDULE PERFORMANCE & DELAYS
   - Total Delayed Projects: 824 Projects (41.6% of portfolio)
   - Ahead of Schedule / On Time: 865 Projects
   - Range of Delay: 1 month to 264 months (Mean: 36.4 months)
   - Projects without Sanctioned Commissioning Date: 292 Projects

3. CRITICAL RISK PROJECTS UNDER ML SURVEILLANCE
   - Projects in Critical Risk Tier (Score ≥ 75): 43 Projects
   - Key Drivers: Seismic / Geological tunneling hurdles, Stage-II Forest diversion delays, EPC price dispute arbitration.
   - Lead Time Advantage: 5.4 months early warning prior to formal revision.

4. TOP PROJECTS REQUIRING INTER-MINISTERIAL PMG RESOLUTION
   - PRJ-RLY-001: Udhampur-Srinagar-Baramulla Rail Link (Delay: 264m | Cost Esc: +1554.7%)
   - PRJ-WTR-004: Polavaram Multipurpose Irrigation Project (Delay: 144m | Cost Esc: +447.2%)
   - PRJ-HSR-002: Mumbai-Ahmedabad High Speed Rail (Delay: 48m | Cost Esc: +15.5%)

Generated via PAIMANA AI Decision Support Platform.`;
    } else if (selectedReportType === 'parliament') {
      return `LOK SABHA / RAJYA SABHA
UNSTARRED QUESTION BRIEFING NOTE - MINISTRY OF STATISTICS & PROGRAMME IMPLEMENTATION
SUBJECT: MONITORING OF COST AND TIME OVERRUNS IN INFRASTRUCTURE PROJECTS
CYCLE: ${reportingMonth}

QUESTION:
(a) Whether several mega infrastructure projects are experiencing severe time and cost overruns;
(b) The details of projects delayed by more than three years along with sectoral distribution;
(c) Remedial measures taken through the Online Computerised Monitoring System (OCMS) and PMG.

ANSWER / BRIEFING POINTS FOR HON'BLE MINISTER:
(a) Yes, Sir/Madam. As of ${reportingMonth}, out of 1,981 central sector infrastructure projects costing ₹150 crore and above, 824 projects have reported schedule delays against original commissioning dates. Aggregate cost escalation stands at 16.76%.

(b) Railway (248 projects) and Road Transport (785 projects) sectors constitute the largest volume of monitored assets. Projects experiencing delay exceeding 36 months include major high-altitude rail connectivity and complex river basin projects.

(c) Remedial interventions include:
    1. Rigorous monthly appraisal via PAIMANA AI predictive early-warning algorithms;
    2. Escalation to the Cabinet Secretariat Project Monitoring Group (PMG) for inter-ministerial resolution of forest/wildlife clearances;
    3. Mandatory site inspections and digital milestone tracking via OCMS portal.`;
    } else {
      return `CABINET COMMITTEE ON ECONOMIC AFFAIRS (CCEA) - RESTRICTED BRIEFING
MEMORANDUM ON SYSTEMIC DELAY AND CAPITAL REVISION IN MEGA INFRASTRUCTURE PROJECTS
PREPARED BY: INFRASTRUCTURE & PROJECT MONITORING DIVISION (MoSPI)

PROPOSAL:
Approval of Revised Cost Estimates (RCE) frameworks and establishment of Fast-Track Environmental Clearance Fast-Path for 43 Critical Projects.

BACKGROUND & SYSTEMIC ISSUES:
1. Aggregate capital escalation has reached ₹4.62 Lakh Crore, primarily concentrated in 8 mega infrastructure projects (>₹25,000 Cr outlay).
2. TreeSHAP attribution demonstrates that 42.8% of aggregate delay is attributable to statutory forest and wildlife clearance sequencing.
3. Contractors have submitted claims under FIDIC price adjustment clauses due to prolonged site mobilization delays.

RECOMMENDED CABINET DIRECTIVES:
1. Authorize inter-ministerial committee under Cabinet Secretary to grant conditional Stage-II clearances.
2. Direct Ministry of Railways and NHAI to establish binding dispute avoidance panels to prevent arbitration stalls.`;
    }
  };

  const reportContent = generateReportText();

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([reportContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `MoSPI-IPMD-${selectedReportType}-report-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for PDF Generation */}
      {pdfSuccessMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500/40 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            ✓
          </div>
          <span>{pdfSuccessMessage}</span>
          <button
            onClick={() => setPdfSuccessMessage(null)}
            className="text-slate-400 hover:text-white p-0.5 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Executive Reports & Project Brief Dossiers
          </h2>
          <p className="text-xs text-slate-500">
            Generate publication-grade PDF briefs, statutory Monthly Flash Reports, and Parliamentary briefs
          </p>
        </div>

        {/* Report Type Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs overflow-x-auto">
          <button
            onClick={() => setSelectedReportType('project_brief')}
            className={`px-3 py-1.5 rounded-md font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedReportType === 'project_brief'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-700" />
            <span>Project PDF Brief</span>
          </button>
          <button
            onClick={() => setSelectedReportType('flash')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
              selectedReportType === 'flash'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Flash Report
          </button>
          <button
            onClick={() => setSelectedReportType('parliament')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
              selectedReportType === 'parliament'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parliamentary Question (PQ)
          </button>
          <button
            onClick={() => setSelectedReportType('ccea')}
            className={`px-3 py-1.5 rounded-md font-medium whitespace-nowrap transition-all ${
              selectedReportType === 'ccea'
                ? 'bg-white text-blue-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CCEA Cabinet Note
          </button>
        </div>
      </div>

      {/* --- View Mode 1: Project Executive PDF Brief --- */}
      {selectedReportType === 'project_brief' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Select Project for Executive PDF Brief:
                </label>
                <p className="text-xs text-slate-500">
                  Choose any monitored central sector project to generate an official one-page risk & status brief
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedProject && onSelectProject && (
                  <button
                    type="button"
                    onClick={() => onSelectProject(selectedProject.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    <span>View Full Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Print View</span>
                </button>

                <button
                  type="button"
                  onClick={handleGenerateProjectPdf}
                  disabled={isGeneratingPdf || !selectedProject}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md cursor-pointer"
                  title="Generate formatted, printer-friendly PDF summary via jsPDF"
                >
                  <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isGeneratingPdf ? 'Generating PDF...' : 'Generate PDF Brief'}</span>
                </button>
              </div>
            </div>

            {/* Dropdown Selector & Search Filter */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
              <div className="md:col-span-8">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white text-slate-900"
                >
                  {filteredProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.projectCode}] {p.name} — {p.sector} ({p.riskLevel.toUpperCase()} RISK · Score: {p.riskScore})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder="Filter by code, name, sector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>
            </div>

            {/* Quick Priority Project Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Quick Select Priority:
              </span>
              {priorityProjects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                    selectedProjectId === p.id
                      ? 'bg-blue-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  [{p.projectCode}] {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Formatted, Printer-Friendly Live Preview Brief Canvas */}
          {selectedProject ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden print:border-none print:shadow-none">
              {/* Official Banner Header */}
              <div className="bg-[#0B1F3A] text-white p-5 sm:p-6 border-b-4 border-amber-500 relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded">
                        Government of India · MoSPI IPMD
                      </span>
                      <span className="text-[11px] text-slate-300 hidden sm:inline">
                        Online Computerised Monitoring System (OCMS)
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                      Executive Project Appraisal & Early-Warning Risk Brief
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Statutory decision-support memorandum for Cabinet Secretariat Project Monitoring Group (PMG)
                    </p>
                  </div>

                  <div className="text-left md:text-right shrink-0">
                    <span className="inline-block text-[11px] font-mono font-bold text-amber-300 bg-blue-950/80 border border-blue-800/80 px-2.5 py-1 rounded">
                      CYCLE: {reportingMonth.toUpperCase()}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                      CONFIDENTIAL / DECISION SUPPORT
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 sm:p-8 space-y-6">
                {/* 1. Project Title & Identity Section */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-blue-900 text-white px-2.5 py-0.5 rounded">
                        {selectedProject.projectCode}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        Sector: <strong>{selectedProject.sector}</strong>
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-500 font-medium">
                        State: <strong>{selectedProject.state}</strong>
                      </span>
                      <span className="text-slate-400 text-xs">·</span>
                      <span className="text-xs text-slate-500 font-medium">
                        Agency: <strong>{selectedProject.implementingAgency || 'Central PSU'}</strong>
                      </span>
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-slate-900 pt-1">
                      {selectedProject.name}
                    </h2>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {selectedProject.description}
                    </p>
                  </div>

                  <div className="flex items-center md:flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={selectedProject.projectStatus} size="sm" />
                    <RiskBadge level={selectedProject.riskLevel} score={selectedProject.riskScore} size="md" />
                  </div>
                </div>

                {/* 2. Four Key Indicator Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Sanctioned Cost */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Original Sanctioned Cost
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        ₹{Number(selectedProject.originalCost || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Cr</span>
                    </div>
                    <span className="text-[11px] text-slate-400 mt-2">
                      Sanction: {selectedProject.originalStartDate || 'Baseline approval'}
                    </span>
                  </div>

                  {/* Revised Cost */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Anticipated Revised Cost
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-slate-900">
                        ₹{Number(selectedProject.revisedCost || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Cr</span>
                    </div>
                    <div className="text-[11px] font-semibold text-rose-600 mt-2 font-mono">
                      {selectedProject.costOverrunPct > 0
                        ? `+${Number(selectedProject.costOverrunPct).toFixed(1)}% (+₹${(selectedProject.revisedCost - selectedProject.originalCost).toLocaleString()} Cr)`
                        : 'Within Sanctioned Limit'}
                    </div>
                  </div>

                  {/* Cumulative Disbursal */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Cumulative Expenditure
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-xl font-bold font-mono text-teal-700">
                        ₹{Number(selectedProject.cumulativeExpenditure || 0).toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Cr</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2">
                      Absorption:{' '}
                      <strong className="text-teal-800 font-mono">
                        {selectedProject.revisedCost > 0
                          ? ((selectedProject.cumulativeExpenditure / selectedProject.revisedCost) * 100).toFixed(1)
                          : 0}
                        %
                      </strong>
                    </span>
                  </div>

                  {/* Schedule Slippage */}
                  <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Schedule Drift
                    </span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span
                        className={`text-xl font-bold font-mono ${
                          selectedProject.delayMonths > 0 ? 'text-amber-700' : 'text-emerald-700'
                        }`}
                      >
                        {selectedProject.delayMonths > 0 ? `+${selectedProject.delayMonths}` : '0'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">Months</span>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-2 truncate">
                      Target: {selectedProject.currentCompletionDate || 'Pending revision'}
                    </span>
                  </div>
                </div>

                {/* 3. Schedule Performance & Progress Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <span>Physical Execution vs Financial Outlay Progress</span>
                    <span className="font-mono text-blue-800">
                      Physical: {selectedProject.physicalProgress || 0}% | Financial:{' '}
                      {selectedProject.financialProgress || 0}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-700 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(2, selectedProject.physicalProgress || 0))}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 text-xs text-slate-600 pt-1">
                    <div>
                      Original Sanctioned Completion:{' '}
                      <strong className="text-slate-900 font-mono">
                        {selectedProject.originalCompletionDate || 'Not recorded'}
                      </strong>
                    </div>
                    <div className="sm:text-right">
                      Anticipated Revised Commissioning:{' '}
                      <strong className="text-rose-700 font-mono">
                        {selectedProject.currentCompletionDate || 'Under Cabinet review'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 4. Machine Learning Early Warning & SHAP Risk Drivers */}
                <div className="border border-slate-200 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Key Predictive Risk Drivers & Statutory Bottlenecks (SHAP Attribution)
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(selectedProject.riskAssessment?.topDrivers || [
                      {
                        factorName: 'Stage-II Forest & Wildlife Diversion Clearance',
                        contribution: 0.38,
                        category: 'Statutory',
                        description: 'Pending state forest advisory committee recommendation and compensatory afforestation land handover.'
                      },
                      {
                        factorName: 'Section 3G Land Acquisition Compensation Award',
                        contribution: 0.26,
                        category: 'Schedule',
                        description: 'Arbitration award disputes pending with District Revenue Commissioner.'
                      },
                      {
                        factorName: 'EPC Contractor Price Adjustment & Claims Arbitration',
                        contribution: 0.21,
                        category: 'Cost',
                        description: 'Contractor cash-flow constraints and raw steel/cement price index variation claims.'
                      },
                      {
                        factorName: 'Geological Fractures / High Water Ingress in Tunneling',
                        contribution: 0.15,
                        category: 'Geological',
                        description: 'Unanticipated fault zone requiring special pre-grouting and steel rib reinforcement.'
                      }
                    ]).map((driver, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span className="line-clamp-1">
                            {idx + 1}. [{driver.category || 'General'}] {driver.factorName}
                          </span>
                          <span className="font-mono text-rose-600 text-[11px] shrink-0">
                            {typeof driver.contribution === 'number'
                              ? `+${(driver.contribution * 100).toFixed(0)}%`
                              : '+18%'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {driver.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. PMG Directives & Nodal Accountability */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  {/* PMG Recommendations */}
                  <div className="md:col-span-7 bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-700" />
                      Cabinet Secretariat PMG Recommended Directives
                    </h4>
                    <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                      {(selectedProject.riskAssessment?.recommendedActions || [
                        'Convene Joint Tripartite Review with MoEF&CC to grant conditional Stage-II forest clearance within 30 days.',
                        'Direct State Chief Secretary to resolve Right-of-Way (RoW) encroachment and release escrow funds.',
                        'Mandate EPC contractor dispute avoidance panel under PM GatiShakti National Master Plan.'
                      ]).map((act, i) => (
                        <li key={i} className="leading-relaxed">
                          {act}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Nodal Officer Contact */}
                  <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                      Accountable Nodal Authority
                    </h4>
                    <div className="text-xs text-slate-800 space-y-1">
                      <div className="font-bold text-slate-900">
                        {((selectedProject as any).nodalOfficer?.name) || 'Executive Director (Projects)'}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {((selectedProject as any).nodalOfficer?.designation) || 'Ministry Project Nodal Officer'}
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono">
                        Email: {((selectedProject as any).nodalOfficer?.email) || 'nodal.officer@nic.in'}
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        Ministry: <strong>{selectedProject.ministry}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom PDF Generation CTA Bar */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                  <span>
                    Official brief generated under IPMD statistical protocols · Ready for export to formatted PDF
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateProjectPdf}
                    disabled={isGeneratingPdf}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
                  >
                    <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                    <span>{isGeneratingPdf ? 'Building PDF Document...' : 'Generate PDF Brief'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
              No project selected. Please choose a project from the register above.
            </div>
          )}
        </div>
      )}

      {/* --- View Mode 2, 3, 4: Statutory Text Reports (Flash, Parliamentary, CCEA) --- */}
      {selectedReportType !== 'project_brief' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Actions bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="font-mono text-slate-600 font-bold text-[11px]">
              Document Format: Official Government Briefing Note
            </span>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .TXT</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateGenericPdf}
                disabled={isGeneratingPdf}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors shadow-xs cursor-pointer"
                title="Generate formatted PDF via jsPDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isGeneratingPdf ? 'Generating...' : 'Generate PDF Brief'}</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-medium transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Text View */}
          <div className="p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-blue-600">
            {reportContent}
          </div>
        </div>
      )}
    </div>
  );
};
