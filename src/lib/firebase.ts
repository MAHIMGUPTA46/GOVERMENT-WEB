import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth,
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged, 
  User,
  NextOrObserver
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

/**
 * Interface defining the expected Firebase configuration schema.
 * All sensitive credential properties are encapsulated within this module
 * and never exposed in plain text across frontend components.
 */
export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  storageBucket?: string;
  messagingSenderId?: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
  firestoreDatabaseId?: string;
}

const firebaseConfig: FirebaseAppletConfig = firebaseConfigData as FirebaseAppletConfig;

// Initialize Firebase App as a singleton instance
export const app: FirebaseApp = !getApps().length 
  ? initializeApp(firebaseConfig) 
  : getApps()[0];

// Initialize Firestore instance (supporting custom database ID if configured)
export const db: Firestore = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Firebase Auth service instance
export const auth: Auth = getAuth(app);

// Configure Google Auth Provider with requested Google Workspace scopes
export const googleAuthProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.messages.create',
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.memberships',
  'https://www.googleapis.com/auth/chat.memberships.readonly',
  'https://www.googleapis.com/auth/meetings.space.created',
  'https://www.googleapis.com/auth/meetings.space.readonly',
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleAuthProvider.addScope(scope);
});

// Persistent token management for Google Workspace API interactions
const STORAGE_ACCESS_TOKEN_KEY = 'paimana_workspace_access_token';
let cachedAccessToken: string | null = (typeof window !== 'undefined') ? localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY) : null;
let isSigningIn = false;

/**
 * Validate connection to Firestore on initial application boot.
 */
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore client is offline.');
      return false;
    }
    // Any other response (such as permission denied for test doc) verifies network reached server
    return true;
  }
}

// Automatically initiate connection check
testFirestoreConnection().catch(() => {});

// Firestore Error Handling Specification conforming to FirestoreErrorInfo
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown, 
  operationType: OperationType, 
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Comprehensive Authentication Service
 * Encapsulates authentication workflows without exposing API keys or credentials to calling components.
 */
export const authService = {
  /**
   * Get the current authenticated user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChanged(observer: NextOrObserver<User | null>) {
    return onAuthStateChanged(auth, observer);
  },

  /**
   * Sign in using Google OAuth Popup with requested scopes
   */
  async signInWithGoogle(): Promise<{ user: User; accessToken: string | null }> {
    try {
      isSigningIn = true;
      const result = await signInWithPopup(auth, googleAuthProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      cachedAccessToken = credential?.accessToken || null;
      if (typeof window !== 'undefined') {
        if (cachedAccessToken) {
          localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, cachedAccessToken);
        } else {
          localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
        }
      }
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      console.error('Google Sign-in failed:', error);
      throw error;
    } finally {
      isSigningIn = false;
    }
  },

  /**
   * Sign in with Email and Password
   */
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Email Sign-in failed:', error);
      throw error;
    }
  },

  /**
   * Register with Email and Password
   */
  async signUpWithEmail(email: string, password: string): Promise<User> {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error: any) {
      console.error('Email Sign-up failed:', error);
      throw error;
    }
  },

  /**
   * Sign out current user and clear cached credentials
   */
  async signOut(): Promise<void> {
    await signOut(auth);
    cachedAccessToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
    }
  },

  /**
   * Retrieve the current Firebase ID token (JWT)
   */
  async getIdToken(forceRefresh = false): Promise<string | null> {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  },

  /**
   * Retrieve the current OAuth access token (for Google Workspace APIs)
   */
  getAccessToken(): string | null {
    if (!cachedAccessToken && typeof window !== 'undefined') {
      cachedAccessToken = localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
    }
    return cachedAccessToken;
  },

  /**
   * Set or update the access token
   */
  setAccessToken(token: string | null): void {
    cachedAccessToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(STORAGE_ACCESS_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      }
    }
  }
};

/**
 * Backwards-compatible authentication helpers for existing components
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = localStorage.getItem(STORAGE_ACCESS_TOKEN_KEY);
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_ACCESS_TOKEN_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  return authService.signInWithGoogle();
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null }> => {
  return authService.signInWithGoogle();
};

export const getAccessToken = async (): Promise<string | null> => {
  return authService.getAccessToken();
};

export const setAccessToken = (token: string | null) => {
  authService.setAccessToken(token);
};

export const logout = async () => {
  return authService.signOut();
};

export const signOutUser = async () => {
  return authService.signOut();
};

/**
 * Returns safe non-sensitive configuration parameters (e.g. for display or analytics)
 * without revealing API keys, secret keys, or authentication tokens.
 */
export function getSafeFirebaseInfo() {
  return {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    storageBucket: firebaseConfig.storageBucket || '',
    isConfigured: Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
  };
}

