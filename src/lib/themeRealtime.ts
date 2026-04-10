
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/config";

export const listenGlobalTheme = () => {
  const ref = doc(db, "settings", "global");

  return onSnapshot(ref, (snap) => {
    const data = snap.data();
    if (!data?.theme) return;

    const theme = data.theme;

    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--bg", theme.bg);
  });
};
