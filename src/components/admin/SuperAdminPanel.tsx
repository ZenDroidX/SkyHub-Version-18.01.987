'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Palette } from 'lucide-react';
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
import LayoutManager from './LayoutManager';
import { Slideshow } from '@/components/sections/slideshow';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SuperAdminPanel() {
  const { addNotification } = useNotifications();
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const [formData, setFormData] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedPosts, setSyncedPosts] = useState<string[]>([]);
  const [isAdding, setIsAdding] = useState<Record<number, boolean>>({});

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
    const duration = parseInt(durationStr) * 1000;
    await addDoc(collection(db, 'notifications'), { message, createdAt: serverTimestamp() });
    addNotification(message, duration);
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

  const handleSave = async () => {
    if (settingsRef && formData) {
      await updateDoc(settingsRef, formData);
      toast({ title: 'Settings updated!', description: 'Your changes have been applied successfully.' });
    }
  };

  if (!formData) return <div>Loading...</div>;

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
      
      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="flex flex-nowrap overflow-x-auto w-full justify-start pb-2 mb-4 scrollbar-hide">
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="slideshow">Slideshow</TabsTrigger>
          <TabsTrigger value="support">Support Links</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="theme">
          <div className="p-8 rounded-[2.5rem] bg-card border border-border shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Global Theme Registry</h3>
            <ThemeManager />
          </div>
        </TabsContent>

        <TabsContent value="slideshow">
          <Card>
            <CardHeader><CardTitle>Slideshow Images</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {formData.slideshowImages?.map((img: any, index: number) => (
                <div key={index} className={cn("grid grid-cols-4 gap-2 p-4 border rounded-lg", img.deleted && "opacity-50 bg-muted")}>
                  <Input placeholder="URL" value={img.url} onChange={(e) => {
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
                    value={notif.message} 
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

        <TabsContent value="layout">
          <Card>
            <CardHeader><CardTitle>Layout Manager</CardTitle></CardHeader>
            <CardContent>
              <LayoutManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
