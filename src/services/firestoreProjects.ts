import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  runTransaction,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Project, 
  ProjectMonthlySnapshot, 
  Milestone, 
  RiskAssessment, 
  Alert, 
  Intervention, 
  AuditLog,
  RiskLevel
} from '../types';

export interface ProjectFilterOptions {
  search?: string;
  ministry?: string;
  sector?: string;
  state?: string;
  status?: string;
  riskLevel?: RiskLevel;
  minCost?: number;
  maxCost?: number;
  sortBy?: 'riskScore' | 'revisedCostCr' | 'physicalProgress' | 'currentCompletionDate';
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  page?: number;
}

/**
 * Real-time listener for infrastructure projects
 */
export function subscribeToProjects(
  onUpdate: (projects: Project[]) => void,
  filter?: { riskLevel?: string; ministry?: string }
) {
  const collectionRef = collection(db, 'projects');
  let q = query(collectionRef, limit(150));

  if (filter?.riskLevel) {
    q = query(collectionRef, where('riskLevel', '==', filter.riskLevel), limit(100));
  } else if (filter?.ministry) {
    q = query(collectionRef, where('ministry', '==', filter.ministry), limit(100));
  }

  return onSnapshot(q, (snapshot) => {
    const list: Project[] = [];
    snapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Project);
    });
    if (list.length > 0) {
      onUpdate(list);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, 'projects');
  });
}

/**
 * Fetch projects from Firestore with local fallback
 */
export async function fetchProjectsFromFirestore(): Promise<Project[]> {
  try {
    const snapshot = await getDocs(collection(db, 'projects'));
    const projects: Project[] = [];
    snapshot.forEach((doc) => {
      projects.push({ id: doc.id, ...doc.data() } as Project);
    });
    return projects;
  } catch (error) {
    console.warn('Firestore fetch projects fallback:', error);
    return [];
  }
}

/**
 * Save or update project in Firestore
 */
export async function saveProjectToFirestore(project: Project): Promise<void> {
  const path = `projects/${project.id}`;
  try {
    const docRef = doc(db, 'projects', project.id);
    await setDoc(docRef, {
      ...project,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    // Log audit trail
    await logDatabaseAction({
      userId: auth.currentUser?.uid || 'system',
      userName: auth.currentUser?.displayName || 'System Administrator',
      action: 'UPDATE_PROJECT',
      entityType: 'project',
      entityId: project.id,
      details: `Updated project ${project.projectCode}: ${project.name} (Risk Score: ${project.riskScore})`,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Save a batch of projects to Firestore
 */
export async function saveProjectsBatchToFirestore(projects: Project[]): Promise<void> {
  if (!projects || projects.length === 0) return;
  try {
    let batch = writeBatch(db);
    let opCount = 0;

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const docRef = doc(db, 'projects', p.id);
      batch.set(docRef, {
        ...p,
        lastSyncedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      opCount++;

      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    if (opCount > 0) {
      await batch.commit();
    }

    await logDatabaseAction({
      userId: auth.currentUser?.uid || 'system',
      userName: auth.currentUser?.displayName || 'System Officer',
      action: 'BATCH_INGEST_PROJECTS',
      entityType: 'project_batch',
      entityId: `batch-${Date.now()}`,
      details: `Batch synced ${projects.length} projects to Firestore.`,
    });
  } catch (error) {
    console.error('Failed to save projects batch to Firestore:', error);
    throw error;
  }
}

/**
 * Record immutable audit log
 */
export async function logDatabaseAction(log: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}): Promise<void> {
  try {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, 'audit_logs', logId);
    await setDoc(docRef, {
      id: logId,
      ...log,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Non-blocking for UI
    console.warn('Audit log write error:', error);
  }
}

/**
 * Execute atomic batch seed into Firestore
 */
export async function seedFirestoreDatabase(
  projects: Project[],
  alerts: Alert[],
  interventions: Intervention[],
  auditLogs: AuditLog[],
  onProgress?: (msg: string, pct: number) => void
): Promise<{ projectsSeeded: number; alertsSeeded: number; interventionsSeeded: number }> {
  try {
    onProgress?.('Preparing batch operations...', 10);
    
    // Firestore batch limit is 500 ops per commit
    let batch = writeBatch(db);
    let opCount = 0;
    let totalProjects = 0;
    let totalAlerts = 0;
    let totalInterventions = 0;

    // Seed Projects
    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const pRef = doc(db, 'projects', p.id);
      batch.set(pRef, {
        ...p,
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });
      opCount++;
      totalProjects++;

      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
        onProgress?.(`Committed ${totalProjects} projects...`, 40);
      }
    }

    // Seed Alerts
    for (let i = 0; i < alerts.length; i++) {
      const a = alerts[i];
      const aRef = doc(db, 'alerts', a.id);
      batch.set(aRef, a, { merge: true });
      opCount++;
      totalAlerts++;

      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
        onProgress?.(`Committed ${totalAlerts} alerts...`, 70);
      }
    }

    // Seed Interventions
    for (let i = 0; i < interventions.length; i++) {
      const intv = interventions[i];
      const intvRef = doc(db, 'interventions', intv.id);
      batch.set(intvRef, intv, { merge: true });
      opCount++;
      totalInterventions++;

      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    }

    // Commit any remaining items
    if (opCount > 0) {
      await batch.commit();
    }

    onProgress?.('Database seed completed successfully!', 100);

    // Write audit record for seed
    await logDatabaseAction({
      userId: auth.currentUser?.uid || 'system-seed',
      userName: 'Database Initializer',
      action: 'DATABASE_SEED',
      entityType: 'database',
      entityId: 'paimana_ai',
      details: `Seeded ${totalProjects} projects, ${totalAlerts} alerts, and ${totalInterventions} interventions into Firestore.`,
    });

    return {
      projectsSeeded: totalProjects,
      alertsSeeded: totalAlerts,
      interventionsSeeded: totalInterventions,
    };
  } catch (error) {
    console.error('Firestore seeding failed:', error);
    throw error;
  }
}
