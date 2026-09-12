import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc,
  getDocs, 
  onSnapshot, 
  query, 
  where,
  writeBatch,
  runTransaction,
  limit,
  Unsubscribe,
  FirestoreError
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Intervention, Alert, RiskLevel, Project } from '../types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface WorkspaceAttachment {
  id: string;
  type: 'drive_dpr' | 'meet_link' | 'calendar_review' | 'task_action';
  title: string;
  projectId: string;
  externalId?: string;
  link?: string;
  status: string;
  userId: string;
  createdAt: string;
}

export interface LinkedRiskInterventionUpdateParams {
  /** Target project unique identifier */
  projectId: string;
  /** Target intervention unique identifier */
  interventionId: string;
  /** New lifecycle status for the intervention */
  newInterventionStatus: Intervention['currentStatus'];
  /** Optional summary of mitigation action taken */
  actionTaken?: string;
  /** Optional next review date (ISO YYYY-MM-DD) */
  nextReviewDate?: string;
  /** Optional explicit new risk score (0-100) */
  newRiskScore?: number;
  /** Optional relative delta applied to project risk score (e.g. -12 for resolution, +8 for escalation) */
  riskScoreDelta?: number;
  /** Optional custom audit note written to the immutable audit log */
  auditNote?: string;
  /** Optional project fallback data if project document has not yet been initialized in Firestore */
  projectFallback?: Partial<Project>;
}

export interface TransactionResult {
  success: boolean;
  projectId: string;
  interventionId: string;
  previousRiskScore: number;
  updatedRiskScore: number;
  updatedRiskLevel: RiskLevel;
  interventionStatus: Intervention['currentStatus'];
  timestamp: string;
}

// ============================================================================
// Custom Error Handling Architecture
// ============================================================================

export type FirestoreTransactionErrorCode = 
  | 'AUTH_REQUIRED'
  | 'INVALID_ARGUMENTS'
  | 'DOCUMENT_NOT_FOUND'
  | 'TRANSACTION_ABORTED'
  | 'PERMISSION_DENIED'
  | 'NETWORK_UNAVAILABLE'
  | 'CONCURRENCY_CONFLICT'
  | 'UNKNOWN_ERROR';

/**
 * Custom error class for Firestore transaction and sync failures.
 * Encapsulates error codes, failed paths, operation context, and retryability flags.
 */
export class FirestoreTransactionError extends Error {
  public readonly code: FirestoreTransactionErrorCode;
  public readonly operation: string;
  public readonly targetPath: string;
  public readonly retryable: boolean;
  public readonly originalError?: unknown;

  constructor(
    message: string,
    code: FirestoreTransactionErrorCode,
    operation: string,
    targetPath: string,
    retryable = false,
    originalError?: unknown
  ) {
    super(message);
    this.name = 'FirestoreTransactionError';
    this.code = code;
    this.operation = operation;
    this.targetPath = targetPath;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

/**
 * Parses unknown errors (including Firebase Firestore errors) into a structured FirestoreTransactionError.
 */
export function parseFirestoreError(
  error: unknown,
  operation: string,
  targetPath: string
): FirestoreTransactionError {
  if (error instanceof FirestoreTransactionError) {
    return error;
  }

  const rawMessage = error instanceof Error ? error.message : String(error);
  let code: FirestoreTransactionErrorCode = 'UNKNOWN_ERROR';
  let retryable = false;

  if (rawMessage.includes('permission-denied') || rawMessage.includes('PERMISSION_DENIED')) {
    code = 'PERMISSION_DENIED';
    retryable = false;
  } else if (rawMessage.includes('not-found') || rawMessage.includes('NOT_FOUND')) {
    code = 'DOCUMENT_NOT_FOUND';
    retryable = false;
  } else if (rawMessage.includes('failed-precondition') || rawMessage.includes('aborted') || rawMessage.includes('ABORTED')) {
    code = 'CONCURRENCY_CONFLICT';
    retryable = true;
  } else if (rawMessage.includes('unavailable') || rawMessage.includes('client is offline')) {
    code = 'NETWORK_UNAVAILABLE';
    retryable = true;
  } else if (rawMessage.includes('Authentication Required')) {
    code = 'AUTH_REQUIRED';
    retryable = false;
  }

  return new FirestoreTransactionError(
    `[${operation}] Firestore operation failed on "${targetPath}": ${rawMessage}`,
    code,
    operation,
    targetPath,
    retryable,
    error
  );
}

/**
 * Executes a transaction or async operation with automatic retry logic on transient concurrency conflicts.
 */
export async function withTransactionRetry<T>(
  operationFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 200
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operationFn();
    } catch (err: any) {
      lastError = err;
      const parsed = parseFirestoreError(err, 'withTransactionRetry', 'transaction');

      if (!parsed.retryable || attempt === maxRetries) {
        throw parsed;
      }

      // Exponential backoff with jitter
      const jitter = Math.floor(Math.random() * 50);
      const waitTime = delayMs * Math.pow(2, attempt - 1) + jitter;
      console.warn(`[withTransactionRetry] Attempt ${attempt} failed with ${parsed.code}. Retrying in ${waitTime}ms...`);
      await new Promise((res) => setTimeout(res, waitTime));
    }
  }

