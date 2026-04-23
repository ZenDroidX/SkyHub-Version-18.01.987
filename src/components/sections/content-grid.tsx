
"use client";

import React, { useState, useEffect } from 'react';
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
  Package,
  BookOpen,
  Zap,
  Loader2,
  X,
  ChevronLeft,
  Maximize2,
  Smartphone,
  LayoutGrid,
  Code,
  Activity,
  ShieldAlert,
  Video,
  Cloud,
  Info,
  ChevronUp,
  Link as LinkIcon,
  Camera,
  Layers
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
import { useCollection, useMemoFirebase, useFirestore, useDoc } from '@/firebase';
import { useSearch } from '@/context/SearchContext';
import { collection, doc, increment, updateDoc } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';
import { initializeFirebase } from '@/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const { auth } = initializeFirebase();

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const ICON_REGISTRY: Record<string, React.ReactNode> = {
  'Zap': <Zap className="w-6 h-6" />,
  'Package': <Package className="w-6 h-6" />,
  'Cpu': <Cpu className="w-6 h-6" />,
  'LayoutGrid': <LayoutGrid className="w-6 h-6" />,
  'Smartphone': <Smartphone className="w-6 h-6" />,
  'ShieldAlert': <ShieldAlert className="w-6 h-6" />,
  'Activity': <Activity className="w-6 h-6" />,
  'Code': <Code className="w-6 h-6" />,
  'Video': <Video className="w-6 h-6" />,
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
          className="text-blue-600 hover:text-blue-500 font-bold underline transition-colors mx-1 inline-flex items-center"
        >
          {match[1]}
        </a>
      );
    }
    return part;
  });
};


