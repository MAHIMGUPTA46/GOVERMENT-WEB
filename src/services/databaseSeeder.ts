import { 
  Project, 
  Alert, 
  Intervention, 
  RiskAssessment, 
  Milestone, 
  ProjectMonthlySnapshot,
  RiskLevel
} from '../types';
import { INITIAL_PROJECTS, INITIAL_ALERTS, INITIAL_INTERVENTIONS } from '../data/mockData';

export const MINISTRIES_LIST = [
  { id: 'min-1', code: 'MoRTH', name: 'Ministry of Road Transport and Highways' },
  { id: 'min-2', code: 'MoR', name: 'Ministry of Railways' },
  { id: 'min-3', code: 'MoPNG', name: 'Ministry of Petroleum and Natural Gas' },
  { id: 'min-4', code: 'MoP', name: 'Ministry of Power' },
  { id: 'min-5', code: 'MoC', name: 'Ministry of Coal' },
  { id: 'min-6', code: 'MoS', name: 'Ministry of Steel' },
  { id: 'min-7', code: 'MoCA', name: 'Ministry of Civil Aviation' },
  { id: 'min-8', code: 'MoPSW', name: 'Ministry of Ports, Shipping and Waterways' },
  { id: 'min-9', code: 'MoHUA', name: 'Ministry of Housing and Urban Affairs' },
  { id: 'min-10', code: 'MoJS', name: 'Ministry of Jal Shakti' },
  { id: 'min-11', code: 'MoComm', name: 'Ministry of Communications' },
  { id: 'min-12', code: 'MoHFW', name: 'Ministry of Health and Family Welfare' },
];

export const SECTORS_LIST = [
  { id: 'sec-1', code: 'RAIL', name: 'Railways' },
  { id: 'sec-2', code: 'ROADS', name: 'Roads and Highways' },
  { id: 'sec-3', code: 'PETRO', name: 'Petroleum and Natural Gas' },
  { id: 'sec-4', code: 'POWER', name: 'Power and Renewable Energy' },
  { id: 'sec-5', code: 'COAL', name: 'Coal' },
  { id: 'sec-6', code: 'STEEL', name: 'Steel' },
  { id: 'sec-7', code: 'AVIATION', name: 'Civil Aviation' },
  { id: 'sec-8', code: 'PORTS', name: 'Ports and Inland Waterways' },
  { id: 'sec-9', code: 'URBAN', name: 'Urban Infrastructure and Metro' },
  { id: 'sec-10', code: 'WATER', name: 'Water Resources and Sanitation' },
  { id: 'sec-11', code: 'TELECOM', name: 'Telecommunications' },
  { id: 'sec-12', code: 'HEALTH', name: 'Health and Social Infrastructure' },
  { id: 'sec-13', code: 'MINING', name: 'Mines and Minerals' },
  { id: 'sec-14', code: 'LOGISTICS', name: 'Multi-Modal Logistics Parks' },
  { id: 'sec-15', code: 'ATOMIC', name: 'Atomic Energy' },
];

export const AGENCIES_LIST = [
  { id: 'ag-1', code: 'NHAI', name: 'National Highways Authority of India' },
  { id: 'ag-2', code: 'RVNL', name: 'Rail Vikas Nigam Limited' },
  { id: 'ag-3', code: 'DFCCIL', name: 'Dedicated Freight Corridor Corp of India' },
  { id: 'ag-4', code: 'ONGC', name: 'Oil and Natural Gas Corporation' },
  { id: 'ag-5', code: 'IOCL', name: 'Indian Oil Corporation Limited' },
  { id: 'ag-6', code: 'NTPC', name: 'NTPC Limited' },
  { id: 'ag-7', code: 'PGCIL', name: 'Power Grid Corporation of India' },
  { id: 'ag-8', code: 'CIL', name: 'Coal India Limited' },
  { id: 'ag-9', code: 'SAIL', name: 'Steel Authority of India Limited' },
  { id: 'ag-10', code: 'AAI', name: 'Airports Authority of India' },
  { id: 'ag-11', code: 'JNPA', name: 'Jawaharlal Nehru Port Authority' },
  { id: 'ag-12', code: 'DMRC', name: 'Delhi Metro Rail Corporation' },
  { id: 'ag-13', code: 'MMRDA', name: 'Mumbai Metropolitan Region Development Authority' },
  { id: 'ag-14', code: 'NWDA', name: 'National Water Development Agency' },
  { id: 'ag-15', code: 'BSNL', name: 'Bharat Sanchar Nigam Limited' },
  { id: 'ag-16', code: 'AIIMS_ENG', name: 'AIIMS Engineering Division' },
  { id: 'ag-17', code: 'NMDC', name: 'National Mineral Development Corporation' },
  { id: 'ag-18', code: 'CONCOR', name: 'Container Corporation of India' },
  { id: 'ag-19', code: 'NPCIL', name: 'Nuclear Power Corporation of India' },
  { id: 'ag-20', code: 'BRO', name: 'Border Roads Organisation' },
];

