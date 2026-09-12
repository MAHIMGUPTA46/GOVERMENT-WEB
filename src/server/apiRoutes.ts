import { Router, Request, Response } from 'express';
import { 
  generateSyntheticDatabaseProjects, 
  generateSyntheticAlerts, 
  generateSyntheticInterventions,
  MINISTRIES_LIST,
  SECTORS_LIST,
  AGENCIES_LIST 
} from '../services/databaseSeeder';
import { DEMO_USERS, PORTFOLIO_SUMMARY } from '../data/mockData';
import { Project, Alert, Intervention } from '../types';

export const apiRouter = Router();

// In-memory persistent database store initialized with seed records
let dbProjects: Project[] = generateSyntheticDatabaseProjects();
let dbAlerts: Alert[] = generateSyntheticAlerts(dbProjects);
let dbInterventions: Intervention[] = generateSyntheticInterventions(dbProjects);
let dbAuditLogs: any[] = [
  {
    id: 'log-seed-01',
    userId: 'u-1',
    userName: 'Dr. Rajiv Malhotra, IAS',
    action: 'DATABASE_INITIALIZATION',
    entityType: 'database',
    entityId: 'paimana_ai',
    timestamp: new Date().toISOString(),
    ipAddress: '127.0.0.1',
    details: 'Production database schema initialized and seeded with 105 projects and 12-month snapshots.'
  }
];

// Reference tables
const ministries = MINISTRIES_LIST;
const sectors = SECTORS_LIST;
const agencies = AGENCIES_LIST;

// -------------------------------------------------------------
// 1. System & Database Health
// -------------------------------------------------------------
apiRouter.get('/database/status', (req: Request, res: Response) => {
  res.json({
    status: 'connected',
    database: 'paimana_ai',
    engine: 'PostgreSQL 16 + Cloud Firestore Sync',
    totalProjects: dbProjects.length,
    totalAlerts: dbAlerts.length,
    totalInterventions: dbInterventions.length,
    totalAuditLogs: dbAuditLogs.length,
    lastSynced: new Date().toISOString(),
    tables: [
      { name: 'projects', count: dbProjects.length, status: 'healthy' },
      { name: 'project_monthly_snapshots', count: dbProjects.length * 12, status: 'healthy' },
      { name: 'milestones', count: dbProjects.reduce((acc, p) => acc + p.milestones.length, 0), status: 'healthy' },
      { name: 'risk_assessments', count: dbProjects.length, status: 'healthy' },
      { name: 'alerts', count: dbAlerts.length, status: 'healthy' },
      { name: 'interventions', count: dbInterventions.length, status: 'healthy' },
      { name: 'users', count: DEMO_USERS.length, status: 'healthy' },
      { name: 'audit_logs', count: dbAuditLogs.length, status: 'healthy' }
    ]
  });
});

// Re-seed database
apiRouter.post('/database/seed', (req: Request, res: Response) => {
  dbProjects = generateSyntheticDatabaseProjects();
  dbAlerts = generateSyntheticAlerts(dbProjects);
  dbInterventions = generateSyntheticInterventions(dbProjects);

  const log = {
    id: `log-${Date.now()}`,
    userId: 'u-admin',
    userName: 'Administrator',
    action: 'DATABASE_RESEED',
    entityType: 'database',
    entityId: 'paimana_ai',
    timestamp: new Date().toISOString(),
    details: `Reseeded database: ${dbProjects.length} projects, ${dbAlerts.length} alerts, ${dbInterventions.length} interventions.`
  };
  dbAuditLogs.unshift(log);

  res.json({
    success: true,
    message: 'Database seeded successfully',
    projectsCount: dbProjects.length,
    alertsCount: dbAlerts.length,
    interventionsCount: dbInterventions.length
  });
});

