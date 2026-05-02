
"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';
import { Cpu, Camera, Zap, Smartphone } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function DeviceShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const deviceImage = PlaceHolderImages.find(img => img.id === 'redmi-12-5g-model')?.imageUrl;
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Buttery smooth spring physics to eliminate lag
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 60,
    damping: 25,
    restDelta: 0.001
  });

  // Background Opacity (Blackout effect)
  const bgOpacity = useTransform(smoothProgress, [0.2, 0.4, 0.6, 0.8], [0, 1, 1, 0]);
  
  // Model Transforms
  const scale = useTransform(smoothProgress, [0.2, 0.5, 0.8], [0.8, 1.15, 0.8]);
  const rotateY = useTransform(smoothProgress, [0.2, 0.5, 0.8], [-12, 0, 12]);
  const yOffset = useTransform(smoothProgress, [0.2, 0.5, 0.8], [150, 0, -150]);
  const opacity = useTransform(smoothProgress, [0.3, 0.4, 0.6, 0.7], [0, 1, 1, 0]);

  // Callout Animations
  const labelX1 = useTransform(smoothProgress, [0.4, 0.5], [-80, 0]);
  const labelX2 = useTransform(smoothProgress, [0.4, 0.5], [80, 0]);
  const labelOpacity = useTransform(smoothProgress, [0.45, 0.5, 0.55, 0.6], [0, 1, 1, 0]);

  return (
    <section ref={containerRef} className="h-[250vh] relative z-20 pointer-events-none">
      <motion.div 
        style={{ opacity: bgOpacity }}
        className="fixed inset-0 bg-black -z-10 pointer-events-auto"
      />

      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <motion.div
          style={{ 
            scale, 
            rotateY, 
            y: yOffset, 
            opacity,
            perspective: 1200 
          }}
          className="relative w-[280px] md:w-[380px] aspect-[9/19] [transform-style:preserve-3d]"
        >
          {/* Device Body Simulation - Reflecting the Sky Blue Redmi 12 5G */}
          <div className="absolute inset-0 bg-[#E3F2FD] rounded-[3.5rem] border-[10px] border-[#B0BEC5] shadow-[0_0_100px_rgba(37,99,235,0.1)] overflow-hidden flex items-center justify-center relative">
            {deviceImage ? (
              <Image 
                src={deviceImage} 
                alt="Redmi 12 5G" 
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-blue-500/20 p-12 text-center">
                <Smartphone className="w-24 h-24 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Image will be added soon.<br/>Sorry for the inconvenience.</p>
              </div>
            )}
            
            {/* Camera Module Silhouette - Precise Dual Ring Alignment */}
            <div className="absolute top-10 right-8 w-28 h-36 bg-white/40 rounded-3xl border border-white/60 backdrop-blur-xl flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border-4 border-white/20 shadow-inner" />
              <div className="w-12 h-12 rounded-full bg-[#1A1A1A] border-4 border-white/20 shadow-inner" />
              <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-white/80" />
            </div>
          </div>

          {/* Technical Annotations */}
          <AnimatePresence>
            <motion.div 
              style={{ x: labelX1, opacity: labelOpacity }}
              className="absolute -left-48 top-[20%] w-56"
            >
              <div className="glass border-white/10 p-5 rounded-3xl flex flex-col gap-2">
                <div className="flex items-center gap-3 text-blue-500">
                  <Cpu className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Logic Core</span>
                </div>
                <p className="text-white text-sm font-black uppercase tracking-tight">Snapdragon 4 Gen 2</p>
                <div className="h-px w-full bg-white/10 my-1" />
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">4nm Performance Hub</p>
              </div>
            </motion.div>

            <motion.div 
              style={{ x: labelX2, opacity: labelOpacity }}
              className="absolute -right-48 top-[40%] w-56"
            >
              <div className="glass border-white/10 p-5 rounded-3xl flex flex-col gap-2">
                <div className="flex items-center gap-3 text-red-500">
                  <Camera className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Optics Node</span>
                </div>
                <p className="text-white text-sm font-black uppercase tracking-tight">50MP AI Dual Camera</p>
                <div className="h-px w-full bg-white/10 my-1" />
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">Crystal Clear Imaging</p>
              </div>
            </motion.div>

            <motion.div 
              style={{ x: labelX1, opacity: labelOpacity }}
              className="absolute -left-48 bottom-[25%] w-56"
            >
              <div className="glass border-white/10 p-5 rounded-3xl flex flex-col gap-2">
                <div className="flex items-center gap-3 text-green-500">
                  <Zap className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Power Grid</span>
                </div>
                <p className="text-white text-sm font-black uppercase tracking-tight">5000mAh Battery</p>
                <div className="h-px w-full bg-white/10 my-1" />
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">22.5W Fast Charging</p>
              </div>
            </motion.div>

            <motion.div 
              style={{ x: labelX2, opacity: labelOpacity }}
              className="absolute -right-48 bottom-[15%] w-56"
            >
              <div className="glass border-white/10 p-5 rounded-3xl flex flex-col gap-2">
                <div className="flex items-center gap-3 text-purple-500">
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Visual Field</span>
                </div>
                <p className="text-white text-sm font-black uppercase tracking-tight">90Hz AdaptiveSync</p>
                <div className="h-px w-full bg-white/10 my-1" />
                <p className="text-[8px] text-muted-foreground uppercase font-bold tracking-widest">FHD+ Large Display</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Model Identity Overlay */}
          <motion.div 
            style={{ opacity: labelOpacity }}
            className="absolute -bottom-40 left-1/2 -translate-x-1/2 text-center w-[120%]"
          >
            <h4 className="text-4xl font-black uppercase tracking-tighter text-white mb-2">REDMI 12 5G</h4>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.5em] opacity-60">Snapdragon 4 Gen 2 // SKY PLATFORM</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
