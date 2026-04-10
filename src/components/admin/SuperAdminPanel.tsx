'use client';

import ThemeManager from './ThemeManager';
import { Palette } from 'lucide-react';

export default function SuperAdminPanel() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Palette className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-black uppercase">Super Admin Theme Control</h2>
      </div>
      <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Global Theme Registry</h3>
        <ThemeManager />
      </div>
    </div>
  );
}
