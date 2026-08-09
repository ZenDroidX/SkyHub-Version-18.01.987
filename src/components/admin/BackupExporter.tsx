'use client';

import React, { useState } from 'react';
import { useFirestore } from '@/firebase';
import { 
  Archive, 
  Download, 
  Package, 
  FileJson, 
  FolderArchive, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Info, 
  ShieldCheck, 
  RefreshCw, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  HardDrive, 
  Layers 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { runSkyHubExport, ExportMode, ExportProgress } from '@/lib/exporter';
import { toast } from '@/hooks/use-toast';

export default function BackupExporter() {
  const db = useFirestore();

  const [selectedMode, setSelectedMode] = useState<ExportMode | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showFailedAssets, setShowFailedAssets] = useState(false);

  const [progress, setProgress] = useState<ExportProgress>({
    stage: 'Ready to export',
    stepIndex: 0,
    totalSteps: 7,
    processedItems: 0,
    totalItems: 0,
    percent: 0,
    failedAssets: [],
    status: 'idle'
  });

  const handleModeClick = (mode: ExportMode) => {
    setSelectedMode(mode);
    setIsConfirmOpen(true);
  };

  const handleStartExport = async () => {
    if (!selectedMode || !db) return;
    setIsConfirmOpen(false);
    setIsExporting(true);

    setProgress({
      stage: 'Initializing backup request...',
      stepIndex: 0,
      totalSteps: 7,
      processedItems: 0,
      totalItems: 0,
      percent: 0,
      failedAssets: [],
      status: 'running'
    });

    await runSkyHubExport(db, selectedMode, (latestProgress) => {
      setProgress(latestProgress);
      if (latestProgress.status === 'completed') {
        setIsExporting(false);
        toast({
          title: '🎉 SkyHub Backup Downloaded!',
          description: `Successfully packaged and downloaded ${latestProgress.counts?.roms || 0} ROMs and associated assets.`
        });
      } else if (latestProgress.status === 'failed') {
        setIsExporting(false);
        toast({
          variant: 'destructive',
          title: 'Export Failed',
          description: latestProgress.errorMessage || 'An error occurred during backup.'
        });
      }
    });
  };

  const stepsList = [
    { num: 1, label: 'Fetching SkyHub database records' },
    { num: 2, label: 'Generating Metadata JSON dumps' },
    { num: 3, label: 'Processing ROMs and device folders' },
    { num: 4, label: 'Processing Recoveries & Modules' },
    { num: 5, label: 'Processing Firmware, Wallpapers & Guides' },
    { num: 6, label: 'Generating Manifest & README documentation' },
    { num: 7, label: 'Compressing & Downloading ZIP archive' }
  ];

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-8 rounded-[2.5rem] bg-gradient-to-r from-primary/10 via-card to-primary/5 border border-primary/20 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-2xl text-primary border border-primary/30">
              <Archive className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wide">SkyHub Data Export & Backup</h2>
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
                Admin Data Preservation & Portability Protocol
              </p>
            </div>
          </div>
          <p className="text-sm text-foreground/80 max-w-2xl pt-2">
            Generate a full, portable <code className="text-primary font-mono text-xs px-1.5 py-0.5 rounded bg-primary/10">.zip</code> archive containing all ROMs, devices, files, screenshots, metadata, and original download links.
          </p>
        </div>

        <Badge variant="outline" className="px-4 py-2 rounded-2xl bg-primary/10 border-primary/30 text-primary font-black uppercase text-[10px] tracking-widest shrink-0">
          <ShieldCheck className="w-4 h-4 mr-2" /> Non-Destructive Backup
        </Badge>
      </div>

      {/* Main Mode Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Complete SkyHub Export */}
        <Card className="rounded-[2.5rem] border-primary/30 bg-card hover:border-primary transition-all duration-300 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
            <Archive className="w-24 h-24 text-primary" />
          </div>
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-primary text-primary-foreground font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                Recommended
              </Badge>
              <Package className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-wide">📦 Complete SkyHub Backup</CardTitle>
            <CardDescription className="text-xs">
              Collects all SkyHub data: ROMs, Recoveries, Modules, Mod APKs, Guides, Wallpapers, Donors, Settings, Screenshots, Files, and Metadata into a single ZIP.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <ul className="text-xs space-y-2 text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> All ROMs & Device-grouped folders</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Full screenshot downloads & original quality banners</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Recoveries, Modules, APKs, Guides & Wallpapers</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> Complete JSON database exports + Manifest + README</li>
            </ul>
            <Button 
              onClick={() => handleModeClick('complete')} 
              disabled={isExporting}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4 mr-2" /> Export Complete SkyHub Data
            </Button>
          </CardContent>
        </Card>

        {/* Card 2: ROMs Only */}
        <Card className="rounded-[2.5rem] border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-md relative overflow-hidden group">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                ROM Focus
              </Badge>
              <FolderArchive className="w-6 h-6 text-blue-500" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-wide">📱 ROMs & Screenshots Only</CardTitle>
            <CardDescription className="text-xs">
              Exports all ROM entries organized by Device/Codename, along with screenshots, banners, download links, and ROM metadata.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <ul className="text-xs space-y-2 text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Device/ROM-Name folder hierarchy</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> Downloaded ROM screenshots & banners</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" /> links.txt & metadata.json per ROM</li>
            </ul>
            <Button 
              onClick={() => handleModeClick('roms')} 
              disabled={isExporting}
              variant="outline"
              className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest border-border hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-2" /> Export ROMs Only
            </Button>
          </CardContent>
        </Card>

        {/* Card 3: Files & Assets Only */}
        <Card className="rounded-[2.5rem] border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-md relative overflow-hidden group">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                Assets Focus
              </Badge>
              <HardDrive className="w-6 h-6 text-amber-500" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-wide">📁 Files & Resources Only</CardTitle>
            <CardDescription className="text-xs">
              Exports Modules, Recoveries, Kernels, Firmware binaries, Mod APKs, Wallpapers, Guides, and attached resource files.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <ul className="text-xs space-y-2 text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Magisk & Kernel Module ZIPs</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Custom Recoveries (TWRP / OrangeFox)</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" /> Wallpapers, Guides & Firmware files</li>
            </ul>
            <Button 
              onClick={() => handleModeClick('files')} 
              disabled={isExporting}
              variant="outline"
              className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest border-border hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-2" /> Export Files & Assets
            </Button>
          </CardContent>
        </Card>

        {/* Card 4: Metadata Only */}
        <Card className="rounded-[2.5rem] border-border bg-card hover:border-primary/50 transition-all duration-300 shadow-md relative overflow-hidden group">
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center justify-between mb-2">
              <Badge variant="outline" className="font-black uppercase text-[9px] tracking-widest px-3 py-1 rounded-full">
                Fast & Lightweight
              </Badge>
              <FileJson className="w-6 h-6 text-purple-500" />
            </div>
            <CardTitle className="text-xl font-black uppercase tracking-wide">📄 Metadata Only (Fast)</CardTitle>
            <CardDescription className="text-xs">
              Instant export of all raw JSON database collections, categories, site settings, and manifests without downloading media.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0 space-y-6">
            <ul className="text-xs space-y-2 text-muted-foreground font-medium">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> All Firestore documents in JSON</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> Complete download links preserved</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0" /> Instant generation (&lt; 2 seconds)</li>
            </ul>
            <Button 
              onClick={() => handleModeClick('metadata')} 
              disabled={isExporting}
              variant="outline"
              className="w-full h-14 rounded-2xl font-black uppercase text-[11px] tracking-widest border-border hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-2" /> Export Metadata Only
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Progress & Status Panel */}
      {(progress.status === 'running' || progress.status === 'completed' || progress.status === 'failed') && (
        <Card className="rounded-[2.5rem] border-primary/30 bg-card shadow-2xl p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                {progress.status === 'running' ? (
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                ) : progress.status === 'completed' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <h3 className="text-lg font-black uppercase tracking-wide">
                  {progress.status === 'running' ? 'Export in Progress' : progress.status === 'completed' ? 'Export Complete' : 'Export Failed'}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{progress.stage}</p>
            </div>

            <Badge className="px-4 py-2 rounded-2xl font-mono text-sm font-black bg-primary/20 text-primary border border-primary/30">
              {progress.percent}%
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress.percent} className="h-3 rounded-full bg-muted overflow-hidden" />
            <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-muted-foreground">
              <span>Step {progress.stepIndex} of {progress.totalSteps}</span>
              <span>{progress.processedItems} / {progress.totalItems} items processed</span>
            </div>
          </div>

          {/* Step Checklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {stepsList.map((st) => {
              const isDone = progress.stepIndex > st.num || progress.status === 'completed';
              const isCurrent = progress.stepIndex === st.num && progress.status === 'running';

              return (
                <div 
                  key={st.num}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-semibold transition-colors ${
                    isDone 
                      ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400'
                      : isCurrent
                      ? 'bg-primary/10 border-primary/40 text-primary animate-pulse'
                      : 'bg-muted/30 border-border/40 text-muted-foreground opacity-60'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[9px] shrink-0 font-mono">
                      {st.num}
                    </div>
                  )}
                  <span className="truncate">{st.label}</span>
                </div>
              );
            })}
          </div>

          {/* Metrics Overview */}
          {progress.counts && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/40 border border-border/50 text-center">
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">ROMs</p>
                <p className="text-base font-black text-foreground">{progress.counts.roms}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Modules / APKs</p>
                <p className="text-base font-black text-foreground">{progress.counts.modules + progress.counts.apks}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Downloaded Files</p>
                <p className="text-base font-black text-green-500">{progress.counts.downloadedFiles}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase text-muted-foreground">Failed / Skipped</p>
                <p className="text-base font-black text-amber-500">{progress.failedAssets.length}</p>
              </div>
            </div>
          )}

          {/* Failed Assets Drawer */}
          {progress.failedAssets.length > 0 && (
            <Collapsible open={showFailedAssets} onOpenChange={setShowFailedAssets} className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  <span>{progress.failedAssets.length} asset(s) skipped or unavailable (urls preserved in metadata)</span>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-amber-600 dark:text-amber-400">
                    {showFailedAssets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>

              <CollapsibleContent className="p-4 rounded-xl bg-black/40 border border-border/50 max-h-48 overflow-y-auto space-y-2 font-mono text-[10px]">
                {progress.failedAssets.map((fa, i) => (
                  <div key={i} className="p-2 rounded bg-muted/30 border border-border/30 text-muted-foreground">
                    <p className="text-foreground font-bold">{fa.name} ({fa.category})</p>
                    <p className="truncate text-amber-400">{fa.url}</p>
                    <p className="text-muted-foreground italic">{fa.reason}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Action Buttons when done */}
          {progress.status === 'completed' && (
            <div className="flex justify-end pt-2">
              <Button 
                onClick={() => setProgress(prev => ({ ...prev, status: 'idle' }))}
                variant="outline"
                className="rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Start Another Export
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Confirmation Modal */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="rounded-[2.5rem] bg-card border-border max-w-lg p-8">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-black uppercase tracking-wide flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-primary" /> Confirm SkyHub Export
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Please review the export parameters before proceeding.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs leading-relaxed font-semibold">
              «“This will create a complete copy of your SkyHub content, metadata, links and available assets. Nothing in your existing SkyHub data will be deleted.”»
            </div>

            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">Export Mode:</span>
                <span className="font-black uppercase text-primary">{selectedMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">Archive Format:</span>
                <span className="font-mono">SkyHub-Backup-{selectedMode}.zip</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-bold">Database Safety:</span>
                <span className="font-bold text-green-500">100% Read-Only</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmOpen(false)}
              className="rounded-xl font-black uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStartExport}
              className="bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"
            >
              <Download className="w-4 h-4 mr-2" /> Confirm & Start Backup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