  throw lastError;
}

/**
 * Utility helper to derive risk level from a numeric risk score (0-100)
 */
export function calculateRiskLevel(score: number): RiskLevel {
  const clamped = Math.max(0, Math.min(100, score));
  if (clamped >= 75) return 'critical';
  if (clamped >= 50) return 'high';
  if (clamped >= 25) return 'moderate';
  return 'low';
}

/**
 * Helper to ensure user is authenticated before write operations
 */
function getAuthenticatedUserId(operationName: string): string {
  const user = auth.currentUser;
  if (!user) {
    throw new FirestoreTransactionError(
      `[Authentication Required] You must be signed in to perform "${operationName}".`,
      'AUTH_REQUIRED',
      operationName,
      'auth',
      false
    );
  }
  return user.uid;
}

// ============================================================================
// 1. Transaction-Based Linked Entity Updates (Project Risk + Intervention)
// ============================================================================

/**
 * Atomically updates linked entities (Project Risk Score and Intervention Status)
 * within a single Firestore transaction.
 *
 * Guarantees:
 * 1. Atomicity: Both the intervention status and project risk metrics update together or not at all.
 * 2. Strict Firestore Transaction Isolation: Reads all documents prior to initiating any writes.
 * 3. Derived Calculation: Recomputes project risk score and risk level based on mitigation outcome.
 * 4. Audit Provenance: Creates an immutable audit log record in the same atomic transaction commit.
 * 5. Robust Error Handling: Wraps and classifies failures with descriptive metadata.
 *
 * @param params Parameter payload specifying project, intervention, and mitigation adjustments
 * @returns TransactionResult containing updated metrics and timestamp
 */
