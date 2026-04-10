
"use client";
import { themes } from "@/lib/themes";
import { applyTheme } from "@/lib/themeManager";
import { setFavicon } from "@/lib/favicon";
import { saveUserTheme } from "@/lib/userTheme";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export default function AdminThemePanel() {

  const setGlobalTheme = async (theme:any) => {
    await setDoc(doc(db, "settings", "global"), { theme });
  };

  return (
    <div>
      <h2>Theme Selector</h2>

      {themes.map((t) => (
        <div key={t.name}>
          <button onClick={() => applyTheme(t)} style={{ background: t.primary }}>
            Preview {t.name}
          </button>

          <button onClick={() => saveUserTheme(t)}>
            Save My Theme
          </button>

          <button onClick={() => setGlobalTheme(t)}>
            Set Global
          </button>
        </div>
      ))}

      <h2>Upload Favicon</h2>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const url = URL.createObjectURL(file);
          setFavicon(url);
        }}
      />
    </div>
  );
}
