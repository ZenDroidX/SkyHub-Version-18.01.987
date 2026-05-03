'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useStorage } from '@/firebase';
import { doc, updateDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Palette, Shield, User, Camera, Upload, Loader2, Save, CloudLightning, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useNotifications } from '@/components/NotificationProvider';
import { cn } from '@/lib/utils';
import ThemeManager from './ThemeManager';
import { Slideshow } from '@/components/sections/slideshow';
import { ActivityLog } from './ActivityLog';
import DonorManager from './DonorManager';
import { TelegramLoginWidget } from './TelegramLoginWidget';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/firebase';
import { SiteSettings } from '@/lib/store';
import { resolveImageUrl } from '@/lib/image-resolver';
import { MediaPreview } from '@/components/MediaPreview';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Menu } from 'lucide-react';



function SortableSectionItem({ id, section, onToggle }: { id: string, section: any, onToggle: (id: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const labelMap: Record<string, string> = {
    slideshow: 'Hero Slideshow',
    hero: 'Hero Welcome Section',
    roms: 'ROM Registry',
    modules: 'Utility Modules',
    apks: 'Mod APKs',
    root: 'Root Protocols',
    guides: 'Protocol Guides',
    wallpapers: 'Static Wallpapers',
    donors: 'Donors Wall'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-4 p-4 bg-muted/40 border border-border rounded-2xl group",
        isDragging && "opacity-50 border-primary"
      )}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-lg transition-colors">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest">{labelMap[id] || id}</p>
        <p className="text-[8px] text-muted-foreground">ID: {id}</p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onToggle(id)}
        className={cn(
          "h-10 w-10 p-0 rounded-xl",
          section.visible ? "text-primary hover:text-primary hover:bg-primary/10" : "text-muted-foreground opacity-30"
        )}
      >
        {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
      </Button>
    </div>
  );
}

