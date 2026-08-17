"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Cpu, 
  Download, 
  ExternalLink, 
  ChevronRight,
  ChevronLeft,
  Package,
  BookOpen,
  Zap,
  Loader2,
  X,
  Smartphone,
  LayoutGrid,
  Code,
  Activity,
  ShieldAlert,
  Video,
  Info,
  ChevronUp,
  Link as LinkIcon,
  Camera,
  Layers,
  Sparkles,
  Calendar,
  User as UserIcon,
  SlidersHorizontal,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase';
import { useSearch } from '@/context/SearchContext';
import { doc, increment, updateDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';
import { initializeFirebase } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { SiteSettings } from '@/lib/store';
import { cn } from '@/lib/utils';

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }
};

const convertDriveLink = (url: string) => {
  if (!url) return '';
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit|usp=sharing)?/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }
  return url;
};

const parseLinks = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/);
  return parts.map((part, i) => {
    const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      return (
        <a 
          key={i} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline font-semibold mx-1 inline-flex items-center"
        >
          {match[1]}
        </a>
      );
    }
    return part;
  });
};

const initiateDownload = async (db: any, auth: any, collectionName: string, id: string, url: string, name: string) => {
  if (!url) {
    toast({ variant: "destructive", title: "Download Unavailable", description: "Resource endpoint not found." });
    return;
  }
  
  try {
    if (db) {
      await updateDoc(doc(db, collectionName, id), {
        downloadCount: increment(1)
      });
    }
    if (auth?.currentUser && db) {
      logActivity(db, auth.currentUser.uid, `Downloaded ${name} from ${collectionName}`);
    }
  } catch (e) {
    console.error("Telemetry error:", e);
  }

  const optimizedUrl = convertDriveLink(url);
  const isDirectRegistry = url.includes('firebasestorage.googleapis.com') || url.includes('drive.google.com/uc');

  if (isDirectRegistry) {
    try {
      toast({ title: "Downloading Asset", description: "Streaming file to local storage..." });
      const response = await fetch(optimizedUrl);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const urlParts = url.split(/[?#]/)[0].split('.');
      const extension = urlParts.length > 1 ? urlParts.pop() : 'zip';
      link.download = `${name.split(`.${extension}`)[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Download Complete", description: "Resource saved successfully." });
      return;
    } catch (e) {
      window.open(optimizedUrl, '_blank');
      return;
    }
  }
  
  window.open(optimizedUrl, '_blank');
  toast({ title: "Redirecting to Mirror", description: "Opening download repository in new tab." });
};

// Shimmering Skeleton Loader
export const SkeletonLoader = ({ count = 3, type = 'card' }: { count?: number; type?: 'card' | 'module' | 'wallpaper' }) => (
  <div className={`grid gap-6 ${type === 'module' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : type === 'wallpaper' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-3xl border border-border/60 bg-card/40 p-6 space-y-4 animate-pulse">
        <div className="aspect-[16/10] w-full rounded-2xl bg-muted/60" />
        <div className="h-5 w-3/4 bg-muted/80 rounded-lg" />
        <div className="h-4 w-1/2 bg-muted/50 rounded-lg" />
        <div className="h-10 w-full bg-muted/60 rounded-2xl" />
      </div>
    ))}
  </div>
);

// Empty State Component
export const EmptyState = ({ title = "No items found", description = "Try changing your filters or searching for another term.", onReset }: { title?: string; description?: string; onReset?: () => void }) => (
  <div className="py-16 px-6 text-center rounded-3xl border border-border/60 bg-card/30 max-w-md mx-auto my-8">
    <div className="w-12 h-12 rounded-2xl bg-muted/60 border border-border/80 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
      <Cpu className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-foreground mb-1">{title}</h3>
    <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{description}</p>
    {onReset && (
      <Button onClick={onReset} variant="outline" size="sm" className="rounded-xl border-border text-xs">
        Clear All Filters
      </Button>
    )}
  </div>
);

// ==========================================
// ROM CARD & DETAILS MODAL
// ==========================================
export function ROMCard({ rom }: { rom: any }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const screenshots = Array.isArray(rom.screenshots) ? rom.screenshots : [];
  const hasScreenshots = screenshots.length > 0;
  const currentIndex = lightboxImage ? screenshots.indexOf(lightboxImage) : -1;

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasScreenshots) {
      const nextIdx = (currentIndex + 1) % screenshots.length;
      setLightboxImage(screenshots[nextIdx]);
    }
  };

  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasScreenshots) {
      const prevIdx = (currentIndex - 1 + screenshots.length) % screenshots.length;
      setLightboxImage(screenshots[prevIdx]);
    }
  };

  return (
    <>
      <motion.div layout variants={cardVariants} whileHover={{ y: -5 }} className="h-full">
        <Card 
          className="group relative border border-border/70 hover:border-primary/40 overflow-hidden rounded-3xl p-0 flex flex-col h-full bg-card hover:bg-card/90 shadow-sm hover:shadow-xl transition-all duration-300"
        >
          {/* Visual Banner Preview */}
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/40 flex items-center justify-center">
            {rom.imageUrl ? (
              <img 
                src={rom.imageUrl} 
                alt={rom.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50 p-6 text-center">
                <Camera className="w-8 h-8" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">Preview Available in Details</span>
              </div>
            )}

            {/* Top Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <Badge 
                variant="outline" 
                className="text-[10px] font-bold bg-background/80 backdrop-blur-md border-border/80 text-foreground px-2.5 py-0.5 rounded-full"
              >
                Android {rom.androidVersion || '14'}
              </Badge>
              {rom.isOfficial !== false && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border-emerald-500/30 px-2.5 py-0.5 rounded-full"
                >
                  Official
                </Badge>
              )}
            </div>

            {/* Bottom Gradient Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between text-white text-xs">
              <span className="text-[11px] font-semibold text-white/90">
                {rom.device || 'sky / sky_pro'}
              </span>
              <span className="text-[10px] font-mono text-white/70">
                {rom.downloadCount || 0} downloads
              </span>
            </div>
          </div>
          
          {/* Card Content */}
          <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                  {rom.name}
                </h3>
              </div>
              
              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                {parseLinks(rom.description) || 'High performance custom build optimized for Snapdragon 4 Gen 2.'}
              </div>

              {/* Maintainer & Date Tag */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium pt-2 border-t border-border/50">
                <span className="flex items-center gap-1.5 truncate">
                  <UserIcon className="w-3 h-3 text-primary shrink-0" />
                  <span className="truncate">{rom.maintainer || 'SkyHub Team'}</span>
                </span>
                {rom.releaseDate && (
                  <span className="flex items-center gap-1.5 text-muted-foreground/70 shrink-0">
                    <Calendar className="w-3 h-3" />
                    <span>{rom.releaseDate}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsDetailOpen(true)} 
                className="h-10 rounded-xl border-border/80 bg-background/50 hover:bg-muted text-xs font-semibold"
              >
                <span>View Details</span>
              </Button>

              <Button 
                size="sm"
                onClick={() => initiateDownload(db, auth, 'roms', rom.id, rom.downloadUrl, rom.name)} 
                className="h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Comprehensive ROM Details Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border glass bg-card/95 p-6 sm:p-8 shadow-2xl scrollbar-thin">
          <DialogHeader className="pb-4 border-b border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  {rom.name}
                  {rom.version && <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{rom.version}</span>}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Designed for {rom.device || 'Redmi 12 5G / Poco M6 Pro 5G (sky / sky_pro)'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Spec Matrix Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Android</span>
                <span className="text-sm font-bold text-foreground">{rom.androidVersion || '14'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Status</span>
                <span className="text-sm font-bold text-emerald-500">{rom.status || 'Official'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Maintainer</span>
                <span className="text-sm font-bold text-foreground truncate block">{rom.maintainer || 'Community'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Downloads</span>
                <span className="text-sm font-bold text-foreground">{rom.downloadCount || 0}</span>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About this Build</h4>
              <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap p-4 rounded-2xl bg-muted/20 border border-border/40">
                {parseLinks(rom.description) || 'Optimized custom build for daily usage with clean kernel tuning.'}
              </div>
            </div>

            {/* Screenshots Gallery */}
            {hasScreenshots && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary" /> Screenshot Gallery ({screenshots.length})
                  </h4>
                  <span className="text-[10px] text-muted-foreground">Click to inspect</span>
                </div>
                <ScrollArea className="w-full whitespace-nowrap rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <div className="flex gap-3">
                    {screenshots.map((src: string, idx: number) => (
                      <div 
                        key={idx} 
                        className="relative w-36 sm:w-44 aspect-[9/16] shrink-0 rounded-xl overflow-hidden border border-border/80 cursor-pointer group hover:scale-[1.02] transition-transform shadow-md"
                        onClick={() => { 
                          setLightboxImage(src); 
                          setIsLightboxOpen(true); 
                        }}
                      >
                        <img src={src} className="w-full h-full object-cover" alt={`Screenshot ${idx + 1}`} />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Maximize2 className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Downloads & Acquisition Protocols */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Acquisition & Mirrors</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => initiateDownload(db, auth, 'roms', rom.id, rom.downloadUrl, rom.name)} 
                  className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs uppercase tracking-wider shadow-md gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Primary ROM Package</span>
                </Button>

                {rom.mirrorUrl && (
                  <Button 
                    variant="outline"
                    onClick={() => initiateDownload(db, auth, 'roms', rom.id, rom.mirrorUrl, `${rom.name}-mirror`)} 
                    className="w-full h-11 rounded-2xl border-border/80 text-xs font-semibold gap-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Download from Secondary Mirror</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Fullscreen Lightbox */}
      <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
        <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-none bg-black/95 backdrop-blur-3xl overflow-hidden rounded-none shadow-none flex flex-col z-[110]">
          <div className="relative flex-1 w-full flex items-center justify-center p-4">
            <img 
              src={lightboxImage || undefined} 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
              alt="Screenshot Preview" 
            />
            
            {/* Close Button */}
            <Button 
              onClick={() => setIsLightboxOpen(false)} 
              className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 z-[120]" 
              variant="ghost" 
              size="icon"
            >
              <X className="w-5 h-5 text-white" />
            </Button>

            {/* Prev / Next Navigation Controls */}
            {hasScreenshots && screenshots.length > 1 && (
              <>
                <Button
                  onClick={handlePrevLightbox}
                  className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white z-[120]"
                  variant="ghost"
                  size="icon"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  onClick={handleNextLightbox}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white z-[120]"
                  variant="ghost"
                  size="icon"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ==========================================
// ROM GRID SECTION WITH FILTER BAR
// ==========================================
export function ROMGrid({ roms, isLoading }: { roms: any[], isLoading: boolean }) {
  const { searchQuery } = useSearch();
  const [selectedDevice, setSelectedDevice] = useState<string>('all');
  const [selectedVersion, setSelectedVersion] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'downloads' | 'name'>('newest');

  const filteredRoms = useMemo(() => {
    return (roms || []).filter(rom => {
      // Search filter
      const matchesSearch = !searchQuery || 
        (rom.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rom.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rom.maintainer || '').toLowerCase().includes(searchQuery.toLowerCase());

      // Device filter
      const matchesDevice = selectedDevice === 'all' || 
        (rom.device || '').toLowerCase().includes(selectedDevice.toLowerCase());

      // Version filter
      const matchesVersion = selectedVersion === 'all' || 
        String(rom.androidVersion) === String(selectedVersion);

      return matchesSearch && matchesDevice && matchesVersion;
    }).sort((a, b) => {
      if (sortBy === 'downloads') return (b.downloadCount || 0) - (a.downloadCount || 0);
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0; // default newest
    });
  }, [roms, searchQuery, selectedDevice, selectedVersion, sortBy]);

  const handleResetFilters = () => {
    setSelectedDevice('all');
    setSelectedVersion('all');
    setSortBy('newest');
  };

  return (
    <section id="roms" className="py-24 max-w-7xl mx-auto px-6 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
            <Cpu className="w-3.5 h-3.5" />
            <span>Custom ROM Repository</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Custom <span className="text-primary italic">ROMs</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Clean AOSP, Lineage, Evolution X, and Pixel Experience ports optimized for Snapdragon 4 Gen 2.
          </p>
        </div>

        {/* Quick Count Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3.5 py-1.5 rounded-full text-xs font-semibold border-border/80 bg-card/60">
            {filteredRoms.length} {filteredRoms.length === 1 ? 'Build' : 'Builds'} Ready
          </Badge>
        </div>
      </div>

      {/* Interactive Filter Bar */}
      <div className="p-4 rounded-3xl glass bg-card/60 border border-border/80 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Device Filter */}
          <Select value={selectedDevice} onValueChange={setSelectedDevice}>
            <SelectTrigger className="w-[180px] h-10 rounded-2xl bg-background/60 border-border text-xs font-medium">
              <SelectValue placeholder="All Devices" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl bg-card border-border">
              <SelectItem value="all">All Devices</SelectItem>
              <SelectItem value="sky">Redmi 12 5G (sky)</SelectItem>
              <SelectItem value="sky_pro">Poco M6 Pro 5G (sky_pro)</SelectItem>
            </SelectContent>
          </Select>

          {/* Android Version Filter */}
          <Select value={selectedVersion} onValueChange={setSelectedVersion}>
            <SelectTrigger className="w-[150px] h-10 rounded-2xl bg-background/60 border-border text-xs font-medium">
              <SelectValue placeholder="Android Version" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl bg-card border-border">
              <SelectItem value="all">All Androids</SelectItem>
              <SelectItem value="16">Android 16</SelectItem>
              <SelectItem value="15">Android 15</SelectItem>
              <SelectItem value="14">Android 14</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">Sort:</span>
          <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
            <SelectTrigger className="w-[160px] h-10 rounded-2xl bg-background/60 border-border text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl bg-card border-border">
              <SelectItem value="newest">Latest Uploads</SelectItem>
              <SelectItem value="downloads">Most Downloaded</SelectItem>
              <SelectItem value="name">Alphabetical (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid or States */}
      {isLoading ? (
        <SkeletonLoader count={6} type="card" />
      ) : filteredRoms.length === 0 ? (
        <EmptyState 
          title="No Custom ROMs match your filters" 
          description="Try selecting 'All Devices' or searching for another term."
          onReset={handleResetFilters}
        />
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.06 }}
        >
          {filteredRoms.map((rom) => (
            <ROMCard key={rom.id} rom={rom} />
          ))}
        </motion.div>
      )}
    </section>
  );
}

// ==========================================
// MODULES SECTION & CARDS
// ==========================================
function ModuleCard({ mod }: { mod: any }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }} className="h-full">
      <Card className="glass border-border/80 hover:border-accent/50 p-6 rounded-3xl flex flex-col justify-between h-full bg-card/70 hover:bg-card/90 transition-all duration-300 shadow-sm hover:shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {mod.downloadCount || 0} DL
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1 truncate">{mod.name}</h3>
            <div className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap", !isExpanded ? "line-clamp-2" : "")}>
              {parseLinks(mod.description)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="text-[11px] font-semibold text-muted-foreground h-8 px-2.5 rounded-lg hover:text-foreground"
          >
            {isExpanded ? 'Less' : 'Details'}
          </Button>

          <Button 
            onClick={() => initiateDownload(db, auth, 'modules', mod.id, mod.downloadUrl, mod.name)} 
            size="sm" 
            className="h-9 px-4 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function ModuleGrid({ modules, isLoading }: { modules: any[], isLoading: boolean }) {
  return (
    <section id="modules" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-accent/20 text-accent text-xs font-semibold tracking-wider uppercase mb-4">
            <Package className="w-3.5 h-3.5" />
            <span>Magisk & KernelSU</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            System <span className="text-accent italic">Modules</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Kernel tweaks, audio enhancements, thermal mod patches, and visual UI customizations.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={4} type="module" />
      ) : modules.length === 0 ? (
        <EmptyState title="No modules available" description="Modules will appear here once uploaded." />
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.05 }}
        >
          {modules.map((mod) => <ModuleCard key={mod.id} mod={mod} />)}
        </motion.div>
      )}
    </section>
  );
}

// ==========================================
// RECOVERIES SECTION & CARDS
// ==========================================
function RecoveryCard({ recovery }: { recovery: any }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }} className="h-full">
      <Card className="glass border-border/80 hover:border-orange-500/50 p-6 rounded-3xl flex flex-col justify-between h-full bg-card/70 hover:bg-card/90 transition-all duration-300 shadow-sm hover:shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {recovery.downloadCount || 0} DL
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1 truncate">{recovery.name}</h3>
            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
              {parseLinks(recovery.description)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-4">
          <span className="text-[11px] font-semibold text-muted-foreground">IMG / ZIP</span>
          <Button 
            onClick={() => initiateDownload(db, auth, 'recoveries', recovery.id, recovery.downloadUrl, recovery.downloadFileName || recovery.name)} 
            size="sm" 
            className="h-9 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function RecoveryGrid({ recoveries, isLoading }: { recoveries: any[], isLoading: boolean }) {
  return (
    <section id="recoveries" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-orange-500/20 text-orange-500 text-xs font-semibold tracking-wider uppercase mb-4">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Recovery Environment</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Custom <span className="text-orange-500 italic">Recoveries</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Official TWRP, OrangeFox, and PBRP images with full FBE v2 decryption support for Snapdragon 4 Gen 2.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={4} type="module" />
      ) : recoveries.length === 0 ? (
        <EmptyState title="No custom recoveries found" description="Recoveries will appear here once added." />
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.05 }}
        >
          {recoveries.map((rec) => <RecoveryCard key={rec.id} recovery={rec} />)}
        </motion.div>
      )}
    </section>
  );
}

// ==========================================
// MOD APKS SECTION & CARDS
// ==========================================
function ModApkCard({ apk }: { apk: any }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }} className="h-full">
      <Card className="glass border-border/80 hover:border-emerald-500/50 p-6 rounded-3xl flex flex-col justify-between h-full bg-card/70 hover:bg-card/90 transition-all duration-300 shadow-sm hover:shadow-xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {apk.imageUrl ? (
              <img src={apk.imageUrl} alt={apk.name} className="w-12 h-12 rounded-2xl object-cover border border-border/60" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <Smartphone className="w-6 h-6" />
              </div>
            )}
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
              {apk.downloadCount || 0} DL
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground mb-1 truncate">{apk.name}</h3>
            <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {parseLinks(apk.description)}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 flex items-center justify-between gap-2 mt-4">
          <span className="text-[11px] font-semibold text-muted-foreground">APK Application</span>
          <Button 
            onClick={() => initiateDownload(db, auth, 'mod-apks', apk.id, apk.downloadUrl, apk.downloadFileName || apk.name)} 
            size="sm" 
            className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}