const initiateDownload = async (db: any, collectionName: string, id: string, url: string, name: string) => {
  if (!url) {
    toast({ variant: "destructive", title: "Acquisition Halted", description: "Remote resource endpoint is null or undefined." });
    return;
  }
  
  try {
    // Increment download count
    await updateDoc(doc(db, collectionName, id), {
      downloadCount: increment(1)
    });
    
    // Log Activity
    if (auth.currentUser) {
      logActivity(db, auth.currentUser.uid, `Downloaded ${name} from ${collectionName}`);
    }
  } catch (e) {
    console.error("Neural telemetry error:", e);
  }

  const optimizedUrl = convertDriveLink(url);
  const isDirectRegistry = url.includes('firebasestorage.googleapis.com') || url.includes('drive.google.com/uc');

  if (isDirectRegistry) {
    try {
      toast({ title: "Neural Link Established", description: "Streaming binary data to local buffer..." });
      const response = await fetch(optimizedUrl);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const urlParts = url.split(/[?#]/)[0].split('.');
      const extension = urlParts.length > 1 ? urlParts.pop() : 'apk';
      link.download = `${name.split(`.${extension}`)[0]}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Protocol Success", description: "Resource acquisition completed." });
      return;
    } catch (e) {
      window.open(optimizedUrl, '_blank');
      toast({ title: "External Handover", description: "Redirecting to primary mirror." });
      return;
    }
  }
  
  window.open(optimizedUrl, '_blank');
  toast({ title: "Mirror Redirect", description: "Relaying request to external repository." });
};

const LoadingState = ({ label }: { label: string }) => (
  <div className="py-20 flex flex-col items-center gap-4">
    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
  </div>
);

export function ROMCard({ rom }: { rom: any }) {
  const db = useFirestore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async (id: string, url: string, name: string) => {
    setIsDownloading(true);
    try {
      await initiateDownload(db, 'roms', id, url, name);
    } finally {
      setIsDownloading(false);
    }
  };
  
  const screenshots = Array.isArray(rom.screenshots) ? rom.screenshots : [];
  const hasScreenshots = screenshots.length > 0;
  const currentIndex = selectedImage ? screenshots.indexOf(selectedImage) : -1;

  const handleOpenGallery = () => {
    if (hasScreenshots) {
      setSelectedImage(screenshots[0]);
      setIsPreviewOpen(true);
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasScreenshots) {
      const nextIdx = (currentIndex + 1) % screenshots.length;
      setSelectedImage(screenshots[nextIdx]);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (hasScreenshots) {
      const prevIdx = (currentIndex - 1 + screenshots.length) % screenshots.length;
      setSelectedImage(screenshots[prevIdx]);
    }
  };

  return (
    <motion.div layout variants={cardVariants} whileHover={{ y: -5 }}>
      <Card 
        className="group relative border border-border/50 overflow-hidden rounded-[3rem] p-0 flex flex-col h-full bg-card shadow-lg hover:shadow-2xl transition-all duration-300"
        style={{ 
          background: rom.gradient ? rom.gradient : "var(--card)",
        }}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-background/50">
          <img 
            src={rom.imageUrl || `https://picsum.photos/seed/${rom.id}/800/600`} 
            alt={rom.name} 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 scale-105 group-hover:scale-100" 
          />
          <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
             <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px] font-black bg-black/40 backdrop-blur-sm border-white/10 uppercase tracking-widest text-white px-3 py-1 rounded-full">
                  ANDROID {rom.androidVersion || '14'}
                </Badge>
                <Badge variant="secondary" className="text-[9px] font-black bg-black/40 backdrop-blur-sm border-white/10 uppercase tracking-widest text-white px-3 py-1 rounded-full">
                  {rom.downloadCount || 0} DOWNLOADS
                </Badge>
             </div>
          </div>
        </div>
        
        <div className="p-8 flex flex-col flex-1">
          <h3 className="text-2xl font-black uppercase mb-4 tracking-tight text-foreground">{rom.name}</h3>
          
          <div className={cn(
            "text-sm text-foreground/70 transition-all duration-300 whitespace-pre-wrap leading-relaxed flex-1", 
            !isExpanded ? "line-clamp-3 mb-6" : "mb-6"
          )}>
            {parseLinks(rom.description)}
          </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-8 pt-8 border-t border-white/10 space-y-8">
                  {hasScreenshots && (
                    <div className="space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary/80">System Screenshots</p>
                      <ScrollArea className="w-full whitespace-nowrap rounded-3xl border border-white/10 bg-black/20 p-6">
                        <div className="flex gap-4">
                          {screenshots?.map((src: string, idx: number) => (
                            <div key={idx} className="relative w-56 aspect-[9/16] shrink-0 rounded-3xl overflow-hidden border border-white/10 cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => { setSelectedImage(src); setIsPreviewOpen(true); }}>
                              <img src={src} className="w-full h-full object-cover" alt="SC" />
                            </div>
                          ))}
                        </div>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-2">
                    <Button 
                      variant="outline" 
                      disabled={isDownloading}
                      onClick={() => handleDownload(rom.id, rom.downloadUrl, rom.name)} 
                      className="w-full h-12 justify-start px-6 rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase gap-4 hover:bg-white/10"
                    >
                      {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />} 
                      {isDownloading ? 'Acquiring...' : 'Primary Acquisition Protocol'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

           <div className="mt-auto space-y-3">
             <Button 
                variant="outline" 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full h-10 rounded-full border border-border bg-background/50 text-[10px] uppercase font-bold tracking-widest hover:bg-muted"
             >
               {isExpanded ? 'Show Less' : 'Read Details'}
             </Button>
             <Button 
                onClick={() => handleDownload(rom.id, rom.downloadUrl, rom.name)} 
                disabled={isDownloading}
                className="w-full h-12 rounded-full bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-widest shadow-md hover:scale-[1.02] active:scale-[0.98] transition-transform"
             >
               {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
               {isDownloading ? 'Syncing...' : 'Download ROM'}
             </Button>
          </div>
      </Card>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-none bg-black/95 backdrop-blur-3xl overflow-hidden rounded-none shadow-none flex flex-col">
            <div className="relative flex-1 w-full flex items-center justify-center p-4">
              <img src={selectedImage || ''} className="max-w-full max-h-full object-contain rounded-2xl" alt="Preview" />
              <Button onClick={() => setIsPreviewOpen(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 z-[60]" variant="ghost" size="icon">
                <X className="w-6 h-6 text-white" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

export function ROMGrid({ roms, isLoading }: { roms: any[], isLoading: boolean }) {
  const { searchQuery } = useSearch();
  const filteredRoms = roms.filter(rom => 
    (rom.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rom.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (isLoading) return <LoadingState label="Scanning ROM Registry..." />;
  return (
    <section id="roms" className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20">CUSTOM <span className="text-muted-foreground/40 italic">ROMs</span></h2>
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {filteredRoms.map((rom) => <ROMCard key={rom.id} rom={rom} />)}
      </motion.div>
    </section>
  );
}

function ModuleCard({ mod }: { mod: any }) {
  const db = useFirestore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await initiateDownload(db, 'modules', mod.id, mod.downloadUrl, mod.name);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
      <Card className="glass border-border p-8 rounded-[2.5rem] hover:bg-card/20 flex flex-col justify-between h-full transition-all">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6"><Package className="w-5 h-5" /></div>
          <h3 className="font-black text-lg mb-2 uppercase text-foreground">{mod.name}</h3>
          <div className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap", !isExpanded ? "line-clamp-2 mb-6" : "mb-6")}>{parseLinks(mod.description)}</div>
          <div className="text-[9px] font-black uppercase text-muted-foreground mb-4">{mod.downloadCount || 0} DOWNLOADS</div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)} className="text-[8px] font-black uppercase text-muted-foreground">{isExpanded ? 'LESS' : 'MORE'}</Button>
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button 
              onClick={handleDownload} 
              disabled={isDownloading}
              size="icon" 
              className="w-10 h-10 rounded-xl bg-primary"
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </Button>
          </motion.div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ModuleGrid({ modules, isLoading }: { modules: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Acquiring Modules..." />;
  return (
    <section id="modules" className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20">MODULE</h2>
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {modules.map((mod) => <ModuleCard key={mod.id} mod={mod} />)}
      </motion.div>
    </section>
  );
}

function ModApkCard({ apk }: { apk: any }) {
  const db = useFirestore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await initiateDownload(db, 'mod-apks', apk.id, apk.downloadUrl, apk.downloadFileName || apk.name);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
      <Card className="glass border-border p-0 rounded-[3rem] overflow-hidden flex flex-col h-full transition-all">
        <div className="p-6">
          <div className="relative aspect-square w-full bg-muted/20 flex items-center justify-center rounded-[2.5rem] overflow-hidden border border-border/10 p-10">
            <img src={apk.imageUrl || `https://picsum.photos/seed/${apk.id}/400/400`} alt={apk.name} className="max-w-full max-h-full object-contain drop-shadow-2xl" />
          </div>
        </div>
        <div className="px-8 pb-8 flex flex-col flex-1">
          <h3 className="text-lg font-black uppercase tracking-tight text-foreground mb-4 truncate">{apk.name}</h3>
          <div className={cn("text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap", !isExpanded ? "line-clamp-2 mb-6" : "mb-6")}>{parseLinks(apk.description)}</div>
          <div className="text-[9px] font-black uppercase text-muted-foreground mb-4">{apk.downloadCount || 0} DOWNLOADS</div>
          <div className="mt-auto flex gap-3">
            <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="w-full h-12 rounded-2xl bg-primary font-black uppercase text-[10px]"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDownloading ? 'Acquiring...' : 'Download'}
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button variant="outline" onClick={() => setIsExpanded(!isExpanded)} className={cn("w-12 h-12 rounded-2xl", isExpanded && "bg-primary text-white")}>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function ModApkGrid({ apks, isLoading }: { apks: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Scanning Modded Registry..." />;
  return (
    <section id="rooted-apks" className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20">MOD <span className="text-red-600">APKs</span></h2>
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {apks.map((apk) => <ModApkCard key={apk.id} apk={apk} />)}
      </motion.div>
    </section>
  );
}

function RootCard({ pkg }: { pkg: any }) {
  const db = useFirestore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await initiateDownload(db, 'root-packages', pkg.id, pkg.downloadUrl, pkg.name);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
      <Card className="glass border-border p-10 rounded-[3rem] transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Zap className="w-7 h-7" /></div>
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">{pkg.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="text-[9px] font-black uppercase text-muted-foreground">{pkg.downloadCount || 0} DOWNLOADS</div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="rounded-xl bg-primary h-12 px-6 text-[10px] font-black uppercase"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDownloading ? 'Acquiring...' : 'Get Package'}
              </Button>
            </motion.div>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="steps" className="border-border">
            <AccordionTrigger className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-2">Installation Steps</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-4">
                {pkg.steps?.map((step: string, i: number) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-xs font-black text-primary">{i + 1}.</span>
                    <div className="text-xs text-muted-foreground whitespace-pre-wrap">{parseLinks(step)}</div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>
    </motion.div>
  );
}

export function RootGrid({ packages, isLoading }: { packages: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Retrieving Root Protocols..." />;
  return (
    <section id="root" className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20">ROOT <span className="text-blue-600">PROTOCOL</span></h2>
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {packages.map((pkg) => <RootCard key={pkg.id} pkg={pkg} />)}
      </motion.div>
    </section>
  );
}

export function CustomGrid({ section, items, isLoading }: { section: any, items: any[], isLoading?: boolean }) {
  const db = useFirestore();
  if (isLoading) return <LoadingState label={`Scanning ${section.label} Registry...`} />;
  return (
    <section id={`custom-${section.id}`} className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20" style={{ color: section.color || 'inherit' }}>{section.label}</h2>
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {items.map((item) => (
          <motion.div key={item.id} variants={cardVariants} whileHover={{ y: -5 }}>
            <Card className="glass border-border p-0 rounded-[3rem] overflow-hidden flex flex-col h-full transition-all">
              <div className="relative aspect-video w-full overflow-hidden">
                <img src={item.imageUrl || `https://picsum.photos/seed/${item.id}/800/600`} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-4">{item.name}</h3>
                <div className="text-xs text-muted-foreground mb-4 line-clamp-3 whitespace-pre-wrap">{parseLinks(item.description)}</div>
                <div className="text-[9px] font-black uppercase text-muted-foreground mb-8">{item.downloadCount || 0} DOWNLOADS</div>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Button onClick={() => initiateDownload(db, section.id, item.id, item.downloadUrl, item.name)} className="w-full h-12 rounded-xl bg-primary font-black uppercase text-[10px]">Synchronize</Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

export function GuideGrid({ guides, isLoading }: { guides: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Scanning Knowledge Base..." />;
  return (
    <div className="space-y-12">
      <h2 className="text-4xl font-black uppercase tracking-tighter text-foreground">GUIDES</h2>
      <motion.div className="grid grid-cols-1 gap-4" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {guides.slice(0, 5).map((guide) => (
          <motion.div key={guide.id} variants={cardVariants} whileHover={{ x: 5 }}>
            <Link href={`/guides#${guide.id}`}>
              <Card className="glass border-border p-6 rounded-[1.5rem] group cursor-pointer flex items-center justify-between transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground group-hover:text-primary transition-all"><BookOpen className="w-5 h-5" /></div>
                  <h3 className="text-base font-black uppercase tracking-tight text-foreground">{guide.title}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all" />
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function WallpaperCard({ wall }: { wall: any }) {
  const db = useFirestore();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await initiateDownload(db, 'live-wallpapers', wall.id, wall.downloadUrl, wall.name);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div variants={cardVariants} whileHover={{ y: -5 }}>
      <Card className="glass border-border p-0 rounded-[3rem] overflow-hidden flex flex-col h-full transition-all">
        <div className="relative aspect-[9/16] w-full bg-background/50 overflow-hidden">
          <img src={wall.previewUrl || wall.imageUrl} alt="Live" className="w-full h-full object-cover" />
          <div className="absolute bottom-8 left-8 right-8">
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground mb-2">{wall.name || "Sky Visual"}</h3>
            <div className="text-[9px] font-black uppercase text-muted-foreground mb-4">{wall.downloadCount || 0} DOWNLOADS</div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading}
                className="w-full h-12 rounded-2xl bg-primary font-black uppercase text-[10px]"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isDownloading ? 'Syncing...' : 'Sync Visual'}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function LiveWallpaperGrid({ wallpapers, isLoading }: { wallpapers: any[], isLoading: boolean }) {
  if (isLoading) return <LoadingState label="Rendering Visuals..." />;
  return (
    <section id="live-wallpapers" className="py-32 max-w-7xl mx-auto px-6">
      <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-20">LIVE <span className="text-blue-600">VISUALS</span></h2>
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8" initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ staggerChildren: 0.05 }}>
        {wallpapers?.map((wall) => <WallpaperCard key={wall.id} wall={wall} />)}
      </motion.div>
    </section>
  );
}

export function RequestROM() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variant, setVariant] = useState('sky');
  const db = useFirestore();

  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc(settingsRef);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formUrl = globalSettings?.romRequestFormUrl || "https://formspree.io/f/xgvzvelv";
    
    setIsSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('variant', variant);
    try {
      const response = await fetch(formUrl, { method: "POST", body: formData, headers: { 'Accept': 'application/json' } });
      if (response.ok) { toast({ title: "Protocol Initiated" }); form.reset(); }
      else { throw new Error("Submission failed"); }
    } catch (error) { toast({ variant: "destructive", title: "Error submitting protocol" }); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-12">
      <h2 className="text-4xl font-black uppercase tracking-tighter">REQUEST <span className="text-muted-foreground/40 italic">PORT</span></h2>
      <Card className="glass border-border p-10 rounded-[3rem] bg-card/10 transition-all">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input name="rom_name" placeholder="ROM NAME" className="bg-background/50 h-14 rounded-2xl px-6" required />
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger className="bg-background/50 h-14 rounded-2xl px-6"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-background rounded-2xl">
              <SelectItem value="sky">REDMI 12 5G (SKY)</SelectItem>
              <SelectItem value="sky_pro">POCO M6 PRO 5G (SKY)</SelectItem>
            </SelectContent>
          </Select>
          <Textarea name="specifications" placeholder="SPECIFICATIONS" className="bg-background/50 min-h-[140px] rounded-3xl p-6" required />
          <motion.div whileTap={{ scale: 0.98 }}>
            <Button type="submit" disabled={isSubmitting} className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl text-[10px] uppercase">{isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "INITIATE REQUEST"}</Button>
          </motion.div>
        </form>
      </Card>
    </div>
  );
}
