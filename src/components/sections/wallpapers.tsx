"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Library, Loader2, FileArchive, CheckSquare, Square, Circle, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import JSZip from 'jszip';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function Wallpapers({ wallpapers, isLoading }: { wallpapers: any[], isLoading: boolean }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isZipLoading, setIsZipLoading] = useState(false);

  const isNewAsset = (createdAt: any) => {
    if (!createdAt) return false;
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    // 24 Hour Threshold: 24 * 60 * 60 * 1000 ms
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
    const visibleWallpapers = wallpapers.slice(0, 4);
    if (selectedIds.size === visibleWallpapers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleWallpapers.map(w => w.id)));
    }
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${name.replace(/\s+/g, '-').toLowerCase() || 'skyhub-wallpaper'}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Asset Saved", description: "Wallpaper added to your library." });
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  const handleBulkDownload = async () => {
    const itemsToDownload = selectedIds.size > 0 
      ? wallpapers?.filter(w => selectedIds.has(w.id)) 
      : wallpapers.slice(0, 4);

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
        const fileName = `SkyHub Wallo ${i + 1}.jpg`;
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
      : wallpapers.slice(0, 4);

    if (!itemsToZip || itemsToZip.length === 0) return;
    
    setIsZipLoading(true);
    const zip = new JSZip();
    const folder = zip.folder("sky-wallpapers");

    toast({ 
      title: "Archiving Started", 
      description: `Compressing ${itemsToZip.length} selected assets into a single ZIP terminal.` 
    });

    try {
      for (let i = 0; i < itemsToZip.length; i++) {
        const wall = itemsToZip[i];
        try {
          const response = await fetch(wall.imageUrl);
          if (!response.ok) throw new Error('Fetch error');
          const blob = await response.blob();
          const fileName = `SkyHub Wallo ${i + 1}.jpg`;
          folder?.file(fileName, blob);
        } catch (itemError) {
          console.warn(`Registry skip: Node ${i+1} failed to archive.`, itemError);
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const blobUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `SkyHub-Wallo-Bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast({ title: "Archive Ready", description: "ZIP protocol synchronized successfully." });
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

  if (isLoading) {
    return (
      <section id="wallpapers" className="py-20 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-white/10 border-t-white rounded-full animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Visuals...</p>
        </div>
      </section>
    );
  }

  const visibleWallpapers = wallpapers.slice(0, 4);
  const hasNewWallpapers = visibleWallpapers.some(w => isNewAsset(w.createdAt));

  return (
    <section id="wallpapers" className="py-20 max-w-7xl mx-auto px-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 mb-12">
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {hasNewWallpapers && (
            <motion.div 
              className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] mb-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Sparkles className="w-3 h-3" />
              NEWLY ADDED PROTOCOLS
            </motion.div>
          )}
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-foreground">SKY <span className="text-[#2563eb]">WALLPAPERS</span></h2>
          <p className="text-muted-foreground">High fidelity visual assets for Sky devices.</p>
        </motion.div>
        
        <motion.div 
          className="flex flex-wrap items-center gap-4 w-full sm:w-auto"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
        >
          {wallpapers.length > 0 && (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outline"
                  onClick={handleSelectAll}
                  className="h-10 px-4 rounded-xl border-white/10 bg-white/5 text-foreground font-black uppercase text-[9px] tracking-widest gap-2"
                >
                  {selectedIds.size === visibleWallpapers.length ? <CheckSquare className="w-3.5 h-3.5 text-blue-500" /> : <Square className="w-3.5 h-3.5" />}
                  {selectedIds.size === visibleWallpapers.length ? 'Deselect All' : 'Select All'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleZipDownload} 
                  disabled={isZipLoading || isBulkDownloading}
                  variant="outline" 
                  className="h-10 px-6 rounded-xl border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/10 font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  {isZipLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileArchive className="w-3.5 h-3.5" />}
                  Download ZIP {selectedIds.size > 0 ? `(${selectedIds.size})` : 'Archive'}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  onClick={handleBulkDownload} 
                  disabled={isBulkDownloading || isZipLoading}
                  variant="outline" 
                  className="h-10 px-6 rounded-xl border-[#2563eb] text-[#2563eb] hover:bg-[#2563eb]/10 font-black uppercase text-[10px] tracking-widest gap-2"
                >
                  {isBulkDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Library className="w-3.5 h-3.5" />}
                  Bulk Sync {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
                </Button>
              </motion.div>
            </>
          )}
          <Link href="/wallpapers">
            <Button variant="link" className="text-foreground font-bold uppercase tracking-widest text-[10px] hover:text-[#2563eb] h-10 px-0">Browse All</Button>
          </Link>
        </motion.div>
      </div>

      {wallpapers.length === 0 ? (
        <div className="py-32 text-center border border-dashed border-white/10 rounded-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">Empty Repository</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleWallpapers.map((wall, idx) => {
            const isSelected = selectedIds.has(wall.id);
            const isNew = isNewAsset(wall.createdAt);
            
            return (
              <motion.div 
                key={wall.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  onClick={() => toggleSelection(wall.id)}
                  className={cn(
                    "relative group aspect-[9/16] overflow-hidden rounded-[2.5rem] bg-[#0a0a0a] border-white/10 cursor-pointer transition-all duration-300",
                    isSelected ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-background" : "hover:border-blue-500/50"
                  )}
                >
                  <motion.img 
                    src={wall.imageUrl} 
                    alt="Wallpaper" 
                    className={cn(
                      "object-cover w-full h-full transition-transform duration-700",
                      !isSelected && "group-hover:scale-105",
                      isSelected && "scale-105 blur-[1px]"
                    )} 
                    whileHover={{ scale: 1.05 }}
                  />
                  <div className={cn(
                    "absolute inset-0 transition-opacity duration-300",
                    isSelected ? "bg-blue-500/10" : "bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100"
                  )} />

                  {/* Selection Indicator */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                    {isSelected ? (
                      <CheckCircle2 className="w-6 h-6 text-white fill-blue-500" />
                    ) : (
                      <Circle className="w-6 h-6 text-white/40 group-hover:text-white transition-colors" />
                    )}
                    {isNew && !isSelected && (
                      <Badge className="bg-primary text-primary-foreground font-black text-[7px] uppercase px-2 py-0.5 border-none animate-bounce">
                        NEW
                      </Badge>
                    )}
                  </div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-[#2563eb] text-white font-black uppercase text-[8px] tracking-widest rounded-lg px-3 py-1 border-none">
                        {wall.category || 'Sky'}
                      </Badge>
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
    </section>
  );
}