const STATES = [
  'Jammu & Kashmir', 'Gujarat', 'Maharashtra', 'Odisha', 'Assam', 'Madhya Pradesh',
  'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'Rajasthan', 'West Bengal', 'Andhra Pradesh',
  'Bihar', 'Kerala', 'Telangana', 'Jharkhand', 'Chhattisgarh', 'Punjab', 'Haryana'
];

/**
 * Generate 100+ fully consistent, realistic mega-infrastructure projects for database seeding
 */
export function generateSyntheticDatabaseProjects(): Project[] {
  const baseProjects = [...INITIAL_PROJECTS];
  const targetCount = 105;

  if (baseProjects.length >= targetCount) {
    return baseProjects;
  }

  const generated: Project[] = [...baseProjects];
  const titlesPrefixes = [
    'Greenfield Express Corridor',
    'Super Thermal Power Station Phase III',
    'Deep Water Container Terminal',
    'Inter-State River Basin Linkage',
    'High-Speed Freight Bypass',
    'Crude Pipeline Augmentation',
    'Smart City Metro Line Extension',
    'Special Economic Zone Rail Siding',
    'Ultra Mega Solar Park Grid Connection',
    'Underground Liquefied Gas Storage',
    'All-Weather Himalayan Tunnel Section',
    'Multi-Modal Inland Waterway Terminal',
    'Central Medical Institute Campus',
    'Strategic Border Highway Package',
    'Coking Coal Washery Complex'
  ];

  for (let i = baseProjects.length + 1; i <= targetCount; i++) {
    const code = `P-${1000 + i}`;
    const minObj = MINISTRIES_LIST[i % MINISTRIES_LIST.length];
    const secObj = SECTORS_LIST[i % SECTORS_LIST.length];
    const agObj = AGENCIES_LIST[i % AGENCIES_LIST.length];
    const state = STATES[i % STATES.length];
    const titlePrefix = titlesPrefixes[i % titlesPrefixes.length];
    const name = `${titlePrefix} - Package ${String.fromCharCode(65 + (i % 8))}`;

    const origCost = Math.round(450 + (i * 125) % 18500);
    const costOverrunFactor = 1 + ((i * 7) % 45) / 100;
    const revCost = Math.round(origCost * costOverrunFactor);
    const progress = Math.min(96, Math.max(12, (i * 11) % 92));
    const exp = Math.round(revCost * (progress / 100) * 0.94);
    
    // Risk score calculation based on cost drift & progress
    const costDrift = (revCost - origCost) / origCost;
    let riskScore = Math.min(94, Math.max(15, Math.round(costDrift * 100 + ((100 - progress) * 0.35) + ((i * 9) % 25))));
    let riskLevel: RiskLevel = 'moderate';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 55) riskLevel = 'high';
    else if (riskScore >= 35) riskLevel = 'moderate';
    else riskLevel = 'low';

    const delayMonths = Math.round(((i * 5) % 36));

    // Generate 12 historical snapshots for S-Curve
    const snapshots: ProjectMonthlySnapshot[] = [];
    for (let m = 1; m <= 12; m++) {
      const monthStr = `2025-${String(m).padStart(2, '0')}`;
      const planPhys = Math.min(100, Math.round((m / 12) * (progress + delayMonths)));
      const actPhys = Math.min(progress, Math.round((m / 12) * progress));
      const planFin = Math.min(100, Math.round((m / 12) * 85));
      const actFin = Math.min(85, Math.round((m / 12) * (exp / revCost * 100)));
      snapshots.push({
        id: `snap-${code}-${m}`,
        projectId: `proj-${i}`,
        reportingMonth: monthStr,
        approvedCost: origCost,
        revisedCost: revCost,
        monthlyExpenditure: Math.round(exp / 12),
        cumulativeExpenditure: Math.round(exp * (m / 12)),
        plannedPhysicalProgress: planPhys,
        actualPhysicalProgress: actPhys,
        plannedFinancialProgress: planFin,
        actualFinancialProgress: actFin,
        milestoneCount: 5,
        delayedMilestoneCount: delayMonths > 12 ? Math.floor(m / 4) : 0,
        remarks: `Monthly progress monitored under IPMD MoSPI regular cycle.`
      });
    }

    // Generate milestones
    const milestones: Milestone[] = [
      {
        id: `m-${code}-1`,
        projectId: `proj-${i}`,
        name: 'Detailed Project Report (DPR) & Forest Stage-I Clearance',
        plannedDate: '2023-03-31',
        actualDate: '2023-07-15',
        status: 'completed',
        delayDays: 106,
        remarks: 'Statutory approvals obtained with 106 days delay',
        weightagePct: 15
      },
      {
        id: `m-${code}-2`,
        projectId: `proj-${i}`,
        name: 'Engineering Procurement Construction (EPC) Contract Award',
        plannedDate: '2023-11-30',
        actualDate: '2024-01-20',
        status: 'completed',
        delayDays: 51,
        remarks: 'Financial bid evaluation completed',
        weightagePct: 20
      },
      {
        id: `m-${code}-3`,
        projectId: `proj-${i}`,
        name: 'Right-of-Way (RoW) Handover & Site Mobilization',
        plannedDate: '2024-06-30',
        actualDate: delayMonths > 6 ? null : '2024-08-10',
        status: delayMonths > 6 ? 'delayed' : 'completed',
        delayDays: delayMonths * 30,
        remarks: 'Land acquisition compensation disbursement',
        weightagePct: 25
      },
      {
        id: `m-${code}-4`,
        projectId: `proj-${i}`,
        name: 'Sub-structure & Civil Engineering Milestones',
        plannedDate: '2025-12-31',
        actualDate: null,
        status: progress > 50 ? 'on_track' : 'delayed',
        delayDays: delayMonths > 0 ? delayMonths * 15 : 0,
        remarks: 'Foundation piling and girder casting',
        weightagePct: 25
      },
      {
        id: `m-${code}-5`,
        projectId: `proj-${i}`,
        name: 'Commercial Operational Date (COD) Commissioning',
        plannedDate: `2027-${String(1 + (i % 12)).padStart(2, '0')}-28`,
        actualDate: null,
        status: riskLevel === 'critical' ? 'critical' : 'on_track',
        delayDays: delayMonths * 30,
        remarks: 'Integrated trial runs and safety certification',
        weightagePct: 15
      }
    ];

    const riskAssessment: RiskAssessment = {
      id: `ra-${code}`,
      projectId: `proj-${i}`,
      assessmentDate: '2026-08-31',
      costOverrunProbability: Math.min(0.98, Math.max(0.1, riskScore / 100)),
      timeOverrunProbability: Math.min(0.98, Math.max(0.15, delayMonths / 36)),
      implementationRiskProbability: 0.45,
      overallRiskScore: riskScore,
      riskLevel: riskLevel,
      confidenceScore: 0.88,
      modelVersion: 'v4.2-Ensemble',
      topDrivers: [
        {
          factorName: 'Statutory RoW Clearance Delay',
          factorValue: `${delayMonths} Months`,
          contribution: +18.4,
          direction: 'increasing',
          description: 'Forest Stage-II and Right-of-Way possession pending in key packages',
          category: 'Statutory'
        },
        {
          factorName: 'Contractor Material Escalation',
          factorValue: 'WPI +8.4%',
          contribution: +9.2,
          direction: 'increasing',
          description: 'Escalation claims submitted under standard EPC clause 10CC',
          category: 'Cost'
        }
      ],
      recommendedActions: [
        'Convene tri-partite session under PMG fast-track framework.',
        'Authorize provisional milestone payment against bank guarantee.'
      ]
    };

    generated.push({
      id: `proj-${i}`,
      projectCode: code,
      name: name,
      description: `National priority infrastructure asset executed by ${agObj.name} under ${minObj.name}.`,
      ministry: minObj.name,
      sector: secObj.name,
      implementingAgency: agObj.name,
      state: state,
      district: `${state} Central District`,
      latitude: 20.5937 + ((i * 3.7) % 8) - 4,
      longitude: 78.9629 + ((i * 4.1) % 10) - 5,
      originalCost: origCost,
      revisedCost: revCost,
      cumulativeExpenditure: exp,
      originalStartDate: '2022-04-01',
      originalCompletionDate: '2026-03-31',
      currentCompletionDate: `2027-${String(1 + (i % 12)).padStart(2, '0')}-30`,
      projectStatus: delayMonths > 18 ? 'Delayed' : progress >= 100 ? 'Completed' : 'On Schedule',
      physicalProgress: progress,
      financialProgress: Math.round((exp / revCost) * 100),
      riskScore: riskScore,
      riskLevel: riskLevel,
      delayMonths: delayMonths,
      costOverrunPct: Math.round(((revCost - origCost) / origCost) * 100),
      dataCompletenessScore: 96.5,
      dataQualityScore: 96.5,
      missingMandatoryFields: [],
      dataQualityIssues: [],
      lastUpdated: '2026-08-31',
      priorityRank: i,
      milestones: milestones,
      snapshots: snapshots,
      riskAssessment: riskAssessment,
      activeAlertsCount: riskScore >= 55 ? 2 : 0
    });
  }

  return generated;
}

