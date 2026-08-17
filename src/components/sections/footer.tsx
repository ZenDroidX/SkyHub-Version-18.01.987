"use client";

import React from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG, SiteSettings } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Heart, Sparkles, Send, MessageSquare, ExternalLink, Code2 } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc<SiteSettings>(globalSettingsRef);

  const activeConfig = settings || DEFAULT_DONATION_CONFIG;
  const brandName = globalSettings?.brandName || 'SkyHub';
  const telegramChannel = globalSettings?.socialLinks?.telegramChannel || DEFAULT_DONATION_CONFIG.telegramChannelUrl;
  const telegramDiscussion = globalSettings?.socialLinks?.discussion || DEFAULT_DONATION_CONFIG.telegramDiscussionUrl;

  return (
    <footer className="pt-24 pb-16 border-t border-border/60 bg-card/40 backdrop-blur-md relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-64 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-6 w-full flex flex-col items-center">
        {/* Lead Architect Card */}
        <div className="w-full max-w-3xl mb-16">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Project Leadership</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Lead <span className="text-primary italic">Architect</span>
            </h2>
          </div>

          <Card className="glass border-border/80 p-6 sm:p-10 rounded-3xl w-full relative overflow-hidden group shadow-lg bg-card/80">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 relative z-10">
              <div className="relative shrink-0">
                {activeConfig.adminPhotoRedirectUrl ? (
                  <a href={activeConfig.adminPhotoRedirectUrl} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
                    <Avatar className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-primary/30 shadow-xl relative hover:scale-105 transition-transform duration-300">
                      <AvatarImage src={activeConfig.adminAvatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-primary/10 text-primary font-black text-xl uppercase">
                        {activeConfig.adminName?.[0] || 'A'}
                      </AvatarFallback>
                    </Avatar>
                  </a>
                ) : (
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-primary/30 shadow-xl relative">
                    <AvatarImage src={activeConfig.adminAvatarUrl} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xl uppercase">
                      {activeConfig.adminName?.[0] || 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 ring-2 ring-card flex items-center justify-center text-white text-[10px]">
                  ✓
                </span>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-2">
                  <h3 className="text-xl sm:text-2xl font-bold text-foreground">{activeConfig.adminName || 'SkyHub Admin'}</h3>
                  <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary/30 text-primary bg-primary/10">
                    Maintainer
                  </Badge>
                </div>
                
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-6">
                  {activeConfig.adminBio || 'Core maintainer and kernel engineer for the Snapdragon 4 Gen 2 Sky and Sky Pro platform.'}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  {telegramChannel && (
                    <a
                      href={telegramChannel}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white border border-sky-500/20 text-xs font-semibold transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Telegram</span>
                    </a>
                  )}
                  {telegramDiscussion && (
                    <a
                      href={telegramDiscussion}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/80 text-xs font-semibold transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-primary" />
                      <span>Group Chat</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer Navigation & Copyright */}
        <div className="w-full pt-10 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>{brandName}</span>
            <span className="text-muted-foreground font-normal">© 2025 • High Performance Mobile Platform</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/#roms" className="hover:text-foreground transition-colors">Custom ROMs</Link>
            <Link href="/#devices" className="hover:text-foreground transition-colors">Devices</Link>
            <Link href="/#modules" className="hover:text-foreground transition-colors">Modules</Link>
            <Link href="/guides" className="hover:text-foreground transition-colors">Guides</Link>
            <Link href="/wallpapers" className="hover:text-foreground transition-colors">Wallpapers</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
