import { Project } from '../types';

export interface DataQualityCheckResult {
  score: number; // 0 - 100
  missingMandatoryFields: string[]; // e.g. ['original_completion_date', 'original_cost']
  issues: string[]; // Descriptive audit remarks
  status: 'clean' | 'warning' | 'critical';
}

export interface PortfolioQualityReport {
  totalProjects: number;
  flaggedProjectsCount: number;
  cleanProjectsCount: number;
  averageQualityScore: number;
  missingFieldsCountMap: Record<string, number>;
  highQualityCount: number; // score >= 90
  moderateQualityCount: number; // score 70 - 89
  poorQualityCount: number; // score < 70
}

/**
 * Checks whether a date string is non-empty, not a placeholder ('TBD', 'N/A', etc.),
 * and can be parsed as a valid ISO/calendar date.
 */
function isValidDate(dateStr: unknown): boolean {
  if (typeof dateStr !== 'string') return false;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed.toLowerCase() === 'tbd' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'null') {
    return false;
  }
  const parsed = Date.parse(trimmed);
  return !isNaN(parsed);
}

/**
 * Checks whether a string value is present and not a generic empty/placeholder.
 */
function isNonEmptyString(val: unknown): boolean {
  if (typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed.length > 0 && trimmed.toLowerCase() !== 'tbd' && trimmed.toLowerCase() !== 'n/a';
}

/**
 * Formats snake_case field identifiers into user-facing presentation labels
 * e.g., 'original_completion_date' -> 'Original Completion Date'
 */
export function formatMissingFieldName(fieldKey: string): string {
  switch (fieldKey) {
    case 'original_completion_date':
      return 'Original Completion Date';
    case 'original_start_date':
      return 'Original Start Date';
    case 'current_completion_date':
      return 'Current Completion Date';
    case 'original_cost':
      return 'Original Cost (₹ Cr)';
    case 'project_code':
      return 'Project Code';
    case 'name':
      return 'Project Name';
    case 'ministry':
      return 'Ministry';
    case 'sector':
      return 'Sector';
    case 'implementing_agency':
      return 'Implementing Agency';
    case 'state':
      return 'Location State';
    default:
      return fieldKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

/**
 * Evaluates a single project against statutory data quality and mandatory field rules.
 * Deducts points for missing mandatory fields and semantic data contradictions.
 */
export function checkProjectDataQuality(project: Partial<Project>): DataQualityCheckResult {
  const missingMandatory: string[] = [];
  const issues: string[] = [];
  let deduction = 0;

  // 1. Mandatory Statutory Baseline: Original Completion Date (Critical)
  // Essential for IPMD statutory time overrun calculations
  const origCompDate = project.originalCompletionDate ?? (project as any).original_completion_date;
  if (!isValidDate(origCompDate)) {
    missingMandatory.push('original_completion_date');
    issues.push('Missing mandatory original completion date (baseline schedule unavailable)');
    deduction += 25;
  }

  // 2. Mandatory Statutory Baseline: Original Start Date
  const origStartDate = project.originalStartDate ?? (project as any).original_start_date;
  if (!isValidDate(origStartDate)) {
    missingMandatory.push('original_start_date');
    issues.push('Missing mandatory sanction / original start date');
    deduction += 15;
  }

  // 3. Mandatory Anticipated Completion Date
  const currCompDate = project.currentCompletionDate ?? (project as any).current_completion_date;
  if (!isValidDate(currCompDate)) {
    missingMandatory.push('current_completion_date');
    issues.push('Missing current / revised target completion date');
    deduction += 15;
  }

  // 4. Mandatory Financials: Original Cost
  const origCost = project.originalCost ?? (project as any).original_cost;
  if (origCost === undefined || origCost === null || isNaN(Number(origCost)) || Number(origCost) <= 0) {
    missingMandatory.push('original_cost');
    issues.push('Original approved cost is missing or non-positive');
    deduction += 20;
  }

  // 5. Core Identification: Project Code
  const code = project.projectCode ?? (project as any).project_code;
  if (!isNonEmptyString(code)) {
    missingMandatory.push('project_code');
    issues.push('Missing unique identifier / project code');
    deduction += 10;
  }

  // 6. Project Name
  if (!isNonEmptyString(project.name)) {
    missingMandatory.push('name');
    issues.push('Missing project title / name');
    deduction += 10;
  }

  // 7. Implementing Agency & Ministry
  const agency = project.implementingAgency ?? (project as any).implementing_agency;
  if (!isNonEmptyString(agency)) {
    missingMandatory.push('implementing_agency');
    issues.push('Missing executing agency / PSU');
    deduction += 5;
  }

  if (!isNonEmptyString(project.ministry)) {
    missingMandatory.push('ministry');
    issues.push('Missing nodal ministry specification');
    deduction += 5;
  }

  if (!isNonEmptyString(project.sector)) {
    missingMandatory.push('sector');
    issues.push('Missing infrastructure sector classification');
    deduction += 5;
  }

  const state = project.state ?? (project as any).location_state;
  if (!isNonEmptyString(state)) {
    missingMandatory.push('state');
    issues.push('Missing project geographical state');
    deduction += 5;
  }

  // --- Semantic consistency checks ---
  if (isValidDate(origStartDate) && isValidDate(currCompDate)) {
    const startMs = Date.parse(origStartDate as string);
    const currMs = Date.parse(currCompDate as string);
    if (currMs < startMs) {
      issues.push('Anticipated completion date is earlier than original start date');
      deduction += 10;
    }
  }

  if (project.revisedCost !== undefined && origCost !== undefined && Number(origCost) > 0) {
    const rev = Number(project.revisedCost);
    const orig = Number(origCost);
    if (rev < orig * 0.5 && project.projectStatus !== 'Completed') {
      issues.push('Revised cost is unexpectedly lower than 50% of sanctioned cost');
      deduction += 5;
    }
  }

  // Calculate clamped score
  let score = Math.max(10, Math.min(100, 100 - deduction));

  // If critical mandatory fields (such as original_completion_date) are missing,
  // cap data quality score at 70% to strictly enforce audit compliance
  if (missingMandatory.includes('original_completion_date')) {
    score = Math.min(score, 70);
  }
  if (missingMandatory.length >= 2) {
    score = Math.min(score, 55);
  }

  let status: 'clean' | 'warning' | 'critical' = 'clean';
  if (missingMandatory.length > 0 || score < 75) {
    status = score < 60 || missingMandatory.length >= 2 ? 'critical' : 'warning';
  }

  return {
    score,
    missingMandatoryFields: missingMandatory,
    issues,
    status,
  };
}

/**
 * Runs DataQualityCheck utility over an array of Project domain records during initial ingestion.
 * Computes and populates 'dataQualityScore', 'missingMandatoryFields', and 'dataQualityIssues'.
 */
export function runDataQualityCheck(projects: Project[]): Project[] {
  return projects.map((p) => {
    const result = checkProjectDataQuality(p);
    return {
      ...p,
      dataQualityScore: result.score,
      dataCompletenessScore: result.score, // Synchronize completeness with quality score
      missingMandatoryFields: result.missingMandatoryFields,
      dataQualityIssues: result.issues,
    };
  });
}

/**
 * Computes portfolio-wide summary metrics for data quality auditing.
 */
export function getPortfolioQualityReport(projects: Project[]): PortfolioQualityReport {
  let totalScore = 0;
  let flaggedCount = 0;
  let highCount = 0;
  let modCount = 0;
  let poorCount = 0;
  const missingCountMap: Record<string, number> = {};

  projects.forEach((p) => {
    const score = p.dataQualityScore ?? p.dataCompletenessScore ?? 90;
    totalScore += score;

    if (score >= 90) highCount++;
    else if (score >= 70) modCount++;
    else poorCount++;

    if (p.missingMandatoryFields && p.missingMandatoryFields.length > 0) {
      flaggedCount++;
      p.missingMandatoryFields.forEach((field) => {
        missingCountMap[field] = (missingCountMap[field] || 0) + 1;
      });
    }
  });

  const total = Math.max(1, projects.length);

  return {
    totalProjects: projects.length,
    flaggedProjectsCount: flaggedCount,
    cleanProjectsCount: projects.length - flaggedCount,
    averageQualityScore: parseFloat((totalScore / total).toFixed(1)),
    missingFieldsCountMap: missingCountMap,
    highQualityCount: highCount,
    moderateQualityCount: modCount,
    poorQualityCount: poorCount,
  };
}