export async function updateLinkedProjectAndInterventionTx(
  params: LinkedRiskInterventionUpdateParams
): Promise<TransactionResult> {
  const { 
    projectId, 
    interventionId, 
    newInterventionStatus, 
    actionTaken, 
    nextReviewDate, 
    newRiskScore, 
    riskScoreDelta,
    auditNote,
    projectFallback
  } = params;

  // 1. Precondition Validation
  if (!projectId || typeof projectId !== 'string') {
    throw new FirestoreTransactionError(
      'A valid "projectId" string is required for linked transaction updates.',
      'INVALID_ARGUMENTS',
      'updateLinkedProjectAndInterventionTx',
      'projects'
    );
  }

  if (!interventionId || typeof interventionId !== 'string') {
    throw new FirestoreTransactionError(
      'A valid "interventionId" string is required for linked transaction updates.',
      'INVALID_ARGUMENTS',
      'updateLinkedProjectAndInterventionTx',
      'interventions'
    );
  }

  const userId = getAuthenticatedUserId('updateLinkedProjectAndInterventionTx');
  const projectRef = doc(db, 'projects', projectId);
  const interventionRef = doc(db, 'interventions', interventionId);
  const auditLogRef = doc(collection(db, 'audit_logs'));

  try {
    return await withTransactionRetry(async () => {
      return await runTransaction(db, async (transaction) => {
        // -------------------------------------------------------------
        // PHASE 1: ALL READS FIRST (Strict Firestore rule)
        // -------------------------------------------------------------
        const projectSnap = await transaction.get(projectRef);
        const interventionSnap = await transaction.get(interventionRef);

        const projectExists = projectSnap.exists();
        const interventionExists = interventionSnap.exists();

        // If project does not exist and no fallback is supplied, abort transaction
        if (!projectExists && !projectFallback) {
          throw new FirestoreTransactionError(
            `Target project "${projectId}" was not found in Firestore. Provide fallback project data to initialize it.`,
            'DOCUMENT_NOT_FOUND',
            'updateLinkedProjectAndInterventionTx',
            `projects/${projectId}`
          );
        }

        // -------------------------------------------------------------
        // PHASE 2: COMPUTE DERIVED METRICS & DERIVATIONS
        // -------------------------------------------------------------
        const existingProjectData: Partial<Project> = projectExists 
          ? (projectSnap.data() as Partial<Project>) 
          : (projectFallback || {});

        const previousRiskScore = typeof existingProjectData.riskScore === 'number' 
          ? existingProjectData.riskScore 
          : 50;

        let finalRiskScore: number;
        if (typeof newRiskScore === 'number') {
          finalRiskScore = Math.max(0, Math.min(100, Math.round(newRiskScore)));
        } else if (typeof riskScoreDelta === 'number') {
          finalRiskScore = Math.max(0, Math.min(100, Math.round(previousRiskScore + riskScoreDelta)));
        } else if (newInterventionStatus === 'resolved') {
          // Standard mitigation bonus for resolved bottleneck: -10 pts
          finalRiskScore = Math.max(0, Math.min(100, previousRiskScore - 10));
        } else if (newInterventionStatus === 'action_initiated') {
          // Partial mitigation for action initiation: -4 pts
          finalRiskScore = Math.max(0, Math.min(100, previousRiskScore - 4));
        } else {
          finalRiskScore = previousRiskScore;
        }

        const updatedRiskLevel = calculateRiskLevel(finalRiskScore);
        const timestamp = new Date().toISOString();

        // -------------------------------------------------------------
        // PHASE 3: ALL WRITES
        // -------------------------------------------------------------

        // 1. Write Intervention Update
        const interventionPayload: Record<string, any> = {
          id: interventionId,
          projectId,
          currentStatus: newInterventionStatus,
          updatedAt: timestamp,
          userId,
        };

        if (actionTaken) {
          interventionPayload.lastActionTaken = actionTaken;
        }
        if (nextReviewDate) {
          interventionPayload.nextReviewDate = nextReviewDate;
        }

        if (interventionExists) {
          transaction.update(interventionRef, interventionPayload);
        } else {
          transaction.set(interventionRef, {
            ...interventionPayload,
            priority: 'P1 - Critical',
            recommendedAction: actionTaken || 'Coordination action initiated via PMG Fast-Track',
            responsibleAuthority: 'Cabinet Secretariat (PMG)',
            dueDate: nextReviewDate || '',
            projectName: existingProjectData.name || 'Infrastructure Project',
            projectCode: existingProjectData.projectCode || projectId,
            riskDriver: 'Inter-ministerial bottleneck',
          }, { merge: true });
        }

        // 2. Write Parent Project Update
        if (projectExists) {
          transaction.update(projectRef, {
            riskScore: finalRiskScore,
            riskLevel: updatedRiskLevel,
            lastUpdated: timestamp,
          });
        } else if (projectFallback) {
          transaction.set(projectRef, {
            ...projectFallback,
            id: projectId,
            riskScore: finalRiskScore,
            riskLevel: updatedRiskLevel,
            lastUpdated: timestamp,
          }, { merge: true });
        }

        // 3. Write Immutable Audit Trail Entry
        transaction.set(auditLogRef, {
          userId,
          action: 'LINKED_INTERVENTION_RISK_UPDATE',
          entityType: 'project_and_intervention',
          entityId: `${projectId}:${interventionId}`,
          details: auditNote || `Intervention status updated to '${newInterventionStatus}'. Project risk score adjusted from ${previousRiskScore} to ${finalRiskScore} (${updatedRiskLevel}).`,
          timestamp,
        });

        return {
          success: true,
          projectId,
          interventionId,
          previousRiskScore,
          updatedRiskScore: finalRiskScore,
          updatedRiskLevel,
          interventionStatus: newInterventionStatus,
          timestamp,
        };
      });
    });
  } catch (error) {
    const parsedError = parseFirestoreError(
      error,
      'updateLinkedProjectAndInterventionTx',
      `projects/${projectId} + interventions/${interventionId}`
    );
    console.error(`[FirestoreSync Error] Transaction failed:`, parsedError);
    handleFirestoreError(parsedError, OperationType.WRITE, `projects/${projectId}`);
    throw parsedError;
  }
}

