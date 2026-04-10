import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export const applyTheme = async (theme: any) => {
  const ref = doc(db, "settings", "global");
  await setDoc(ref, { theme }, { merge: true });
};

export const updateGlobalSettings = async (settings: any) => {
  const ref = doc(db, "settings", "global");
  await setDoc(ref, settings, { merge: true });
};

export const listenGlobalSettings = (callback: (data: any) => void) => {
  const ref = doc(db, "settings", "global");
  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (data) {
      callback(data);
    }
  });
};
