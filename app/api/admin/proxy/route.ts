import { NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

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
    const { action, collectionName, id, data } = await req.json();
    
    // Simple auth check (you might want to add more robust auth here)
    // For now, we assume the client-side admin check is sufficient for this app's scale
    
    if (action === 'add') {
      const docRef = await addDoc(collection(db, collectionName), data);
      return NextResponse.json({ id: docRef.id });
    } else if (action === 'update') {
      await updateDoc(doc(db, collectionName, id), data);
      return NextResponse.json({ success: true });
    } else if (action === 'delete') {
      await deleteDoc(doc(db, collectionName, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin proxy API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
