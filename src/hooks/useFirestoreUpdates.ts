import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint, 
  DocumentData, 
  FirestoreError,
  QuerySnapshot
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface UseFirestoreUpdatesOptions {
  /**
   * Optional Firestore query constraints (e.g., where, orderBy, limit)
   */
  constraints?: QueryConstraint[];
  /**
   * Set to false to temporarily pause or disable the listener
   * @default true
   */
  enabled?: boolean;
  /**
   * Optional callback when new snapshot data is received
   */
  onUpdate?: (data: any[]) => void;
  /**
   * Optional callback when an error occurs in the snapshot listener
   */
  onError?: (error: FirestoreError | Error) => void;
}

export interface UseFirestoreUpdatesResult<T> {
  /**
   * Array of document entities with their Firestore document ID
   */
  data: T[];
  /**
   * Indicates if the initial snapshot is still loading
   */
  loading: boolean;
  /**
   * Captured error instance, or null if healthy
   */
  error: FirestoreError | Error | null;
  /**
   * Count of documents retrieved in current snapshot
   */
  count: number;
  /**
   * Timestamp of last received snapshot update
   */
  lastUpdated: Date | null;
}

/**
 * Custom React hook that uses Firestore `onSnapshot` to listen for real-time changes
 * in a specified collection and updates local state accordingly.
 * Includes complete cleanup logic on component unmount or parameter changes to prevent memory leaks.
 *
 * @param collectionName Name of the Firestore collection to observe
 * @param options Optional configuration including query constraints and enabled flag
 * @returns Real-time collection data, loading status, and error states
 *
 * @example
 * ```tsx
 * const { data: projects, loading, error } = useFirestoreUpdates<Project>('projects', {
 *   constraints: [where('riskLevel', '==', 'critical'), orderBy('riskScore', 'desc')]
 * });
 * ```
 */
export function useFirestoreUpdates<T = DocumentData>(
  collectionName: string | null | undefined,
  options: UseFirestoreUpdatesOptions = {}
): UseFirestoreUpdatesResult<T> {
  const { constraints = [], enabled = true, onUpdate, onError } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(collectionName && enabled));
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Keep ref to callbacks to avoid unnecessary listener tear-downs
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  // Track serialized constraints for effect dependency
  const constraintsLength = constraints.length;

  useEffect(() => {
    // Skip subscription if disabled or no collection specified
    if (!collectionName || !enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isMounted = true;

    // Create collection reference and query
    const colRef = collection(db, collectionName);
    const q = constraints && constraints.length > 0 
      ? query(colRef, ...constraints) 
      : query(colRef);

    // Subscribe to real-time updates via onSnapshot
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        if (!isMounted) return;

        const documents: T[] = snapshot.docs.map((docSnap) => {
          const docData = docSnap.data();
          return {
            id: docSnap.id,
            ...docData,
          } as unknown as T;
        });

        setData(documents);
        setLoading(false);
        setError(null);
        const now = new Date();
        setLastUpdated(now);

        if (onUpdateRef.current) {
          onUpdateRef.current(documents);
        }
      },
      (err: FirestoreError) => {
        if (!isMounted) return;

        console.error(`[useFirestoreUpdates] Firestore snapshot error on collection "${collectionName}":`, err);
        setError(err);
        setLoading(false);

        if (onErrorRef.current) {
          onErrorRef.current(err);
        }
      }
    );

    // CRITICAL: Cleanup function executes on component unmount or when collectionName/constraints change
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [collectionName, enabled, constraintsLength]);

  return {
    data,
    loading,
    error,
    count: data.length,
    lastUpdated,
  };
}

export default useFirestoreUpdates;
