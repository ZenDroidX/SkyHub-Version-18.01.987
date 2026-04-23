
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/firebase/config";

export const loadUserTheme = async (uid: string) => {
  if (typeof document === 'undefined') return false;
  
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (snap.exists() && snap.data().theme) {
    const theme = snap.data().theme;

    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--bg", theme.bg);

    return true;
  }

  return false;
};

export const saveUserTheme = async (theme: any) => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    theme
  }, { merge: true });
};
