"use client";

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Library, Loader2, FileArchive, CheckCircle2, Circle, CheckSquare, Square, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function WallpapersBrowsePage() {
  const db = useFirestore();
  const wallpapersQuery = useMemoFirebase(() => collection(db, 'wallpapers'), [db]);
  const { data: wallpapers, isLoading } = useCollection(wallpapersQuery);
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const isNewAsset = (createdAt: any) => {
    if (!createdAt) return false;
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    return (now.getTime() - date.getTime()) < 86400000;
  };

  const toggleSelection = (id: string) => {
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

  const handleDownload = async (url: string, name: string) => {
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

  const handleBulkDownload = async () => {
    const itemsToDownload = selectedIds.size > 0 
      ? wallpapers?.filter(w => selectedIds.has(w.id)) 
      : wallpapers;

    if (!itemsToDownload || itemsToDownload.length === 0) return;
    
    setIsBulkDownloading(true);
    toast({ 
      title: "Bulk Acquisition Initiated", 
      description: `Synchronizing ${itemsToDownload.length} assets with the local terminal.` 
    });

    for (let i = 0; i < itemsToDownload.length; i++) {
      const wall = itemsToDownload[i];
      try {
        const response = await fetch(wall.imageUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        const fileName = `ZenDroid Wallo ${i + 1}.jpg`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.error("Bulk sync failed for asset:", wall.imageUrl);
      }
    }

    setIsBulkDownloading(false);
    toast({ title: "Bulk Sync Complete", description: "Selected visual assets have been synchronized." });
  };

  const handleZipDownload = async () => {
    const itemsToZip = selectedIds.size > 0 
      ? wallpapers?.filter(w => selectedIds.has(w.id)) 
      : wallpapers;

    if (!itemsToZip || itemsToZip.length === 0) return;
    
    setIsZipLoading(true);
    const zip = new JSZip();
    const folder = zip.folder("sky-wallpapers");

    toast({ 
      title: "Archiving Started", 
      description: `Compressing ${itemsToZip.length} selected assets into a ZIP terminal archive.` 
    });

    try {
      for (let i = 0; i < itemsToZip.length; i++) {
        const wall = itemsToZip[i];
        try {
          const response = await fetch(wall.imageUrl);
          if (!response.ok) throw new Error('Fetch failure');
          const blob = await response.blob();
          const fileName = `ZenDroid Wallo ${i + 1}.jpg`;
          folder?.file(fileName, blob);
        } catch (itemError) {
          console.warn(`Registry skip: Node ${i+1} failed to archive.`, itemError);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `ZenDroid-Wallo-Selection.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({ title: "Archive Ready", description: "Custom ZIP protocol synchronized successfully." });
    } catch (e) {
      toast({ 
        variant: "destructive", 
        title: "Archive Failed", 
        description: "Protocol error during compression." 
      });
    } finally {
      setIsZipLoading(false);
    }
  };

  const hasNewWallpapers = wallpapers?.some(w => isNewAsset(w.createdAt));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <motion.div 
        className="pt-32 pb-20 px-6 max-w-7xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <Link href="/">
              <motion.div whileHover={{ x: -10 }} transition={{ type: "spring", stiffness: 400 }}>
                <Button variant="ghost" className="p-0 hover:bg-transparent text-muted-foreground group">
                  <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                  Return Home
                </Button>
              </motion.div>
            </Link>
            <div>
              {hasNewWallpapers && (
                <motion.div 
                  className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-3"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Sparkles className="w-3 h-3" />
                  NEWLY ADDED PROTOCOLS
                </motion.div>
              )}
              <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">SKY <span className="text-[#2563eb]">WALLPAPERS</span></h1>
              <p className="text-muted-foreground text-lg max-w-xl">Curated high-fidelity visual assets optimized for Sky platform devices.</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {wallpapers && wallpapers.length > 0 && (
              <>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="outline"
                    onClick={handleSelectAll}
                    className="h-14 px-6 rounded-2xl border-white/10 bg-white/5 text-foreground font-black uppercase text-[11px] tracking-widest gap-3 hover:bg-white/10 transition-all w-full sm:w-auto"
                  >
                    {selectedIds.size === wallpapers.length ? <CheckSquare className="w-4 h-4 text-blue-500" /> : <Square className="w-4 h-4" />}
                    {selectedIds.size === wallpapers.length ? 'Deselect All' : `Select All (${wallpapers.length})`}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleZipDownload} 
                    disabled={isZipLoading || isBulkDownloading}
                    className="h-14 px-8 rounded-2xl bg-[#0a0a0a] border border-white/10 text-white font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl hover:bg-white/5 transition-all w-full sm:w-auto"
                  >
                    {isZipLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileArchive className="w-5 h-5" />}
                    Download ZIP {selectedIds.size > 0 ? `(${selectedIds.size})` : 'Archive'}
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={handleBulkDownload} 
                    disabled={isBulkDownloading || isZipLoading}
                    className="h-14 px-8 rounded-2xl bg-[#2563eb] text-white font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-[#2563eb]/20 hover:shadow-[#2563eb]/40 transition-all w-full sm:w-auto"
                  >
                    {isBulkDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Library className="w-5 h-5" />}
                    Bulk Sync {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                  </Button>
                </motion.div>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Assets...</p>
          </div>
        ) : wallpapers?.length === 0 ? (
          <div className="py-40 text-center border border-dashed border-border rounded-[3rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">The vault is currently empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {wallpapers?.map((wall, idx) => {
              const isSelected = selectedIds.has(wall.id);
              const isNew = isNewAsset(wall.createdAt);

              return (
                <motion.div 
                  key={wall.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx % 12 * 0.05 }}
                >
                  <Card 
                    onClick={() => toggleSelection(wall.id)}
                    className={cn(
                      "relative group aspect-[9/16] overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border-white/10 cursor-pointer transition-all duration-300",
                      isSelected ? "ring-4 ring-blue-500 ring-offset-4 ring-offset-background scale-[0.98]" : "hover:border-blue-500/50"
                    )}
                  >
                    <motion.img 
                      src={wall.imageUrl} 
                      alt={wall.name || 'Wallpaper'} 
                      className={cn(
                        "object-cover w-full h-full transition-transform duration-700",
                        !isSelected && "group-hover:scale-105",
                        isSelected && "scale-110 blur-[2px]"
                      )} 
                      whileHover={{ scale: 1.05 }}
                    />
                    
                    <div className={cn(
                      "absolute inset-0 transition-opacity duration-300",
                      isSelected ? "bg-blue-500/20" : "bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100"
                    )} />
                    
                    {/* Selection Indicator & New Badge */}
                    <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
                      {isSelected ? (
                        <CheckCircle2 className="w-8 h-8 text-white fill-blue-500" />
                      ) : (
                        <Circle className="w-8 h-8 text-white/40 group-hover:text-white transition-colors" />
                      )}
                      {isNew && !isSelected && (
                        <Badge className="bg-primary text-primary-foreground font-black text-[8px] uppercase px-3 py-1 border-none animate-bounce">
                          NEW
                        </Badge>
                      )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                          <Badge className="w-fit bg-[#2563eb] text-white font-black uppercase text-[8px] tracking-widest rounded-lg px-3 py-1 border-none">
                            {wall.category || 'Sky'}
                          </Badge>
                          <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[150px]">
                            {wall.name || 'Sky Asset'}
                          </span>
                        </div>
                      </div>
                      
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(wall.imageUrl, wall.name);
                          }}
                          className="w-full rounded-2xl bg-white hover:bg-[#2563eb] hover:text-white text-black font-black uppercase text-[10px] tracking-widest h-12 transition-all shadow-xl"
                        >
                          <Download className="mr-2 w-4 h-4" />
                          Download
                        </Button>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <Footer />
    </main>
  );
}
