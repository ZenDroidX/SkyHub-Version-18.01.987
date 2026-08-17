"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  Eye, 
  Sparkles, 
  Image as ImageIcon, 
  Maximize2, 
  X,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useFirestore } from '@/firebase';
import { updateDoc, doc, increment } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';

export function WallpaperGrid({ wallpapers, isLoading }: { wallpapers: any[]; isLoading: boolean }) {
  const db = useFirestore();
  const [selectedWallpaper, setSelectedWallpaper] = useState<any>(null);

  const handleDownload = async (wall: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!wall.imageUrl && !wall.downloadUrl) return;

    try {
      if (db) {
        await updateDoc(doc(db, 'wallpapers', wall.id), {
          downloadCount: increment(1)
        });
      }
    } catch (e) {
      console.error(e);
    }

    const url = wall.downloadUrl || wall.imageUrl;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${wall.name || 'SkyHub-Wallpaper'}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast({ title: "Wallpaper Downloaded", description: "Saved to your device in full resolution." });
  };

  return (
    <section id="wallpapers" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-purple-500/20 text-purple-500 text-xs font-semibold tracking-wider uppercase mb-4">
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Visual Artwork</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Featured <span className="text-purple-500 italic">Wallpapers</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Hand-curated, high-resolution AMOLED and minimalist wallpapers designed for crisp mobile displays.
          </p>
        </div>

        <Link href="/wallpapers">
          <Button variant="outline" className="h-10 rounded-2xl border-border/80 text-xs font-semibold gap-1.5">
            <span>View Full Gallery</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[9/16] rounded-3xl bg-muted/40 animate-pulse border border-border/60" />
          ))}
        </div>
      ) : (wallpapers || []).length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-border/60 bg-card/30 max-w-md mx-auto">
          <p className="text-xs text-muted-foreground">No wallpapers published yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
          {wallpapers.slice(0, 8).map((wall, idx) => (
            <motion.div
              key={wall.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
              whileHover={{ y: -6 }}
              className="group cursor-pointer"
              onClick={() => setSelectedWallpaper(wall)}
            >
              <Card className="relative aspect-[9/16] rounded-3xl overflow-hidden border border-border/80 hover:border-purple-500/50 transition-all duration-300 bg-card shadow-sm hover:shadow-xl p-0">
                <img 
                  src={wall.previewUrl || wall.imageUrl} 
                  alt={wall.name || 'Wallpaper'} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                
                {/* Gradient and info overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 text-white">
                  <div className="flex justify-end">
                    <span className="p-2 rounded-xl bg-black/40 backdrop-blur-md text-white/90">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate mb-2">{wall.name || 'Minimal Visual'}</h4>
                    <Button 
                      size="sm" 
                      onClick={(e) => handleDownload(wall, e)}
                      className="w-full h-8 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black font-bold text-[11px] backdrop-blur-md border border-white/20 transition-all"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Wallpaper Lightbox Dialog */}
      <Dialog open={!!selectedWallpaper} onOpenChange={(open) => !open && setSelectedWallpaper(null)}>
        <DialogContent className="max-w-3xl rounded-3xl border border-border glass bg-card/95 p-6 shadow-2xl">
          {selectedWallpaper && (
            <div className="space-y-6">
              <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden bg-black/50 border border-border/80 flex items-center justify-center">
                <img 
                  src={selectedWallpaper.imageUrl || selectedWallpaper.previewUrl} 
                  alt={selectedWallpaper.name} 
                  className="max-h-full max-w-full object-contain" 
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedWallpaper.name || 'Wallpaper Asset'}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedWallpaper.category || 'Aesthetic'} • {selectedWallpaper.downloadCount || 0} Total Downloads
                  </p>
                </div>

                <Button 
                  onClick={() => handleDownload(selectedWallpaper)}
                  className="h-11 px-6 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full Resolution</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export const Wallpapers = WallpaperGrid;
