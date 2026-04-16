import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  memoryLocalCache,
  getDocFromServer, 
  doc 
} from 'firebase/firestore';

// Initialize Firebase SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app;
let dbInstance: any = null;
let authInstance: any = null;

const isBrowser = typeof window !== 'undefined';

try {
  if (firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;
    
    // Check if localStorage is available to avoid "IndexedDB persistence" error in restricted environments
    let cacheConfig;
    try {
      if (isBrowser && window.localStorage) {
        cacheConfig = persistentLocalCache({ tabManager: persistentMultipleTabManager() });
      } else {
        cacheConfig = memoryLocalCache();
      }
    } catch (e) {
      cacheConfig = memoryLocalCache();
    }

    dbInstance = initializeFirestore(app, {
      experimentalForceLongPolling: true,
      localCache: cacheConfig
    }, dbId && dbId !== '(default)' ? dbId : undefined);

    authInstance = getAuth(app);
    console.log(`Firebase initialized successfully (Cache: ${cacheConfig.kind === 'persistent' ? 'Persistent' : 'Memory'})`);

    // Connection test
    if (isBrowser) {
      const testConnection = async () => {
        try {
          await getDocFromServer(doc(dbInstance, 'test', 'connection'));
          console.log("Firestore connection test successful");
        } catch (error) {
          if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Firestore connection failed: The client is offline. Please check your Firebase configuration and network.");
          } else {
            // This is often just a 404 if the doc doesn't exist, which is fine
          }
        }
      };
      testConnection();
    }
  } else {
    console.warn("Firebase API Key is missing. Database connection will be disabled.");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export const db = dbInstance;
export const auth = authInstance;
export const isFirebaseInitialized = !!dbInstance;
