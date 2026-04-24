'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection, useStorage } from '@/firebase';
import { doc, updateDoc, deleteDoc, query, orderBy, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Palette, Shield, User, Camera, Upload, Loader2, Save, CloudLightning } from 'lucide-react';
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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logActivity } from '@/lib/activity-logger';
import { useAuth } from '@/firebase';

export default function SuperAdminPanel() {
  const { addNotification } = useNotifications();
  const db = useFirestore();
  const auth = useAuth();
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const identityRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: identity } = useDoc(identityRef);
  const storage = useStorage();

  const [formData, setFormData] = useState<any>(null);
  const [identityData, setIdentityData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedPosts, setSyncedPosts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState<Record<number, boolean>>({});
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncedPosts([]);
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: settings.socialLinks.telegramChannel }),
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

  const [notificationsQuery] = useMemoFirebase(() => [query(collection(db, 'notifications'), orderBy('createdAt', 'desc'))], [db]);
  const { data: notifications } = useCollection(notificationsQuery[0]);
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
        url: settings.socialLinks.telegramChannel,
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
      setFormData(settings);
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
          <TabsTrigger value="posts" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Posts</TabsTrigger>
          <TabsTrigger value="activity" className="justify-start px-6 h-12 rounded-2xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-widest border border-border/50">Activity Log</TabsTrigger>
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
                  <div className="flex gap-2">
                    <Input 
                      placeholder="HTTPS image URL" 
                      value={identityData?.adminAvatarUrl || ''} 
                      onChange={(e) => setIdentityData({...identityData, adminAvatarUrl: e.target.value})}
                      className="h-12 rounded-xl bg-muted/50 border-border flex-1"
                    />
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
                        <img 
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
                        {(avatarPreview || identityData?.adminAvatarUrl) && <img src={avatarPreview || identityData.adminAvatarUrl} className="w-full h-full object-cover" />}
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
                    <Input type="number" placeholder="400" value={img.size?.replace('px', '') || 400} onChange={(e) => {
                      const newImages = [...formData.slideshowImages];
                      newImages[index].size = `${e.target.value}px`;
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
          <Card>
            <CardHeader><CardTitle>Support Links</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Link</Label>
                <Input value={formData.supportLinks?.paymentLink || ''} onChange={(e) => setFormData({...formData, supportLinks: {...formData.supportLinks, paymentLink: e.target.value}})} />
              </div>
              <div className="space-y-2">
                <Label>QR Link</Label>
                <Input value={formData.supportLinks?.qrLink || ''} onChange={(e) => setFormData({...formData, supportLinks: {...formData.supportLinks, qrLink: e.target.value}})} />
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
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

        <TabsContent value="posts">
          <Card>
            <CardHeader><CardTitle>Telegram Posts</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleSync} disabled={isSyncing}>{isSyncing ? 'Syncing...' : 'Sync Latest Posts'}</Button>
              <div className="grid gap-4 mt-4">
                {syncedPosts.map((post, index) => (
                  <div key={index} className="p-4 border rounded-lg flex justify-between items-center">
                    <p className="text-sm truncate mr-4">{post}</p>
                    <Button onClick={() => handleAddPost(post, index)} disabled={!!isAdding[index]}>{isAdding[index] ? 'Adding...' : 'Add to Site'}</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
           <ActivityLog />
        </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
