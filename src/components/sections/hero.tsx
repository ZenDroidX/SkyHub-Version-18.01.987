"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Settings, 
  Cpu, 
  Zap, 
  Shield, 
  Users, 
  Heart, 
  QrCode, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  Sparkles, 
  ArrowDown,
  Layers,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG, SiteSettings } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SearchOverlay } from '@/components/ui/SearchOverlay';

export function Hero() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc<SiteSettings>(globalSettingsRef);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const upiId = settings?.upiId || DEFAULT_DONATION_CONFIG.upiId;
  const upiAmount = settings?.upiAmount || DEFAULT_DONATION_CONFIG.upiAmount;
  const qrUrl = settings?.qrImageUrl || DEFAULT_DONATION_CONFIG.qrImageUrl;
  const telegramChannel = globalSettings?.socialLinks?.telegramChannel || DEFAULT_DONATION_CONFIG.telegramChannelUrl;
  const telegramDiscussion = globalSettings?.socialLinks?.discussion || DEFAULT_DONATION_CONFIG.telegramDiscussionUrl;

  const rawHeroTitle = globalSettings?.heroTitle || 'REDMI 12 5G\nPOCO M6 PRO 5G';
  const heroTitle = rawHeroTitle.includes("hemlo User's") 
    ? 'REDMI 12 5G\nPOCO M6 PRO 5G' 
    : rawHeroTitle;

  const rawHeroSubtitle = globalSettings?.heroSubtitle || 'The definitive command center for sky-platform development.\nUnleash Snapdragon 4 Gen 2 with premium custom kernels and system builds.';
  const heroSubtitle = rawHeroTitle.includes("hemlo User's")
    ? 'The definitive command center for sky-platform development.\nUnleash Snapdragon 4 Gen 2 with premium custom kernels and system builds.'
    : rawHeroSubtitle;

  const titleLines = heroTitle.split('\n');

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: "UPI ID Copied", description: "UPI ID copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const highlightWords = (text: string) => {
    if (!globalSettings?.highlightedWords || globalSettings.highlightedWords.length === 0) return text;
    let parts: (string | React.ReactNode)[] = [text];
    
    globalSettings.highlightedWords.forEach((hw: any) => {
      if (!hw.word) return;
      const escapedWord = hw.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedWord})`, 'gi');
      
      parts = parts.flatMap((p: any, pIdx: number) => {
        if (typeof p === 'string') {
          const split = p.split(regex);
          return split.map((s, i) => i % 2 !== 0 ? <span key={`${hw.word}-${pIdx}-${i}`} style={{ color: hw.color }}>{s}</span> : s);
        }
        return p;
      });
    });
    
    return parts;
  };

  return (
    <section className="relative pt-36 sm:pt-44 pb-20 md:pb-28 overflow-hidden flex flex-col items-center justify-center text-center px-4 sm:px-6 min-h-[85vh]">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
        {/* Soft Radial Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-accent/10 blur-[140px] rounded-full" />
        {/* Fine Dot Grid */}
        <div className="absolute inset-0 bg-dot-pattern opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-5xl mx-auto z-10 w-full">
        {/* Top Protocol Status Pill */}
        <motion.div 
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/25 bg-card/80 text-foreground text-xs font-semibold tracking-wider uppercase mb-8 backdrop-blur-xl shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-primary font-bold">SkyHub</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground font-mono text-[11px]">Snapdragon 4 Gen 2 Matrix</span>
        </motion.div>
        
        {/* Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-6 flex flex-col leading-[1.02] uppercase text-foreground"
        >
          {titleLines.map((line: string, index: number) => (
            <span key={index} className={index === 0 ? "drop-shadow-sm" : "text-muted-foreground/70 font-bold"}>
              {highlightWords(line)}
            </span>
          ))}
        </motion.h1>
        
        {/* Hero Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 font-normal leading-relaxed whitespace-pre-line"
        >
          {highlightWords(heroSubtitle)}
        </motion.p>

        {/* Primary Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12"
        >
          <Button
            size="lg"
            onClick={() => scrollTo('roms')}
            className="h-12 px-7 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Cpu className="w-4 h-4 mr-2" />
            <span>Explore ROMs</span>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollTo('devices')}
            className="h-12 px-7 rounded-2xl border-border/80 bg-card/70 hover:bg-muted text-foreground font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4 mr-2 text-primary" />
            <span>Device Matrix</span>
          </Button>

          <Button
            size="lg"
            variant="ghost"
            onClick={() => setIsSearchOpen(true)}
            className="h-12 px-5 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted text-sm font-medium"
          >
            <Search className="w-4 h-4 mr-2 text-muted-foreground" />
            <span>Command Search (⌘K)</span>
          </Button>
        </motion.div>

        {/* Community & Discussion Translucent Pills */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-xl mx-auto mb-16 p-2 rounded-2xl sm:rounded-full glass border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg"
        >
          {telegramChannel && (
            <a 
              href={telegramChannel}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white border border-sky-500/20 text-xs font-bold transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Official Telegram Channel</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}

          {telegramDiscussion && (
            <a 
              href={telegramDiscussion}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full hover:bg-muted text-foreground border border-border/60 text-xs font-bold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>Discussion Group</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          )}
        </motion.div>

        {/* Technical Highlights Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left"
        >
          <div className="p-4 rounded-2xl bg-card/50 border border-border/70 backdrop-blur-md">
            <div className="flex items-center gap-2 text-primary font-bold text-xs mb-1 uppercase tracking-wider">
              <Cpu className="w-3.5 h-3.5" />
              <span>Architecture</span>
            </div>
            <p className="text-sm font-bold text-foreground">Snapdragon 4 Gen 2</p>
            <p className="text-xs text-muted-foreground mt-0.5">SM4450 4nm Platform</p>
          </div>

          <div className="p-4 rounded-2xl bg-card/50 border border-border/70 backdrop-blur-md">
            <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs mb-1 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Kernels</span>
            </div>
            <p className="text-sm font-bold text-foreground">KSU & Performance</p>
            <p className="text-xs text-muted-foreground mt-0.5">KernelSU + Boot Patches</p>
          </div>

          <div className="p-4 rounded-2xl bg-card/50 border border-border/70 backdrop-blur-md">
            <div className="flex items-center gap-2 text-accent font-bold text-xs mb-1 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>Build Types</span>
            </div>
            <p className="text-sm font-bold text-foreground">AOSP 14 / 15 / 16</p>
            <p className="text-xs text-muted-foreground mt-0.5">Official & Community</p>
          </div>

          <div className="p-4 rounded-2xl bg-card/50 border border-border/70 backdrop-blur-md">
            <div className="flex items-center gap-2 text-rose-500 font-bold text-xs mb-1 uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" />
              <span>Integrity</span>
            </div>
            <p className="text-sm font-bold text-foreground">100% Free & Open</p>
            <p className="text-xs text-muted-foreground mt-0.5">Zero Ads or Paywalls</p>
          </div>
        </motion.div>
      </div>

      {/* Subtle Bottom Scroll Indicator */}
      <motion.button 
        onClick={() => scrollTo('roms')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-16 inline-flex flex-col items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group cursor-pointer"
      >
        <span className="text-[11px] font-medium tracking-wider uppercase">Scroll to explore</span>
        <ArrowDown className="w-4 h-4 text-primary group-hover:translate-y-1 transition-transform animate-bounce" />
      </motion.button>

      {/* Command Search Overlay Modal */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </section>
  );
}
