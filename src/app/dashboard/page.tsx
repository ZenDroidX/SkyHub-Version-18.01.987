
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useDropzone } from 'react-dropzone';
import { useRouter, useSearchParams } from 'next/navigation';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { 
  LogOut,
  Menu,
  Sun,
  Moon,
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
  useAuth,
  deleteDocumentNonBlocking,
  updateDocumentNonBlocking,
  useStorage
} from '@/firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { cn } from '@/lib/utils';
import { MediaPreview } from '@/components/MediaPreview';
import { logActivity } from '@/lib/activity-logger';
import { extractRoms } from '@/ai/flows/extract-roms-flow';
import { toast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { DEFAULT_DONATION_CONFIG, StormConfig } from '@/lib/store';
import { themes } from '@/lib/themes';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { MessageHistory } from '@/components/admin/MessageHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractFromContent } from '@/ai/client-ai';
import { motion, AnimatePresence } from 'framer-motion';
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

function SortableSidebarItem({ 
  item, 
  activeTab, 
  setActiveTab, 
  isSuperAdmin 
}: { 
  item: any, 
  activeTab: string, 
  setActiveTab: (id: string) => void,
  isSuperAdmin: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      id={`sidebar-item-${item.id}`}
      style={style}
      className={cn(
        "relative group flex shrink-0 snap-center snap-always",
        isDragging && "opacity-50"
      )}
    >
      <motion.button
        whileHover={!isDragging ? { scale: 1.02, backgroundColor: "rgba(var(--primary), 0.1)" } : {}}
        whileTap={!isDragging ? { scale: 0.98 } : {}}
        onClick={() => setActiveTab(item.id)}
        className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-2xl transition-all font-black text-[10px] uppercase border text-left min-w-max lg:w-full snap-center",
          activeTab === item.id 
            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
            : "bg-transparent text-muted-foreground border-transparent hover:border-border/50 hover:text-foreground"
        )}
      >
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0",
          activeTab === item.id ? "bg-white/20" : "bg-muted"
        )}>
          {item.icon}
        </div>
        <span className="flex-1 uppercase tracking-widest whitespace-nowrap">{item.label}</span>
        
        {activeTab === item.id && (
          <motion.div 
            layoutId="activeTabIndicator"
            className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_#fff] animate-pulse shrink-0" 
          />
        )}
      </motion.button>
      
      {isSuperAdmin && (
        <div 
          {...attributes}
          {...listeners}
          className="absolute -top-2 -right-2 w-8 h-8 bg-background border border-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing z-50 touch-none"
        >
           <Menu className="w-3 h-3 rotate-90 text-primary" />
        </div>
      )}
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
  const [selectedExtractedIndices, setSelectedExtractedIndices] = useState<number[]>([]);

  const [isBootAnimationEnabled, setIsBootAnimationEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [fetchedPosts, setFetchedPosts] = useState<string[]>([]);

  // Logo Management States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [sidebarOrder, setSidebarOrder] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 20, // Increased distance to avoid accidental drag while selecting/scrolling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    // Scroll active tab into view on mobile slider
    const activeElement = document.getElementById(`sidebar-item-${activeTab}`);
    if (activeElement) {
      activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab]);

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
  const [romRequestFormUrl, setRomRequestFormUrl] = useState('');
  const [slideshowRounding, setSlideshowRounding] = useState(2); // 2rem default
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  const { user: currentUser } = useUser();
  const auth = useAuth();
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
      setRomRequestFormUrl(globalSettings.romRequestFormUrl || '');
      setSlideshowRounding(globalSettings.slideshowRounding ?? 2);
      if (globalSettings.dashboardSidebarOrder) {
        setSidebarOrder(globalSettings.dashboardSidebarOrder);
      }
    }
  }, [globalSettings]);

  useEffect(() => {
    if (settings?.loading) {
      setIsBootAnimationEnabled(settings.loading.enabled !== false);
    }
  }, [settings]);

  useEffect(() => {
    if (!isBulkDialogOpen) {
      setExtractedItems([]);
      setSelectedExtractedIndices([]);
    }
  }, [isBulkDialogOpen]);

  const baseMenuItems = [
    { id: 'profile', label: 'My Profile', icon: <UserCircle className="w-4 h-4" />, permission: 'all' },
    { id: 'themes', label: 'Themes', icon: <Palette className="w-4 h-4" />, permission: 'superAdminOnly' },
    { id: 'roms', label: 'Custom ROMs', icon: <Package className="w-4 h-4" />, permission: 'canManageRoms' },
    { id: 'modules', label: 'Modules', icon: <Smartphone className="w-4 h-4" />, permission: 'canManageModules' },
    { id: 'mod-apks', label: 'Mod APKs', icon: <ShieldAlert className="w-4 h-4" />, permission: 'canManageApks' },
    { id: 'guides', label: 'Protocols', icon: <FileText className="w-4 h-4" />, permission: 'canManageGuides' },
    { id: 'branding', label: 'Logo Mgmt', icon: <LucideImage className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'root', label: 'Root Protocol', icon: <Zap className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'visuals', label: 'Visual Protocols', icon: <Monitor className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'ai-extract', label: 'AI Terminal', icon: <Bot className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'telegram-sync', label: 'Telegram Sync', icon: <CloudLightning className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'history', label: 'Message History', icon: <MessageCircle className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'users', label: 'Identity Mgmt', icon: <Users className="w-4 h-4" />, permission: 'adminOnly' },
    { id: 'payments', label: 'Payment Hub', icon: <CreditCard className="w-4 h-4" />, permission: 'superAdminOnly' },
    { id: 'maintenance', label: 'Maintenance Hub', icon: <Zap className="w-4 h-4" />, permission: 'superAdminOnly' }
  ];

  const menuItems = [...baseMenuItems].sort((a, b) => {
    const aIndex = sidebarOrder.indexOf(a.id);
    const bIndex = sidebarOrder.indexOf(b.id);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  }).filter(item => {
    if (item.permission === 'all') return true;
    if (item.permission === 'superAdminOnly') return isSuperAdmin;
    if (isSuperAdmin || profile?.role === 'admin') return true;
    if (isDeveloperRole) {
      if (item.permission === 'adminOnly') return false;
      return profile?.[item.permission];
    }
    return false;
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !isSuperAdmin) return;

    const oldIndex = menuItems.findIndex(item => item.id === active.id);
    const newIndex = menuItems.findIndex(item => item.id === over.id);

    const newMenuItems = arrayMove(menuItems, oldIndex, newIndex);
    const newOrder = newMenuItems.map(item => item.id);
    
    // Update local state first for immediate feedback
    setSidebarOrder(newOrder);

    try {
      await updateDoc(doc(db, 'settings', 'global'), {
        dashboardSidebarOrder: newOrder
      });
      toast({ title: "Site Structure Updated", description: "Sidebar hierarchy synchronized." });
    } catch (e) {
      toast({ variant: "destructive", title: "Sync Failed" });
    }
  };

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
  const guidesQuery = useMemoFirebase(() => query(collection(db, 'tutorials'), orderBy('createdAt', 'desc')), [db]);
  const rootQuery = useMemoFirebase(() => query(collection(db, 'root-packages'), orderBy('createdAt', 'desc')), [db]);
  const auditLogsQuery = useMemoFirebase(() => isSuperAdmin ? query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')) : null, [db, isSuperAdmin]);

  const { data: roms } = useCollection(romsQuery);
  const { data: modules } = useCollection(modulesQuery);
  const { data: apks } = useCollection(apksQuery);
  const { data: users } = useCollection(usersQuery);
  const { data: wallpapers } = useCollection(wallpapersQuery);
  const { data: guides } = useCollection(guidesQuery);
  const { data: rootPackages } = useCollection(rootQuery);
  const { data: auditLogs } = useCollection(auditLogsQuery);

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
      if (currentUser) {
        await logActivity(db, currentUser.uid, `Added post to ${collectionName}`);
      }
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
        romRequestFormUrl,
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

  const [editingExtractedItem, setEditingExtractedItem] = useState<{item: any, index: number} | null>(null);
  const [aiTargetDestination, setAiTargetDestination] = useState('roms');

  const handleBulkExtract = async () => {
    if (!bulkUrl && !bulkHtml && !bulkTelegramText) return;
    setIsExtracting(true);
    setSelectedExtractedIndices([]);
    try {
      let content = bulkHtml || bulkTelegramText;
      if (bulkUrl) {
         try {
           const resp = await fetch(bulkUrl);
           content = await resp.text();
         } catch (e) {
           throw new Error("CORS Alert: Cannot scan remote URL directly from browser. Please paste the HTML/Telegram content into the pulse buffer.");
         }
      }

      const result = await extractFromContent(content || '', bulkUrl || 'pulse-buffer', globalSettings?.geminiApiKey);
      const items = result.roms || [];
      setExtractedItems(items);
      setSelectedExtractedIndices(items.map((_: any, i: number) => i));
      
      // Log Activity
      if (currentUser) {
        logActivity(db, currentUser.uid, `AI Extraction: Found ${items.length} records from ${bulkUrl || 'uploaded file'}`);
      }

      toast({ title: "Neural Extraction Success", description: `Identified ${items.length} records.` });
    } catch (e: any) { 
      toast({ variant: "destructive", title: "Neural Pulse Failed", description: e.message }); 
    }
    finally { setIsExtracting(false); }
  };

  const saveItemsToDatabase = async (items: any[]) => {
    if (items.length === 0) return;
    setIsAdding(true);
    try {
      let collectionName = activeTab === 'ai-extract' ? aiTargetDestination : activeTab;
      if (collectionName === 'guides') collectionName = 'tutorials';
      else if (collectionName === 'root') collectionName = 'root-packages';
      
      const validCollections = ['roms', 'modules', 'mod-apks', 'tutorials', 'root-packages'];
      if (!validCollections.includes(collectionName)) {
        collectionName = 'roms';
      }

      for (const item of items) {
        const collRef = collection(db, collectionName);
        const newDocRef = doc(collRef);
        await setDoc(newDocRef, {
          ...item,
          id: newDocRef.id,
          developer: profile?.username || 'Admin',
          createdAt: serverTimestamp(),
        });
      }

      // Log Activity
      if (currentUser) {
        logActivity(db, currentUser.uid, `Imported ${items.length} items to ${collectionName} via AI`);
      }

      setExtractedItems([]);
      setIsBulkDialogOpen(false);
      toast({ title: "Registry Synchronized", description: `${items.length} items have been added to ${collectionName}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Sync Failed", description: e.message });
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    console.log("Neural Pulse: File link established.", file.name, file.size);
    setIsExtracting(true);
    setExtractedItems([]); // Clear previous items immediately for feedback
    setSelectedExtractedIndices([]);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const html = event.target?.result as string;
      console.log("Neural Pulse: Transmitting data packet of size", html.length);
      try {
        const result = await extractFromContent(html, 'file-upload', globalSettings?.geminiApiKey);
        console.log("Neural Pulse: AI response received.", result);
        const items = result.roms || [];
        setExtractedItems(items);
        if (items.length > 0) {
          toast({ title: "Neural Extraction Success", description: `Found ${items.length} resources in ${file.name}.` });
          setSelectedExtractedIndices(items.map((_: any, i: number) => i));
        } else {
          toast({ variant: "destructive", title: "No Data Found", description: "The AI could not identify structured resources. Check if the file contains readable links." });
        }
      } catch (e: any) {
        console.error("Neural Pulse: Error in transmission.", e);
        toast({ variant: "destructive", title: "Neural Error", description: e.message });
      } finally {
        setIsExtracting(false);
        // Reset input so same file can be uploaded again
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleSaveBulk = async () => {
    await saveItemsToDatabase(extractedItems);
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
        <div className="flex items-center gap-4">
          <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
            <Button variant="outline" onClick={() => router.push('/')} className="rounded-2xl bg-card border border-border h-12 px-6">
              <ArrowLeft className="w-5 h-5 mr-3" /> Back to Hub
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              variant="outline" 
              onClick={async () => {
                await signOut(auth);
                router.push('/');
              }} 
              className="rounded-2xl bg-red-500/10 border-red-500/20 text-red-500 h-12 px-6 hover:bg-red-500/20"
            >
              <LogOut className="w-5 h-5 mr-3" /> Terminate Session
            </Button>
          </motion.div>
        </div>
        <Badge className={cn("px-4 py-1.5 rounded-full font-black text-[10px]", isSuperAdmin ? "bg-red-500/10 text-red-600" : "bg-blue-600/10 text-blue-600")}>
          {isSuperAdmin ? 'SUPER ADMIN' : isAdminRole ? 'ADMIN' : 'DEVELOPER'}
        </Badge>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 items-start">
        {/* Navigation Sidebar (Desktop) / Tab Bar (Mobile) */}
        <aside className="w-full lg:w-80 lg:shrink-0 lg:sticky lg:top-32 space-y-4 z-40">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex flex-row overflow-x-auto lg:flex-col gap-4 p-4 bg-card/30 backdrop-blur-xl border border-border rounded-3xl lg:rounded-[2.5rem] lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto scrollbar-hide snap-x snap-mandatory scroll-px-10">
              <div className="hidden lg:block h-2" /> 
              <SortableContext
                items={menuItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                {menuItems.map((item) => (
                  <SortableSidebarItem
                    key={item.id}
                    item={item}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    isSuperAdmin={isSuperAdmin}
                  />
                ))}
              </SortableContext>
              <div className="min-w-[4rem] lg:hidden" /> {/* Extra spacing for slider end */}
            </div>
          </DndContext>

          {/* Quick Stats or Info could go here */}
          <div className="hidden lg:block p-6 rounded-[2.5rem] bg-primary/5 border border-primary/10">
            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-primary mb-2">System Status</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Neural Link Optimized
            </div>
          </div>
        </aside>

        {/* Main Workspace Area */}
        <motion.div 
          layout 
          transition={{ duration: 0.4 }} 
          className="flex-1 w-full bg-card/20 backdrop-blur-md rounded-3xl lg:rounded-[3rem] p-6 lg:p-12 min-h-[700px] lg:max-h-[calc(100vh-160px)] border border-border/50 shadow-2xl relative overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
        >
          {activeTab === 'profile' ? (
            <div className="space-y-10 w-full">
              <div className="flex items-center gap-4"><UserCircle className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">My Profile</h2></div>
              <Card className="p-8 rounded-[2.5rem] bg-muted/30 border-border space-y-6">
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Display Name</Label>
                  <Input 
                    value={editUsername || ''} 
                    onChange={(e) => setEditUsername(e.target.value)} 
                    className="h-14 rounded-2xl bg-black/40 border-border" 
                    placeholder="Enter your display name"
                  />
                </div>
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Profile Image URL</Label>
                  <Input 
                    value={editProfileImage || ''} 
                    onChange={(e) => setEditProfileImage(e.target.value)} 
                    className="h-14 rounded-2xl bg-black/40 border-border" 
                    placeholder="Enter profile image URL"
                  />
                </div>
                
                {/* Theme Switcher */}
                <div className="space-y-4 pt-4 border-t border-border/50">
                  <Label className="text-[10px] font-black uppercase tracking-widest">Environment Theme</Label>
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.classList.add('light');
                        localStorage.setItem('skyhub-theme', 'light');
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="flex-1 rounded-xl h-14 uppercase font-black text-[9px] tracking-widest border-border hover:bg-muted text-foreground"
                    >
                      <Sun className="w-4 h-4 mr-2" /> Light Protocol
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        document.documentElement.classList.remove('light');
                        document.documentElement.classList.add('dark');
                        localStorage.setItem('skyhub-theme', 'dark');
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="flex-1 rounded-xl h-14 uppercase font-black text-[9px] tracking-widest border-border hover:bg-muted text-foreground"
                    >
                      <Moon className="w-4 h-4 mr-2" /> Dark Protocol
                    </Button>
                  </div>
                </div>

                {/* Admin Mode Switch (for Hub Owners) */}
                {isSuperAdmin && (
                  <div className="space-y-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between bg-black/20 p-6 rounded-2xl border border-border">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                          <Shield className="w-3 h-3 text-red-500" /> Admin Bypass
                        </Label>
                        <p className="text-[8px] text-muted-foreground uppercase opacity-70">Toggle elevated terminal clearance</p>
                      </div>
                      <Switch 
                        checked={profile?.role === 'super_admin'} 
                        onCheckedChange={async (checked) => {
                          if (!currentUser) return;
                          if (currentUser) {
                            await updateDocumentNonBlocking(doc(db, 'users', currentUser.uid), { 
                              role: checked ? 'super_admin' : 'user' 
                            });
                          }
                          toast({ title: checked ? "Superuser Mode Activated" : "Standard User Protocol Active" });
                        }} 
                      />
                    </div>
                  </div>
                )}

                {editProfileImage && (
                  <div className="flex justify-center p-4">
                    <div className="relative w-24 h-24">
                      <Image src={editProfileImage} alt="Profile Preview" fill className="rounded-full object-cover border-4 border-primary/20" referrerPolicy="no-referrer" />
                    </div>
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
            <div className="space-y-10">
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
                      value={siteName || ''} 
                      onChange={(e) => setSiteName(e.target.value)} 
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SkyHub Protocol"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Brand Name (Navbar)</Label>
                    <Input 
                      value={brandName || ''} 
                      onChange={(e) => setBrandName(e.target.value)} 
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. SKYHUB"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Favicon URL</Label>
                    <Input 
                      value={faviconUrl || ''} 
                      onChange={(e) => setFaviconUrl(e.target.value)}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter favicon URL"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Hero Title</Label>
                    <Textarea 
                      value={heroTitle || ''} 
                      onChange={(e) => setHeroTitle(e.target.value)}
                      className="h-24 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter hero title (use \n for line breaks)"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">Hero Subtitle</Label>
                    <Textarea 
                      value={heroSubtitle || ''} 
                      onChange={(e) => setHeroSubtitle(e.target.value)}
                      className="h-32 rounded-2xl bg-black/40 border-border" 
                      placeholder="Enter hero subtitle"
                    />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest">ROM Request Form Link</Label>
                    <Input 
                      value={romRequestFormUrl || ''} 
                      onChange={(e) => setRomRequestFormUrl(e.target.value)}
                      className="h-14 rounded-2xl bg-black/40 border-border" 
                      placeholder="e.g. https://formspree.io/f/your_id"
                    />
                  </div>
                  {faviconUrl && (
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest">Favicon Preview</Label>
                      <div className="p-6 bg-black/40 rounded-2xl border border-border flex items-center justify-center">
                        <div className="relative w-12 h-12">
                          <Image src={faviconUrl} fill className="object-contain" alt="Favicon Preview" referrerPolicy="no-referrer" />
                        </div>
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
                    <Label className="text-[10px] font-black uppercase tracking-widest">Direction ({gradientDirection}deg)</Label>
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
                          <div className="relative h-20 w-40">
                            <Image src={logoPreview} fill className="object-contain" alt="Preview" referrerPolicy="no-referrer" />
                          </div>
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
                        <div className="relative h-full w-full">
                          <Image src={settings.logoUrl} fill className="object-contain" alt="Current Logo" referrerPolicy="no-referrer" />
                        </div>
                      ) : (
                        <p className="text-[10px] font-black uppercase text-muted-foreground italic">Standard Typography Active</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'audit' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><FileText className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Activity Logs</h2></div>
              <Card className="p-8 rounded-[2rem] bg-muted/30 border-border">
                <div className="space-y-2">
                  {auditLogs?.map((log) => (
                    <div key={log.id} className="p-4 bg-black/20 rounded-lg flex justify-between items-center text-[10px] font-code">
                      <span>{log.action} - UID: {log.uid}</span>
                      <span className="text-muted-foreground">{log.timestamp?.toDate().toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : activeTab === 'maintenance' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><Zap className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Maintenance Hub</h2></div>
              <Card className="p-8 rounded-[2rem] bg-muted/30 border-border space-y-6">
                <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl">
                  <Label>Maintenance Mode</Label>
                  <Switch checked={globalSettings?.maintenanceMode} onCheckedChange={(checked) => updateDocumentNonBlocking(globalSettingsRef, { maintenanceMode: checked })} />
                </div>
                <Input placeholder="Message for users" defaultValue={globalSettings?.maintenanceMessage} onBlur={(e) => updateDocumentNonBlocking(globalSettingsRef, { maintenanceMessage: e.target.value })} />
                <Label>Start Time</Label>
                <Input type="datetime-local" defaultValue={globalSettings?.maintenanceStartTime ? new Date(globalSettings.maintenanceStartTime.toDate()).toISOString().slice(0, 16) : ''} onChange={(e) => updateDocumentNonBlocking(globalSettingsRef, { maintenanceStartTime: new Date(e.target.value) })} />
                <Label>End Time</Label>
                <Input type="datetime-local" defaultValue={globalSettings?.maintenanceEndTime ? new Date(globalSettings.maintenanceEndTime.toDate()).toISOString().slice(0, 16) : ''} onChange={(e) => updateDocumentNonBlocking(globalSettingsRef, { maintenanceEndTime: new Date(e.target.value) })} />
              </Card>
            </div>
          ) : activeTab === 'payments' ? (
            <div className="space-y-8">
              <div className="flex items-center gap-4"><CreditCard className="w-8 h-8 text-primary" /><h2 className="text-3xl font-black uppercase">Payment Hub</h2></div>
              <Card className="p-8 rounded-[2rem] bg-muted/30 border-border space-y-6">
                <div className="space-y-2">
                  <Label>UPI ID</Label>
                  <Input placeholder="UPI ID (e.g., user@upi)" defaultValue={settings?.upiId || ''} onBlur={(e) => updateDocumentNonBlocking(settingsRef, { upiId: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>UPI Amount</Label>
                  <Input placeholder="UPI Amount (e.g., 100)" defaultValue={settings?.upiAmount || ''} onBlur={(e) => updateDocumentNonBlocking(settingsRef, { upiAmount: e.target.value })} />
                </div>
              </Card>
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
          ) : activeTab === 'ai-extract' ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black uppercase flex items-center gap-3">
                    <Bot className="w-8 h-8 text-primary animate-pulse" />
                    AI EXTRACTION TERMINAL
                  </h2>
                  <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Global Neural Processing Unit Active</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8 rounded-[2.5rem] bg-card border-border border-2 overflow-hidden relative">
                   <div className="absolute top-0 right-0 p-8 opacity-10">
                      <CloudLightning className="w-32 h-32 text-primary" />
                   </div>
                   <div className="relative z-10 space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-black uppercase tracking-wider">Source Analysis Node</Label>
                        <Tabs defaultValue="file" className="w-full">
                          <TabsList className="grid w-full grid-cols-3 h-12 bg-muted p-1 rounded-xl">
                            <TabsTrigger value="file" className="text-[9px] uppercase font-black">Index.html</TabsTrigger>
                            <TabsTrigger value="telegram" className="text-[9px] uppercase font-black">Telegram AI</TabsTrigger>
                            <TabsTrigger value="url" className="text-[9px] uppercase font-black">URL Scan</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="file" className="mt-6 space-y-6">
                            <div className="flex flex-col items-center justify-center min-h-[250px] border-2 border-dashed border-border rounded-3xl p-8 hover:border-primary/50 transition-colors group cursor-pointer relative" onClick={() => document.getElementById('ai-file-upload')?.click()}>
                              <input type="file" accept=".html" onChange={handleFileUpload} className="hidden" id="ai-file-upload" />
                              <div className="flex flex-col items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Upload className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-2 text-center">
                                  <h3 className="font-black uppercase text-sm tracking-widest">DRAG OR CLICK TO UPLOAD</h3>
                                  <p className="text-[10px] text-muted-foreground uppercase max-w-[200px] leading-relaxed mx-auto italic">
                                    Upload index.html for neural registry extraction
                                  </p>
                                </div>
                                {isExtracting && (
                                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-3xl backdrop-blur-sm">
                                    <div className="flex flex-col items-center gap-4">
                                      <Loader2 className="w-12 h-12 animate-spin text-primary" />
                                      <span className="text-[10px] font-black uppercase tracking-widest animate-pulse">Processing index.html...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="telegram" className="mt-6 space-y-4">
                            <Label className="text-[9px] font-black uppercase ml-1">Paste Broadcast Content</Label>
                            <Textarea 
                              value={bulkTelegramText || ''} 
                              onChange={(e) => setBulkTelegramText(e.target.value)} 
                              placeholder="PASTE TELEGRAM POST CONTENT..." 
                              className="min-h-[200px] bg-muted rounded-2xl p-6 text-[11px] font-mono border-border"
                            />
                            <Button 
                              onClick={handleBulkExtract} 
                              disabled={isExtracting} 
                              className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl"
                            >
                              {isExtracting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                              EXTRACT FROM TELEGRAM
                            </Button>
                          </TabsContent>

                          <TabsContent value="url" className="mt-6 space-y-4">
                            <Label className="text-[9px] font-black uppercase ml-1">Remote Endpoint URL</Label>
                            <Input 
                              value={bulkUrl || ''} 
                              onChange={(e) => setBulkUrl(e.target.value)} 
                              placeholder="HTTPS://EXTERNAL-SOURCE.COM/INDEX.HTML" 
                              className="h-14 bg-muted rounded-2xl px-6 font-mono text-[11px]"
                            />
                            <Button 
                              onClick={handleBulkExtract} 
                              disabled={isExtracting} 
                              className="w-full h-14 bg-primary text-white font-black uppercase text-[10px] tracking-widest rounded-2xl"
                            >
                              {isExtracting ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Globe className="w-5 h-5 mr-2" />}
                              SCAN REMOTE ENDPOINT
                            </Button>
                          </TabsContent>
                        </Tabs>
                      </div>
                   </div>
                </Card>

                <Card className="p-8 rounded-[2.5rem] bg-card border-border border-2 flex flex-col h-full min-h-[600px]">
                   <div className="flex items-center justify-between border-b border-border/50 pb-6 mb-6">
                      <div className="space-y-1">
                        <h4 className="font-black uppercase text-sm tracking-widest flex items-center gap-2">
                           <List className="w-5 h-5 text-primary" />
                           Extraction Buffer
                        </h4>
                        <p className="text-[9px] text-muted-foreground uppercase">{extractedItems.length} resources identified</p>
                      </div>
                      <div className="flex gap-2">
                         <Button 
                           variant="outline" 
                           size="sm" 
                           className="text-[8px] font-black uppercase rounded-xl h-10 px-4"
                           onClick={() => setSelectedExtractedIndices(
                             selectedExtractedIndices.length === extractedItems.length ? [] : extractedItems.map((_, i) => i)
                           )}
                         >
                           {selectedExtractedIndices.length === extractedItems.length ? "Deselect" : "Select All"}
                         </Button>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                      {extractedItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4 text-center">
                           <Bot className="w-20 h-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest max-w-[150px]">Waiting for input pulses...</p>
                        </div>
                      ) : (
                        extractedItems.map((item, idx) => (
                          <motion.div 
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            key={idx} 
                            className={cn(
                              "group p-5 rounded-2xl border transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden",
                              selectedExtractedIndices.includes(idx) ? "bg-primary/10 border-primary/50 ring-1 ring-primary/20" : "bg-muted/30 border-border/50 hover:border-primary/30"
                            )}
                            onClick={() => {
                              if (selectedExtractedIndices.includes(idx)) {
                                setSelectedExtractedIndices(selectedExtractedIndices.filter(i => i !== idx));
                              } else {
                                setSelectedExtractedIndices([...selectedExtractedIndices, idx]);
                              }
                            }}
                          >
                            <div className={cn(
                              "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors shrink-0",
                              selectedExtractedIndices.includes(idx) ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                            )}>
                              {selectedExtractedIndices.includes(idx) && <Check className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <p className="text-[11px] font-black uppercase truncate">{item.name}</p>
                                  {item.androidVersion && <Badge variant="outline" className="text-[8px] py-0 h-4 border-primary/30 text-primary font-black uppercase">A{item.androidVersion}</Badge>}
                               </div>
                               <div className="flex items-center gap-3">
                                  <p className="text-[8px] text-muted-foreground font-mono truncate flex-1">{item.downloadUrl}</p>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="w-6 h-6 rounded-md hover:bg-primary/20"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingExtractedItem({ item, index: idx });
                                    }}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                               </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                   </div>

                   {extractedItems.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-border/50 space-y-4">
                         <div className="flex items-center justify-between mb-2">
                             <Label className="text-[9px] font-black uppercase tracking-widest">Target Destination</Label>
                             <Select value={aiTargetDestination} onValueChange={(v) => setAiTargetDestination(v)}>
                                <SelectTrigger className="w-32 h-8 text-[9px] font-black uppercase rounded-lg">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                   <SelectItem value="roms" className="text-[9px] font-black uppercase">ROMs</SelectItem>
                                   <SelectItem value="modules" className="text-[9px] font-black uppercase">Modules</SelectItem>
                                   <SelectItem value="mod-apks" className="text-[9px] font-black uppercase">APKs</SelectItem>
                                   <SelectItem value="wallpapers" className="text-[9px] font-black uppercase">Walls</SelectItem>
                                </SelectContent>
                             </Select>
                         </div>
                         <Button 
                           onClick={() => saveItemsToDatabase(extractedItems.filter((_, i) => selectedExtractedIndices.includes(i)))} 
                           disabled={isAdding || selectedExtractedIndices.length === 0} 
                           className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[11px] tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30"
                         >
                           {isAdding ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : <Activity className="w-5 h-5 mr-2" />}
                           INITIALIZE SYNC ({selectedExtractedIndices.length})
                         </Button>
                      </div>
                   )}
                </Card>
              </div>

              {/* Editing Extracted Item Dialog */}
              <Dialog open={!!editingExtractedItem} onOpenChange={() => setEditingExtractedItem(null)}>
                {editingExtractedItem && (
                  <DialogContent className="bg-card rounded-[2.5rem] p-8 max-w-xl border-border">
                    <DialogHeader>
                      <DialogTitle className="uppercase font-black">Neural Correction Node</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Resource Identity</Label>
                          <Input 
                            value={editingExtractedItem.item.name || ''} 
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[editingExtractedItem.index].name = e.target.value;
                              setExtractedItems(newItems);
                              setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, name: e.target.value } });
                            }}
                            className="bg-muted rounded-xl"
                          />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest">OS Base (Android)</Label>
                             <Input 
                               value={editingExtractedItem.item.androidVersion || ''} 
                               onChange={(e) => {
                                 const newItems = [...extractedItems];
                                 newItems[editingExtractedItem.index].androidVersion = e.target.value;
                                 setExtractedItems(newItems);
                                 setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, androidVersion: e.target.value } });
                               }}
                               className="bg-muted rounded-xl"
                             />
                          </div>
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase tracking-widest">Version Pin</Label>
                             <Input 
                               value={editingExtractedItem.item.version || ''} 
                               onChange={(e) => {
                                 const newItems = [...extractedItems];
                                 newItems[editingExtractedItem.index].version = e.target.value;
                                 setExtractedItems(newItems);
                                 setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, version: e.target.value } });
                               }}
                               className="bg-muted rounded-xl"
                             />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Transmission Endpoint (URL)</Label>
                          <Input 
                            value={editingExtractedItem.item.downloadUrl || ''} 
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[editingExtractedItem.index].downloadUrl = e.target.value;
                              setExtractedItems(newItems);
                              setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, downloadUrl: e.target.value } });
                            }}
                            className="bg-muted rounded-xl"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Feature Summary</Label>
                          <Textarea 
                            value={editingExtractedItem.item.description || ''} 
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[editingExtractedItem.index].description = e.target.value;
                              setExtractedItems(newItems);
                              setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, description: e.target.value } });
                            }}
                            className="bg-muted rounded-xl min-h-[100px]"
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest">Mirror Links (One per line)</Label>
                          <Textarea 
                            value={editingExtractedItem.item.mirrors?.join('\n') || ''} 
                            onChange={(e) => {
                              const newItems = [...extractedItems];
                              newItems[editingExtractedItem.index].mirrors = e.target.value.split('\n').filter(Boolean);
                              setExtractedItems(newItems);
                              setEditingExtractedItem({ ...editingExtractedItem, item: { ...editingExtractedItem.item, mirrors: e.target.value.split('\n').filter(Boolean) } });
                            }}
                            placeholder="Add redundant mirrors..."
                            className="bg-muted rounded-xl min-h-[80px]"
                          />
                       </div>
                       <Button onClick={() => setEditingExtractedItem(null)} className="w-full bg-primary font-black uppercase text-[10px] h-12 rounded-xl mt-4">Confirm Correction</Button>
                    </div>
                  </DialogContent>
                )}
              </Dialog>
            </div>
          ) : activeTab === 'users' ? (
            <div className="space-y-10">
              <div className="flex items-center gap-4 pb-8 border-b border-border/50">
                <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tighter">Identity Management</h2>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {users?.map((u) => (
                  <Card key={u.id} className="p-8 rounded-[2.5rem] bg-muted/30 border-border flex flex-col gap-8 hover:bg-muted/50 transition-all shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center overflow-hidden shrink-0 border border-border shadow-inner">
                          {u.profileImageUrl ? (
                            <Image src={u.profileImageUrl} fill className="object-cover" alt="Profile" referrerPolicy="no-referrer" />
                          ) : (
                            <UserCircle className="w-8 h-8 text-primary/40" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black uppercase text-base truncate tracking-tight">{u.username || 'Anonymous Hub Node'}</h4>
                          <p className="text-[10px] uppercase text-muted-foreground truncate mb-2">{u.email}</p>
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary px-3 py-0.5 rounded-full">
                            {u.role || 'user'}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Label className="text-[8px] font-black uppercase text-muted-foreground mr-1">Global Clearance</Label>
                        <Select 
                          disabled={(u.email && HUB_OWNERS.includes(u.email.toLowerCase())) || (u.role === 'super_admin' && !isSuperAdmin)} 
                          value={u.role || 'user'} 
                          onValueChange={(val) => updateDocumentNonBlocking(doc(db, 'users', u.id), { role: val })}
                        >
                          <SelectTrigger className="h-10 w-32 text-[10px] font-black uppercase rounded-xl border border-border bg-background/50">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-background">
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="developer">Developer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(u.role === 'developer' || u.role === 'admin') && (
                      <div className="pt-6 border-t border-border/50">
                        <Label className="text-[9px] font-black uppercase text-muted-foreground mb-4 block tracking-widest">Protocol Permissions</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                            <div key={perm.id} className="flex flex-col gap-2 bg-background/30 p-3 rounded-2xl border border-border/50 hover:border-primary/20 transition-all">
                              <Label className="text-[7px] font-black uppercase text-muted-foreground leading-tight h-5">
                                {perm.label}
                              </Label>
                              <Switch 
                                className="scale-75 origin-left data-[state=checked]:bg-primary"
                                checked={!!u[perm.id]} 
                                onCheckedChange={(checked) => updateDocumentNonBlocking(doc(db, 'users', u.id), { [perm.id]: checked })} 
                                disabled={!isSuperAdmin && !(isAdminRole && profile?.canManageUsers)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary">
                    {menuItems.find(i => i.id === activeTab)?.icon}
                  </div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">
                    Manage {menuItems.find(i => i.id === activeTab)?.label}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="Neural scan..." 
                      className="h-12 w-full md:w-64 bg-muted/50 rounded-2xl pl-12 border-border focus:ring-primary/20 font-black text-[10px] uppercase"
                      value={searchQuery || ''}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => setIsBulkDialogOpen(true)} className="h-12 rounded-2xl border-primary/20 text-primary hover:bg-primary/5 uppercase font-black text-[10px] tracking-widest px-6">
                    <CloudLightning className="w-4 h-4 mr-2" /> Bulk Sync
                  </Button>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="h-12 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-lg shadow-primary/20">
                    <Plus className="w-4 h-4 mr-2" /> Add Protocol
                  </Button>
                </div>
              </div>

              {activeTab === 'history' ? (
                <MessageHistory />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredItems(getActiveCollectionData()).map((item) => (
                    <motion.div 
                      layout 
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ y: -4 }}
                      className="group"
                    >
                      <Card className="p-6 rounded-[2rem] bg-card border-border hover:border-primary/30 transition-all flex flex-col justify-between h-full shadow-lg hover:shadow-primary/5">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="w-16 h-16 rounded-2xl bg-muted overflow-hidden flex items-center justify-center shrink-0 border border-border/10 group-hover:scale-105 transition-transform">
                            {item.imageUrl ? <MediaPreview src={item.imageUrl} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black uppercase text-sm truncate mb-1">{item.name || item.title}</h4>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-[7px] font-black uppercase border-primary/10 text-primary px-2 py-0">
                                {item.developer || 'Admin'}
                              </Badge>
                              {item.androidVersion && (
                                <Badge variant="secondary" className="text-[7px] font-black uppercase px-2 py-0">
                                  Android {item.androidVersion}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-border/50 flex items-center justify-between">
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            Ref: {item.id.substring(0, 8)}
                          </span>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setEditingItem(item); setIsEditDialogOpen(true); }} className="w-10 h-10 text-primary hover:bg-primary/10 rounded-xl transition-all">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(activeTab === 'guides' ? 'tutorials' : activeTab === 'root' ? 'root-packages' : activeTab, item.id)} className="w-10 h-10 text-red-600 hover:bg-red-600/10 rounded-xl transition-all">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
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
                <Label className="text-[9px] font-black uppercase ml-1">Thumbnail Image URL</Label>
                <Input name="imageUrl" placeholder="Static Preview (JPG/PNG)" className="bg-muted rounded-xl h-12" />
              </div>

              {activeTab === 'roms' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Looping Preview Video</Label>
                  <Input name="videoUrl" placeholder="Direct .mp4 Link" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {(activeTab === 'roms') && (
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
            <TabsList className="grid w-full grid-cols-4 h-12 mb-6 bg-muted p-1">
              <TabsTrigger value="telegram" className="text-[9px] uppercase font-black">Telegram AI</TabsTrigger>
              <TabsTrigger value="links" className="text-[9px] uppercase font-black">Link Series</TabsTrigger>
              <TabsTrigger value="file" className="text-[9px] uppercase font-black">Webpage File</TabsTrigger>
              <TabsTrigger value="bulk" className="text-[9px] uppercase font-black">Bulk Add</TabsTrigger>
            </TabsList>
            <TabsContent value="telegram" className="space-y-6">
              <Textarea value={bulkTelegramText} onChange={(e) => setBulkTelegramText(e.target.value)} placeholder="PASTE TELEGRAM BROADCAST CONTENT..." className="bg-muted min-h-[250px] rounded-2xl p-6 text-[10px] font-code" />
              <Button onClick={handleBulkExtract} disabled={isExtracting} className="w-full h-12 bg-blue-600 text-white uppercase text-[10px] font-black tracking-widest rounded-xl">
                {isExtracting ? <Loader2 className="animate-spin w-4 h-4" /> : 'Analyze Transmission'}
              </Button>
              {extractedItems.length > 0 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-muted/30 border border-border space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Zap className="w-4 h-4 text-primary" />
                         Extracted Items ({extractedItems.length})
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[8px] uppercase font-black"
                        onClick={() => setSelectedExtractedIndices(
                          selectedExtractedIndices.length === extractedItems.length ? [] : extractedItems.map((_, i) => i)
                        )}
                      >
                        {selectedExtractedIndices.length === extractedItems.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    
                    <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                      {extractedItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "group p-4 rounded-xl border transition-all flex items-center gap-4 cursor-pointer",
                            selectedExtractedIndices.includes(idx) ? "bg-primary/10 border-primary/50" : "bg-black/20 border-border/50 hover:border-primary/30"
                          )}
                          onClick={() => {
                            if (selectedExtractedIndices.includes(idx)) {
                              setSelectedExtractedIndices(selectedExtractedIndices.filter(i => i !== idx));
                            } else {
                              setSelectedExtractedIndices([...selectedExtractedIndices, idx]);
                            }
                          }}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                            selectedExtractedIndices.includes(idx) ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                          )}>
                            {selectedExtractedIndices.includes(idx) && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <div className="flex items-center gap-2 mb-1">
                                <p className="text-[10px] font-bold uppercase truncate">{item.name}</p>
                                {item.version && <span className="text-[6px] bg-muted px-1 rounded font-mono border border-border">v{item.version}</span>}
                                {item.size && <span className="text-[6px] text-blue-500 font-bold">{item.size}</span>}
                             </div>
                             <div className="flex items-center gap-2">
                                <p className="text-[7px] text-muted-foreground truncate flex-1">{item.downloadUrl}</p>
                                {item.updated && <span className="text-[6px] opacity-70 italic whitespace-nowrap">{item.updated}</span>}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => saveItemsToDatabase(extractedItems.filter((_, i) => selectedExtractedIndices.includes(i)))} 
                      disabled={isAdding || selectedExtractedIndices.length === 0} 
                      className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl"
                    >
                      {isAdding ? <Loader2 className="animate-spin w-5 h-5" /> : `Import ${selectedExtractedIndices.length} Selected`}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="links" className="space-y-6">
              <Textarea value={bulkLinksText} onChange={(e) => setBulkLinksText(e.target.value)} placeholder="PASTE ONE LINK PER LINE FOR AUTO-SCANNING..." className="bg-muted min-h-[300px] rounded-2xl p-6 text-[10px] font-code" />
              <Button onClick={handleBulkLinkSync} disabled={isAdding} className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl">Initialize Link Sync Series</Button>
            </TabsContent>
            <TabsContent value="file" className="space-y-6">
              <div className="flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-muted rounded-2xl p-6 text-center">
                <input type="file" accept=".html" onChange={handleFileUpload} className="hidden" id="html-upload" />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CloudLightning className="w-8 h-8 text-primary" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black uppercase text-sm tracking-widest leading-none">Automated Index Pulse</h3>
                    <p className="text-[9px] text-muted-foreground uppercase max-w-[250px] leading-relaxed mx-auto">
                      Upload an index.html file to trigger global extraction and real-time registry synchronization.
                    </p>
                  </div>
                  <Label htmlFor="html-upload" className="cursor-pointer bg-primary text-white py-4 px-8 rounded-xl text-[10px] uppercase font-black tracking-widest hover:scale-105 transition-transform">
                    {isExtracting ? 'Analyzing...' : 'Pulse Upload'}
                  </Label>
                </div>
              </div>
              
              {extractedItems.length > 0 && (
                <div className="space-y-6">
                  <div className="p-6 rounded-[2rem] bg-muted/30 border border-border space-y-4">
                    <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                         <Zap className="w-4 h-4 text-primary" />
                         Extracted Resources ({extractedItems.length})
                      </h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[8px] uppercase font-black"
                        onClick={() => setSelectedExtractedIndices(
                          selectedExtractedIndices.length === extractedItems.length ? [] : extractedItems.map((_, i) => i)
                        )}
                      >
                        {selectedExtractedIndices.length === extractedItems.length ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                    
                    <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                      {extractedItems.map((item, idx) => (
                        <div 
                          key={idx} 
                          className={cn(
                            "group p-4 rounded-xl border transition-all flex items-center gap-4 cursor-pointer",
                            selectedExtractedIndices.includes(idx) ? "bg-primary/10 border-primary/50" : "bg-black/20 border-border/50 hover:border-primary/30"
                          )}
                          onClick={() => {
                            if (selectedExtractedIndices.includes(idx)) {
                              setSelectedExtractedIndices(selectedExtractedIndices.filter(i => i !== idx));
                            } else {
                              setSelectedExtractedIndices([...selectedExtractedIndices, idx]);
                            }
                          }}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                            selectedExtractedIndices.includes(idx) ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                          )}>
                            {selectedExtractedIndices.includes(idx) && <Check className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                               <p className="text-[10px] font-bold uppercase truncate">{item.name}</p>
                               {item.androidVersion && <Badge variant="outline" className="text-[7px] py-0 h-4 border-primary/20">A{item.androidVersion}</Badge>}
                               {item.version && <span className="text-[6px] bg-muted px-1 rounded font-mono border border-border">v{item.version}</span>}
                            </div>
                            <div className="flex items-center gap-2">
                               <p className="text-[8px] text-muted-foreground truncate flex-1">{item.downloadUrl}</p>
                               {item.size && <span className="text-[6px] text-blue-500 font-bold">{item.size}</span>}
                               {item.updated && <span className="text-[6px] opacity-70 italic whitespace-nowrap">{item.updated}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      onClick={() => saveItemsToDatabase(extractedItems.filter((_, i) => selectedExtractedIndices.includes(i)))} 
                      disabled={isAdding || selectedExtractedIndices.length === 0} 
                      className="w-full h-14 bg-primary uppercase text-[10px] font-black tracking-widest rounded-2xl shadow-lg shadow-primary/20"
                    >
                      {isAdding ? <Loader2 className="animate-spin w-5 h-5" /> : `Import ${selectedExtractedIndices.length} Resources to Registry`}
                    </Button>
                  </div>
                </div>
              )}
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
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-widest">Payment Links</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input name="qrImageUrl" defaultValue={settings?.qrImageUrl} placeholder="QR Code Image URL" className="bg-muted rounded-xl h-12" />
                </div>
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
                <Label className="text-[9px] font-black uppercase ml-1">Thumbnail Image URL</Label>
                <Input name="imageUrl" defaultValue={editingItem?.imageUrl} placeholder="Static Preview (JPG/PNG)" className="bg-muted rounded-xl h-12" />
              </div>

              {activeTab === 'roms' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase ml-1">Looping Preview Video</Label>
                  <Input name="videoUrl" defaultValue={editingItem?.videoUrl} placeholder="Direct .mp4 Link" className="bg-muted rounded-xl h-12" />
                </div>
              )}

              {(activeTab === 'roms') && (
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