/**
 * Specialized atomic transaction to mark an intervention as 'resolved' and apply a project risk reduction.
 */
export async function resolveInterventionWithRiskReductionTx(
  projectId: string,
  interventionId: string,
  resolutionSummary: string,
  customReductionPoints = 12,
  projectFallback?: Partial<Project>
): Promise<TransactionResult> {
  return updateLinkedProjectAndInterventionTx({
    projectId,
    interventionId,
    newInterventionStatus: 'resolved',
    actionTaken: resolutionSummary,
    riskScoreDelta: -Math.abs(customReductionPoints),
    auditNote: `Bottleneck resolved via Cabinet PMG Fast-Track. Resolution notes: "${resolutionSummary}". Risk reduced by ${customReductionPoints} pts.`,
    projectFallback
  });
}

/**
 * Specialized atomic transaction to escalate an intervention and reflect increased risk on the parent project.
 */
export async function escalateInterventionWithRiskIncreaseTx(
  projectId: string,
  interventionId: string,
  escalationReason: string,
  customIncreasePoints = 8,
  projectFallback?: Partial<Project>
): Promise<TransactionResult> {
  return updateLinkedProjectAndInterventionTx({
    projectId,
    interventionId,
    newInterventionStatus: 'awaiting_update',
    actionTaken: `Escalated: ${escalationReason}`,
    riskScoreDelta: Math.abs(customIncreasePoints),
    auditNote: `Bottleneck escalated to PMG Apex Committee. Impasse details: "${escalationReason}". Risk increased by +${customIncreasePoints} pts.`,
    projectFallback
  });
}

// ============================================================================
// 2. Batch Operations for Atomic Bulk Writes
// ============================================================================

/**
 * Atomically synchronizes a list of interventions in Firestore-compliant chunks (<= 500 documents per batch commit).
 */
export async function batchSyncInterventions(interventions: Intervention[]): Promise<{ count: number }> {
  if (!interventions || interventions.length === 0) {
    return { count: 0 };
  }

  const userId = getAuthenticatedUserId('batchSyncInterventions');
  const now = new Date().toISOString();
  const BATCH_SIZE = 500;

  try {
    for (let i = 0; i < interventions.length; i += BATCH_SIZE) {
      const chunk = interventions.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        if (!item.id) continue;
        const docRef = doc(db, 'interventions', item.id);
        batch.set(docRef, {
          ...item,
          userId,
          updatedAt: now,
        }, { merge: true });
      }

      await batch.commit();
    }

    return { count: interventions.length };
  } catch (error) {
    const parsed = parseFirestoreError(error, 'batchSyncInterventions', 'interventions (batch)');
    console.error(`[FirestoreSync Error] Batch sync interventions failed:`, parsed);
    handleFirestoreError(parsed, OperationType.WRITE, 'interventions');
    throw parsed;
  }
}