/**
 * Generate 100+ realistic predictive anomaly alerts
 */
export function generateSyntheticAlerts(projects: Project[]): Alert[] {
  const alerts: Alert[] = [...INITIAL_ALERTS];
  const targetCount = 100;

  if (alerts.length >= targetCount) return alerts;

  const alertTypes: Array<Alert['alertType']> = [
    'Predicted Cost Overrun',
    'Predicted Schedule Delay',
    'Milestone Delay',
    'Physical-Financial Mismatch',
    'Expenditure Slowdown',
    'Statutory Clearance Block'
  ];

  for (let i = alerts.length + 1; i <= targetCount; i++) {
    const p = projects[i % projects.length];
    const alertType = alertTypes[i % alertTypes.length];
    const severity: Alert['severity'] = p.riskScore >= 75 ? 'critical' : p.riskScore >= 55 ? 'high' : 'medium';

    alerts.push({
      id: `alt-${i}`,
      projectId: p.id,
      projectCode: p.projectCode,
      projectName: p.name,
      ministry: p.ministry,
      sector: p.sector,
      alertType: alertType,
      severity: severity,
      title: `${alertType.toUpperCase()}: ${p.projectCode}`,
      description: `Predictive model detected early divergence in ${p.sector} project parameters. Risk Score: ${p.riskScore}/100.`,
      triggerValue: `${p.riskScore}/100`,
      thresholdValue: '55/100',
      status: i % 3 === 0 ? 'acknowledged' : i % 3 === 1 ? 'under_review' : 'active',
      assignedTo: 'Dr. Rajiv Malhotra, IAS',
      assignedRole: 'Monitoring Officer',
      dueDate: '2026-09-30',
      createdAt: '2026-08-28',
      resolvedAt: null,
      comments: [
        {
          id: `cmt-${i}-1`,
          author: 'System Diagnostic',
          role: 'AI Model',
          text: 'Automated notification dispatched following August OCMS monthly ingestion cycle.',
          timestamp: '2026-08-28T09:15:00Z'
        }
      ]
    });
  }

  return alerts;
}

