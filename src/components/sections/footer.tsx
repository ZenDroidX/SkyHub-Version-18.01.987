
"use client";

import React from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Heart } from 'lucide-react';

export function Footer() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const activeConfig = settings || DEFAULT_DONATION_CONFIG;

  return (
    <footer className="py-32 border-t border-white/5 flex flex-col items-center gap-16 bg-gradient-to-b from-transparent to-black/50">
      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
        <div className="flex flex-col items-center text-center mb-12">
          <Badge variant="outline" className="mb-6 border-white/10 text-[9px] font-black uppercase tracking-[0.3em] px-6 py-2 rounded-full text-blue-500 bg-blue-500/5">
            Registry Credits
          </Badge>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">LEAD <span className="text-muted-foreground/40 italic">ARCHITECT</span></h2>
        </div>

        <Card className="glass border-white/10 p-10 md:p-12 rounded-[3rem] max-w-2xl w-full relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 text-white/[0.02] pointer-events-none group-hover:text-blue-500/[0.05] transition-all duration-700">
            <Shield className="w-48 h-48" />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            <div className="relative">
              <div className="absolute -inset-4 bg-blue-600/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              {activeConfig.adminPhotoRedirectUrl ? (
                <a href={activeConfig.adminPhotoRedirectUrl} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                  <Avatar className="w-32 h-32 rounded-[2.5rem] border-2 border-white/5 shadow-2xl relative hover:scale-105 transition-transform duration-300">
                    <AvatarImage src={activeConfig.adminAvatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-white/5 text-blue-600 font-black text-2xl uppercase">
                      {activeConfig.adminName?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                </a>
              ) : (
                <Avatar className="w-32 h-32 rounded-[2.5rem] border-2 border-white/5 shadow-2xl relative">
                  <AvatarImage src={activeConfig.adminAvatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-white/5 text-blue-600 font-black text-2xl uppercase">
                    {activeConfig.adminName?.[0] || 'A'}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                <h3 className="text-3xl font-black uppercase tracking-tight text-white">{activeConfig.adminName}</h3>
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              
              <p className="text-muted-foreground text-sm leading-relaxed mb-8 opacity-60">
                {activeConfig.adminBio}
              </p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <Heart className="w-3.5 h-3.5 text-red-500" />
                  Core Maintainer
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                  Verified Identity
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="mt-24 text-center space-y-4 opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Sky Hub Ecosystem © 2025</p>
          <div className="flex gap-6 justify-center text-[8px] font-black uppercase tracking-widest text-muted-foreground">
            <span className="hover:text-white cursor-pointer transition-colors">Security Protocol</span>
            <span className="hover:text-white cursor-pointer transition-colors">API Endpoint</span>
            <span className="hover:text-white cursor-pointer transition-colors">Terminal Log</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
