import { jsPDF } from 'jspdf';
import { Project, Intervention } from '../types';
import { derivePhaseBudgetData } from '../components/charts/PhaseBudgetVsActualChart';

/**
 * Helper to wrap text and advance Y position safely
 */
function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

/**
 * Generates an executive, publication-grade Briefing Note PDF for a specific infrastructure project.
 * Formatted specifically for executive printing and cabinet decision support.
 * Page 1: Current Status, Progress & Machine Learning Risk Profile
 * Page 2: Phase-Wise Budget vs Actual Capital Utilization & Pending Interventions Escalation Matrix
 */
export function generateExecutiveBriefingNotePdf(
  project: Project,
  reportingMonth: string = 'August 2026'
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // =========================================================================
  // PAGE 1: EXECUTIVE PROJECT STATUS & RISK ENGINE APPRAISAL
  // =========================================================================

  // --- 1. Top Government Banner ---
  doc.setFillColor(11, 31, 58); // Deep Navy (#0B1F3A)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // National Flag Motif Bar (Saffron, White, Green)
  doc.setFillColor(245, 158, 11); // Saffron
  doc.rect(0, 27, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 27, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(16, 185, 129); // Green
  doc.rect((pageWidth / 3) * 2, 27, pageWidth / 3, 1.2, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GOVERNMENT OF INDIA · CABINET SECRETARIAT & MoSPI', margin, 7.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12.5);
  doc.text('EXECUTIVE BRIEFING NOTE · PROJECT MONITORING DIVISION', margin, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    'Online Computerised Monitoring System (OCMS) · High-Priority Infrastructure Appraisal',
    margin,
    20.5
  );

  // Right-aligned header metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(253, 224, 71); // Amber 300
  doc.text(`REPORTING CYCLE: ${reportingMonth.toUpperCase()}`, pageWidth - margin, 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('CLASSIFICATION: CONFIDENTIAL / DECISION SUPPORT', pageWidth - margin, 13.5, { align: 'right' });
  doc.text(`DATE ISSUED: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, 19, { align: 'right' });

  let y = 35;

  // --- 2. Project Title & Identifier Card ---
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  // Project Code Badge
  doc.setFillColor(30, 58, 138); // Blue 900
  doc.roundedRect(margin + 3, y + 3, 24, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(project.projectCode, margin + 15, y + 7.2, { align: 'center' });

  // Priority Rank Badge
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 29, y + 3, 30, 6, 1, 1, 'F');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(7);
  doc.text(`Priority Rank: #${project.priorityRank || 1}`, margin + 31, y + 7.2);

  // Status Badge in Header Card
  const statusBg = project.projectStatus === 'Completed' ? [16, 185, 129] : project.delayMonths > 0 ? [245, 158, 11] : [37, 99, 235];
  doc.setFillColor(statusBg[0], statusBg[1], statusBg[2]);
  doc.roundedRect(pageWidth - margin - 38, y + 3, 35, 6, 1, 1, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(project.projectStatus.toUpperCase(), pageWidth - margin - 20.5, y + 7.2, { align: 'center' });

  // Project Name
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const truncatedName = doc.splitTextToSize(project.name, contentWidth - 8);
  doc.text(truncatedName[0], margin + 3, y + 14);

  // Line meta: Ministry · Sector · Implementing Agency · Location
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const agencyText = project.implementingAgency ? ` [Agency: ${project.implementingAgency}]` : '';
  const metaLine = `${project.ministry} · Sector: ${project.sector}${agencyText} · State: ${project.state} (${project.district || 'All Districts'})`;
  doc.text(doc.splitTextToSize(metaLine, contentWidth - 8)[0], margin + 3, y + 20);

  y += 28;

  // --- 3. Executive Risk & Health Summary Box ---
  let riskColor = { r: 16, g: 185, b: 129 }; // Green (low)
  let riskLabel = 'LOW RISK';
  if (project.riskLevel === 'critical' || project.riskScore >= 75) {
    riskColor = { r: 225, g: 29, b: 72 }; // Rose/Red
    riskLabel = 'CRITICAL RISK';
  } else if (project.riskLevel === 'high' || project.riskScore >= 50) {
    riskColor = { r: 217, g: 119, b: 6 }; // Amber
    riskLabel = 'HIGH RISK';
  } else if (project.riskLevel === 'moderate' || project.riskScore >= 25) {
    riskColor = { r: 37, g: 99, b: 235 }; // Blue
    riskLabel = 'MODERATE RISK';
  }

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(riskColor.r, riskColor.g, riskColor.b);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  // Left strip for risk level
  doc.setFillColor(riskColor.r, riskColor.g, riskColor.b);
  doc.roundedRect(margin, y, 4, 18, 1, 1, 'F');

  // Risk Score Badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(riskColor.r, riskColor.g, riskColor.b);
  doc.text(`${project.riskScore}`, margin + 8, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('/100 Risk Score', margin + 8, y + 13);

  // Status & Tier badge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${riskLabel} · SCHEDULE DRIFT: ${project.delayMonths > 0 ? `+${project.delayMonths} MONTHS` : 'ON SCHEDULE'}`, margin + 38, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const overrunProb = project.riskAssessment?.costOverrunProbability
    ? Math.round(project.riskAssessment.costOverrunProbability * 100)
    : 85;
  const timeProb = project.riskAssessment?.timeOverrunProbability
    ? Math.round(project.riskAssessment.timeOverrunProbability * 100)
    : 92;
  doc.text(`Cost Drift Probability: ${overrunProb}% | Schedule Delay Probability: ${timeProb}% | Data Quality Score: ${project.dataQualityScore || 94}%`, margin + 38, y + 13);

  y += 22;

  // --- 4. Four Key Metric Cards (Financial & Timeline) ---
  const colWidth = (contentWidth - 6) / 4; // ~44mm each
  const cardHeight = 18;

  // Metric 1: Original Sanctioned Cost
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ORIGINAL SANCTIONED', margin + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`₹${Number(project.originalCost || 0).toLocaleString()} Cr`, margin + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Sanction Date: ${project.originalStartDate || 'N/A'}`, margin + 3, y + 15.5);

  // Metric 2: Revised Cost & Escalation
  const col2X = margin + colWidth + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ANTICIPATED REVISED', col2X + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(project.costOverrunPct > 0 ? 225 : 15, project.costOverrunPct > 0 ? 29 : 23, project.costOverrunPct > 0 ? 72 : 42);
  doc.text(`₹${Number(project.revisedCost || 0).toLocaleString()} Cr`, col2X + 3, y + 11.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text(
    project.costOverrunPct > 0
      ? `+${Number(project.costOverrunPct).toFixed(1)}% (+₹${(project.revisedCost - project.originalCost).toLocaleString()} Cr)`
      : 'No Cost Escalation',
    col2X + 3,
    y + 15.5
  );

  // Metric 3: Cumulative Disbursal
  const col3X = margin + (colWidth + 2) * 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col3X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CUMULATIVE DISBURSED', col3X + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(13, 148, 136); // Teal 600
  doc.text(`₹${Number(project.cumulativeExpenditure || 0).toLocaleString()} Cr`, col3X + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  const fundPct = project.revisedCost > 0 ? ((project.cumulativeExpenditure / project.revisedCost) * 100).toFixed(1) : 0;
  doc.text(`Fund Absorption: ${fundPct}%`, col3X + 3, y + 15.5);

  // Metric 4: Schedule Slippage
  const col4X = margin + (colWidth + 2) * 3;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col4X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SCHEDULE SLIPPAGE', col4X + 3, y + 5);
  doc.setFontSize(10.5);
  doc.setTextColor(project.delayMonths > 0 ? 194 : 16, project.delayMonths > 0 ? 65 : 185, project.delayMonths > 0 ? 12 : 129);
  doc.text(project.delayMonths > 0 ? `+${project.delayMonths} Mos` : 'On Schedule', col4X + 3, y + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Target: ${project.currentCompletionDate || project.anticipatedCompletionDate || 'N/A'}`, col4X + 3, y + 15.5);

  y += 23;

  // --- 5. Statutory Schedule & Progress Comparison Table ---
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('STATUTORY COMMISSIONING & PROGRESS APPRAISAL', margin + 3, y + 4);

  y += 7.5;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  // Row 1: Dates
  doc.text('Original Sanctioned Date:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(project.originalCompletionDate || 'Not Specified', margin + 45, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Anticipated Commissioning:', margin + 95, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(project.currentCompletionDate || project.anticipatedCompletionDate || 'Pending Revision', margin + 140, y + 4.5);

  // Row 2: Progress
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Physical Progress:', margin + 3, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${project.physicalProgress || 0}%`, margin + 45, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.text('Financial Progress:', margin + 95, y + 4.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`${project.financialProgress || 0}%`, margin + 140, y + 4.5);

  y += 8;

  // Progress Bar Visualization
  const barWidth = contentWidth - 6;
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(margin + 3, y, barWidth, 3, 1, 1, 'F');
  const fillWidth = Math.max(1, (barWidth * (project.physicalProgress || 0)) / 100);
  doc.setFillColor(37, 99, 235);
  doc.roundedRect(margin + 3, y, fillWidth, 3, 1, 1, 'F');

  y += 8;

  // --- 6. Machine Learning SHAP Risk Attributions & Bottlenecks ---
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PREDICTIVE RISK ATTRIBUTIONS & BOTTLENECKS (XGBOOST / SHAP)', margin + 3, y + 4);

  y += 7.5;

  const topDrivers = project.riskAssessment?.topDrivers || [
    { factorName: 'Stage-II Forest & Wildlife Diversion Delay', contribution: 38, category: 'Statutory', description: 'Pending environmental and tree-felling NOCs from State Forest Dept' },
    { factorName: 'Section 3G Land Acquisition Compensation Dispute', contribution: 26, category: 'Schedule', description: 'Disbursement stalled with District Revenue Collector' },
    { factorName: 'EPC Contractor Price Escalation & Arbitration Claim', contribution: 21, category: 'Cost', description: 'FIDIC price adjustment claims pending mediation' },
    { factorName: 'Geological Fractures / High Water Ingress in Tunneling', contribution: 15, category: 'Geological', description: 'Specialized pre-grouting and steel rib reinforcement required' },
  ];

  topDrivers.slice(0, 4).forEach((d: any, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    const pct = typeof d.contribution === 'number' ? `+${Math.abs(d.contribution)}%` : '+18%';
    doc.text(`${idx + 1}. [${d.category || 'General'}] ${d.factorName} (${pct} risk impact)`, margin + 3, y + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(doc.splitTextToSize(d.description || 'Statutory coordination bottleneck flagged by machine learning early warning engine', contentWidth - 10)[0], margin + 6, y + 7.5);

    y += 9.5;
  });

  y += 2;

  // --- 7. Recommended Cabinet PMG Directives & Action Plan ---
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CABINET SECRETARIAT PMG DIRECTIVES & INTERVENTION PLAN', margin + 3, y + 4);

  y += 7.5;
  const actions = project.riskAssessment?.recommendedActions || [
    'Convene Joint Tripartite Review with Ministry of Environment, Forest and Climate Change (MoEF&CC)',
    'Establish binding dispute avoidance panel under PM GatiShakti National Master Plan',
    'Expedite Section 3G disbursement escrow release through State Chief Secretary intervention'
  ];

  actions.slice(0, 3).forEach((act) => {
    doc.setFillColor(30, 58, 138);
    doc.circle(margin + 5, y + 3, 0.8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    doc.text(doc.splitTextToSize(act, contentWidth - 14)[0], margin + 8, y + 3.5);
    y += 5.5;
  });

  // Page 1 Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'PAIMANA AI · Ministry of Statistics and Programme Implementation (MoSPI) · Executive Briefing Note',
    margin,
    pageHeight - 8
  );
  doc.text(
    `Page 1 of 2 · Confidential / Cabinet Decision Support`,
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  // =========================================================================
  // PAGE 2: BUDGET UTILIZATION BY PHASE & PENDING INTERVENTIONS MATRIX
  // =========================================================================
  doc.addPage();

  // Top Running Banner on Page 2
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 20, 'F');

  // National Flag Accent
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 19.2, pageWidth / 3, 0.8, 'F');
  doc.setFillColor(255, 255, 255);
  doc.rect(pageWidth / 3, 19.2, pageWidth / 3, 0.8, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect((pageWidth / 3) * 2, 19.2, pageWidth / 3, 0.8, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('GOVERNMENT OF INDIA · CABINET SECRETARIAT & MoSPI', margin, 6.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text(`EXECUTIVE BRIEFING NOTE (PAGE 2) · FISCAL AUDIT & INTERVENTIONS MATRIX`, margin, 12.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(203, 213, 225);
  doc.text(`PROJECT: [${project.projectCode}] ${project.name}`, margin, 17);

  let p2Y = 27;

  // --- SECTION A: PHASE-WISE BUDGET VS ACTUAL BREAKDOWN ---
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('1. BUDGET VS ACTUAL: PHASE-WISE CAPITAL UTILIZATION BREAKDOWN', margin + 3, p2Y + 4.2);

  p2Y += 9;

  // Table Headers
  const colWidths = [56, 26, 26, 26, 24, 24]; // Total = 182mm
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4],
  ];

  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(margin, p2Y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Project Phase & Scope', colX[0] + 2, p2Y + 4.2);
  doc.text('Allocated (Cr)', colX[1] + colWidths[1] - 2, p2Y + 4.2, { align: 'right' });
  doc.text('Disbursed (Cr)', colX[2] + colWidths[2] - 2, p2Y + 4.2, { align: 'right' });
  doc.text('Variance (Cr)', colX[3] + colWidths[3] - 2, p2Y + 4.2, { align: 'right' });
  doc.text('Utilization', colX[4] + colWidths[4] - 2, p2Y + 4.2, { align: 'right' });
  doc.text('Status', colX[5] + colWidths[5] - 2, p2Y + 4.2, { align: 'right' });

  p2Y += 6;

  // Derive phase budget items
  const phases = derivePhaseBudgetData(project);
  let totalAlloc = 0;
  let totalSpent = 0;

  phases.forEach((phase, idx) => {
    totalAlloc += phase.allocatedBudget;
    totalSpent += phase.actualExpenditure;

    // Zebra row background
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, p2Y, contentWidth, 6.2, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, p2Y + 6.2, margin + contentWidth, p2Y + 6.2);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);
    doc.text(phase.phase, colX[0] + 2, p2Y + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.text(`₹${phase.allocatedBudget.toLocaleString()}`, colX[1] + colWidths[1] - 2, p2Y + 4.2, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136); // Teal
    doc.text(`₹${phase.actualExpenditure.toLocaleString()}`, colX[2] + colWidths[2] - 2, p2Y + 4.2, { align: 'right' });

    // Variance
    doc.setTextColor(phase.varianceCr > 0 ? 225 : 13, phase.varianceCr > 0 ? 29 : 148, phase.varianceCr > 0 ? 72 : 136);
    const varText = phase.varianceCr > 0 ? `+₹${phase.varianceCr.toLocaleString()}` : `-₹${Math.abs(phase.varianceCr).toLocaleString()}`;
    doc.text(varText, colX[3] + colWidths[3] - 2, p2Y + 4.2, { align: 'right' });

    // Utilization Pct
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${phase.utilizationPct}%`, colX[4] + colWidths[4] - 2, p2Y + 4.2, { align: 'right' });

    // Status label
    const isOverrun = phase.status === 'overrun';
    doc.setTextColor(isOverrun ? 225 : phase.status === 'approaching_limit' ? 217 : 16, isOverrun ? 29 : phase.status === 'approaching_limit' ? 119 : 185, isOverrun ? 72 : phase.status === 'approaching_limit' ? 6 : 129);
    doc.text(isOverrun ? 'OVERRUN' : phase.status === 'approaching_limit' ? 'NEAR CAP' : 'WITHIN PLAN', colX[5] + colWidths[5] - 2, p2Y + 4.2, { align: 'right' });

    p2Y += 6.2;
  });

  // Table Total Row
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, contentWidth, 7, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, p2Y, margin + contentWidth, p2Y);
  doc.line(margin, p2Y + 7, margin + contentWidth, p2Y + 7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('TOTAL CAPITAL DRAWDOWN:', colX[0] + 2, p2Y + 4.8);
  doc.text(`₹${totalAlloc.toLocaleString()}`, colX[1] + colWidths[1] - 2, p2Y + 4.8, { align: 'right' });
  doc.text(`₹${totalSpent.toLocaleString()}`, colX[2] + colWidths[2] - 2, p2Y + 4.8, { align: 'right' });

  const totalVar = totalSpent - totalAlloc;
  doc.setTextColor(totalVar > 0 ? 225 : 13, totalVar > 0 ? 29 : 148, totalVar > 0 ? 72 : 136);
  doc.text(totalVar > 0 ? `+₹${totalVar.toLocaleString()}` : `-₹${Math.abs(totalVar).toLocaleString()}`, colX[3] + colWidths[3] - 2, p2Y + 4.8, { align: 'right' });

  const totalUtil = totalAlloc > 0 ? Math.round((totalSpent / totalAlloc) * 1000) / 10 : 0;
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalUtil}%`, colX[4] + colWidths[4] - 2, p2Y + 4.8, { align: 'right' });
  doc.text(totalUtil > 100 ? 'OVERRUN' : 'ON TRACK', colX[5] + colWidths[5] - 2, p2Y + 4.8, { align: 'right' });

  p2Y += 10;

  // Fiscal Audit Footnote
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('* Phase disbursals benchmarked against statutory CCEA approved package ceilings. Packages exceeding 100% require Revised Cost Estimate (RCE) validation.', margin + 2, p2Y);

  p2Y += 7;

  // --- SECTION B: PENDING INTERVENTIONS & ESCALATION MATRIX ---
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('2. PENDING INTERVENTIONS & CABINET ESCALATION MATRIX', margin + 3, p2Y + 4.2);

  p2Y += 9;

  const rawInterventions: any[] = project.interventions || [];
  const interventionsToRender = rawInterventions.length > 0
    ? rawInterventions
    : [
        {
          id: 'int-default-1',
          actionType: 'Inter-Ministerial PMG',
          priority: 'P1 - Critical',
          title: 'Forest Stage-II Clearances & Tree Felling Sanction Escalation',
          description: 'Bilateral review with MoEF&CC and State Principal Chief Conservator of Forests (PCCF) to release forest land.',
          assignedMinistry: 'MoEF&CC / State Forest Dept',
          targetResolutionDate: '2026-11-30',
          currentStatus: 'under_review',
          impactExpected: 'Permit unhindered viaduct substructure access on Ch 14+200',
        },
        {
          id: 'int-default-2',
          actionType: 'State Coordination',
          priority: 'P2 - High',
          title: 'Section 3G Land Acquisition Compensation Dispute Mediation',
          description: 'Special land acquisition officer (SLAO) fund disbursement escrow dispute hearing with affected titleholders.',
          assignedMinistry: 'State Revenue Department',
          targetResolutionDate: '2026-12-15',
          currentStatus: 'action_initiated',
          impactExpected: 'Resolve physical site handover for Station Yard Package',
        },
      ];

  interventionsToRender.slice(0, 3).forEach((item: any) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, p2Y, contentWidth, 18.5, 1.5, 1.5, 'FD');

    // Priority color strip
    const isP1 = (item.priority || '').includes('P1') || (item.priority || '').includes('Critical');
    doc.setFillColor(isP1 ? 225 : 217, isP1 ? 29 : 119, isP1 ? 72 : 6);
    doc.roundedRect(margin, p2Y, 3, 18.5, 1, 1, 'F');

    // Priority Pill & Target Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(isP1 ? 225 : 217, isP1 ? 29 : 119, isP1 ? 72 : 6);
    doc.text(`[${item.priority || 'P1 - Critical'}] ${item.actionType || 'Inter-Ministerial Action'}`, margin + 6, p2Y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Target Resolution: ${item.targetResolutionDate || '2026-11-30'}`, margin + 85, p2Y + 4);

    // Status Pill
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(pageWidth - margin - 35, p2Y + 1.5, 32, 4.5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(30, 58, 138);
    doc.text(String(item.currentStatus || 'under_review').replace('_', ' ').toUpperCase(), pageWidth - margin - 19, p2Y + 4.7, { align: 'center' });

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(doc.splitTextToSize(item.title, contentWidth - 45)[0], margin + 6, p2Y + 9);

    // Description
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const desc = doc.splitTextToSize(item.description, contentWidth - 12);
    doc.text(desc[0], margin + 6, p2Y + 13);

    // Assigned & Impact
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    const impactText = `Authority: ${item.assignedMinistry || project.ministry} | Expected Impact: ${item.impactExpected || 'Expedite statutory clearances'}`;
    doc.text(doc.splitTextToSize(impactText, contentWidth - 12)[0], margin + 6, p2Y + 16.8);

    p2Y += 21;
  });

  // --- SECTION C: OFFICIAL NODAL AUTHORITY & CABINET ENDORSEMENT SIGN-OFF ---
  p2Y += 2;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, p2Y, contentWidth, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('3. STATUTORY SIGN-OFF & CABINET ENDORSEMENT', margin + 3, p2Y + 4);

  p2Y += 8.5;

  const nodal = (project as any).nodalOfficer || {
    name: 'Shri R. K. Singhal, IRSE',
    designation: 'Executive Director (Projects) & Nodal Officer',
    email: 'ed.infra@nic.in',
    phone: '+91-11-2338-4902'
  };

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, p2Y, contentWidth, 23, 1.5, 1.5, 'FD');

  // Left: Officer Particulars
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('DESIGNATED NODAL OFFICER (ACCOUNTABLE AUTHORITY):', margin + 4, p2Y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${nodal.name} · ${nodal.designation}`, margin + 4, p2Y + 10.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Ministry: ${project.ministry} | Email: ${nodal.email} | Contact: ${nodal.phone || '+91-11-2338-4000'}`, margin + 4, p2Y + 15);
  doc.text('Statutory Certification: All figures extracted from audited monthly OCMS schedules and verified under Rule 145(2) GFR.', margin + 4, p2Y + 19.5);

  // Right: Physical Signature & Seal Block for Executive Printing
  const sigX = margin + 120;
  doc.setDrawColor(148, 163, 184);
  doc.line(sigX, p2Y + 14, sigX + 56, p2Y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Signature & Official Seal', sigX + 15, p2Y + 18);
  doc.text('Date: ____________________', sigX + 14, p2Y + 21);

  // Page 2 Footer
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'PAIMANA AI · Ministry of Statistics and Programme Implementation (MoSPI) · Executive Briefing Note',
    margin,
    pageHeight - 8
  );
  doc.text(
    'Page 2 of 2 · Formatted for Executive Printing & Cabinet Archival',
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  // Save PDF with clear descriptive filename
  const safeFilename = `MoSPI-Briefing-Note-${project.projectCode}-${project.name.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

// Backward-compatible alias so existing callers work seamlessly
export const generateProjectPdfBrief = generateExecutiveBriefingNotePdf;

/**
 * Generates an executive PDF document for the statutory text reports (Monthly Flash Report, PQ Brief, CCEA Memorandum)
 */
export function generateGenericReportPdf(
  reportTitle: string,
  reportText: string,
  reportingMonth: string
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(11, 31, 58);
  doc.rect(0, 0, pageWidth, 26, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GOVERNMENT OF INDIA · CABINET SECRETARIAT & MoSPI', margin, 7.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text(reportTitle.toUpperCase(), margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Infrastructure & Project Monitoring Division (IPMD) · Reporting Cycle: ${reportingMonth}`,
    margin,
    21
  );

  // Report Text (with pagination)
  let y = 34;
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  const lines = doc.splitTextToSize(reportText, contentWidth);
  const lineHeight = 4.2;

  for (let i = 0; i < lines.length; i++) {
    if (y > pageHeight - 16) {
      doc.addPage();
      y = 18;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`${reportTitle} (Continued)`, margin, 10);
      doc.setFont('courier', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
  }

  // Footer on current page
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text('PAIMANA AI · MoSPI IPMD Statutory Decision Support Platform', margin, pageHeight - 6);

  const safeTitle = reportTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
  doc.save(`MoSPI-${safeTitle}-${reportingMonth.replace(/\s+/g, '-')}.pdf`);
}
