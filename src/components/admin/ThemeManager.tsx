'use client';

import { themes } from "@/lib/themes";
import { applyTheme } from "@/lib/themeManager";
import { Button } from "@/components/ui/button";

export default function ThemeManager() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {themes.map((t) => (
        <Button
          key={t.name}
          onClick={() => applyTheme(t)}
          style={{ backgroundColor: t.primary, color: '#fff' }}
          className="h-20 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform border-2 border-transparent hover:border-white/50"
        >
          <span className="font-black uppercase text-[10px] tracking-widest text-center">{t.name}</span>
          <div className="w-full h-2 rounded-full" style={{ backgroundColor: t.bg }} />
        </Button>
      ))}
    </div>
  );
}
