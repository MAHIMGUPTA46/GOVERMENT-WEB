export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export type ProjectStatus = 
  | 'On Schedule' 
  | 'Delayed' 
  | 'Ahead of Schedule' 
  | 'Completed' 
  | 'Stalled / Scrutiny';

export type UserRole = 
  | 'super_admin' 
  | 'ministry_admin' 
  | 'monitoring_officer' 
  | 'analyst' 
  | 'executive_viewer' 
  | 'demo_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  designation: string;
  ministry: string;
  avatarInitials: string;
}

export interface RiskFactor {
  factorName: string;
  factorValue: string | number;
  contribution: number; // e.g. +14% or -6% SHAP value
  direction: 'increasing' | 'decreasing';
  description: string;
  category: 'Cost' | 'Schedule' | 'Statutory' | 'Execution' | 'Geological';
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  plannedDate: string;
  actualDate: string | null;
  status: 'completed' | 'on_track' | 'delayed' | 'critical';
  delayDays: number;
  remarks: string;
  weightagePct: number;
}

export interface ProjectMonthlySnapshot {
  id: string;
  projectId: string;
  reportingMonth: string; // e.g. "2025-09", "2025-10"
  approvedCost: number; // in ₹ Cr
  revisedCost: number; // in ₹ Cr
  monthlyExpenditure: number; // in ₹ Cr
  cumulativeExpenditure: number; // in ₹ Cr
  plannedPhysicalProgress: number; // 0-100%
  actualPhysicalProgress: number; // 0-100%
  plannedFinancialProgress: number; // 0-100%
  actualFinancialProgress: number; // 0-100%
  milestoneCount: number;
  delayedMilestoneCount: number;
  remarks: string;
}

export interface RiskAssessment {
  id: string;
  projectId: string;
  assessmentDate: string;
  costOverrunProbability: number; // 0-1
  timeOverrunProbability: number; // 0-1
  implementationRiskProbability: number; // 0-1
  overallRiskScore: number; // 0-100
  riskLevel: RiskLevel;
  confidenceScore: number; // 0-1
  modelVersion: string;
  topDrivers: RiskFactor[];
  recommendedActions: string[];
}

export interface AlertComment {
  id: string;
  author: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface Alert {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  ministry: string;
  sector: string;
  alertType: 
    | 'Predicted Cost Overrun'
    | 'Predicted Schedule Delay'
    | 'Milestone Delay'
    | 'Physical-Financial Mismatch'
    | 'Expenditure Slowdown'
    | 'Repeated Extension'
    | 'Data Not Updated'
    | 'Sudden Risk Escalation'
    | 'Statutory Clearance Block';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  triggerValue: string;
  thresholdValue: string;
  status: 'active' | 'acknowledged' | 'under_review' | 'resolved';
  assignedTo: string;
  assignedRole: string;
  dueDate: string;
  createdAt: string;
  resolvedAt: string | null;
  comments: AlertComment[];
}

export interface Intervention {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  priority: 'P1 - Critical' | 'P2 - High' | 'P3 - Moderate';
  riskDriver: string;
  recommendedAction: string;
  responsibleAuthority: string;
  dueDate: string;
  currentStatus: 'not_started' | 'under_review' | 'action_initiated' | 'awaiting_update' | 'resolved' | 'closed';
  lastActionTaken: string;
  nextReviewDate: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  projectCode: string; // e.g. "P-1001"
  name: string;
  description: string;
  ministry: string;
  sector: string;
  implementingAgency: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  originalCost: number; // in ₹ Cr
  revisedCost: number; // in ₹ Cr
  cumulativeExpenditure: number; // in ₹ Cr
  originalStartDate: string;
  originalCompletionDate: string;
  currentCompletionDate: string;
  projectStatus: ProjectStatus;
  physicalProgress: number; // 0-100%
  financialProgress: number; // 0-100%
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  delayMonths: number;
  costOverrunPct: number;
  dataCompletenessScore: number; // 0-100%
  dataQualityScore: number; // 0-100% Data Quality audit score
  missingMandatoryFields?: string[]; // Flagged missing mandatory fields (e.g., 'original_completion_date')
  dataQualityIssues?: string[]; // Detailed quality flags and audit remarks
  lastUpdated: string;
  priorityRank: number;
  milestones: Milestone[];
  snapshots: ProjectMonthlySnapshot[];
  riskAssessment: RiskAssessment;
  activeAlertsCount: number;
}

export interface ModelMetrics {
  id: string;
  modelName: string;
  version: string;
  modelType: 'XGBoost Regressor & Classifier' | 'LightGBM Ensemble' | 'Random Forest' | 'Baseline Logistic Regression';
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  maeCostPct: number;
  maeDelayMonths: number;
  leadTimeMonths: number;
  topRiskCaptureRate: number;
  isActive: boolean;
  trainedOnRecords: number;
  lastRetrained: string;
  confusionMatrix: {
    truePositive: number;
    falsePositive: number;
    trueNegative: number;
    falseNegative: number;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entityType: 'Project' | 'Alert' | 'Intervention' | 'Model' | 'User' | 'Report';
  entityId: string;
  details: string;
  ipAddress: string;
}

export interface BenchmarkCohort {
  sector: string;
  totalProjects: number;
  avgOriginalCost: number;
  avgRevisedCost: number;
  avgEscalationPct: number;
  avgDelayMonths: number;
  mismatchScorePct: number;
  topPerformingAgency: string;
  underPerformingAgency: string;
  highRiskCount: number;
}

export interface FilterState {
  search: string;
  reportingMonth: string;
  ministry: string;
  sector: string;
  state: string;
  projectStatus: string;
  riskLevel: string;
  costRange: string; // 'all' | '<1000' | '1000-5000' | '>5000'
  delayRange: string; // 'all' | 'none' | '1-24' | '>24'
}
