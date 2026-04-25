"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Smartphone, Settings, Cpu, Zap, Shield, Users, Heart, QrCode, Copy, Check, Send, MessageSquare, Sparkles } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Hero() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc(globalSettingsRef);

  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const upiId = settings?.upiId || DEFAULT_DONATION_CONFIG.upiId;
  const upiAmount = settings?.upiAmount || DEFAULT_DONATION_CONFIG.upiAmount;
  const qrUrl = settings?.qrImageUrl || DEFAULT_DONATION_CONFIG.qrImageUrl;
  const telegramChannel = globalSettings?.socialLinks?.telegramChannel || DEFAULT_DONATION_CONFIG.telegramChannelUrl;
  const telegramDiscussion = globalSettings?.socialLinks?.discussion || DEFAULT_DONATION_CONFIG.telegramDiscussionUrl;
  const telegramLogo = settings?.telegramLogoUrl || DEFAULT_DONATION_CONFIG.telegramLogoUrl;
  const paymentLink = globalSettings?.supportLinks?.paymentLink || DEFAULT_DONATION_CONFIG.paymentLink;
  const qrLink = globalSettings?.supportLinks?.qrLink || qrUrl;
  const slideshowImages = globalSettings?.slideshowImages || [];

  const heroTitle = globalSettings?.heroTitle || 'REDMI 12 5G\nPOCO M6 PRO 5G';
  const heroSubtitle = globalSettings?.heroSubtitle || 'The definitive command center for sky-platform development.\nUnleash Snapdragon 4 Gen 2 with premium custom kernels and system builds.';

  const titleLines = heroTitle.split('\n');

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSupportClick = () => {
    if (!upiId) {
      toast({ title: "Configuration Error", description: "UPI ID has not been set by the admin." });
      return;
    }
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `upi://pay?pa=${upiId}${upiAmount ? `&am=${upiAmount}` : ''}&cu=INR`;
    } else {
      setIsSupportOpen(true);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: "Registry Copied", description: "UPI ID added to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-32 pb-32 overflow-hidden flex flex-col items-center justify-center text-center px-6 min-h-[80vh]">
      {/* Enhanced Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/5 blur-[200px] rounded-full animate-glow-pulse"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary/10 to-transparent opacity-30"></div>
      </div>

      <div className="max-w-5xl mx-auto z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-3 px-6 py-2 rounded-full border border-border bg-card/10 text-foreground text-[10px] font-black tracking-[0.3em] mb-12 uppercase backdrop-blur-md"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          SKY / SKY_PRO PROTOCOL ACTIVE
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="text-6xl md:text-8xl lg:text-[120px] font-black tracking-tighter mb-6 flex flex-col leading-[0.85] uppercase text-foreground"
        >
          {titleLines.map((line: string, index: number) => (
            <span key={index} className={index === 0 ? "drop-shadow-2xl" : "text-muted-foreground/30 italic"}>
              {line}
            </span>
          ))}
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-sm md:text-lg text-muted-foreground max-w-2xl mx-auto mb-12 font-medium leading-relaxed tracking-tight whitespace-pre-line"
        >
          Sky-platform development command center. Unleash your device&apos;s potential.
        </motion.p>

        {/* Translucent Network Bar Protocol with Lightning Effects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-2xl mx-auto mb-16 p-2 rounded-full glass-pill border-border/10 flex flex-col sm:flex-row items-center gap-3 overflow-visible shadow-[0_0_50px_rgba(0,0,0,0.1)] dark:shadow-[0_0_50px_rgba(0,0,0,0.3)]"
        >
          {/* Telegram Channel Button */}
          <motion.button 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(telegramChannel, '_blank')}
            className="group relative h-14 flex-1 rounded-full bg-card/40 backdrop-blur-xl border border-border/20 flex items-center justify-center gap-3 px-8 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 hover:border-blue-500/50 overflow-hidden w-full shadow-lg"
          >
            {/* Full-Surface Lightning Shimmer - Unified Coverage */}
            <motion.div 
              animate={{ x: ['-150%', '150%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 0.5 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/50 dark:via-blue-400/20 to-transparent skew-x-[35deg] pointer-events-none"
            />
            
            <div className="relative z-10 flex items-center gap-3">
              {telegramLogo ? (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-background/50 border border-border/20 flex items-center justify-center group-hover:border-blue-500/50 transition-all">
                  <img src={telegramLogo} className="w-full h-full object-contain" alt="Logo" />
                </div>
              ) : <Send className="w-4 h-4" />}
              <span>Official Channel</span>
            </div>
            
            <Zap className="absolute right-4 w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all text-blue-500 dark:text-blue-400 animate-pulse z-10" />
          </motion.button>

          {/* Telegram Discussion Button */}
          <motion.button 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open(telegramDiscussion, '_blank')}
            className="group relative h-14 flex-1 rounded-full bg-card/40 backdrop-blur-xl border border-border/20 flex items-center justify-center gap-3 px-8 text-green-600 dark:text-green-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 hover:border-green-500/50 overflow-hidden w-full shadow-lg"
          >
            {/* Full-Surface Lightning Shimmer - Unified Coverage */}
            <motion.div 
              animate={{ x: ['-150%', '150%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/50 dark:via-green-400/20 to-transparent skew-x-[35deg] pointer-events-none"
            />

            <div className="relative z-10 flex items-center gap-3">
              <MessageSquare className="w-4 h-4" />
              <span>Discussion Node</span>
            </div>

            <Sparkles className="absolute right-4 w-3 h-3 opacity-0 group-hover:opacity-100 group-hover:rotate-12 transition-all text-green-500 dark:text-green-400 z-10" />
          </motion.button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-32 flex-wrap"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => scrollTo('roms')}
              size="lg" 
              className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-[0.2em] gap-4 shadow-2xl shadow-primary/10 transition-all duration-300 w-full sm:w-auto"
            >
              <Smartphone className="w-4 h-4" />
              Explore ROMs
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={handleSupportClick}
              size="lg" 
              variant="outline" 
              className="h-16 px-10 rounded-2xl border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black text-[11px] uppercase tracking-[0.2em] gap-4 transition-all duration-300 w-full sm:w-auto"
            >
              <Heart className="w-4 h-4 fill-current" />
              Support
            </Button>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            { label: 'SD 4 Gen 2', icon: <Cpu className="w-5 h-5 text-blue-600" />, desc: 'System Optimization', x: -30 },
            { label: 'Daily Builds', icon: <Zap className="w-5 h-5 text-blue-500" />, desc: 'Realtime Updates', x: -15 },
            { label: 'Verified', icon: <Shield className="w-5 h-5 text-blue-600" />, desc: 'Secure Protocol', x: 15 },
            { label: 'Community', icon: <Users className="w-5 h-5 text-blue-500" />, desc: 'Global Support', x: 30 },
          ].map((feature, idx) => (
            <motion.div 
              key={feature.label} 
              initial={{ opacity: 0, x: feature.x, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 * idx }}
              whileHover={{ y: -10, transition: { duration: 0.2 } }}
              className="flex flex-col items-center gap-5 p-10 rounded-[2.5rem] bg-card/30 border border-border hover:bg-card/50 transition-all group"
            >
              <div className="p-4 bg-background/50 rounded-2xl group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500">
                {feature.icon}
              </div>
              <div className="text-center transition-all duration-500">
                <span className="font-black text-[12px] uppercase tracking-[0.2em] block mb-2 text-foreground">{feature.label}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">{feature.desc}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="bg-card border-border rounded-[3rem] p-10 max-w-sm flex flex-col items-center text-center gap-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Support Hub</DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full aspect-square bg-white rounded-[2rem] p-4 border border-border overflow-hidden shadow-inner">
            {qrLink && <img src={qrLink} alt="Payment QR" className="w-full h-full object-contain" />}
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Registry UPI ID</span>
              <div className="bg-muted p-4 rounded-2xl flex items-center justify-between border border-border group hover:border-primary/40 transition-all">
                <span className="text-[10px] font-code text-foreground truncate">{upiId}</span>
                <Button variant="ghost" size="icon" onClick={copyUpiId} className="h-8 w-8 rounded-xl shrink-0 ml-2">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            
            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-medium">
              Contributions fuel Snapdragon optimizations and community development protocols.
            </p>
          </div>
          
          <Button onClick={() => setIsSupportOpen(false)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest">
            Close Terminal
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