/**
 * Generate 50+ inter-ministerial interventions
 */
export function generateSyntheticInterventions(projects: Project[]): Intervention[] {
  const interventions: Intervention[] = [...INITIAL_INTERVENTIONS];
  const targetCount = 55;

  if (interventions.length >= targetCount) return interventions;

  for (let i = interventions.length + 1; i <= targetCount; i++) {
    const p = projects[i % projects.length];
    interventions.push({
      id: `intv-${i}`,
      projectId: p.id,
      projectCode: p.projectCode,
      projectName: p.name,
      priority: p.riskScore >= 75 ? 'P1 - Critical' : 'P2 - High',
      riskDriver: 'Inter-Departmental Clearances and Right-of-Way Handover',
      recommendedAction: `Escalate ${p.projectCode} to Cabinet Secretariat Project Monitoring Group (PMG) for expedited statutory resolution.`,
      responsibleAuthority: p.ministry,
      dueDate: `2026-09-${String(10 + (i % 18)).padStart(2, '0')}`,
      currentStatus: i % 3 === 0 ? 'under_review' : i % 3 === 1 ? 'action_initiated' : 'awaiting_update',
      lastActionTaken: `Notice dispatched to District Magistrate and Principal Chief Conservator of Forests.`,
      nextReviewDate: '2026-09-30',
      updatedAt: '2026-08-31'
    });
  }

  return interventions;
}
