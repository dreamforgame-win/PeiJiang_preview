import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase on the server
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;
const db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);

export async function GET() {
  console.log('API /api/data: Starting fetch from Firestore...');
  console.log('Project ID:', firebaseConfig.projectId);
  
  try {
    const collections = ['generals', 'tactics', 'teams', 'buffs', 'special_effects'];
    const results: any = {};

    await Promise.all(collections.map(async (colName) => {
      console.log(`Fetching collection: ${colName}`);
      const snap = await getDocs(collection(db, colName));
      results[colName] = snap.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      console.log(`Successfully fetched ${results[colName].length} items from ${colName}`);
    }));

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Server-side Firestore fetch error:', error);
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
