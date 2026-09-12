import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  Building2,
  Calendar
} from 'lucide-react';
import { Project } from '../../types';

interface ReportsViewProps {
  projects: Project[];
  reportingMonth: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ projects, reportingMonth }) => {
  const [selectedReportType, setSelectedReportType] = useState<'flash' | 'parliament' | 'ccea'>('flash');
  const [copied, setCopied] = useState(false);

  const delayedCount = projects.filter((p) => p.delayMonths > 0).length;
  const criticalCount = projects.filter((p) => p.riskLevel === 'critical').length;

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
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-700" />
            Executive Reports & Parliamentary Briefing Dossiers
          </h2>
          <p className="text-xs text-slate-500">
            Automated generation of statutory Monthly Flash Reports, Cabinet Memorandums, and Question Briefs
          </p>
        </div>

        {/* Report Type Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
          <button
            onClick={() => setSelectedReportType('flash')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedReportType === 'flash'
                ? 'bg-white text-blue-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Flash Report
          </button>
          <button
            onClick={() => setSelectedReportType('parliament')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedReportType === 'parliament'
                ? 'bg-white text-blue-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Parliamentary Question (PQ)
          </button>
          <button
            onClick={() => setSelectedReportType('ccea')}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedReportType === 'ccea'
                ? 'bg-white text-blue-900 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            CCEA Cabinet Note
          </button>
        </div>
      </div>

      {/* Report Preview Canvas */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Actions bar */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
          <span className="font-mono text-slate-600 font-bold text-[11px]">
            Document Format: Official Government Briefing Note
          </span>

          <div className="flex items-center gap-2">
            <button
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
              onClick={handleDownload}
              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .TXT</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Text View */}
        <div className="p-6 bg-slate-950 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap selection:bg-blue-600">
          {reportContent}
        </div>
      </div>
    </div>
  );
};
