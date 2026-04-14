'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Palette } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import ThemeManager from './ThemeManager';
import LayoutManager from './LayoutManager';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function SuperAdminPanel() {
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
      <div className="flex items-center gap-4">
        <Palette className="w-8 h-8 text-primary" />
        <h2 className="text-3xl font-black uppercase">Super Admin Panel</h2>
      </div>
      
      <Tabs defaultValue="theme" className="w-full">
        <TabsList>
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
                  <Input placeholder="Orientation" value={img.orientation} onChange={(e) => {
                    const newImages = [...formData.slideshowImages];
                    newImages[index].orientation = e.target.value;
                    setFormData({...formData, slideshowImages: newImages});
                  }} />
                  <Input placeholder="Size" value={img.size} onChange={(e) => {
                    const newImages = [...formData.slideshowImages];
                    newImages[index].size = e.target.value;
                    setFormData({...formData, slideshowImages: newImages});
                  }} />
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
              <Button onClick={() => setFormData({...formData, slideshowImages: [...(formData.slideshowImages || []), {url: '', orientation: '', size: '', deleted: false}]})}>Add Image</Button>
              <Button onClick={handleSave}>Save Changes</Button>
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
            <CardContent className="space-y-4">
              {formData.notifications?.map((notif: any, index: number) => (
                <div key={index} className="grid grid-cols-2 gap-2 p-4 border rounded-lg">
                  <Input placeholder="Message" value={notif.message} onChange={(e) => {
                    const newNotifs = [...formData.notifications];
                    newNotifs[index].message = e.target.value;
                    setFormData({...formData, notifications: newNotifs});
                  }} />
                  <Input type="datetime-local" value={notif.scheduledTime} onChange={(e) => {
                    const newNotifs = [...formData.notifications];
                    newNotifs[index].scheduledTime = e.target.value;
                    setFormData({...formData, notifications: newNotifs});
                  }} />
                </div>
              ))}
              <Button onClick={() => setFormData({...formData, notifications: [...(formData.notifications || []), {message: '', scheduledTime: ''}]})}>Add Notification</Button>
              <Button onClick={handleSave}>Save Changes</Button>
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
