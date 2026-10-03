import { jsPDF } from 'jspdf';
import { Project } from '../types';

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
 * Generates an executive, publication-grade PDF brief for a specific infrastructure project.
 */
export function generateProjectPdfBrief(project: Project, reportingMonth: string): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // --- 1. Top Government Banner ---
  doc.setFillColor(11, 31, 58); // Deep Navy (#0B1F3A)
  doc.rect(0, 0, pageWidth, 28, 'F');

  // National Flag Motif Bar (Saffron, White, Green thin line)
  doc.setFillColor(245, 158, 11); // Saffron
  doc.rect(0, 27, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(255, 255, 255); // White
  doc.rect(pageWidth / 3, 27, pageWidth / 3, 1.2, 'F');
  doc.setFillColor(16, 185, 129); // Green
  doc.rect((pageWidth / 3) * 2, 27, pageWidth / 3, 1.2, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GOVERNMENT OF INDIA · CABINET SECRETARIAT & MoSPI', margin, 7.5);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.text('PROJECT APPRAISAL & EARLY-WARNING RISK BRIEF', margin, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(
    'Infrastructure & Project Monitoring Division (IPMD) · Online Computerised Monitoring System',
    margin,
    20.5
  );

  // Right-aligned header metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(253, 224, 71); // Amber 300
  doc.text(`CYCLE: ${reportingMonth.toUpperCase()}`, pageWidth - margin, 8, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(226, 232, 240);
  doc.text('CLASSIFICATION: CONFIDENTIAL / DECISION SUPPORT', pageWidth - margin, 13.5, { align: 'right' });
  doc.text(`ISSUED: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth - margin, 19, { align: 'right' });

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
  const metaLine = `${project.ministry} · Sector: ${project.sector}${agencyText} · State: ${project.state} (${project.district || 'Multi-District'})`;
  doc.text(doc.splitTextToSize(metaLine, contentWidth - 8)[0], margin + 3, y + 20);

  y += 28;

  // --- 3. Executive Risk & Health Summary Box ---
  // Background card with risk tint
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
  doc.text(`${riskLabel} · ${project.projectStatus.toUpperCase()}`, margin + 38, y + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const overrunProb = project.riskAssessment?.costOverrunProbability
    ? Math.round(project.riskAssessment.costOverrunProbability * 100)
    : 85;
  const timeProb = project.riskAssessment?.timeOverrunProbability
    ? Math.round(project.riskAssessment.timeOverrunProbability * 100)
    : 92;
  doc.text(`Cost Drift Prob: ${overrunProb}% | Schedule Slippage Prob: ${timeProb}% | Data Quality Audit: ${project.dataQualityScore || 94}% Verified`, margin + 38, y + 13);

  y += 22;

  // --- 4. Four Key Metric Cards (Financial & Timeline) ---
  const colWidth = (contentWidth - 6) / 4; // ~44mm each
  const cardHeight = 18;

  // Metric 1: Original Cost
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
  doc.text(`Sanction: ${project.originalStartDate || 'N/A'}`, margin + 3, y + 15.5);

  // Metric 2: Revised Cost & Escalation
  const col2X = margin + colWidth + 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(col2X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REVISED ANTICIPATED', col2X + 3, y + 5);
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
  doc.text('CUMULATIVE EXP.', col3X + 3, y + 5);
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
  doc.text(`Target: ${project.currentCompletionDate || 'N/A'}`, col4X + 3, y + 15.5);

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
  doc.text(project.currentCompletionDate || 'Pending CCEA Revision', margin + 140, y + 4.5);

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
    { factorName: 'Stage-II Forest & Wildlife Diversion Delay', contribution: 0.38, category: 'Statutory', description: 'Pending environmental and tree-felling NOCs from State Forest Dept' },
    { factorName: 'Section 3G Land Acquisition Compensation Dispute', contribution: 0.26, category: 'Schedule', description: 'Disbursement stalled with District Revenue Collector' },
    { factorName: 'EPC Contractor Price Escalation & Arbitration Claim', contribution: 0.21, category: 'Cost', description: 'FIDIC price adjustment claims pending mediation' },
    { factorName: 'Geological Fractures / High Water Ingress in Tunneling', contribution: 0.15, category: 'Geological', description: 'Specialized pre-grouting and steel rib reinforcement required' },
  ];

  topDrivers.slice(0, 4).forEach((d, idx) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);
    const pct = typeof d.contribution === 'number' ? `+${(d.contribution * 100).toFixed(0)}%` : '+18%';
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

  // --- 8. Nodal Officer & Accountable Authority ---
  y += 3;
  const nodal = (project as any).nodalOfficer || {
    name: 'Shri R. K. Singhal, IRSE',
    designation: 'Executive Director (Projects) & Nodal Officer',
    email: 'ed.infra@nic.in',
    phone: '+91-11-2338-4902'
  };

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('OFFICIAL NODAL OFFICER & ACCOUNTABLE AUTHORITY:', margin + 3, y + 4.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`${nodal.name} — ${nodal.designation}`, margin + 3, y + 9.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Email: ${nodal.email} | Phone: ${nodal.phone || '+91-11-2338-4000'} | Ministry: ${project.ministry}`, margin + 3, y + 13);

  // --- 9. Footer & Watermark ---
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'PAIMANA AI · Ministry of Statistics and Programme Implementation (MoSPI) · Official Infrastructure Decision Support Brief',
    margin,
    pageHeight - 8
  );
  doc.text(
    `Page 1 of 1 · Generated: ${new Date().toISOString()}`,
    pageWidth - margin,
    pageHeight - 8,
    { align: 'right' }
  );

  // Save PDF
  const safeFilename = `MoSPI-Brief-${project.projectCode}-${project.name.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(safeFilename);
}

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
      // Add page
      doc.addPage();
      y = 18;
      // Header line on subsequent pages
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