/**
 * Atomically updates statuses for multiple interventions in batches.
 */
export async function batchUpdateInterventionStatuses(
  updates: Array<{
    id: string;
    currentStatus: Intervention['currentStatus'];
    lastActionTaken?: string;
    nextReviewDate?: string;
  }>
): Promise<{ count: number }> {
  if (!updates || updates.length === 0) return { count: 0 };

  getAuthenticatedUserId('batchUpdateInterventionStatuses');
  const now = new Date().toISOString();
  const BATCH_SIZE = 500;

  try {
    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
      const chunk = updates.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const update of chunk) {
        const docRef = doc(db, 'interventions', update.id);
        const updatePayload: Record<string, any> = {
          currentStatus: update.currentStatus,
          updatedAt: now,
        };
        if (update.lastActionTaken !== undefined) {
          updatePayload.lastActionTaken = update.lastActionTaken;
        }
        if (update.nextReviewDate !== undefined) {
          updatePayload.nextReviewDate = update.nextReviewDate;
        }

        batch.update(docRef, updatePayload);
      }

      await batch.commit();
    }

    return { count: updates.length };
  } catch (error) {
    const parsed = parseFirestoreError(error, 'batchUpdateInterventionStatuses', 'interventions (batch update)');
    console.error(`[FirestoreSync Error] Batch update statuses failed:`, parsed);
    handleFirestoreError(parsed, OperationType.UPDATE, 'interventions');
    throw parsed;
  }
}

/**
 * Atomically deletes a collection of interventions in batches.
 */
export async function batchDeleteInterventions(interventionIds: string[]): Promise<{ count: number }> {
  if (!interventionIds || interventionIds.length === 0) return { count: 0 };

  getAuthenticatedUserId('batchDeleteInterventions');
  const BATCH_SIZE = 500;

  try {
    for (let i = 0; i < interventionIds.length; i += BATCH_SIZE) {
      const chunk = interventionIds.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const id of chunk) {
        const docRef = doc(db, 'interventions', id);
        batch.delete(docRef);
      }

      await batch.commit();
    }

    return { count: interventionIds.length };
  } catch (error) {
    const parsed = parseFirestoreError(error, 'batchDeleteInterventions', 'interventions (batch delete)');
    console.error(`[FirestoreSync Error] Batch delete interventions failed:`, parsed);
    handleFirestoreError(parsed, OperationType.DELETE, 'interventions');
    throw parsed;
  }
}

/**
 * Atomically synchronizes early warning anomaly alerts in batches.
 */
