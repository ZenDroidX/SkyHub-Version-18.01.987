'use client';

import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc } from 'firebase/firestore';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Heart, User, Quote, Sparkles } from 'lucide-react';
import { SiteSettings } from '@/lib/store';
import { cn } from '@/lib/utils';
import { resolveImageUrl } from '@/lib/image-resolver';

export function DonorShowcase() {
  const db = useFirestore();
  const donorsRef = useMemoFirebase(() => collection(db, 'donors'), [db]);
  const donorsQuery = useMemoFirebase(() => query(donorsRef, where('visible', '==', true), orderBy('priority', 'desc')), [donorsRef]);
  const { data: donors } = useCollection(donorsQuery);

  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc<SiteSettings>(settingsRef);

  const showcaseSettings = globalSettings?.donorShowcase || {
    enabled: true,
    speed: 30,
    pauseOnHover: true,
    style: 'glassmorphism',
    showParticles: true
  };

  if (!showcaseSettings.enabled || !donors || donors.length === 0) return null;

  // Double the donors for seamless looping
  const loopedDonors = [...donors, ...donors, ...donors];

  return (
    <section className="relative py-24 overflow-hidden bg-black/40 border-y border-white/5">
      {showcaseSettings.showParticles && <ParticlesBackground />}
      
      <div className="container mx-auto px-4 mb-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6 uppercase tracking-widest"
        >
          <Heart className="w-3 h-3" />
          Wall of Gratitude
        </motion.div>
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Our Special <span className="text-primary italic">Donors</span>
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Honoring those who fuel the continuous research and optimization for the Snapdragon ecosystem.
        </p>
      </div>

      <div className="relative flex overflow-hidden py-12">
        <div 
          className="flex whitespace-nowrap animate-marquee hover:pause-marquee"
          style={{ 
            animationDuration: `${Number(showcaseSettings.speed) || 30}s`,
            animationPlayState: showcaseSettings.pauseOnHover ? undefined : 'running'
          }}
        >
          {loopedDonors.map((donor, idx) => (
            <DonorCard 
              key={`${donor.id}-${idx}`} 
              donor={donor} 
              style={showcaseSettings.style || 'glassmorphism'} 
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DonorCard({ donor, style }: { donor: any, style: string }) {
  const isNeon = style === 'neon';
  const isGlass = style === 'glassmorphism';
  const isMinimal = style === 'minimal';

  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={cn(
        "flex-shrink-0 mx-4 w-72 rounded-2xl p-6 transition-all duration-300 relative group",
        isGlass && "bg-white/5 backdrop-blur-xl border border-white/10 hover:border-primary/50",
        isNeon && "bg-black border border-primary/20 hover:border-primary hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]",
        isMinimal && "bg-transparent border border-white/5 hover:bg-white/5",
        "flex flex-col items-start gap-4"
      )}
    >
      <div className="flex items-center gap-4 w-full">
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors">
            {donor.avatarUrl ? (
              <img src={resolveImageUrl(donor.avatarUrl)} alt={donor.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1 shadow-lg ring-2 ring-black">
            <Heart className="w-2 h-2 text-white fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-white truncate group-hover:text-primary transition-colors">{donor.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            {donor.username && (
              <p className="text-xs text-muted-foreground truncate">@{donor.username}</p>
            )}
            {donor.amount && (
              <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 uppercase tracking-tighter">
                {donor.amount}
              </span>
            )}
          </div>
        </div>
      </div>

      {donor.message && (
        <div className="relative mt-2">
          <Quote className="w-4 h-4 text-primary/40 absolute -top-1 -left-2 rotate-180" />
          <p className="text-sm text-muted-foreground leading-relaxed pl-4 italic">
            {donor.message}
          </p>
        </div>
      )}

      {/* Decorative background glow */}
      {isNeon && (
        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl -z-10" />
      )}
    </motion.div>
  );
}

function ParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/40 rounded-full"
          initial={{
            x: Math.random() * 100 + "%",
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [null, "-100%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "linear",
            delay: Math.random() * 10,
          }}
        />
      ))}
    </div>
  );
}