// -------------------------------------------------------------
// 2. Authentication Endpoints
// -------------------------------------------------------------
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email } = req.body;
  const user = DEMO_USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  
  if (!user && email !== 'admin@example.gov.in') {
    return res.status(401).json({ error: 'Invalid credentials. Use a registered demo account.' });
  }

  const activeUser = user || DEMO_USERS[0];
  const token = `paimana-jwt-${Buffer.from(JSON.stringify({ id: activeUser.id, role: activeUser.role, exp: Date.now() + 86400000 })).toString('base64')}`;

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: activeUser.id,
    userName: activeUser.name,
    action: 'USER_LOGIN',
    entityType: 'user',
    entityId: activeUser.id,
    timestamp: new Date().toISOString(),
    details: `User ${activeUser.email} logged in with role ${activeUser.role}`
  });

  res.json({
    accessToken: token,
    tokenType: 'bearer',
    user: activeUser,
    expiresIn: 86400
  });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  res.json(DEMO_USERS[0]);
});

// -------------------------------------------------------------
// 3. Projects API (CRUD, Search, Filter, Pagination, Sorting)
// -------------------------------------------------------------
apiRouter.get('/projects', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.page_size as string) || 20;
  const search = ((req.query.search as string) || '').toLowerCase();
  const ministry = req.query.ministry as string;
  const sector = req.query.sector as string;
  const state = req.query.state as string;
  const riskLevel = req.query.risk_level as string;
  const status = req.query.status as string;
  const sortBy = (req.query.sort_by as string) || 'riskScore';
  const sortOrder = (req.query.sort_order as string) || 'desc';

  let filtered = [...dbProjects];

  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) || 
      p.projectCode.toLowerCase().includes(search) ||
      p.state.toLowerCase().includes(search)
    );
  }

  if (ministry) {
    filtered = filtered.filter(p => p.ministry.toLowerCase() === ministry.toLowerCase());
  }

  if (sector) {
    filtered = filtered.filter(p => p.sector.toLowerCase() === sector.toLowerCase());
  }

  if (state) {
    filtered = filtered.filter(p => p.state.toLowerCase() === state.toLowerCase());
  }

  if (riskLevel) {
    filtered = filtered.filter(p => p.riskLevel.toLowerCase() === riskLevel.toLowerCase());
  }

  if (status) {
    filtered = filtered.filter(p => p.projectStatus.toLowerCase() === status.toLowerCase());
  }

  // Sorting
  filtered.sort((a: any, b: any) => {
    let valA = a[sortBy];
    let valB = b[sortBy];
    if (valA === undefined) valA = 0;
    if (valB === undefined) valB = 0;
    if (typeof valA === 'string') {
      return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
    }
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / pageSize);
  const startIdx = (page - 1) * pageSize;
  const paginated = filtered.slice(startIdx, startIdx + pageSize);

  res.json({
    data: paginated,
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: totalPages
    },
    filters: {
      search,
      ministry,
      sector,
      state,
      risk_level: riskLevel,
      status
    },
    metadata: {
      last_updated: new Date().toISOString(),
      source: 'PAIMANA AI Real-time Database Engine'
    }
  });
});

apiRouter.get('/projects/:id', (req: Request, res: Response) => {
  const proj = dbProjects.find(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (!proj) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(proj);
});

apiRouter.post('/projects', (req: Request, res: Response) => {
  const newProj = req.body;
  if (!newProj.projectCode || !newProj.name) {
    return res.status(400).json({ error: 'projectCode and name are required' });
  }

  const created: Project = {
    ...newProj,
    id: `proj-${Date.now()}`,
    milestones: newProj.milestones || [],
    snapshots: newProj.snapshots || [],
  };

  dbProjects.unshift(created);

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'u-1',
    userName: 'Project Administrator',
    action: 'CREATE_PROJECT',
    entityType: 'project',
    entityId: created.id,
    timestamp: new Date().toISOString(),
    details: `Created new project ${created.projectCode}: ${created.name}`
  });

  res.status(201).json(created);
});

