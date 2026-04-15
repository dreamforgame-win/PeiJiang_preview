import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;
const db = dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);

export async function POST(req: Request) {
  try {
    const { uid, email, action, data } = await req.json();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const userDocRef = doc(db, 'users', uid);

    if (action === 'get') {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        return NextResponse.json(snap.data());
      } else {
        // Create initial doc
        const initialData = {
          email,
          collectedGenerals: [],
          collectedTactics: [],
          updatedAt: new Date()
        };
        await setDoc(userDocRef, initialData);
        return NextResponse.json(initialData);
      }
    } else if (action === 'save') {
      await setDoc(userDocRef, {
        ...data,
        updatedAt: new Date()
      }, { merge: true });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('User warehouse API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
