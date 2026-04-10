
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LoadingConfig } from '@/lib/store';

interface LoadingScreenProps {
  config?: LoadingConfig;
  onFinished?: () => void;
  isInline?: boolean;
}

const DEFAULT_LOGS = [
  "INITIALIZING BOOTLOADER...",
  "DECRYPTING CORE PARTITIONS...",
  "MOUNTING /SYSTEM_ROOT...",
  "INJECTING SKY HUB PROTOCOLS...",
  "PATCHING BOOT.IMG...",
  "STARTING DAEMON...",
  "SYNCING REGISTRY TERMINAL..."
];

export function LoadingScreen({ config, onFinished, isInline }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [show, setShow] = useState(true);

  const logs = config?.customText || DEFAULT_LOGS;
  const mode = config?.mode || 'terminal';

  useEffect(() => {
    const duration = isInline ? 4000 : 2500; 
    const interval = 40;
    const step = 100 / (duration / interval);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (isInline) return 0;
          clearInterval(timer);
          setTimeout(() => { setShow(false); onFinished?.(); }, 400);
          return 100;
        }
        return prev + step;
      });
    }, interval);

    const logTimer = setInterval(() => {
      setCurrentLogIndex((prev) => (prev + 1) % logs.length);
    }, 350);

    return () => { clearInterval(timer); clearInterval(logTimer); };
  }, [logs.length, onFinished, isInline]);

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 overflow-hidden relative",
      isInline ? "w-full h-full scale-[0.7]" : "fixed inset-0 z-[9999] bg-black"
    )}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full animate-pulse" />

      <div className="max-w-md w-full relative z-10 flex flex-col items-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-8 relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
            {mode === 'terminal' ? <Terminal className="w-8 h-8 text-primary" /> : 
             mode === 'circuit' ? <Cpu className="w-8 h-8 text-primary" /> : <Zap className="w-8 h-8 text-primary" />}
          </div>
        </motion.div>

        <div className="w-full glass border-white/5 rounded-[2rem] p-6 bg-black/40 backdrop-blur-2xl">
          <div className="flex items-center gap-2 mb-4 opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
            <span className="text-[7px] font-black uppercase tracking-widest ml-2 text-white">SKY_OS :: TERM</span>
          </div>

          <div className="h-10 overflow-hidden mb-6">
            <AnimatePresence mode="wait">
              <motion.p key={currentLogIndex} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -5, opacity: 0 }} className="text-[8px] font-code text-primary uppercase">
                <span className="text-white/40 mr-2">[OK]</span> {logs[currentLogIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-[7px] font-black uppercase text-white/60">BOOTING...</span><span className="text-xs font-black text-white italic">{Math.round(progress)}%</span></div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden"><motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInline) return content;
  return <AnimatePresence>{show && <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[9999] bg-black">{content}</motion.div>}</AnimatePresence>;
}
