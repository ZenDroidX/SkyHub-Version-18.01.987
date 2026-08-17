"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Image as ImageIcon, Loader2, FileArchive, CheckSquare, Square, Maximize2, Sparkles, X } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

export default function WallpapersBrowsePage() {
  const db = useFirestore();
  const wallpapersQuery = useMemoFirebase(() => db ? query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: wallpapers, isLoading } = useCollection(wallpapersQuery);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState<any>(null);

  const toggleSelection = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (!wallpapers) return;
    if (selectedIds.size === wallpapers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(wallpapers.map(w => w.id)));
    }
  };

  const handleDownload = async (url: string, name: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '-').toLowerCase() || 'sky-wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Asset Downloaded", description: "Wallpaper saved to your device." });
    } catch (e) {
      window.open(url, '_blank');
      toast({ title: "Opening Image", description: "Downloading direct via browser." });
    }
  };

  const handleZipDownload = async () => {
    const itemsToDownload = selectedIds.size > 0 
      ? wallpapers?.filter(w => selectedIds.has(w.id)) 
      : wallpapers;

    if (!itemsToDownload || itemsToDownload.length === 0) return;
    
    setIsZipLoading(true);
    toast({ 
      title: "Creating Archive", 
      description: `Compressing ${itemsToDownload.length} wallpapers into high-speed ZIP package...` 
    });

    try {
      const zip = new JSZip();
      const folder = zip.folder("SkyHub-Wallpapers");

      for (let i = 0; i < itemsToDownload.length; i++) {
        const wall = itemsToDownload[i];
        try {
          const response = await fetch(wall.imageUrl || wall.downloadUrl);
          const blob = await response.blob();
          const fileName = `${wall.name ? wall.name.replace(/\s+/g, '-').toLowerCase() : `wallpaper-${i + 1}`}.jpg`;
          folder?.file(fileName, blob);
        } catch (err) {
          console.error(`Failed to pack wallpaper ${i}:`, err);
        }
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SkyHub-Wallpapers-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast({ title: "Archive Generated", description: "ZIP download completed successfully." });
    } catch (error) {
      toast({ variant: "destructive", title: "Archive Error", description: "Could not create ZIP file." });
    } finally {
      setIsZipLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="pt-36 pb-24 px-6 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-6 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold gap-1.5">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Hub</span>
              </Button>
            </Link>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-purple-500/20 text-purple-500 text-xs font-semibold tracking-wider uppercase mb-4">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Full Artwork Archive</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground mb-3">
              Curated <span className="text-purple-500 italic">Wallpapers</span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
              High-resolution minimalist and AMOLED artworks optimized for high refresh rate mobile panels.
            </p>
          </div>

          {/* Bulk Action Controls */}
          {wallpapers && wallpapers.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5 p-2 rounded-2xl glass bg-card/60 border border-border/80">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSelectAll}
                className="h-9 px-3 rounded-xl text-xs font-medium"
              >
                {selectedIds.size === wallpapers.length ? (
                  <CheckSquare className="w-4 h-4 mr-1.5 text-primary" />
                ) : (
                  <Square className="w-4 h-4 mr-1.5 text-muted-foreground" />
                )}
                <span>{selectedIds.size === wallpapers.length ? 'Deselect All' : 'Select All'}</span>
              </Button>

              <Button 
                size="sm" 
                onClick={handleZipDownload}
                disabled={isZipLoading}
                className="h-9 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm gap-1.5"
              >
                {isZipLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                <span>
                  {selectedIds.size > 0 ? `Download (${selectedIds.size}) as ZIP` : 'Download All as ZIP'}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* Wallpaper Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[9/16] rounded-3xl bg-muted/40 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : !wallpapers || wallpapers.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border/80 rounded-3xl bg-card/40">
            <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">No wallpapers in gallery</h3>
            <p className="text-xs text-muted-foreground">New visuals will be published here soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {wallpapers.map((wall, idx) => {
              const isSelected = selectedIds.has(wall.id);

              return (
                <motion.div
                  key={wall.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: (idx % 10) * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="group cursor-pointer relative"
                  onClick={() => setSelectedWallpaper(wall)}
                >
                  <Card className={`relative aspect-[9/16] rounded-3xl overflow-hidden border transition-all duration-300 bg-card shadow-sm hover:shadow-xl p-0 ${
                    isSelected ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-border/80 hover:border-purple-500/50'
                  }`}>
                    <img 
                      src={wall.previewUrl || wall.imageUrl} 
                      alt={wall.name || 'Wallpaper'} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />

                    {/* Top Select Checkbox */}
                    <button
                      onClick={(e) => toggleSelection(wall.id, e)}
                      className={`absolute top-3 left-3 p-1.5 rounded-xl backdrop-blur-md transition-all z-10 ${
                        isSelected 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-black/40 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>

                    {/* Bottom Info Overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <span className="text-xs font-bold text-white truncate mb-2">{wall.name || 'Wallpaper'}</span>
                      <Button 
                        size="sm"
                        onClick={(e) => handleDownload(wall.imageUrl || wall.downloadUrl, wall.name, e)}
                        className="w-full h-8 rounded-xl bg-white/20 hover:bg-white text-white hover:text-black font-bold text-[11px] backdrop-blur-md border border-white/20"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        <span>Download</span>
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

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
                  onClick={() => handleDownload(selectedWallpaper.imageUrl || selectedWallpaper.downloadUrl, selectedWallpaper.name)}
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

      <Footer />
    </main>
  );
}
