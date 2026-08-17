'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Cpu, 
  Smartphone, 
  Package, 
  ShieldAlert, 
  BookOpen, 
  Image as ImageIcon, 
  Download, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  Command,
  ArrowRight
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = 'all' | 'roms' | 'modules' | 'recoveries' | 'apks' | 'guides' | 'wallpapers';

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [queryText, setQueryText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const inputRef = useRef<HTMLInputElement>(null);
  const db = useFirestore();

  // Queries
  const romsQuery = useMemoFirebase(() => db ? query(collection(db, 'roms'), orderBy('createdAt', 'desc')) : null, [db]);
  const modulesQuery = useMemoFirebase(() => db ? query(collection(db, 'modules'), orderBy('createdAt', 'desc')) : null, [db]);
  const recoveriesQuery = useMemoFirebase(() => db ? query(collection(db, 'recoveries'), orderBy('createdAt', 'desc')) : null, [db]);
  const apksQuery = useMemoFirebase(() => db ? query(collection(db, 'mod-apks'), orderBy('createdAt', 'desc')) : null, [db]);
  const guidesQuery = useMemoFirebase(() => db ? query(collection(db, 'tutorials'), orderBy('createdAt', 'desc')) : null, [db]);
  const wallpapersQuery = useMemoFirebase(() => db ? query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc')) : null, [db]);

  const { data: roms } = useCollection(romsQuery);
  const { data: modules } = useCollection(modulesQuery);
  const { data: recoveries } = useCollection(recoveriesQuery);
  const { data: apks } = useCollection(apksQuery);
  const { data: guides } = useCollection(guidesQuery);
  const { data: wallpapers } = useCollection(wallpapersQuery);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const q = queryText.trim().toLowerCase();

  const filteredRoms = (roms || []).filter(item => 
    !q || (item.name || '').toLowerCase().includes(q) || 
    (item.description || '').toLowerCase().includes(q) || 
    (item.androidVersion || '').toLowerCase().includes(q) ||
    (item.device || '').toLowerCase().includes(q)
  );

  const filteredModules = (modules || []).filter(item => 
    !q || (item.name || '').toLowerCase().includes(q) || 
    (item.description || '').toLowerCase().includes(q)
  );

  const filteredRecoveries = (recoveries || []).filter(item => 
    !q || (item.name || '').toLowerCase().includes(q) || 
    (item.description || '').toLowerCase().includes(q)
  );

  const filteredApks = (apks || []).filter(item => 
    !q || (item.name || '').toLowerCase().includes(q) || 
    (item.description || '').toLowerCase().includes(q)
  );

  const filteredGuides = (guides || []).filter(item => 
    !q || (item.title || '').toLowerCase().includes(q) || 
    (item.content || '').toLowerCase().includes(q) ||
    (item.category || '').toLowerCase().includes(q)
  );

  const filteredWallpapers = (wallpapers || []).filter(item => 
    !q || (item.name || '').toLowerCase().includes(q) || 
    (item.category || '').toLowerCase().includes(q)
  );

  const totalResults = 
    filteredRoms.length + 
    filteredModules.length + 
    filteredRecoveries.length + 
    filteredApks.length + 
    filteredGuides.length + 
    filteredWallpapers.length;

  const categories: { id: SearchCategory; label: string; icon: any; count: number }[] = [
    { id: 'all', label: 'All Resources', icon: Sparkles, count: totalResults },
    { id: 'roms', label: 'Custom ROMs', icon: Cpu, count: filteredRoms.length },
    { id: 'modules', label: 'Modules', icon: Package, count: filteredModules.length },
    { id: 'recoveries', label: 'Recoveries', icon: ShieldAlert, count: filteredRecoveries.length },
    { id: 'apks', label: 'Mod APKs', icon: Smartphone, count: filteredApks.length },
    { id: 'guides', label: 'Guides', icon: BookOpen, count: filteredGuides.length },
    { id: 'wallpapers', label: 'Wallpapers', icon: ImageIcon, count: filteredWallpapers.length },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-16 sm:pt-24 px-4 sm:px-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-background/80 backdrop-blur-md"
        />

        {/* Command Panel Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-3xl glass bg-card/95 border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header Search Input */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/80 bg-background/40">
            <Search className="w-5 h-5 text-primary shrink-0" />
            <input
              ref={inputRef}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search ROMs, kernels, modules, codenames (sky, sky_pro)..."
              className="w-full bg-transparent text-sm sm:text-base font-medium outline-none text-foreground placeholder:text-muted-foreground/60"
            />
            {queryText && (
              <button 
                onClick={() => setQueryText('')}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded bg-muted/60 text-[10px] font-mono text-muted-foreground border border-border/50">
              <span>ESC</span>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted sm:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/50 overflow-x-auto scrollbar-hide bg-muted/20">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  {cat.count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Results List */}
          <div className="overflow-y-auto p-4 sm:p-5 space-y-6 flex-1 scrollbar-thin">
            {totalResults === 0 ? (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/60 flex items-center justify-center mx-auto mb-3 text-muted-foreground">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-1">No matching assets found</h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try searching for another ROM, module name, or codename like &quot;sky&quot; or &quot;sky_pro&quot;.
                </p>
              </div>
            ) : (
              <>
                {/* ROMs Section */}
                {(selectedCategory === 'all' || selectedCategory === 'roms') && filteredRoms.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-primary" /> Custom ROMs ({filteredRoms.length})
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {filteredRoms.slice(0, selectedCategory === 'roms' ? 20 : 4).map((rom) => (
                        <div 
                          key={rom.id}
                          onClick={() => {
                            onClose();
                            const el = document.getElementById('roms');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/40 border border-border/60 hover:border-primary/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {rom.imageUrl ? (
                              <img src={rom.imageUrl} alt={rom.name} className="w-10 h-10 rounded-lg object-cover border border-border/60 shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                                <Cpu className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {rom.name}
                                </span>
                                {rom.androidVersion && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary bg-primary/5">
                                    A{rom.androidVersion}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate max-w-md">
                                {rom.description || 'Custom ROM build for Snapdragon platform'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {rom.downloadUrl && (
                              <a 
                                href={rom.downloadUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 rounded-lg bg-primary/10 hover:bg-primary hover:text-primary-foreground text-primary transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modules Section */}
                {(selectedCategory === 'all' || selectedCategory === 'modules') && filteredModules.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-accent" /> Modules ({filteredModules.length})
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {filteredModules.slice(0, selectedCategory === 'modules' ? 20 : 3).map((mod) => (
                        <div 
                          key={mod.id}
                          onClick={() => {
                            onClose();
                            const el = document.getElementById('modules');
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/40 border border-border/60 hover:border-accent/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-foreground group-hover:text-accent transition-colors truncate block">
                                {mod.name}
                              </span>
                              <p className="text-xs text-muted-foreground truncate max-w-md">{mod.description}</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Guides Section */}
                {(selectedCategory === 'all' || selectedCategory === 'guides') && filteredGuides.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Guides & Tutorials ({filteredGuides.length})
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {filteredGuides.slice(0, selectedCategory === 'guides' ? 20 : 3).map((guide) => (
                        <Link 
                          key={guide.id}
                          href={`/guides#${guide.id}`}
                          onClick={onClose}
                          className="group flex items-center justify-between p-3 rounded-xl bg-card hover:bg-muted/40 border border-border/60 hover:border-emerald-500/40 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-sm font-bold text-foreground group-hover:text-emerald-500 transition-colors truncate block">
                                {guide.title}
                              </span>
                              <p className="text-xs text-muted-foreground truncate max-w-md">
                                {guide.category || 'Tutorial'} • Read Step-by-Step
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-foreground transition-all" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Wallpapers Section */}
                {(selectedCategory === 'all' || selectedCategory === 'wallpapers') && filteredWallpapers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-purple-500" /> Wallpapers ({filteredWallpapers.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {filteredWallpapers.slice(0, 4).map((wall) => (
                        <Link 
                          key={wall.id}
                          href="/wallpapers"
                          onClick={onClose}
                          className="group relative aspect-[9/16] rounded-xl overflow-hidden border border-border/60 hover:border-purple-500/50 transition-all"
                        >
                          <img src={wall.previewUrl || wall.imageUrl} alt={wall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                            <span className="text-[11px] font-medium text-white truncate w-full">{wall.name || 'Wallpaper'}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Controls / Hint */}
          <div className="px-5 py-3 border-t border-border/80 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">↓</kbd>
                <span className="text-[11px]">Navigate</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/60 text-[10px] font-mono">↵</kbd>
                <span className="text-[11px]">Select</span>
              </span>
            </div>
            <span className="text-[11px]">
              Showing <span className="font-semibold text-foreground">{totalResults}</span> matches
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
