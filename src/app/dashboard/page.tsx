
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useRouter, useSearchParams } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { 
  ArrowLeft, 
  Shield, 
  Cpu, 
  ImageIcon, 
  Search,
  Plus,
  Trash2,
  Loader2,
  Package,
  Smartphone,
  FileText,
  Zap,
  Crown,
  Pencil,
  ShieldAlert,
  Users,
  Video,
  Monitor,
  Code,
  Terminal,
  Globe,
  PlusCircle,
  Save,
  Wand2,
  List,
  CreditCard,
  UserCircle,
  Palette,
  ChevronUp,
  MessageCircle,
  Send,
  Link as LinkIcon,
  CloudLightning,
  Activity,
  Settings2,
  Download,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Bot,
  Upload,
  Image as LucideImage,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  useCollection, 
  useFirestore, 
  useMemoFirebase, 
  useUser, 
  useDoc, 
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useStorage
} from '@/firebase';
import { collection, doc, setDoc, getDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { logActivity } from '@/lib/activity-logger';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { DEFAULT_DONATION_CONFIG, StormConfig } from '@/lib/store';
import { themes } from '@/lib/themes';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { MessageHistory } from '@/components/admin/MessageHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractRoms, extractRomsFromRawHtml } from '@/ai/flows/extract-roms-flow';
import { motion, AnimatePresence } from 'framer-motion';
import SuperAdminPanel from '@/components/admin/SuperAdminPanel';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

const BOOT_SUGGESTIONS = [
  { title: 'Project Sky', mode: 'terminal', logs: ["INIT_BOOTLOADER", "MOUNTING_SYSTEM", "INJECT_ROOT", "SYNC_REGISTRY"] },
  { title: 'Nexus Protocol', mode: 'terminal', logs: ["STARTING_DAEMON", "CORE_SECURE_SYNC", "VERIFY_SIGNED_ROM", "BOOT_OS"] },
  { title: 'Turbo Mode', mode: 'circuit', logs: ["SNAPDRAGON_INIT", "OVERCLOCK_CORE", "ZRAM_ALLOCATION", "FORCE_60FPS"] },
  { title: 'Magisk Sync', mode: 'terminal', logs: ["MOUNTING_MAGISK", "LOADING_MODULES", "BYPASSING_SAFETYNET", "SYNCING_PROPS"] },
  { title: 'Kernel Node', mode: 'circuit', logs: ["LOAD_KERNEL_MODULES", "SET_GOVERNOR_SCHEDUTIL", "THERMAL_SYNC", "SYNC_IO_SCHED"] },
];

function StormEnvironmentFX({ config }: { config?: StormConfig }) {
  if (!config?.enabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-black/5">
      <motion.div
        animate={{ 
          opacity: [0, 0.2, 0],
        }}
        transition={{ 
          duration: 0.2, 
          repeat: Infinity, 
          repeatDelay: Math.max(2, 12 - (config.thunderFrequency || 5))
        }}
        className="absolute inset-0 bg-white"
      />
      {[...Array(Math.min(config.intensity || 3, 5))].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: Math.random() * 100 + '%' }}
          animate={{ 
            opacity: [0, 1, 0],
            scaleY: [0.8, 1, 0.8]
          }}
          transition={{ 
            duration: 0.15, 
            repeat: Infinity, 
            repeatDelay: Math.random() * 8,
            delay: Math.random() * 4
          }}
          className="absolute top-0 bottom-0 w-[2px] blur-[1px]"
          style={{ backgroundColor: config.color || '#2563eb' }}
        />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState<string>(initialTab || '');
  const [isAdding, setIsAdding] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkUrl, setBulkUrl] = useState('');
  const [bulkHtml, setBulkHtml] = useState('');
  const [bulkTelegramText, setBulkTelegramText] = useState('');
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [bulkAddLinks, setBulkAddLinks] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<any[]>([]);

  const [isBootAnimationEnabled, setIsBootAnimationEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [fetchedPosts, setFetchedPosts] = useState<string[]>([]);

  // Logo Management States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [editProfileImage, setEditProfileImage] = useState('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [gradientColors, setGradientColors] = useState({ color1: '#2563eb', color2: '#1e40af' });
  const [gradientDirection, setGradientDirection] = useState(90);
  const [useGradient, setUseGradient] = useState(false);

  const [siteName, setSiteName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [slideshowRounding, setSlideshowRounding] = useState(2); // 2rem default
  const [isSavingLayout, setIsSavingLayout] = useState(false);

  const { user: currentUser } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => currentUser ? doc(db, 'users', currentUser.uid) : null, [db, currentUser]);
  const { data: profile } = useDoc(userProfileRef);

  const isSuperAdmin = (currentUser?.email && HUB_OWNERS.includes(currentUser.email.toLowerCase())) || profile?.role === 'super_admin';
  const isAdminRole = profile?.role === 'admin';
  const isDeveloperRole = profile?.role === 'developer';

  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => doc(db, 'settings', 'global'), [db]);
  const { data: globalSettings } = useDoc(globalSettingsRef);

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditProfileImage(profile.profileImageUrl || '');
    }
  }, [profile]);

  useEffect(() => {
    if (globalSettings) {
      setSiteName(globalSettings.siteName || '');
      setBrandName(globalSettings.brandName || '');
      setHeroTitle(globalSettings.heroTitle || '');
      setHeroSubtitle(globalSettings.heroSubtitle || '');
      setFaviconUrl(globalSettings.faviconUrl || '');
      setSlideshowRounding(globalSettings.slideshowRounding ?? 2);
    }
  }, [globalSettings]);

  useEffect(() => {
    if (settings?.loading) {
      setIsBootAnimationEnabled(settings.loading.enabled !== false);
    }
  }, [settings]);

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: <UserCircle className="w-4 h-4" />, permission: 'all' },
    { id: 'themes', label: 'Themes', icon: <Palette className="w-4 h-4" />, permission: 'superAdminOnly' },
    { id: 'layout', label: 'Layout Manage', icon: <Settings2 className="w-4 h-4" />, permission: 'superAdminOnly' },
    { id: 'roms', label: 'Custom ROMs', icon: <Package className="w-4 h-4" />, permission: 'canManageRoms' },
    { id: 'modules', label: 'Modules', icon: <Smartphone className="w-4 h-4" />, permission: 'canManageModules' },
    { id: 'mod-apks', label: 'Mod APKs', icon: <ShieldAlert className="w-4 h-4" />, permission: 'canManageApks' },
    { id: 'guides', label: 'Protocols', icon: <FileText className="w-4 h-4" />, permission: 'canManageGuides' },
    { id: 'branding', label: 'Logo Mgmt', icon: <LucideImage className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'root', label: 'Root Protocol', icon: <Zap className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'live-wallpapers', label: 'Live Visuals', icon: <Video className="w-4 h-4" />, permission: 'canManageWallpapers' },
    { id: 'wallpapers', label: 'Wallpaper', icon: <ImageIcon className="w-4 h-4" />, permission: 'canManageWallpapers' },
    { id: 'visuals', label: 'Visual Protocols', icon: <Monitor className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'telegram-sync', label: 'Telegram Sync', icon: <CloudLightning className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'history', label: 'Message History', icon: <MessageCircle className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'users', label: 'Identity Mgmt', icon: <Users className="w-4 h-4" />, permission: 'adminOnly' }
  ].filter(item => {
    if (item.permission === 'all') return true;
    if (item.permission === 'superAdminOnly') return isSuperAdmin;
    if (isSuperAdmin || profile?.role === 'admin') return true;
    if (isDeveloperRole) {
      if (item.permission === 'adminOnly') return false;
      return profile?.[item.permission];
    }
    return false;
  });

  useEffect(() => {
    if (menuItems.length > 0 && !activeTab) {
      setActiveTab(menuItems[0].id);
    }
  }, [menuItems, activeTab]);

  const romsQuery = useMemoFirebase(() => query(collection(db, 'roms'), orderBy('createdAt', 'desc')), [db]);
  const modulesQuery = useMemoFirebase(() => query(collection(db, 'modules'), orderBy('createdAt', 'desc')), [db]);
  const apksQuery = useMemoFirebase(() => query(collection(db, 'mod-apks'), orderBy('createdAt', 'desc')), [db]);
  const usersQuery = useMemoFirebase(() => (isSuperAdmin || isAdminRole) ? query(collection(db, 'users'), orderBy('createdAt', 'desc')) : null, [db, isSuperAdmin, isAdminRole]);
  const wallpapersQuery = useMemoFirebase(() => query(collection(db, 'wallpapers'), orderBy('createdAt', 'desc')), [db]);
  const liveWallpapersQuery = useMemoFirebase(() => query(collection(db, 'live-wallpapers'), orderBy('createdAt', 'desc')), [db]);
  const guidesQuery = useMemoFirebase(() => query(collection(db, 'tutorials'), orderBy('createdAt', 'desc')), [db]);
  const rootQuery = useMemoFirebase(() => query(collection(db, 'root-packages'), orderBy('createdAt', 'desc')), [db]);

  const { data: roms } = useCollection(romsQuery);
  const { data: modules } = useCollection(modulesQuery);
  const { data: apks } = useCollection(apksQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: wallpapers } = useCollection(wallpapersQuery);
  const { data: liveWallpapers } = useCollection(liveWallpapersQuery);
  const { data: guides } = useCollection(guidesQuery);
  const { data: rootPackages } = useCollection(rootQuery);

  const handleAddPost = async (content: string, collectionName: string) => {
    setIsAdding(true);
    try {
      const collRef = collection(db, collectionName);
      const newDocRef = doc(collRef);
      await setDoc(newDocRef, {
        id: newDocRef.id,
        title: content.substring(0, 50) + '...',
        content: content,
        developer: profile?.username || 'Admin',
        createdAt: serverTimestamp(),
      });
      await logActivity(db, currentUser.uid, `Added post to ${collectionName}`);
      toast({ title: "Added to " + collectionName });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Failed to add", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast({ title: "Command Copied" });
    setTimeout(() => setCopiedText(null), 2000);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    setProfileImageFile(file);
    setEditProfileImage(URL.createObjectURL(file));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setIsSavingProfile(true);
    try {
      await updateDocumentNonBlocking(doc(db, 'users', currentUser.uid), {
        username: editUsername,
        profileImageUrl: editProfileImage
      });
      await logActivity(db, currentUser.uid, 'Updated profile');
      toast({ title: "Profile updated successfully" });
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFaviconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLayout = async () => {
    if (!isSuperAdmin) return;
    setIsSavingLayout(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), {
        siteName,
        brandName,
        heroTitle,
        heroSubtitle,
        gradient: useGradient ? { colors: gradientColors, direction: gradientDirection } : null,
        faviconUrl,
        slideshowRounding
      }, { merge: true });
      
      toast({ title: "Layout Settings Updated", description: "Global layout synchronized successfully." });
    } catch (error: any) {
      console.error(error);
      toast({ title: "Failed to update layout", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingLayout(false);
    }
  };

  const handleBulkExtract = async () => {
    if (!bulkUrl && !bulkHtml && !bulkTelegramText) return;
    setIsExtracting(true);
    try {
      let result = bulkUrl ? await extractRoms({ url: bulkUrl }) : await extractRomsFromRawHtml({ html: bulkHtml || bulkTelegramText });
      setExtractedItems(result.roms || []);
      toast({ title: "Extraction Complete" });
    } catch (e: any) { toast({ variant: "destructive", title: "Failed", description: e.message }); }
    finally { setIsExtracting(false); }
  };

  const handleSaveBulk = async () => {
    if (extractedItems.length === 0) return;
    setIsAdding(true);
    toast({ title: "Bulk Sync Initiated", description: "Adding items to the registry..." });
    try {
      // Determine collection based on active tab
      let collectionName = 'roms';
      if (activeTab === 'wallpapers') collectionName = 'wallpapers';
      else if (activeTab === 'live-wallpapers') collectionName = 'live-wallpapers';
      else if (activeTab === 'mod-apks') collectionName = 'mod-apks';
      else if (activeTab === 'modules') collectionName = 'modules';

      for (const item of extractedItems) {
        const collRef = collection(db, collectionName);
        const newDocRef = doc(collRef);
        await setDoc(newDocRef, {
          ...item,
          id: newDocRef.id,
          developer: profile?.username || 'Admin',
          createdAt: serverTimestamp(),
        });
      }
      setExtractedItems([]);
      setIsBulkDialogOpen(false);
      toast({ title: "Bulk Sync Successful", description: `${extractedItems.length} items have been added to ${collectionName}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkLinkSync = async () => {
    const lines = bulkLinksText.split('\n');
    const urls = lines
      .map(line => {
        const match = line.match(/https?:\/\/[^\s]+/);
        return match ? match[0] : null;
      })
      .filter((url): url is string => url !== null);
    
    if (urls.length === 0) {
      toast({ variant: "destructive", title: "No Links Found", description: "Please ensure you have pasted valid http/https links." });
      return;
    }
    
    // Determine collection based on active tab
    let collectionName = 'roms';
    if (activeTab === 'wallpapers') collectionName = 'wallpapers';
    else if (activeTab === 'live-wallpapers') collectionName = 'live-wallpapers';
    else if (activeTab === 'mod-apks') collectionName = 'mod-apks';
    else if (activeTab === 'modules') collectionName = 'modules';
    
    setIsAdding(true);
    toast({ title: "Series Sync Initiated", description: `Processing ${urls.length} links...` });
    
    let totalAdded = 0;
    try {
      for (const url of urls) {
        const result = await extractRoms({ url: url.trim() });
        if (result.roms && result.roms.length > 0) {
          for (const item of result.roms) {
            const collRef = collection(db, collectionName);
            const newDocRef = doc(collRef);
            await setDoc(newDocRef, {
              ...item,
              id: newDocRef.id,
              developer: profile?.username || 'Admin',
              createdAt: serverTimestamp(),
            });
            totalAdded++;
          }
        }
      }
      setBulkLinksText('');
      setIsBulkDialogOpen(false);
      toast({ title: "Series Sync Complete", description: `${totalAdded} resources identified and registered in ${collectionName}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Series Sync Failed", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleBulkAdd = async () => {
    const urls = bulkAddLinks.split('\n').filter(url => url.trim().startsWith('http'));
    if (urls.length === 0) {
      toast({ variant: "destructive", title: "No Links Found", description: "Please paste valid links." });
      return;
    }
    
    setIsAdding(true);
    toast({ title: "Bulk Add Initiated", description: `Registering ${urls.length} items...` });
    try {
      const collRef = collection(db, activeTab);
      for (const url of urls) {
        const newDocRef = doc(collRef);
        await setDoc(newDocRef, {
          imageUrl: url.trim(),
          name: `New Resource ${urls.indexOf(url) + 1}`,
          createdAt: serverTimestamp(),
          id: newDocRef.id,
          developer: profile?.username || 'Admin'
        });
      }
      setBulkAddLinks('');
      setIsBulkDialogOpen(false);
      toast({ title: "Bulk Add Complete", description: `Added ${urls.length} items to ${activeTab}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Bulk Add Failed", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!logoFile || !isSuperAdmin) return;
    setIsUploadingLogo(true);
    try {
      const storageRef = ref(storage, 'branding/logo');
      await uploadBytes(storageRef, logoFile);
      const url = await getDownloadURL(storageRef);
      
      await setDoc(settingsRef, { logoUrl: url }, { merge: true });
      toast({ title: "Branding Registry Updated", description: "Global logo synchronized successfully." });
      setLogoFile(null);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Upload Failed", description: e.message });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const docData = docSnap.data();

      await deleteDocumentNonBlocking(docRef);
      
      toast({ 
        title: "Removed from registry",
        description: "Item has been deleted.",
        action: (
          <ToastAction altText="Undo" onClick={async () => {
            try {
              await setDoc(doc(db, collectionName, id), docData);
              toast({ title: "Restored", description: "Item has been restored." });
            } catch (e) {
              toast({ variant: "destructive", title: "Failed to restore" });
            }
          }}>
            Undo
          </ToastAction>
        ),
        duration: 10000,
      });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleToggleBootAnimation = async (checked: boolean) => {
    if (!isSuperAdmin) return;
    setIsBootAnimationEnabled(checked);
    try {
      await setDoc(settingsRef, { loading: { ...settings?.loading, enabled: checked } }, { merge: true });
      toast({ title: "Boot Registry Synchronized" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
  };

  const handleToggleStormFX = async (checked: boolean) => {
    if (!isSuperAdmin) return;
    try {
      await setDoc(settingsRef, { stormFX: { ...(settings?.stormFX || DEFAULT_DONATION_CONFIG.stormFX), enabled: checked } }, { merge: true });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
  };

  const handleEditResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsAdding(true);
    const formData = new FormData(e.currentTarget);
    let collectionName = activeTab === 'guides' ? 'tutorials' : activeTab === 'root' ? 'root-packages' : activeTab;
    try {
      const docRef = doc(db, collectionName, editingItem.id);
      const data: any = { ...editingItem };
      formData.forEach((value, key) => {
        if (key === 'mirrors' || key === 'screenshots' || key === 'steps') {
          data[key] = (value as string).split('\n').filter(Boolean);
        } else {
          data[key] = value;
        }
      });
      await setDoc(docRef, data, { merge: true });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      toast({ title: "Resource Updated", description: "The registry has been updated." });
    } catch (e) { toast({ variant: "destructive", title: "Failed to update resource." }); }
    finally { setIsAdding(false); }
  };

  const filteredItems = (items: any[] | null) => {
    if (!items) return [];
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      (item.name || item.title || '').toLowerCase().includes(query) ||
      (item.developer || '').toLowerCase().includes(query) ||
      (item.description || item.content || '').toLowerCase().includes(query)
    );
  };

  const getActiveCollectionData = () => {
    switch(activeTab) {
      case 'roms': return roms;
      case 'modules': return modules;
      case 'mod-apks': return apks;
      case 'wallpapers': return wallpapers;
      case 'live-wallpapers': return liveWallpapers;
      case 'guides': return guides;
      case 'root': return rootPackages;
      case 'history': return [];
      default: return [];
    }
  };

  const activeStormConfig = settings?.stormFX || DEFAULT_DONATION_CONFIG.stormFX;
  const vercelWebhookUrl = `https://prixzz.in/api/telegram-webhook`;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 relative text-foreground">
      {isSuperAdmin && <StormEnvironmentFX config={activeStormConfig} />}
      
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" onClick={() => router.push('/')} className="rounded-2xl bg-card border border-border h-12 px-6">
            <ArrowLeft className="w-5 h-5 mr-3" /> Back to Hub
          </Button>
        </motion.div>
        <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px]", isSuperAdmin ? "bg-red-500/10 text-red-600" : "bg-blue-600/10 text-blue-600")}>
          {isSuperAdmin ? 'SUPER ADMIN' : isAdminRole ? 'ADMIN' : 'DEVELOPER'}
        </Badge>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.95, y: -5, boxShadow: "0 0 20px 5px rgba(255, 255, 255, 0.5)" }}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center justify-center gap-3 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase border flex-1 min-w-[140px]",
                activeTab === item.id 
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                  : "bg-card text-muted-foreground border-border hover:bg-muted hover:text-foreground"
              )}
            >
              {item.icon} <span className="opacity-100">{item.label}</span>
            </motion.button>
          ))}
        </div>

        <motion.div 
          layout 
          transition={{ duration: 0.4 }} 
          className="bg-card rounded-[2rem] p-8 min-h-[500px] border border-border shadow-2xl relative overflow-hidden"
        >
          {activeTab === 'profile' ? (
            <div className="space-y-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-4"><UserCircle className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">My Profile</h2></div>
              <Card className="p-8 rounded-[2.5rem] bg-muted/30 border-border space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Display Name</Label>
                  <Input 
                    value={editUsername} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    className="h-14 rounded-2xl bg-black/40 border-border" 
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Profile Image URL</Label>
                  <Input 
                    value={editProfileImage} 
                    onChange={(e) => setEditProfileImage(e.target.value)} 
                    className="h-14 rounded-2xl bg-black/40 border-border" 
                    placeholder="Enter profile image URL"
                  />
                </div>
                {editProfileImage && (
                  <div className="flex justify-center p-4">
                    <img src={editProfileImage} alt="Profile Preview" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                  </div>
                )}
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={isSavingProfile} 
                  className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest"
                >
                  {isSavingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Save Profile</>}
                </Button>
              </Card>
            </div>
          ) : activeTab === 'themes' ? (
            <SuperAdminPanel />
          ) : activeTab === 'layout' ? (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div className="flex items-center gap-4"><Settings2 className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Layout Management</h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2.5rem] bg-muted/30 border-border space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Site Configuration</h3>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">UI Scale</Label>
                    <Slider 
                      value={[100]} 
                      min={80} 
                      max={120} 
                      step={1} 
                      onValueChange={(val) => {
                        document.documentElement.style.setProperty('--ui-scale', `${val[0] / 100}`);
                      }}
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Site Name (Browser Title)</Label>
                    <Input 
                      value={siteName} 
                      onChange={(e) => setSiteName(e.target.value)} 
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SkyHub Protocol"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Brand Name (Navbar)</Label>
                    <Input 
                      value={brandName} 
                      onChange={(e) => setBrandName(e.target.value)} 
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SKYHUB"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Favicon URL</Label>
                    <Input 
                      value={faviconUrl} 
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter favicon URL"
                    />
                  </div>
                  {faviconUrl && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Favicon Preview</Label>
                      <div className="p-6 bg-black/40 rounded-2xl border border-border flex items-center justify-center">
                        <img src={faviconUrl} className="w-12 h-12 object-contain" alt="Favicon Preview" />
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Slideshow Image Rounding (rem)</Label>
                    <Slider 
                      value={[slideshowRounding]} 
                      min={0} 
                      max={4} 
                      step={0.1} 
                      onValueChange={(val) => setSlideshowRounding(val[0])}
                    />
                  </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] bg-muted/30 border-border space-y-6">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-6">Gradient Configuration</h3>
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Enable Gradient Background</Label>
                    <Switch checked={useGradient} onCheckedChange={setUseGradient} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Color 1</Label>
                      <Input type="color" value={gradientColors.color1} onChange={(e) => setGradientColors({...gradientColors, color1: e.target.value})} className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Color 2</Label>
                      <Input type="color" value={gradientColors.color2} onChange={(e) => setGradientColors({...gradientColors, color2: e.target.value})} className="h-10 w-full" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Direction ({gradientDirection}°)</Label>
                    <Slider value={[gradientDirection]} min={0} max={360} step={1} onValueChange={(val) => setGradientDirection(val[0])} />
                  </div>
                </Card>
              </div>
              <Button 
                onClick={handleSaveLayout} 
                disabled={isSavingLayout} 
                className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest"
              >
                {isSavingLayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Synchronize Layout Settings</>}
              </Button>
            </div>
          ) : activeTab === 'branding' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><LucideImage className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Logo Management</h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <Card className="p-8 rounded-[2.5rem] bg-muted/30 border-border space-y-6">
                    <div className="flex flex-col gap-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Upload New Signature</Label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleLogoChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="h-40 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 group-hover:border-primary/50 transition-all">
                          <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary" />
                          <p className="text-[9px] font-black uppercase text-muted-foreground">Select PNG/SVG Resource</p>
                        </div>
                      </div>
                    </div>

                    {logoPreview && (
                      <div className="space-y-4">
                        <Label className="text-[10px] font-black uppercase tracking-widest">Initialization Preview</Label>
                        <div className="p-6 bg-black/40 rounded-2xl border border-border flex items-center justify-center">
                          <img src={logoPreview} className="max-h-20 object-contain" alt="Preview" />
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={handleSaveLogo} 
                      disabled={!logoFile || isUploadingLogo} 
                      className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black uppercase text-[10px] tracking-widest"
                    >
                      {isUploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-4 h-4 mr-2" /> Commit to Registry</>}
                    </Button>
                  </Card>
                </div>

                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-primary/5 border border-primary/20 space-y-6">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Active Identity</Label>
                    <div className="h-48 glass border-white/5 rounded-3xl flex items-center justify-center p-8">
                      {settings?.logoUrl ? (
                        <img src={settings.logoUrl} className="max-h-full object-contain" alt="Current Logo" />
                      ) : (
                        <p className="text-[10px] font-black uppercase text-muted-foreground italic">Standard Typography Active</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'visuals' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><Monitor className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Visual Protocols</h2></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-6 rounded-2xl bg-muted/50 border border-border">
                    <Label className="text-[10px] font-black uppercase">Enable Boot Animation</Label>
                    <Switch checked={isBootAnimationEnabled} onCheckedChange={handleToggleBootAnimation} disabled={!isSuperAdmin} />
                  </div>
                  {isSuperAdmin && (
                    <Card className="p-8 rounded-[2rem] bg-primary/5 space-y-6 border-primary/20">
                      <div className="flex items-center justify-between"><Label className="text-[10px] font-black uppercase">Storm Protocol (Storm FX)</Label><Switch checked={activeStormConfig.enabled} onCheckedChange={handleToggleStormFX} /></div>
                      <div className="space-y-4">
                        <Label className="text-[9px] font-black uppercase">Intensity: {activeStormConfig.intensity}</Label>
                        <Slider defaultValue={[activeStormConfig.intensity]} max={10} min={1} onValueChange={([v]) => updateDocumentNonBlocking(settingsRef, { stormFX: { ...activeStormConfig, intensity: v } })} />
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'telegram-sync' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><CloudLightning className="w-8 h-8 text-blue-500" /><h2 className="text-3xl font-black uppercase">Telegram Synchronizer</h2></div>
              <Card className="p-8 rounded-[2rem] bg-muted/30 border-border space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase">Telegram Channel URL</Label>
                  <div className="flex gap-4">
                    <Input 
                      id="telegram-url"
                      placeholder="https://t.me/s/yourchannel" 
                      className="bg-black/20 border-border h-12 rounded-xl font-code text-[10px] flex-1" 
                    />
                    <Button 
                      onClick={async () => {
                        const url = (document.getElementById('telegram-url') as HTMLInputElement)?.value;
                        if (!url) {
                          toast({ variant: "destructive", title: "URL Required" });
                          return;
                        }
                        try {
                          toast({ title: "Syncing...", description: "Fetching posts from Telegram." });
                          const res = await fetch('/api/telegram', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ url })
                          });
                          const data = await res.json();
                          if (data.error) throw new Error(data.error);
                          
                          setFetchedPosts(data.posts.filter((post: string) => post.trim().length > 10));
                          toast({ title: "Sync Complete", description: `Fetched ${data.posts.length} posts.` });
                        } catch (e: any) {
                          toast({ variant: "destructive", title: "Sync Failed", description: e.message });
                        }
                      }}
                      className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] px-8"
                    >
                      Sync Latest Posts
                    </Button>
                  </div>
                </div>
                {fetchedPosts.length > 0 && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <h3 className="text-sm font-black uppercase">Fetched Posts</h3>
                    {fetchedPosts.map((post, index) => (
                      <Card key={index} className="p-4 bg-black/20 border-border">
                        <p className="text-xs text-muted-foreground mb-4">{post.substring(0, 100)}...</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" className="text-[9px]" onClick={() => handleAddPost(post, 'tutorials')}>Add to Tutorials</Button>
                          <Button size="sm" className="text-[9px]" onClick={() => handleAddPost(post, 'roms')}>Add to ROMs</Button>
                          <Button size="sm" className="text-[9px]" onClick={() => handleAddPost(post, 'modules')}>Add to Modules</Button>
                          <Button size="sm" className="text-[9px]" onClick={() => handleAddPost(post, 'tutorials')}>Add to Guides</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                <div className="space-y-4 pt-4 border-t border-border">
                  <Label className="text-[10px] font-black uppercase">Webhook Endpoint (Vercel)</Label>
                  <div className="relative">
                    <Input readOnly value={vercelWebhookUrl} className="bg-black/20 border-border h-12 rounded-xl font-code text-[10px] pr-12 text-blue-400" />
                    <Button variant="ghost" size="icon" onClick={() => handleCopy(vercelWebhookUrl, 'webhook')} className="absolute right-2 top-1/2 -translate-y-1/2"><Copy className="w-3 h-3" /></Button>
                  </div>
                </div>
              </Card>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><Users className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Identity Management</h2></div>
              <div className="grid grid-cols-1 gap-4">
                {users?.map((u) => (
                  <Card key={u.id} className="p-6 rounded-3xl bg-muted/30 border-border flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        {u.profileImageUrl ? (
                          <img src={u.profileImageUrl} className="w-full h-full object-cover" alt="Profile" />
                        ) : (
                          <UserCircle className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black uppercase text-sm truncate">{u.username || 'Anonymous Hub Node'}</h4>
                        <p className="text-[9px] uppercase text-muted-foreground truncate">{u.email}</p>
                        <Badge variant="outline" className="mt-1 text-[8px] font-black uppercase border-primary/20 text-primary">
                          {u.role || 'user'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 bg-black/20 p-2 rounded-xl border border-border">
                        <Label className="text-[8px] font-black uppercase px-2 text-muted-foreground">Clearance:</Label>
                        <Select 
                          disabled={(u.email && HUB_OWNERS.includes(u.email.toLowerCase())) || (u.role === 'super_admin' && !isSuperAdmin)} 
                          value={u.role || 'user'} 
                          onValueChange={(val) => updateDocumentNonBlocking(doc(db, 'users', u.id), { role: val })}
                        >
                          <SelectTrigger className="h-8 w-28 text-[9px] font-black uppercase rounded-lg border-none bg-transparent hover:bg-white/5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>

                      {(u.role === 'developer' || u.role === 'admin') && (
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'canManageRoms', label: 'ROMs' },
                            { id: 'canManageModules', label: 'Mods' },
                            { id: 'canManageApks', label: 'APKs' },
                            { id: 'canManageWallpapers', label: 'Walls' },
                            { id: 'canManageGuides', label: 'Guides' },
                            { id: 'canPromoteToAdmin', label: 'Promote Admin' },
                            { id: 'canPromoteToDeveloper', label: 'Promote Dev' },
                            { id: 'canManageUsers', label: 'Manage Users' },
                          ].map((perm) => (
                            <div key={perm.id} className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg border border-border/50">
                              <Label className="text-[7px] font-black uppercase text-muted-foreground">{perm.label}</Label>
                              <Switch 
                                className="scale-75 data-[state=checked]:bg-primary"
                                checked={!!u[perm.id]} 
                                onCheckedChange={(checked) => updateDocumentNonBlocking(doc(db, 'users', u.id), { [perm.id]: checked })} 
                                disabled={!isSuperAdmin && !(isAdminRole && profile?.canManageUsers)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase">{menuItems.find(i => i.id === activeTab)?.label}</h2>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Managing Global Registry Node</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="SEARCH REGISTRY..." 
                      className="h-12 w-48 sm:w-64 pl-12 rounded-xl bg-muted/50 border-border font-black text-[10px] uppercase"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="h-12 rounded-xl border-primary text-primary uppercase text-[10px]">Bulk Import</Button>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 rounded-xl bg-primary text-white uppercase text-[10px]">Add New</Button>
                </div>
              </div>

              <div className={cn("grid grid-cols-1", activeTab !== 'history' && "gap-2")}>
                {activeTab === 'history' ? (
                  <MessageHistory />
                ) : (
                  filteredItems(getActiveCollectionData()).map((item) => (
                    <motion.div layout key={item.id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-card border border-border gap-4">
                    <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border/10">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black uppercase text-sm truncate">{item.name || item.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/10 text-primary py-0">
                            {item.developer || 'Admin'}
                          </Badge>
                          <span className="text-[8px] text-muted-foreground uppercase font-medium">{item.androidVersion ? `Android ${item.androidVersion}` : activeTab}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }} className="text-primary hover:bg-primary/10 rounded-xl">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(activeTab === 'guides' ? 'tutorials' : activeTab === 'root' ? 'root-packages' : activeTab, item.id)} className="text-red-600 hover:bg-red-600/10 rounded-xl">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </motion.div>
                )))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-card rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="uppercase font-black">Add New {menuItems.find(i => i.id === activeTab)?.label}</DialogTitle>
          </DialogHeader>
          <form onSubmit={async (e) => {
            e.preventDefault();
            setIsAdding(true);
            const formData = new FormData(e.currentTarget);
            const collectionName = activeTab === 'guides' ? 'tutorials' : activeTab === 'root' ? 'root-packages' : activeTab;
            try {
              const collRef = collection(db, collectionName);
              const newDocRef = doc(collRef);
              const data: any = { id: newDocRef.id, createdAt: serverTimestamp(), developer: profile?.username || 'Admin' };
              formData.forEach((value, key) => {
                if (key === 'mirrors' || key === 'screenshots' || key === 'steps') {
                  data[key] = (value as string).split('\n').filter(Boolean);
                } else {
                  data[key] = value;
                }
              });
              await setDoc(newDocRef, data);
              setIsAddDialogOpen(false);
              toast({ title: "Resource Added", description: "The registry has been updated." });
            } catch (e) { toast({ variant: "destructive", title: "Failed to add resource." }); }
            finally { setIsAdding(false); }
          }} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Identity Name</Label>
                <Input name={activeTab === 'guides' ? 'title' : 'name'} required className="bg-muted rounded-xl h-12" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Telegram Channel Link</Label>
                <Input name="telegramLink" placeholder="https://t.me/..." className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Discussion Channel Link</Label>
                <Input name="discussionLink" placeholder="https://t.me/..." className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Payment Mode</Label>
                <Input name="paymentMode" placeholder="E.g. Free, Paid, Donation" className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Main Developer Credit</Label>
                <Input name="developerCredit" placeholder="E.g. Developer Name" className="bg-muted rounded-xl h-12" />
              </div>
              
              {activeTab === 'roms' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Android Version</Label>
                  <Input name="androidVersion" placeholder="E.g. 15" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {activeTab === 'guides' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Category</Label>
                  <Input name="category" placeholder="E.g. Technical" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {activeTab !== 'guides' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Registry Download URL</Label>
                  <Input name="downloadUrl" placeholder="Direct or Mirror Link" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Visual Preview URL</Label>
                <Input name="imageUrl" placeholder="HTTPS Asset Link" className="bg-muted rounded-xl h-12" />
              </div>

              {(activeTab === 'roms' || activeTab === 'wallpapers' || activeTab === 'live-wallpapers') && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Category / Tag</Label>
                  <Input name="category" placeholder="E.g. AOSP, Nature, 60fps" className="bg-muted rounded-xl h-12" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase ml-1">{activeTab === 'guides' ? 'Tutorial Content' : 'Description Registry'}</Label>
              <Textarea name={activeTab === 'guides' ? 'content' : 'description'} required className="bg-muted min-h-[150px] rounded-2xl" />
            </div>

            {activeTab === 'roms' && (
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">System Screenshots (One URL per line)</Label>
                <Textarea name="screenshots" placeholder="Mirror URL 1\nMirror URL 2" className="bg-muted min-h-[100px] rounded-2xl" />
              </div>
            )}

            {activeTab === 'root' && (
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Installation Protocols (One per line)</Label>
                <Textarea name="steps" placeholder="1. Flash via Recovery\n2. Wipe Cache" className="bg-muted min-h-[100px] rounded-2xl" />
              </div>
            )}

            <Button type="submit" disabled={isAdding} className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl mt-4">
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Add to Global Registry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className="bg-card rounded-[2.5rem] p-8 max-w-2xl border-border">
          <DialogHeader><DialogTitle className="uppercase font-black">Bulk Sync Terminal</DialogTitle></DialogHeader>
          <Tabs defaultValue="telegram" className="mt-4">
            <TabsList className="grid w-full grid-cols-3 h-12 mb-6 bg-muted p-1">
              <TabsTrigger value="telegram" className="text-[9px] uppercase font-black">Telegram AI</TabsTrigger>
              <TabsTrigger value="links" className="text-[9px] uppercase font-black">Link Series</TabsTrigger>
              <TabsTrigger value="bulk" className="text-[9px] uppercase font-black">Bulk Add</TabsTrigger>
            </TabsList>
            <TabsContent value="telegram" className="space-y-6">
              <Textarea value={bulkTelegramText} onChange={(e) => setBulkTelegramText(e.target.value)} placeholder="PASTE TELEGRAM BROADCAST CONTENT..." className="bg-muted min-h-[250px] rounded-2xl p-6 text-[10px] font-code" />
              <Button onClick={handleBulkExtract} disabled={isExtracting} className="w-full h-12 bg-blue-600 text-white uppercase text-[10px] font-black tracking-widest rounded-xl">
                {isExtracting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Analyze Transmission'}
              </Button>
              {extractedItems.length > 0 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 max-h-[200px] overflow-y-auto">
                    <p className="text-[8px] font-black uppercase text-blue-400 mb-2">Detected Protocols:</p>
                    {extractedItems.map((item, idx) => (
                      <div key={idx} className="text-[9px] text-muted-foreground uppercase mb-1">• {item.name} ({item.androidVersion || 'N/A'})</div>
                    ))}
                  </div>
                  <Button onClick={handleSaveBulk} disabled={isAdding} className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl">Sync {extractedItems.length} Resources</Button>
                </div>
              )}
            </TabsContent>
            <TabsContent value="links" className="space-y-6">
              <Textarea value={bulkLinksText} onChange={(e) => setBulkLinksText(e.target.value)} placeholder="PASTE ONE LINK PER LINE FOR AUTO-SCANNING..." className="bg-muted min-h-[300px] rounded-2xl p-6 text-[10px] font-code" />
              <Button onClick={handleBulkLinkSync} disabled={isAdding} className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl">Initialize Link Sync Series</Button>
            </TabsContent>
            <TabsContent value="bulk" className="space-y-6">
              <Textarea value={bulkAddLinks} onChange={(e) => setBulkAddLinks(e.target.value)} placeholder="PASTE IMAGE LINKS (ONE PER LINE)..." className="bg-muted min-h-[300px] rounded-2xl p-6 text-[10px] font-code" />
              <Button onClick={handleBulkAdd} disabled={isAdding} className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl">Add to {menuItems.find(i => i.id === activeTab)?.label}</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto border-border">
          <DialogHeader>
            <DialogTitle className="uppercase font-black">Edit Resource Protocol</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditResource} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Identity Name</Label>
                <Input name={activeTab === 'guides' ? 'title' : 'name'} defaultValue={editingItem?.name || editingItem?.title} required className="bg-muted rounded-xl h-12" />
              </div>
              
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Telegram Channel Link</Label>
                <Input name="telegramLink" defaultValue={editingItem?.telegramLink} placeholder="https://t.me/..." className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Discussion Channel Link</Label>
                <Input name="discussionLink" defaultValue={editingItem?.discussionLink} placeholder="https://t.me/..." className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Payment Mode</Label>
                <Input name="paymentMode" defaultValue={editingItem?.paymentMode} placeholder="E.g. Free, Paid, Donation" className="bg-muted rounded-xl h-12" />
              </div>
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Main Developer Credit</Label>
                <Input name="developerCredit" defaultValue={editingItem?.developerCredit} placeholder="E.g. Developer Name" className="bg-muted rounded-xl h-12" />
              </div>
              
              {activeTab === 'roms' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Android Version</Label>
                  <Input name="androidVersion" defaultValue={editingItem?.androidVersion} placeholder="E.g. 15" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {activeTab === 'guides' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Category</Label>
                  <Input name="category" defaultValue={editingItem?.category} placeholder="E.g. Technical" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {activeTab !== 'guides' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Registry Download URL</Label>
                  <Input name="downloadUrl" defaultValue={editingItem?.downloadUrl} placeholder="Direct or Mirror Link" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Visual Preview URL</Label>
                <Input name="imageUrl" defaultValue={editingItem?.imageUrl} placeholder="HTTPS Asset Link" className="bg-muted rounded-xl h-12" />
              </div>

              {(activeTab === 'roms' || activeTab === 'wallpapers' || activeTab === 'live-wallpapers') && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Category / Tag</Label>
                  <Input name="category" defaultValue={editingItem?.category} placeholder="E.g. AOSP, Nature, 60fps" className="bg-muted rounded-xl h-12" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase ml-1">{activeTab === 'guides' ? 'Tutorial Content' : 'Description Registry'}</Label>
              <Textarea name={activeTab === 'guides' ? 'content' : 'description'} defaultValue={editingItem?.description || editingItem?.content} required className="bg-muted min-h-[150px] rounded-2xl" />
            </div>

            {activeTab === 'roms' && (
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">System Screenshots (One URL per line)</Label>
                <Textarea name="screenshots" defaultValue={editingItem?.screenshots?.join('\n')} placeholder="Mirror URL 1\nMirror URL 2" className="bg-muted min-h-[100px] rounded-2xl" />
              </div>
            )}

            {activeTab === 'root' && (
              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase ml-1">Installation Protocols (One per line)</Label>
                <Textarea name="steps" defaultValue={editingItem?.steps?.join('\n')} placeholder="1. Flash via Recovery\n2. Wipe Cache" className="bg-muted min-h-[100px] rounded-2xl" />
              </div>
            )}

            <Button type="submit" disabled={isAdding} className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl mt-4">
              {isAdding ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Global Registry"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