export function ModApkGrid({ apks, isLoading }: { apks: any[], isLoading: boolean }) {
  return (
    <section id="rooted-apks" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-emerald-500/20 text-emerald-500 text-xs font-semibold tracking-wider uppercase mb-4">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Root & Enhanced Tools</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Modded <span className="text-emerald-500 italic">APKs</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            System utilities, custom camera tools (GCam & Leica), and root application managers.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={4} type="module" />
      ) : apks.length === 0 ? (
        <EmptyState title="No modded APKs found" description="APKs will appear here once added." />
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.05 }}
        >
          {apks.map((apk) => <ModApkCard key={apk.id} apk={apk} />)}
        </motion.div>
      )}
    </section>
  );
}

// ==========================================
// ROOT PROTOCOLS SECTION
// ==========================================
export function RootGrid({ packages, isLoading }: { packages: any[], isLoading: boolean }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();

  return (
    <section id="root" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Boot & Kernel Protocols</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Root <span className="text-primary italic">Protocols</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Automated and manual root toolkits, init_boot patch instructions, and KernelSU guides.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={2} type="card" />
      ) : packages.length === 0 ? (
        <EmptyState title="No root packages available" />
      ) : (
        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-2 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.06 }}
        >
          {packages.map((pkg) => (
            <motion.div key={pkg.id} variants={cardVariants} whileHover={{ y: -4 }}>
              <Card className="glass border-border/80 p-6 sm:p-8 rounded-3xl bg-card/70 hover:bg-card/90 transition-all shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-border/50">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                      <span className="text-xs text-muted-foreground">{pkg.downloadCount || 0} Downloads</span>
                    </div>
                  </div>

                  <Button 
                    onClick={() => initiateDownload(db, auth, 'root-packages', pkg.id, pkg.downloadUrl, pkg.name)} 
                    className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    <span>Get Package</span>
                  </Button>
                </div>

                {pkg.steps && pkg.steps.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="steps" className="border-none">
                      <AccordionTrigger className="text-xs font-bold uppercase tracking-wider text-muted-foreground py-1 hover:no-underline">
                        Installation Steps ({pkg.steps.length})
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2.5 pt-3">
                          {pkg.steps.map((step: string, i: number) => (
                            <div key={i} className="flex gap-3 items-start text-xs text-muted-foreground p-2.5 rounded-xl bg-muted/30">
                              <span className="font-bold text-primary shrink-0">{i + 1}.</span>
                              <div className="leading-relaxed whitespace-pre-wrap">{parseLinks(step)}</div>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

// ==========================================
// GUIDES & TUTORIALS LIST
// ==========================================
export function GuideGrid({ guides, isLoading }: { guides: any[], isLoading: boolean }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-foreground">Guides & Tutorials</h3>
        </div>
        <Link href="/guides">
          <Button variant="ghost" size="sm" className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl">
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-2xl bg-card/50 animate-pulse border border-border" />)}
        </div>
      ) : guides.length === 0 ? (
        <EmptyState title="No guides published yet" />
      ) : (
        <div className="space-y-3">
          {guides.slice(0, 4).map((guide) => (
            <Link key={guide.id} href={`/guides#${guide.id}`}>
              <Card className="p-4 sm:p-5 rounded-2xl border border-border/80 hover:border-primary/40 glass bg-card/60 hover:bg-card/90 transition-all flex items-center justify-between group cursor-pointer shadow-sm">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {guide.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {guide.category || 'General Guide'} • Read Step-by-Step
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all shrink-0" />
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// REQUEST PORT FORM
// ==========================================
export function RequestROM() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variant, setVariant] = useState('sky');
  const db = useFirestore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('variant', variant);
    
    try {
      const response = await fetch("https://formspree.io/f/xgvzvelv", { 
        method: "POST", 
        body: formData, 
        headers: { 'Accept': 'application/json' } 
      });
      if (response.ok) { 
        toast({ title: "Request Sent", description: "Your port request has been registered with maintainers." }); 
        form.reset(); 
      } else { 
        throw new Error("Failed to send"); 
      }
    } catch (error) { 
      toast({ variant: "destructive", title: "Error submitting request", description: "Please try again later." }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-2">
          <Code className="w-3.5 h-3.5" />
          <span>Community Request</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-black text-foreground">Request a ROM</h3>
      </div>

      <Card className="p-6 rounded-3xl glass border border-border/80 bg-card/60 shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">ROM Name & Source</label>
            <Input name="rom_name" placeholder="e.g. crDroid 10 / RisingOS" className="h-11 rounded-xl bg-background/60 text-xs" required />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Target Device</label>
            <Select value={variant} onValueChange={setVariant}>
              <SelectTrigger className="h-11 rounded-xl bg-background/60 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl bg-card border-border">
                <SelectItem value="sky">Redmi 12 5G (sky)</SelectItem>
                <SelectItem value="sky_pro">Poco M6 Pro 5G (sky_pro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Source / Kernel Details</label>
            <Textarea name="specifications" placeholder="Include official source links or kernel requirements..." className="min-h-[100px] rounded-xl bg-background/60 text-xs" required />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl uppercase tracking-wider">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            <span>Submit Port Request</span>
          </Button>
        </form>
      </Card>
    </div>
  );
}

// ==========================================
// LIVE WALLPAPERS & CUSTOM RESOURCE GRIDS
// ==========================================
export function LiveWallpaperGrid({ wallpapers, isLoading }: { wallpapers: any[], isLoading: boolean }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();

  return (
    <section id="live-wallpapers" className="py-24 max-w-7xl mx-auto px-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-purple-500/20 text-purple-500 text-xs font-semibold tracking-wider uppercase mb-4">
            <Video className="w-3.5 h-3.5" />
            <span>Animated Assets</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
            Live <span className="text-purple-500 italic">Visuals</span>
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2 max-w-xl">
            Live wallpapers and video boot animations optimized for 120Hz Snapdragon panels.
          </p>
        </div>
      </div>

      {isLoading ? (
        <SkeletonLoader count={4} type="wallpaper" />
      ) : wallpapers?.length === 0 ? (
        <EmptyState title="No live wallpapers available" />
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.05 }}
        >
          {wallpapers?.map((wall) => (
            <motion.div key={wall.id} variants={cardVariants} whileHover={{ y: -5 }}>
              <Card className="glass border-border/80 p-0 rounded-3xl overflow-hidden flex flex-col h-full bg-card shadow-sm hover:shadow-xl transition-all">
                <div className="relative aspect-[9/16] w-full bg-background/50 overflow-hidden flex items-center justify-center">
                  {(wall.previewUrl || wall.imageUrl) ? (
                    <img src={wall.previewUrl || wall.imageUrl} alt="Live" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground/40 p-4 text-center">
                      <Video className="w-8 h-8" />
                      <span className="text-[10px] font-semibold">Video Preview</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-5 text-white">
                    <h3 className="text-base font-bold text-white mb-1 truncate">{wall.name || "Live Visual"}</h3>
                    <span className="text-[10px] text-white/70 mb-3">{wall.downloadCount || 0} Downloads</span>
                    <Button 
                      onClick={() => initiateDownload(db, auth, 'live-wallpapers', wall.id, wall.downloadUrl, wall.name)} 
                      size="sm"
                      className="w-full h-10 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      <span>Download</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

export function CustomGrid({ section, items, isLoading }: { section: any, items: any[], isLoading?: boolean }) {
  const db = useFirestore();
  const { auth } = initializeFirebase();

  return (
    <section id={`custom-${section.id}`} className="py-24 max-w-7xl mx-auto px-6">
      <div className="mb-12">
        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground" style={{ color: section.color || 'inherit' }}>
          {section.label}
        </h2>
      </div>

      {isLoading ? (
        <SkeletonLoader count={3} type="card" />
      ) : items.length === 0 ? (
        <EmptyState title={`No ${section.label} items found`} />
      ) : (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }} 
          transition={{ staggerChildren: 0.05 }}
        >
          {items.map((item) => (
            <motion.div key={item.id} variants={cardVariants} whileHover={{ y: -5 }}>
              <Card className="glass border-border/80 p-0 rounded-3xl overflow-hidden flex flex-col h-full bg-card shadow-sm hover:shadow-xl transition-all">
                <div className="relative aspect-video w-full overflow-hidden bg-muted/40 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Layers className="w-8 h-8 text-muted-foreground/30" />
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1 justify-between space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-foreground mb-1 truncate">{item.name}</h3>
                    <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {parseLinks(item.description)}
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button 
                      onClick={() => initiateDownload(db, auth, section.id, item.id, item.downloadUrl, item.name)} 
                      className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      <span>Download Resource</span>
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