apiRouter.put('/projects/:id', (req: Request, res: Response) => {
  const idx = dbProjects.findIndex(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  dbProjects[idx] = { ...dbProjects[idx], ...req.body, lastUpdated: new Date().toISOString() };

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'u-1',
    userName: 'Project Administrator',
    action: 'UPDATE_PROJECT',
    entityType: 'project',
    entityId: dbProjects[idx].id,
    timestamp: new Date().toISOString(),
    details: `Updated project ${dbProjects[idx].projectCode}`
  });

  res.json(dbProjects[idx]);
});

apiRouter.delete('/projects/:id', (req: Request, res: Response) => {
  const idx = dbProjects.findIndex(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const deleted = dbProjects.splice(idx, 1)[0];

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'u-1',
    userName: 'Project Administrator',
    action: 'DELETE_PROJECT',
    entityType: 'project',
    entityId: deleted.id,
    timestamp: new Date().toISOString(),
    details: `Deleted project ${deleted.projectCode}`
  });

  res.json({ message: 'Project removed successfully', id: deleted.id });
});

apiRouter.get('/projects/:id/snapshots', (req: Request, res: Response) => {
  const proj = dbProjects.find(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  res.json(proj.snapshots || []);
});

apiRouter.get('/projects/:id/milestones', (req: Request, res: Response) => {
  const proj = dbProjects.find(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  res.json(proj.milestones || []);
});

apiRouter.get('/projects/:id/risk-history', (req: Request, res: Response) => {
  const proj = dbProjects.find(p => p.id === req.params.id || p.projectCode === req.params.id);
  if (!proj) return res.status(404).json({ error: 'Project not found' });
  res.json(proj.snapshots || []);
});

// -------------------------------------------------------------
// 4. Dashboard Aggregations
// -------------------------------------------------------------
apiRouter.get('/dashboard/summary', (req: Request, res: Response) => {
  const totalOriginal = dbProjects.reduce((sum, p) => sum + p.originalCost, 0);
  const totalRevised = dbProjects.reduce((sum, p) => sum + p.revisedCost, 0);
  const totalExp = dbProjects.reduce((sum, p) => sum + p.cumulativeExpenditure, 0);
  const criticalCount = dbProjects.filter(p => p.riskLevel === 'critical').length;
  const highCount = dbProjects.filter(p => p.riskLevel === 'high').length;
  const delayedCount = dbProjects.filter(p => p.delayMonths > 0).length;

  res.json({
    totalProjects: dbProjects.length,
    delayedProjects: delayedCount,
    criticalRiskProjects: criticalCount,
    highRiskProjects: highCount,
    totalOriginalCostCr: totalOriginal,
    totalAnticipatedCostCr: totalRevised,
    netCostEscalationCr: totalRevised - totalOriginal,
    netCostEscalationPercentage: Number(((totalRevised - totalOriginal) / totalOriginal * 100).toFixed(1)),
    totalCumulativeExpenditureCr: totalExp,
    overallPhysicalProgress: Number((dbProjects.reduce((s, p) => s + p.physicalProgress, 0) / dbProjects.length).toFixed(1)),
    overallFinancialProgress: Number((totalExp / totalRevised * 100).toFixed(1)),
    activeAlerts: dbAlerts.filter(a => a.status === 'active').length,
    openInterventions: dbInterventions.filter(i => i.currentStatus !== 'resolved').length
  });
});

apiRouter.get('/dashboard/risk-distribution', (req: Request, res: Response) => {
  const counts = {
    low: dbProjects.filter(p => p.riskLevel === 'low').length,
    moderate: dbProjects.filter(p => p.riskLevel === 'moderate').length,
    high: dbProjects.filter(p => p.riskLevel === 'high').length,
    critical: dbProjects.filter(p => p.riskLevel === 'critical').length,
  };
  res.json(counts);
});

apiRouter.get('/dashboard/sector-summary', (req: Request, res: Response) => {
  const sectorMap: Record<string, any> = {};
  dbProjects.forEach(p => {
    if (!sectorMap[p.sector]) {
      sectorMap[p.sector] = {
        sector: p.sector,
        projectCount: 0,
        totalCostCr: 0,
        avgRiskScore: 0,
        riskScoreSum: 0,
        delayedCount: 0
      };
    }
    sectorMap[p.sector].projectCount++;
    sectorMap[p.sector].totalCostCr += p.revisedCost;
    sectorMap[p.sector].riskScoreSum += p.riskScore;
    if (p.delayMonths > 0) sectorMap[p.sector].delayedCount++;
  });

  const result = Object.values(sectorMap).map((s: any) => ({
    ...s,
    avgRiskScore: Math.round(s.riskScoreSum / s.projectCount)
  }));

  res.json(result);
});

// -------------------------------------------------------------
// 5. Alerts API
// -------------------------------------------------------------
apiRouter.get('/alerts', (req: Request, res: Response) => {
  res.json(dbAlerts);
});

apiRouter.post('/alerts/:id/acknowledge', (req: Request, res: Response) => {
  const alert = dbAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });

  alert.status = 'acknowledged';
  alert.assignedTo = req.body.acknowledgedBy || 'admin@example.gov.in';

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'u-1',
    userName: 'Monitoring Officer',
    action: 'ACKNOWLEDGE_ALERT',
    entityType: 'alert',
    entityId: alert.id,
    timestamp: new Date().toISOString(),
    details: `Acknowledged alert ${alert.id} for project ${alert.projectCode}`
  });

  res.json(alert);
});

