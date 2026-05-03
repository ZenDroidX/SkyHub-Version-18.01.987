import { db } from '../../../firebase/config';
import { doc, setDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const globalRef = doc(db, 'settings', 'global');
    await setDoc(globalRef, {
      heroTitle: 'REDMI 12 5G\nPOCO M6 PRO 5G',
      heroSubtitle: 'The definitive command center for sky-platform development.\nUnleash Snapdragon 4 Gen 2 with premium custom kernels and system builds.'
    }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}
