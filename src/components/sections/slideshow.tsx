
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Wallpaper {
  id: string;
  imageUrl: string;
  isSlideshow?: boolean;
  name?: string;
}

export function Slideshow({ wallpapers }: { wallpapers: Wallpaper[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideshowImages = wallpapers.filter(w => w.isSlideshow).slice(0, 8);

  useEffect(() => {
    if (slideshowImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideshowImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slideshowImages.length]);

  if (slideshowImages.length === 0) return null;

  return (
    <div className="relative w-full aspect-video overflow-hidden mt-32 max-w-4xl mx-auto rounded-[3rem] border border-white/5 shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={slideshowImages[currentIndex].id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <img
            src={slideshowImages[currentIndex].imageUrl}
            alt={slideshowImages[currentIndex].name || "Sky Hub Slideshow"}
            className="w-full h-full object-cover"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slideshowImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-500",
              currentIndex === i ? "bg-[#2563eb] w-8" : "bg-white/20"
            )}
          />
        ))}
      </div>
      
      {/* Non-downloadable overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none" />
    </div>
  );
}