export async function batchSyncAlerts(alerts: Alert[]): Promise<{ count: number }> {
  if (!alerts || alerts.length === 0) return { count: 0 };

  const userId = getAuthenticatedUserId('batchSyncAlerts');
  const BATCH_SIZE = 500;

  try {
    for (let i = 0; i < alerts.length; i += BATCH_SIZE) {
      const chunk = alerts.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);

      for (const alert of chunk) {
        if (!alert.id) continue;
        const docRef = doc(db, 'alerts', alert.id);
        batch.set(docRef, {
          ...alert,
          userId,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }

      await batch.commit();
    }

    return { count: alerts.length };
  } catch (error) {
    const parsed = parseFirestoreError(error, 'batchSyncAlerts', 'alerts (batch write)');
    console.error(`[FirestoreSync Error] Batch sync alerts failed:`, parsed);
    handleFirestoreError(parsed, OperationType.WRITE, 'alerts');
    throw parsed;
  }
}

// ============================================================================
// 3. Single-Document Sync & Live Listeners
// ============================================================================

/**
 * Single intervention document cloud sync with validation and structured error handling.
 */
export async function syncInterventionToFirestore(intervention: Intervention): Promise<void> {
  const path = `interventions/${intervention.id}`;
  try {
    const userId = getAuthenticatedUserId('syncInterventionToFirestore');

    if (!intervention.id || !intervention.projectId) {
      throw new FirestoreTransactionError(
        `Invalid intervention data: Both 'id' and 'projectId' are required.`,
        'INVALID_ARGUMENTS',
        'syncInterventionToFirestore',
        path
      );
    }

    const docRef = doc(db, 'interventions', intervention.id);
    await setDoc(docRef, {
      id: intervention.id,
      projectId: intervention.projectId,
      projectCode: intervention.projectCode || '',
      projectName: intervention.projectName || '',
      priority: intervention.priority,
      riskDriver: intervention.riskDriver || '',
      recommendedAction: intervention.recommendedAction || '',
      responsibleAuthority: intervention.responsibleAuthority || '',
      dueDate: intervention.dueDate || '',
      currentStatus: intervention.currentStatus || 'not_started',
      lastActionTaken: intervention.lastActionTaken || '',
      nextReviewDate: intervention.nextReviewDate || '',
      userId,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    const parsed = parseFirestoreError(error, 'syncInterventionToFirestore', path);
    handleFirestoreError(parsed, OperationType.WRITE, path);
    throw parsed;
  }
}

/**
 * Real-time listener for user interventions with safe unsubscribe cleanup.
 */
export function subscribeToUserInterventions(
  userId: string,
  onUpdate: (interventions: Intervention[]) => void,
  onError?: (error: any) => void
): Unsubscribe | undefined {
  const path = 'interventions';
  try {
    if (!userId) {
      console.warn('[subscribeToUserInterventions] Skipped: No userId provided.');
      return undefined;
    }

    const q = query(collection(db, path), where('userId', '==', userId));
    return onSnapshot(
      q,
      (snapshot) => {
        const items: Intervention[] = [];
        snapshot.forEach((docSnap) => {
          items.push(docSnap.data() as Intervention);
        });
        onUpdate(items);
      },
      (error: FirestoreError) => {
        const parsed = parseFirestoreError(error, 'subscribeToUserInterventions', path);
        console.error(`[subscribeToUserInterventions] Listener error:`, parsed);
        handleFirestoreError(parsed, OperationType.GET, path);
        if (onError) onError(parsed);
      }
    );
  } catch (error) {
    const parsed = parseFirestoreError(error, 'subscribeToUserInterventions', path);
    handleFirestoreError(parsed, OperationType.GET, path);
    if (onError) onError(parsed);
    return undefined;
  }
}

// ============================================================================
// 4. Workspace Items & Attachments Cloud Sync
// ============================================================================

export async function saveWorkspaceAttachment(
  attachment: Omit<WorkspaceAttachment, 'userId' | 'createdAt'>
): Promise<void> {
  const path = `workspace_items/${attachment.id}`;
  try {
    const userId = getAuthenticatedUserId('saveWorkspaceAttachment');
    const docRef = doc(db, 'workspace_items', attachment.id);
    await setDoc(docRef, {
      ...attachment,
      userId,
      createdAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    const parsed = parseFirestoreError(error, 'saveWorkspaceAttachment', path);
    handleFirestoreError(parsed, OperationType.WRITE, path);
    throw parsed;
  }
}

export async function fetchWorkspaceAttachments(projectId?: string): Promise<WorkspaceAttachment[]> {
  const path = 'workspace_items';
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const q = projectId 
      ? query(collection(db, path), where('userId', '==', user.uid), where('projectId', '==', projectId), limit(50))
      : query(collection(db, path), where('userId', '==', user.uid), limit(50));
    
    const snapshot = await getDocs(q);
    const items: WorkspaceAttachment[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as WorkspaceAttachment);
    });
    return items;
  } catch (error) {
    const parsed = parseFirestoreError(error, 'fetchWorkspaceAttachments', path);
    handleFirestoreError(parsed, OperationType.GET, path);
    return [];
  }
}