export default function SuperAdminPanel() {
  const { addNotification } = useNotifications();
  const db = useFirestore();
  const auth = useAuth();
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const identityRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: identity } = useDoc<SiteSettings>(identityRef);
  const storage = useStorage();

  const [formData, setFormData] = useState<any>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = formData.layoutConfig.findIndex((s: any) => s.id === active.id);
    const newIndex = formData.layoutConfig.findIndex((s: any) => s.id === over.id);

    const newLayout = arrayMove(formData.layoutConfig, oldIndex, newIndex);
    setFormData({ ...formData, layoutConfig: newLayout });
  };

  const toggleSection = (id: string) => {
    const newLayout = formData.layoutConfig.map((s: any) => 
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    setFormData({ ...formData, layoutConfig: newLayout });
  };
  const [identityData, setIdentityData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedPosts, setSyncedPosts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState<Record<number, boolean>>({});
  const [isExtractingPost, setIsExtractingPost] = useState<Record<number, boolean>>({});
  const [isResolvingPost, setIsResolvingPost] = useState<Record<number, boolean>>({});
  const [extractedData, setExtractedData] = useState<Record<number, any[]>>({});

  const handleResolveLink = async (url: string, index: number, field: string) => {
    setIsResolvingPost(prev => ({ ...prev, [index]: true }));
    try {
      const resp = await fetch('/api/resolve-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      if (data.imageUrl) {
        setExtractedData(prev => {
          const newData = { ...prev };
          const list = [...(newData[index] || [])];
          if (list.length > 0) {
            // Update last extracted rom or first one
            list[0] = { ...list[0], [field]: data.imageUrl };
          }
          return { ...newData, [index]: list };
        });
        toast({ title: 'Link Resolved', description: `Injected visual into ROM buffer.` });
      }
    } catch (e: any) {
      toast({ title: 'Resolution failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsResolvingPost(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleExtractFromPost = async (post: any, index: number) => {
    const content = post.text;
    // Combine text with button links for AI context
    const enrichedText = `
      Content: ${content}
      Links: ${post.buttons?.map((b: any) => `${b.text}: ${b.url}`).join(', ')}
    `;
    setIsExtractingPost(prev => ({ ...prev, [index]: true }));
    try {
      const resp = await fetch('/api/ai/extract-rom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: enrichedText }),
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      setExtractedData(prev => ({ ...prev, [index]: data.roms }));
      toast({ title: 'AI Extraction Complete', description: `Detected ${data.roms.length} ROM configurations.` });
    } catch (e: any) {
      toast({ title: 'Extraction failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsExtractingPost(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleCommitRom = async (rom: any, index: number) => {
    try {
      const romsRef = collection(db, 'roms');
      await addDoc(romsRef, {
        ...rom,
        source: 'telegram_manual',
        created_at: serverTimestamp(),
        status: 'published'
      });
      
      toast({ title: 'ROM Published!', description: `${rom.name} is now live.` });
      
      // Remove from extracted data preview
      setExtractedData(prev => {
        const newData = { ...prev };
        const updatedList = newData[index].filter(r => r !== rom);
        if (updatedList.length === 0) {
          delete newData[index];
        } else {
          newData[index] = updatedList;
        }
        return { ...newData };
      });
    } catch (error: any) {
      toast({ title: 'Failed to publish', description: error.message, variant: 'destructive' });
    }
  };
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [telegramUser, setTelegramUser] = useState<any>(null);
  const [manualLink, setManualLink] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleManualExtract = async () => {
    if (!manualLink) return;
    setIsExtracting(true);
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: manualLink }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      if (data.posts && data.posts.length > 0) {
        setSyncedPosts(data.posts);
        toast({ title: 'Extraction successful', description: `Found ${data.posts.length} messages.` });
      } else {
        toast({ title: 'No content found', description: 'Could not extract text from this link.' });
      }
    } catch (error: any) {
      toast({ title: 'Extraction failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncedPosts([]);
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings?.socialLinks?.telegramChannel }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setSyncedPosts(data.posts);
      toast({ title: 'Sync successful!', description: `Found ${data.posts.length} posts.` });
    } catch (error: any) {
      toast({ title: 'Sync failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsSyncing(false);
    }
  };

  const notificationsQuery = useMemoFirebase(() => query(collection(db, 'notifications'), orderBy('createdAt', 'desc')), [db]);
  const { data: notifications } = useCollection(notificationsQuery);
  const [panelLayout, setPanelLayout] = useState<'grid' | 'list'>('grid');
  const [newNotificationMessage, setNewNotificationMessage] = useState('');
  const [newNotificationDuration, setNewNotificationDuration] = useState('5');

  const handleAddNotification = async (message: string, durationStr: string) => {
    if (!message) return;
    const durationSeconds = parseInt(durationStr);
    const durationMs = durationSeconds * 1000;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMs);
    
    await addDoc(collection(db, 'notifications'), { 
      message, 
      duration: durationMs,
      createdAt: serverTimestamp(),
      expiresAt: expiresAt
    });
    setNewNotificationMessage('');
  };
  const handleDeleteNotification = async (id: string) => {
    await deleteDoc(doc(db, 'notifications', id));
  };
  const handleUpdateNotification = async (id: string, message: string) => {
    await updateDoc(doc(db, 'notifications', id), { message });
  };

  const handleAddPost = async (content: string, index: number) => {
    setIsAdding(prev => ({ ...prev, [index]: true }));
    try {
      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, {
        content,
        date: new Date().toISOString(),
        url: settings?.socialLinks?.telegramChannel,
      });
      
      // Log Activity
      try {
        if (auth.currentUser) {
          logActivity(db, auth.currentUser.uid, `Added post: ${content.substring(0, 30)}...`);
        }
      } catch (e) {
        console.error("Log error:", e);
      }

      toast({ title: 'Post added!', description: 'The post has been added to the site.' });
    } catch (error: any) {
      toast({ title: 'Failed to add post', description: error.message, variant: 'destructive' });
    } finally {
      setIsAdding(prev => ({ ...prev, [index]: false }));
    }
  };

  useEffect(() => {
    if (settings) {
      const defaultLayout = [
        { id: 'slideshow', visible: true },
        { id: 'hero', visible: true },
        { id: 'roms', visible: true },
        { id: 'modules', visible: true },
        { id: 'apks', visible: true },
        { id: 'root', visible: true },
        { id: 'guides', visible: true },
        { id: 'wallpapers', visible: true },
        { id: 'donors', visible: true },
      ];

      const currentLayout = settings.layoutConfig || [];
      // Merge missing defaults
      const mergedLayout = [...currentLayout];
      defaultLayout.forEach(def => {
        if (!mergedLayout.find(m => m.id === def.id)) {
          mergedLayout.push(def);
        }
      });

      setFormData({
        ...settings,
        layoutConfig: mergedLayout
      });
    }
  }, [settings]);

  useEffect(() => {
    if (identity) {
      setIdentityData(identity);
    }
  }, [identity]);

  const handleSaveIdentity = async () => {
    if (identityRef && identityData) {
      try {
        await setDoc(identityRef, identityData, { merge: true });
        toast({ title: 'Identity updated!', description: 'Architect profile has been synchronized.' });
      } catch (error: any) {
        toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadAvatar = async () => {
    if (!avatarFile || !identityRef) return;
    setIsUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `architect/avatar_${Date.now()}`);
      await uploadBytes(storageRef, avatarFile);
      const url = await getDownloadURL(storageRef);
      
      await setDoc(identityRef, { adminAvatarUrl: url }, { merge: true });
      setIdentityData({ ...identityData, adminAvatarUrl: url });
      setAvatarFile(null);
      setAvatarPreview(null);
      toast({ title: 'Profile picture updated!', description: 'Global identity has been refreshed.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e.message });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (settingsRef && formData) {
      await updateDoc(settingsRef, formData);
      
      // Log Activity
      try {
        if (auth.currentUser) {
          logActivity(db, auth.currentUser.uid, `Updated global settings`);
        }
      } catch (e) {
        console.error("Log error:", e);
      }

      toast({ title: 'Settings updated!', description: 'Your changes have been applied successfully.' });
    }
  };

  if (!formData || !identityData) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Palette className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-black uppercase">Super Admin Panel</h2>
        </div>
        <Button variant="outline" onClick={() => setPanelLayout(prev => prev === 'grid' ? 'list' : 'grid')}>
          Switch to {panelLayout === 'grid' ? 'List' : 'Grid'} Layout
        </Button>
      </div>
      
      <Tabs defaultValue="theme" orientation="vertical" className="w-full flex flex-col md:flex-row gap-8">
        <TabsList className="flex md:flex-col h-auto bg-transparent border-none gap-2 md:w-64 shrink-0 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide">
          <TabsTrigger value="theme" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Theme</TabsTrigger>
          <TabsTrigger value="identity" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Architect Identity</TabsTrigger>
          <TabsTrigger value="slideshow" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Slideshow</TabsTrigger>
          <TabsTrigger value="support" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Support Links</TabsTrigger>
          <TabsTrigger value="social" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Social Links</TabsTrigger>
          <TabsTrigger value="notifications" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Notifications</TabsTrigger>
          <TabsTrigger value="donors" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Donors Wall</TabsTrigger>
          <TabsTrigger value="posts" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Posts</TabsTrigger>
          <TabsTrigger value="activity" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Activity Log</TabsTrigger>
          <TabsTrigger value="ai" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">AI Settings</TabsTrigger>
          <TabsTrigger value="layout" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Layout & Architecture</TabsTrigger>
          <TabsTrigger value="seo" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">SEO & Extras</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="theme" className="mt-0">
          <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Global Theme Registry</h3>
            <ThemeManager />
          </div>
        </TabsContent>

        <TabsContent value="identity">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Profile configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Lead Architect Name</Label>
                  <Input 
                    placeholder="Enter architect name" 
                    value={identityData?.adminName || ''} 
                    onChange={(e) => setIdentityData({...identityData, adminName: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Professional Biography</Label>
                  <Input 
                    placeholder="Enter short bio" 
                    value={identityData?.adminBio || ''} 
                    onChange={(e) => setIdentityData({...identityData, adminBio: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Profile Avatar URL</Label>
                  <div className="flex flex-col gap-2">
                    <Input 
                      placeholder="HTTPS image URL (Google Photos/Drive supported)" 
                      value={identityData?.adminAvatarUrl || ''} 
                      onChange={(e) => setIdentityData({...identityData, adminAvatarUrl: e.target.value})}
                      className="h-12 rounded-xl bg-muted/50 border-border flex-1"
                    />
                    <p className="text-[8px] text-muted-foreground px-2">Tip: Use &quot;Copy Image Address&quot; for Google Photos direct links.</p>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveIdentity} 
                  className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest"
                >
                  <Save className="w-4 h-4 mr-2" /> Sync Profile Data
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" /> Visual Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2rem] overflow-hidden border-2 border-border/50 bg-muted flex items-center justify-center relative">
                      {avatarPreview || identityData?.adminAvatarUrl ? (
                        <MediaPreview 
                          src={avatarPreview || identityData.adminAvatarUrl} 
                          alt="Architect Preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-muted-foreground opacity-20" />
                      )}
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-2">
                        <Upload className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Replace</span>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                      </label>
                    </div>
                  </div>
                  
                  {avatarFile && (
                    <div className="w-full space-y-2">
                      <p className="text-[9px] font-black uppercase text-center text-primary animate-pulse">New identity pending upload</p>
                      <Button 
                        onClick={handleUploadAvatar} 
                        disabled={isUploadingAvatar}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest"
                      >
                        {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CloudLightning className="w-4 h-4 mr-2" />}
                        Commit New Visual
                      </Button>
                    </div>
                  )}

                  <div className="p-6 bg-muted/30 rounded-2xl border border-border/50 w-full">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-3 text-center tracking-[0.2em]">Identity Preview</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted">
                        {(avatarPreview || identityData?.adminAvatarUrl) && <MediaPreview src={avatarPreview || identityData.adminAvatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase">{identityData?.adminName || 'Admin'}</h4>
                        <p className="text-[9px] text-muted-foreground line-clamp-1">{identityData?.adminBio || 'No biography set'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="slideshow">
          <Card>
            <CardHeader><CardTitle>Slideshow Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {formData.slideshowImages?.map((img: any, index: number) => (
                <div key={index} className={cn("grid grid-cols-4 gap-2 p-4 border rounded-lg", img.deleted && "opacity-50 bg-muted")}>
                  <Input placeholder="URL" value={img.url || ''} onChange={(e) => {
                    const newImages = [...formData.slideshowImages];
                    newImages[index].url = e.target.value;
                    setFormData({...formData, slideshowImages: newImages});
                  }} />
                  <Select value={img.orientation || 'cover'} onValueChange={(val) => {
                    const newImages = [...formData.slideshowImages];
                    newImages[index].orientation = val;
                    setFormData({...formData, slideshowImages: newImages});
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Orientation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">Cover</SelectItem>
                      <SelectItem value="contain">Contain</SelectItem>
                    </SelectContent>
                  </Select>
                  <label>
                    <span className="text-xs">Height (px):</span>
                    <Input type="number" placeholder="400" value={String(img.size || '400').replace('px', '')} onChange={(e) => {
                      const val = parseInt(e.target.value) || 400;
                      const newImages = [...formData.slideshowImages];
                      newImages[index].size = `${val}px`;
                      setFormData({...formData, slideshowImages: newImages});
                    }} />
                  </label>
                  <div className="flex gap-2">
                    {img.deleted ? (
                      <Button variant="outline" size="sm" onClick={() => {
                        const newImages = [...formData.slideshowImages];
                        newImages[index].deleted = false;
                        setFormData({...formData, slideshowImages: newImages});
                      }}>Restore</Button>
                    ) : (
                      <Button variant="destructive" size="sm" onClick={() => {
                        const newImages = [...formData.slideshowImages];
                        newImages[index].deleted = true;
                        setFormData({...formData, slideshowImages: newImages});
                      }}>Delete</Button>
                    )}
                  </div>
                </div>
              ))}
              <Button onClick={() => setFormData({...formData, slideshowImages: [...(formData.slideshowImages || []), {url: '', orientation: 'cover', size: '400px', deleted: false}]})}>Add Image</Button>
              <Button onClick={handleSave}>Save Changes</Button>
              
              <h4 className="text-lg font-bold mt-8">Preview</h4>
              <div className="bg-muted p-4 rounded-xl">
                 <Slideshow slideshowImages={formData.slideshowImages || []} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Contribution Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]">UPI Identifier</Label>
                  <Input 
                    placeholder="example@upi" 
                    value={formData.upiId || ''} 
                    onChange={(e) => setFormData({...formData, upiId: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Target Amount (Optional)</Label>
                  <Input 
                    placeholder="E.g. 500" 
                    value={formData.upiAmount || ''} 
                    onChange={(e) => setFormData({...formData, upiAmount: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em]">QR Code Visual URL</Label>
                <div className="flex gap-4">
                  <Input 
                    placeholder="HTTPS Image URL" 
                    value={formData.qrImageUrl || ''} 
                    onChange={(e) => setFormData({...formData, qrImageUrl: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border flex-1"
                  />
                  {formData.qrImageUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-border">
                      <MediaPreview src={formData.qrImageUrl} alt="QR Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Legacy Support Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input 
                    placeholder="Payment Portal Link" 
                    value={formData.supportLinks?.paymentLink || ''} 
                    onChange={(e) => setFormData({...formData, supportLinks: {...formData.supportLinks, paymentLink: e.target.value}})}
                    className="h-10 rounded-xl bg-muted/30"
                  />
                  <Input 
                    placeholder="QR Direct Link" 
                    value={formData.supportLinks?.qrLink || ''} 
                    onChange={(e) => setFormData({...formData, supportLinks: {...formData.supportLinks, qrLink: e.target.value}})}
                    className="h-10 rounded-xl bg-muted/30"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest mt-4"
              >
                <Save className="w-4 h-4 mr-2" /> Commit Contribution Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social">
          <Card>
            <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Telegram Channel Link</Label>
                <Input value={formData.socialLinks?.telegramChannel || ''} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, telegramChannel: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>Discussion Link</Label>
                <Input value={formData.socialLinks?.discussion || ''} onChange={(e) => setFormData({...formData, socialLinks: {...formData.socialLinks, discussion: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>ROM Request Form Link (Formspree or other)</Label>
                <Input value={formData.romRequestFormUrl || ''} onChange={(e) => setFormData({...formData, romRequestFormUrl: e.target.value})} />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
            <CardContent className={cn("space-y-4", panelLayout === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4")}>
              {notifications?.map((notif: any) => (
                <div key={notif.id} className="flex flex-col gap-3 p-5 border border-border bg-card rounded-2xl shadow-sm">
                  <Input 
                    value={notif.message || ''} 
                    onChange={(e) => handleUpdateNotification(notif.id, e.target.value)} 
                    className="w-full"
                  />
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteNotification(notif.id)}
                    className="w-full font-bold uppercase tracking-wider text-xs"
                  >
                    Delete Notification
                  </Button>
                </div>
              ))}
              <div className="flex flex-col gap-2 p-5 border border-dashed border-primary/50 rounded-2xl">
                <Input 
                  placeholder="Enter custom notification message..." 
                  value={newNotificationMessage}
                  onChange={(e) => setNewNotificationMessage(e.target.value)}
                />
                <Input 
                  type="number"
                  placeholder="Duration (seconds)..." 
                  value={newNotificationDuration}
                  onChange={(e) => setNewNotificationDuration(e.target.value)}
                />
                <Button onClick={() => handleAddNotification(newNotificationMessage, newNotificationDuration)}>Add Custom Notification</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors">
           <DonorManager />
        </TabsContent>

        <TabsContent value="posts">
          <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30 flex flex-col gap-4">
              <div className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" /> Telegram Hub
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={handleSync} disabled={isSyncing} className="h-9 px-4 rounded-xl text-[8px] font-black uppercase">
                    {isSyncing ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <CloudLightning className="w-3 h-3 mr-2" />}
                    Sync Channel
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <Input 
                    placeholder="t.me/channel/123 (Manual Link)"
                    value={manualLink}
                    onChange={(e) => setManualLink(e.target.value)}
                    className="h-10 text-[10px] rounded-xl bg-muted/50 border-border"
                  />
                  <Button 
                    onClick={handleManualExtract} 
                    disabled={isExtracting}
                    className="h-10 px-4 rounded-xl text-[8px] font-black uppercase"
                  >
                    {isExtracting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Fetch"}
                  </Button>
                </div>
                <div className="flex justify-end items-center px-4 bg-muted/20 rounded-xl border border-border/50">
                   {telegramUser ? (
                      <div className="flex items-center gap-2">
                         <div className="text-[8px] font-black uppercase">Connected as {telegramUser.first_name}</div>
                         <Button variant="ghost" size="sm" onClick={() => setTelegramUser(null)} className="h-6 text-[8px] uppercase font-black">Logout</Button>
                      </div>
                   ) : (
                      <TelegramLoginWidget 
                        botName={formData?.telegramBotUsername || 'skyhub_bot'} 
                        onAuth={setTelegramUser} 
                      />
                   )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {syncedPosts.length === 0 && (
                  <div className="p-20 text-center text-muted-foreground">
                    <CloudLightning className="w-12 h-12 mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No posts synchronized.</p>
                  </div>
                )}
                {syncedPosts.map((post, index) => (
                  <div key={index} className="p-6 hover:bg-muted/30 transition-colors">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] text-muted-foreground line-clamp-3 italic">&quot;{post.text}&quot;</p>
                        {post.buttons && post.buttons.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {post.buttons.map((btn: any, bIdx: number) => (
                              <Badge key={bIdx} variant="secondary" className="text-[8px] bg-primary/10 text-primary border-none">
                                {btn.text}: {btn.url.substring(0, 20)}...
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => handleExtractFromPost(post, index)} 
                          disabled={isExtractingPost[index]}
                          className="h-10 rounded-xl px-4 text-[8px] font-black uppercase"
                        >
                          {isExtractingPost[index] ? <Loader2 className="w-3 h-3 animate-spin" /> : "AI Extract"}
                        </Button>
                        <Button 
                          onClick={() => handleAddPost(post.text, index)} 
                          disabled={!!isAdding[index]}
                          className="h-10 rounded-xl px-4 text-[8px] font-black uppercase"
                        >
                          {isAdding[index] ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Raw Add'}
                        </Button>
                      </div>
                    </div>

                    {extractedData[index] && extractedData[index].length > 0 && (
                      <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/20 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-baseline mb-3">
                          <p className="text-[8px] font-black uppercase text-primary">AI Results Detected:</p>
                          <div className="flex gap-2">
                             <Input 
                               placeholder="Paste Google Photos Link" 
                               className="h-6 text-[8px] w-40 rounded-lg bg-card"
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') handleResolveLink((e.target as any).value, index, 'imageUrl');
                               }}
                             />
                          </div>
                        </div>
                        <div className="space-y-3">
                          {extractedData[index].map((rom, rIdx) => (
                            <div key={rIdx} className="flex flex-col gap-3 p-3 bg-card border border-border/50 rounded-xl shadow-sm">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-[10px] font-black">{rom.name}</h5>
                                  <p className="text-[8px] text-muted-foreground">{rom.device} • Android {rom.androidVersion} • Dev: {rom.author}</p>
                                </div>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCommitRom(rom, index)}
                                  className="h-8 rounded-lg text-[8px] font-black uppercase"
                                >
                                  Commit to DB
                                </Button>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2 items-center">
                                  {(rom.videoUrl || rom.imageUrl) && <MediaPreview src={rom.videoUrl || rom.imageUrl} className="w-8 h-8 rounded shrink-0 object-cover" alt="PRV" />}
                                  <div className="flex-1 space-y-1">
                                    <Input 
                                      placeholder="Thumbnail Image URL"
                                      value={rom.imageUrl || ''}
                                      onChange={(e) => {
                                        const newData = [...extractedData[index]];
                                        newData[rIdx].imageUrl = e.target.value;
                                        setExtractedData({ ...extractedData, [index]: newData });
                                      }}
                                      onBlur={(e) => {
                                        if (e.target.value.includes('google')) {
                                          handleResolveLink(e.target.value, index, 'imageUrl');
                                        }
                                      }}
                                      className="h-7 text-[8px] rounded-lg"
                                    />
                                    <Input 
                                      placeholder="Video Preview URL (Direct .mp4)"
                                      value={rom.videoUrl || ''}
                                      onChange={(e) => {
                                        const newData = [...extractedData[index]];
                                        newData[rIdx].videoUrl = e.target.value;
                                        setExtractedData({ ...extractedData, [index]: newData });
                                      }}
                                      className="h-7 text-[8px] rounded-lg"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 items-center">
                                  <div className="w-8 h-8 rounded shrink-0 bg-muted flex items-center justify-center text-[10px]">🎨</div>
                                  <Input 
                                    placeholder="Boot Animation Link (GIF/MP4)"
                                    value={rom.bootAnimationUrl || ''}
                                    onChange={(e) => {
                                      const newData = [...extractedData[index]];
                                      newData[rIdx].bootAnimationUrl = e.target.value;
                                      setExtractedData({ ...extractedData, [index]: newData });
                                    }}
                                    className="h-7 text-[8px] rounded-lg"
                                  />
                                </div>
                                <div className="flex gap-2 items-center">
                                  <div className="w-8 h-8 rounded shrink-0 bg-muted flex items-center justify-center text-[10px]">👤</div>
                                  <Input 
                                    placeholder="Developer Name"
                                    value={rom.author || ''}
                                    onChange={(e) => {
                                      const newData = [...extractedData[index]];
                                      newData[rIdx].author = e.target.value;
                                      setExtractedData({ ...extractedData, [index]: newData });
                                    }}
                                    className="h-7 text-[8px] rounded-lg"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 rounded-[2.5rem] border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest">Recent Extractions</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <TelegramExtractionLog />
            </CardContent>
          </Card>
        </TabsContent>
 
        <TabsContent value="activity">
           <ActivityLog />
        </TabsContent>
        
        <TabsContent value="ai">
          <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Bot className="w-4 h-4 text-primary" /> AI Terminal Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em]">Gemini API Key</Label>
                <div className="relative">
                  <Input 
                    type="password"
                    placeholder="Enter your Gemini API Key" 
                    value={formData?.geminiApiKey || ''} 
                    onChange={(e) => setFormData({...formData, geminiApiKey: e.target.value})}
                    className="h-12 rounded-xl bg-muted/50 border-border pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Bot className="w-4 h-4 opacity-30" />
                  </div>
                </div>
                <p className="text-[9px] text-muted-foreground px-2">
                  This key is used for the AI Terminal (Bulk Extraction). It remains encrypted within your private Firestore database.
                </p>
              </div>
              <Button 
                onClick={handleSave} 
                className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest"
              >
                <Save className="w-4 h-4 mr-2" /> Save AI Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

      <TabsContent value="layout">
          <div className="space-y-8">
            <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Site Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                 <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Site Name (Browser Title)</Label>
                    <Input 
                      value={formData?.siteName || ''}
                      onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SkyHub Protocol"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Brand Name (Navbar)</Label>
                    <Input 
                      value={formData?.brandName || ''}
                      onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SKYHUB"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Favicon URL</Label>
                    <Input 
                      value={formData?.faviconUrl || ''} 
                      onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter favicon URL"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Hero Title</Label>
                    <Input 
                      value={formData?.heroTitle || ''} 
                      onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter hero title"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Hero Subtitle</Label>
                    <Input 
                      value={formData?.heroSubtitle || ''} 
                      onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter hero subtitle"
                    />
                  </div>
                  <Button 
                    onClick={handleSave} 
                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest mt-4"
                  >
                    <Save className="w-4 h-4 mr-2" /> Save Site Identity
                  </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
              <CardHeader className="border-b border-border/50 bg-muted/30 flex items-center justify-between flex-row">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Menu className="w-4 h-4 text-primary" /> Site Architecture
                </CardTitle>
                <Badge variant="outline" className="text-[8px] uppercase tracking-widest">Dnd Enabled</Badge>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-4">Reorder and toggle visibility of homepage sections.</p>
                
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <div className="space-y-2">
                    <SortableContext
                      items={formData?.layoutConfig?.map((s: any) => s.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {formData?.layoutConfig?.map((section: any) => (
                        <SortableSectionItem 
                          key={section.id} 
                          id={section.id} 
                          section={section} 
                          onToggle={toggleSection} 
                        />
                      ))}
                    </SortableContext>
                  </div>
                </DndContext>

                <div className="pt-6">
                  <Button 
                    onClick={handleSave} 
                    className="w-full h-12 bg-primary text-primary-foreground rounded-xl font-black uppercase text-[10px] tracking-widest"
                  >
                    <Save className="w-4 h-4 mr-2" /> Commit New Architecture
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="rounded-[2.5rem] border-border bg-card overflow-hidden">
            <CardHeader className="border-b border-border/50 bg-muted/30">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> SEO & Site Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Search Engine Optimization</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Site Meta Title</Label>
                      <Input 
                        placeholder="Skyhub - Professional Hub"
                        value={formData?.seo?.title || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          seo: { ...(formData.seo || {}), title: e.target.value }
                        })}
                        className="h-12 rounded-xl bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Meta Description</Label>
                      <Input 
                        placeholder="A professional portal for custom ROMs..."
                        value={formData?.seo?.description || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          seo: { ...(formData.seo || {}), description: e.target.value }
                        })}
                        className="h-12 rounded-xl bg-muted/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Keywords</Label>
                      <Input 
                        placeholder="android, roms, custom, modules"
                        value={formData?.seo?.keywords || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          seo: { ...(formData.seo || {}), keywords: e.target.value }
                        })}
                        className="h-12 rounded-xl bg-muted/50 border-border"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Interface Dynamics</h4>
                   <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest opacity-70">Global Page Animation</Label>
                        <Select 
                          value={formData?.siteAnimation || 'fade'} 
                          onValueChange={(val) => setFormData({ ...formData, siteAnimation: val })}
                        >
                          <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-border">
                            <SelectValue placeholder="Select animation type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None / Instant</SelectItem>
                            <SelectItem value="fade">Smooth Fade</SelectItem>
                            <SelectItem value="slide">Dynamic Slide</SelectItem>
                            <SelectItem value="bounce">Bouncy Entrance</SelectItem>
                            <SelectItem value="zoom">Elastic Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[8px] text-muted-foreground">Applies a unique feel to the portal layout entrance.</p>
                      </div>
                   </div>
                </div>
              </div>

              <Button 
                onClick={handleSave} 
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20"
              >
                <Save className="w-4 h-4 mr-3" /> Commit Site Configuration
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        </div>
      </Tabs>

    </div>
  );
}

function TelegramExtractionLog() {
  const db = useFirestore();
  const logsQuery = useMemoFirebase(() => query(collection(db, 'telegram_logs'), orderBy('created_at', 'desc')), [db]);
  const { data: logs, isLoading: loading } = useCollection(logsQuery);

  if (loading) return <div className="p-8 text-center text-[10px] font-black uppercase opacity-50">Transmitting Logs...</div>;
  if (!logs || logs.length === 0) return <div className="p-8 text-center text-[10px] font-black uppercase opacity-50">No activity detected.</div>;

  return (
    <div className="divide-y divide-border">
      {logs.map((log: any) => (
        <div key={log.id} className="p-6 hover:bg-muted/30 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black text-primary uppercase">
              {log.extracted_count ? `${log.extracted_count} ROMs Extracted` : 'Extraction Failed'}
            </span>
            <span className="text-[8px] text-muted-foreground font-code">
              {log.created_at?.toDate().toLocaleString()}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-2 italic">
            &quot;{log.text || log.raw_text}&quot;
          </p>
          {log.error && (
            <p className="mt-2 text-[8px] text-red-500 font-code bg-red-500/10 p-2 rounded">
              ERROR: {log.error}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
