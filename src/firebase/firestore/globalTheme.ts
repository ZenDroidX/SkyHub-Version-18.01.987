import { doc, setDoc } from 'firebase/firestore';
import { db } from '../index'; // or your firebase config initialization

export const setGlobalTheme = async (themeInfo: any) => {
  try {
    const themeRef = doc(db, 'settings', 'globalTheme');
    await setDoc(themeRef, { currentTheme: themeInfo }, { merge: true });
    console.log("Global theme updated.");
  } catch (error) {
    console.error("Error setting global theme:", error);
    throw error;
  }
};
