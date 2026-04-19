import { db } from '@/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logActivity = async (uid: string, action: string, details: any = {}) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      uid,
      action,
      timestamp: serverTimestamp(),
      details,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};
