import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, setLogLevel } from 'firebase/firestore';
import { setUserLogHandler, LogCallback } from '@firebase/logger';
import firebaseConfig from '../../firebase-applet-config.json';

// Configure Firebase logger to suppress non-fatal transient connection retry warnings in container/iframe environments
try {
  setLogLevel('silent');
} catch {}

try {
  const customLogHandler: LogCallback = (param) => {
    const combined = `${param.message || ''} ${param.args?.map(String).join(' ') || ''}`;
    if (
      combined.includes('Could not reach Cloud Firestore backend') ||
      combined.includes('operate in offline mode') ||
      combined.includes('Connection failed') ||
      combined.includes('code=unavailable')
    ) {
      // Suppress transient backend retry notice
      return;
    }
  };
  setUserLogHandler(customLogHandler);
} catch {}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

// Use specific database ID if configured in firebase-applet-config
// Enable experimentalForceLongPolling to avoid 10-second backend timeout in container / proxy environments
export const db = (() => {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(
          app,
          {
            experimentalForceLongPolling: true,
          },
          firebaseConfig.firestoreDatabaseId
        )
      : initializeFirestore(app, {
          experimentalForceLongPolling: true,
        });
  } catch {
    // If instance is already initialized
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export const ADMIN_EMAIL = 'kumaribhumi433@gmail.com';

export default app;
