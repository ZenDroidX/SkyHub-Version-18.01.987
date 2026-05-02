'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useStorage } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2, Edit2, Upload, User, Heart, Settings2, Eye, EyeOff, Save } from 'lucide-react';
import { SiteSettings } from '@/lib/store';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '@/lib/image-resolver';

export default function DonorManager() {
  const db = useFirestore();
  const storage = useStorage();
  const donorsRef = useMemoFirebase(() => collection(db, 'donors'), [db]);
  const donorsQuery = useMemoFirebase(() => query(donorsRef, orderBy('priority', 'desc')), [donorsRef]);
  const { data: donors, isLoading: donorsLoading } = useCollection(donorsQuery);

  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc<SiteSettings>(settingsRef);

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    message: '',
    amount: '',
    avatarUrl: '',
    visible: true,
    priority: 0
  });

  const [showcaseSettings, setShowcaseSettings] = useState<SiteSettings['donorShowcase']>({
    enabled: true,
    speed: 30,
    pauseOnHover: true,
    style: 'glassmorphism',
    showParticles: true
  });

  // Sync showcase settings from DB
  useEffect(() => {
    if (globalSettings?.donorShowcase) {
      setShowcaseSettings(globalSettings.donorShowcase);
    }
  }, [globalSettings]);

  const handleSaveShowcaseSettings = async () => {
    if (!settingsRef) return;
    try {
      await updateDoc(settingsRef, {
        donorShowcase: showcaseSettings
      });
      toast({ title: 'Showcase settings updated!', description: 'Visual parameters have been synchronized.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, donorId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `donors/avatar_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      if (donorId) {
        await updateDoc(doc(db, 'donors', donorId), { avatarUrl: url });
      } else {
        setFormData(prev => ({ ...prev, avatarUrl: url }));
      }
      toast({ title: 'Avatar uploaded!', description: 'Image has been processed and hosted.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddDonor = async () => {
    if (!formData.name) return;
    try {
      await addDoc(donorsRef, {
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormData({
        name: '',
        username: '',
        message: '',
        amount: '',
        avatarUrl: '',
        visible: true,
        priority: 0
      });
      setIsAdding(false);
      toast({ title: 'Donor added!', description: 'The new champion has been added to the wall.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message });
    }
  };

  const handleUpdateDonor = async (id: string, data: any) => {
    try {
      await updateDoc(doc(db, 'donors', id), data);
      setIsEditing(null);
      toast({ title: 'Donor updated!' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Update failed', description: e.message });
    }
  };

  const handleDeleteDonor = async (id: string) => {
    if (!confirm('Are you sure you want to remove this donor?')) return;
    try {
      await deleteDoc(doc(db, 'donors', id));
      toast({ title: 'Donor removed.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Delete failed', description: e.message });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Showcase Visual Settings */}
      <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" /> Showcase Parameters
              </CardTitle>
              <CardDescription className="text-xs mt-1">Configure the visual loop and dynamics.</CardDescription>
            </div>
            <Button onClick={handleSaveShowcaseSettings} size="sm" className="h-9 px-4 rounded-xl font-black uppercase text-[10px] tracking-widest">
              <Save className="w-3 h-3 mr-2" /> Save Config
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest">Enable Showcase</Label>
              <Switch 
                checked={showcaseSettings?.enabled} 
                onCheckedChange={(val) => setShowcaseSettings(prev => ({ ...prev, enabled: val }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest">Pause on Hover</Label>
              <Switch 
                checked={showcaseSettings?.pauseOnHover} 
                onCheckedChange={(val) => setShowcaseSettings(prev => ({ ...prev, pauseOnHover: val }))} 
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-black uppercase tracking-widest">Show Particles</Label>
              <Switch 
                checked={showcaseSettings?.showParticles} 
                onCheckedChange={(val) => setShowcaseSettings(prev => ({ ...prev, showParticles: val }))} 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Scroll Duration ({showcaseSettings?.speed}s)</Label>
              <Input 
                type="range" min="10" max="100" 
                value={Number(showcaseSettings?.speed) || 30} 
                onChange={(e) => setShowcaseSettings(prev => ({ ...prev, speed: parseInt(e.target.value) || 30 }))}
                className="accent-primary"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Visual Style</Label>
              <Select 
                value={showcaseSettings?.style || 'glassmorphism'} 
                onValueChange={(val: any) => setShowcaseSettings(prev => ({ ...prev, style: val }))}
              >
                <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="glassmorphism">Glassmorphism</SelectItem>
                  <SelectItem value="neon">Neon Pulse</SelectItem>
                  <SelectItem value="classic">Classic Border</SelectItem>
                  <SelectItem value="minimal">Minimalist</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donor List / CRUD */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" /> Active Donors
        </h3>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className={cn("h-10 rounded-xl font-black uppercase text-[10px] tracking-widest", isAdding ? "bg-muted text-foreground" : "bg-primary text-primary-foreground")}
        >
          {isAdding ? 'Cancel' : <><Plus className="w-3 h-3 mr-2" /> Add Donor</>}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="rounded-[2rem] border-primary/20 bg-primary/5 mb-8">
              <CardContent className="p-8 grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Donor Name</Label>
                    <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Username / Handle</Label>
                    <Input value={formData.username || ''} onChange={(e) => setFormData({...formData, username: e.target.value})} placeholder="e.g. johndoe" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Message</Label>
                    <Input value={formData.message || ''} onChange={(e) => setFormData({...formData, message: e.target.value})} placeholder="e.g. Keep up the great work!" className="bg-background" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Donation Amount</Label>
                    <Input value={formData.amount || ''} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="e.g. $50" className="bg-background" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Avatar / Logo</Label>
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-full bg-muted border-2 border-border overflow-hidden shrink-0">
                        {formData.avatarUrl ? <img src={resolveImageUrl(formData.avatarUrl)} alt="Preview" className="w-full h-full object-cover" /> : <User className="w-full h-full p-4 opacity-20" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input value={formData.avatarUrl || ''} onChange={(e) => setFormData({...formData, avatarUrl: e.target.value})} placeholder="Image URL (Google Drive / Direct)" className="bg-background text-xs" />
                        <p className="text-[8px] text-muted-foreground">For Google Photos: Open image, right click &quot;Copy Image Address&quot;</p>
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4" />
                          <span className="text-[10px] font-black uppercase">Upload File</span>
                          <input type="file" className="hidden" onChange={(e) => handleFileChange(e)} accept="image/*" />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 pt-4">
                    <div className="space-y-2 flex-1">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Priority</Label>
                      <Input type="number" value={isNaN(Number(formData.priority)) ? 0 : formData.priority} onChange={(e) => setFormData({...formData, priority: parseInt(e.target.value) || 0})} className="bg-background" />
                    </div>
                    <Button onClick={handleAddDonor} disabled={!formData.name || isUploading} className="flex-1 h-12 rounded-xl">
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Registration'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {donorsLoading ? (
          <div className="col-span-full py-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : donors?.map((donor) => (
          <Card key={donor.id} className={cn("rounded-3xl border-border bg-card hover:border-primary/30 transition-all group overflow-hidden", !donor.visible && "opacity-60 grayscale")}>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-20 h-20 rounded-full border-4 border-muted overflow-hidden group-hover:border-primary/20 transition-all">
                  {donor.avatarUrl ? (
                    <img src={resolveImageUrl(donor.avatarUrl)} alt={donor.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center"><User className="w-10 h-10 opacity-20" /></div>
                  )}
                </div>
                <button 
                  onClick={() => handleUpdateDonor(donor.id, { visible: !donor.visible })}
                  className="absolute -bottom-1 -right-1 p-2 rounded-full bg-background border border-border shadow-lg hover:text-primary transition-colors"
                >
                  {donor.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3 text-destructive" />}
                </button>
              </div>

              {isEditing === donor.id ? (
                <div className="space-y-3 w-full">
                  <Input defaultValue={donor.name} onBlur={(e) => handleUpdateDonor(donor.id, { name: e.target.value })} className="h-9 px-3 text-sm text-center" />
                  <Input defaultValue={donor.username} onBlur={(e) => handleUpdateDonor(donor.id, { username: e.target.value })} className="h-9 px-3 text-xs text-center text-muted-foreground" placeholder="@username" />
                  <Input defaultValue={donor.amount} onBlur={(e) => handleUpdateDonor(donor.id, { amount: e.target.value })} className="h-9 px-3 text-xs text-center" placeholder="Amount" />
                  <Input defaultValue={donor.message} onBlur={(e) => handleUpdateDonor(donor.id, { message: e.target.value })} className="h-9 px-3 text-xs text-center" placeholder="Message" />
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(null)} className="w-full h-8 text-[9px] font-black uppercase">Finish</Button>
                </div>
              ) : (
                <>
                  <h4 className="font-bold text-lg leading-tight">{donor.name}</h4>
                  {donor.username && <p className="text-xs text-muted-foreground mb-3">@{donor.username}</p>}
                  {donor.amount && <div className="mb-2 text-xs font-black text-primary uppercase tracking-widest px-3 py-1 bg-primary/5 rounded-lg border border-primary/10">{donor.amount}</div>}
                  {donor.message && <p className="text-sm italic text-muted-foreground/80 line-clamp-2 px-2">&quot;{donor.message}&quot;</p>}
                </>
              )}

              <div className="flex items-center gap-2 mt-6 w-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(donor.id)} className="flex-1 rounded-xl h-8 text-[9px] font-black uppercase">
                  <Edit2 className="w-3 h-3 mr-2" /> Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteDonor(donor.id)} className="w-10 h-8 p-0 rounded-xl">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