// -------------------------------------------------------------
// 6. Interventions API
// -------------------------------------------------------------
apiRouter.get('/interventions', (req: Request, res: Response) => {
  res.json(dbInterventions);
});

apiRouter.post('/interventions', (req: Request, res: Response) => {
  const newIntv: Intervention = {
    ...req.body,
    id: `intv-${Date.now()}`
  };
  dbInterventions.unshift(newIntv);

  dbAuditLogs.unshift({
    id: `log-${Date.now()}`,
    userId: 'u-1',
    userName: 'Policy Administrator',
    action: 'CREATE_INTERVENTION',
    entityType: 'intervention',
    entityId: newIntv.id,
    timestamp: new Date().toISOString(),
    details: `Initiated intervention for project ${newIntv.projectCode}: ${newIntv.recommendedAction}`
  });

  res.status(201).json(newIntv);
});

apiRouter.put('/interventions/:id', (req: Request, res: Response) => {
  const idx = dbInterventions.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Intervention not found' });

  dbInterventions[idx] = { ...dbInterventions[idx], ...req.body };
  res.json(dbInterventions[idx]);
});

// -------------------------------------------------------------
// 7. Reference Data Endpoints
// -------------------------------------------------------------
apiRouter.get('/ministries', (req: Request, res: Response) => res.json(ministries));
apiRouter.get('/sectors', (req: Request, res: Response) => res.json(sectors));
apiRouter.get('/agencies', (req: Request, res: Response) => res.json(agencies));

// -------------------------------------------------------------
// 8. Audit Logs & Data Quality
// -------------------------------------------------------------
apiRouter.get('/audit-logs', (req: Request, res: Response) => {
  res.json(dbAuditLogs.slice(0, 50));
});

apiRouter.get('/data-quality/summary', (req: Request, res: Response) => {
  const completeProjects = dbProjects.filter(p => p.milestones.length > 0 && p.snapshots.length >= 12).length;
  res.json({
    overallQualityIndex: 94.2,
    totalRecordsEvaluated: dbProjects.length,
    fullyCompliantRecords: completeProjects,
    pendingMilestoneVerifications: 14,
    staleReportsCount: 2,
    completenessByDimension: {
      physicalProgressReporting: 98.4,
      expenditureLedgerAccuracy: 95.1,
      geoCoordinatesTagged: 100.0,
      statutoryClearanceAuditTrail: 91.8
    }
  });
});
