
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Cpu, 
  ImageIcon, 
  LogIn, 
  LogOut, 
  Menu, 
  Smartphone, 
  ShieldAlert, 
  Code, 
  Crown, 
  Shield,
  BookOpen,
  Sun,
  Moon,
  ChevronRight,
  Terminal,
  Loader2,
  Heart,
  Copy,
  Check,
  Send,
  MessageSquare,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useFirebase, useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { useSearch } from '@/context/SearchContext';
import { signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_DONATION_CONFIG, SiteSettings } from '@/lib/store';
import { AuthModal } from '@/components/auth/auth-modal';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

export function Navbar() {
  const { user, auth, firestore: db } = useFirebase();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const userProfileRef = useMemoFirebase(() => 
    (user && db) ? doc(db, 'users', user.uid) : null
  , [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'donation', 'settings') : null, [db]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc<SiteSettings>(globalSettingsRef);

  const upiId = settings?.upiId || DEFAULT_DONATION_CONFIG.upiId;
  const upiAmount = settings?.upiAmount || DEFAULT_DONATION_CONFIG.upiAmount;
  const qrUrl = settings?.qrImageUrl || DEFAULT_DONATION_CONFIG.qrImageUrl;
  const qrLink = globalSettings?.supportLinks?.qrLink || qrUrl;
  const brandName = globalSettings?.brandName || 'SKY HUB';
  const logoUrl = settings?.logoUrl || DEFAULT_DONATION_CONFIG.logoUrl;
  const telegramChannel = globalSettings?.socialLinks?.telegramChannel || DEFAULT_DONATION_CONFIG.telegramChannelUrl;
  const telegramDiscussion = globalSettings?.socialLinks?.discussion || DEFAULT_DONATION_CONFIG.telegramDiscussionUrl;
  const paymentLink = globalSettings?.supportLinks?.paymentLink || DEFAULT_DONATION_CONFIG.paymentLink;

  const isSuperAdmin = user?.email && HUB_OWNERS.includes(user.email.toLowerCase());
  const isAdminRole = profile?.role === 'admin';
  const isDeveloperRole = profile?.role === 'developer';

  useEffect(() => {
    const savedTheme = localStorage.getItem('skyhub-theme') as 'light' | 'dark' | null;
    if (savedTheme) setTheme(savedTheme);
    else setTheme('dark');
  }, []);

  useEffect(() => {
    if (theme) {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(theme);
      localStorage.setItem('skyhub-theme', theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Session Terminated", description: "Logged out of Sky Hub." });
    } catch (error) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Logout failed." });
    }
  };

  const handleSupportClick = () => {
    if (!upiId) {
      toast({ title: "Configuration Error", description: "UPI ID has not been set by the admin." });
      return;
    }
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = `upi://pay?pa=${upiId}${upiAmount ? `&am=${upiAmount}` : ''}&cu=INR`;
    } else {
      setIsSupportOpen(true);
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: "Registry Copied", description: "UPI ID added to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const { searchQuery, setSearchQuery } = useSearch();

  const defaultNavLinks = [
    { name: 'ROMs', href: '/#roms', icon: <Cpu className="w-3.5 h-3.5" /> },
    { name: 'Modules', href: '/#modules', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { name: 'Mod APKs', href: '/#rooted-apks', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { name: 'Wallpapers', href: '/#wallpapers', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { name: 'Tutorials', href: '/#guides', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  const dynamicLinks = (globalSettings?.navigationLinks || []).map((link: any) => ({
    name: link.label, 
    href: link.url, 
    icon: <Cpu className="w-3.5 h-3.5" /> 
  }));

  const navLinks = [...defaultNavLinks, ...dynamicLinks];

  const getWorkspaceInfo = () => {
    if (isSuperAdmin) return { label: 'Super Admin Console', icon: <Crown className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-600/10' };
    if (isAdminRole) return { label: 'Admin Control Center', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-600/10' };
    if (isDeveloperRole) return { label: 'Developer Workspace', icon: <Code className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-600/10' };
    return null;
  };

  const workspace = getWorkspaceInfo();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
      <nav className="hidden md:flex items-center gap-1.5 glass-pill px-2 py-1.5 rounded-full pointer-events-auto border border-border shadow-2xl">
        <Link href="/" className="ml-4 mr-2 flex items-center">
          {logoUrl ? (
            <img src={logoUrl || undefined} className="h-10 w-auto object-contain py-1" alt="Logo" />
          ) : (
            <span className="font-black text-sm uppercase tracking-tighter">{brandName}</span>
          )}
        </Link>

        <div className="w-px h-4 bg-border mx-2" />

        {navLinks.map((link) => (
          <Link
            key={link.name}
            href={link.href}
            className="group"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all rounded-full hover:bg-muted"
            >
              {link.icon}
              {link.name}
            </motion.div>
          </Link>
        ))}
        
        <div className="w-px h-4 bg-border mx-2" />

        <div className="relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                window.location.href = '/search';
              }
            }}
            className="h-9 w-40 rounded-full bg-muted/50 border-border text-[10px] pl-9"
          />
        </div>
        
        <div className="w-px h-4 bg-border mx-2" />

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full hover:bg-muted text-muted-foreground flex items-center justify-center"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSupportClick}
            className="w-9 h-9 rounded-full hover:bg-muted text-red-500 flex items-center justify-center"
          >
            <Heart className="w-4 h-4 fill-current" />
          </Button>
        </motion.div>

        {workspace && (
          <Link href="/dashboard">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="ghost"
                className={cn(
                  "h-9 px-4 rounded-full font-black uppercase text-[10px] tracking-widest gap-2 flex items-center justify-center transition-all",
                  workspace.color
                )}
              >
                {workspace.icon}
                {workspace.label}
              </Button>
            </motion.div>
          </Link>
        )}

        {user ? (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="w-9 h-9 rounded-full hover:bg-muted text-red-500 ml-1 flex items-center justify-center"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        ) : (
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsAuthOpen(true)}
              className="w-9 h-9 rounded-full hover:bg-muted text-blue-600 ml-1 flex items-center justify-center"
            >
              <LogIn className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        )}
      </nav>

      <div className="md:hidden w-full flex justify-between items-center pointer-events-auto px-6 py-2.5 glass-pill rounded-full border border-border shadow-2xl">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
          <Link href="/" className="flex items-center">
            {logoUrl ? (
              <img src={logoUrl || undefined} className="h-10 w-auto object-contain py-1" alt="Logo" />
            ) : (
              <span className="font-black text-xl uppercase tracking-tighter">{brandName}</span>
            )}
          </Link>
        </motion.div>
        <div className="flex items-center gap-2">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full text-muted-foreground flex items-center justify-center hover:bg-muted transition-all"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSupportClick}
              className="w-10 h-10 rounded-full text-red-500 flex items-center justify-center hover:bg-red-500/10 transition-all"
            >
              <Heart className="w-5 h-5 fill-current" />
            </Button>
          </motion.div>

          {user ? (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="w-10 h-10 rounded-full text-red-500 hover:bg-red-500/10 flex items-center justify-center transition-all"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsAuthOpen(true)}
                className="w-10 h-10 rounded-full text-blue-600 hover:bg-blue-600/10 flex items-center justify-center transition-all"
              >
                <LogIn className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="rounded-full w-10 h-10 flex items-center justify-center hover:bg-muted transition-all">
                  <Menu className="w-5 h-5" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-background/95 backdrop-blur-3xl border-l border-border p-0 flex flex-col shadow-2xl overflow-hidden"
            >
              <SheetHeader className="p-8 border-b border-border">
                <SheetTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-primary" />
                  TERMINAL
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-8 py-4">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link, idx) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                    >
                      <SheetClose asChild>
                        <Link
                          href={link.href}
                          className="flex items-center justify-between py-4 group transition-all active:scale-95 border-b border-border/50 last:border-0"
                        >
                          <motion.div 
                            className="flex items-center gap-4"
                            whileHover={{ x: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                              {link.icon}
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-[0.2em] text-muted-foreground group-hover:text-foreground">{link.name}</span>
                          </motion.div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                        </Link>
                      </SheetClose>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-8 border-t border-border space-y-3 bg-muted/30">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button 
                    onClick={handleSupportClick}
                    variant="outline"
                    className="w-full h-12 rounded-2xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all text-[9px]"
                  >
                    <Heart className="w-4 h-4 fill-current" />
                    Support Hub
                  </Button>
                </motion.div>

                {workspace && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <SheetClose asChild>
                      <Link href="/dashboard" className="w-full block">
                        <Button className={cn(
                          "w-full h-12 rounded-2xl font-black uppercase tracking-widest gap-3 justify-start px-6 shadow-xl transition-all active:scale-95 text-[9px]",
                          workspace.color.includes('red') ? "bg-red-600 text-white" : 
                          workspace.color.includes('orange') ? "bg-orange-600 text-white" : 
                          "bg-blue-600 text-white"
                        )}>
                          {workspace.icon}
                          {workspace.label}
                        </Button>
                      </Link>
                    </SheetClose>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {user ? (
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all active:scale-95 text-[8px]"
                    >
                      <LogOut className="w-4 h-4" />
                      Terminal Exit
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setIsAuthOpen(true)} 
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 bg-blue-600 text-white shadow-xl shadow-blue-600/20 transition-all active:scale-95 text-[8px]"
                    >
                      <LogIn className="w-4 h-4" />
                      Terminal Entry
                    </Button>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <Button 
                    onClick={() => window.open(telegramChannel, '_blank')}
                    variant="outline"
                    className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-blue-500/20 text-blue-500 hover:bg-blue-500/10 transition-all active:scale-95 text-[8px]"
                  >
                    <Send className="w-4 h-4" />
                    Telegram Channel
                  </Button>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <Button 
                    onClick={() => window.open(telegramDiscussion, '_blank')}
                    variant="outline"
                    className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-green-500/20 text-green-500 hover:bg-green-500/10 transition-all active:scale-95 text-[8px]"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Discussion Chat
                  </Button>
                </motion.div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onOpenChange={setIsAuthOpen} />

      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="bg-card border-border rounded-[3rem] p-10 max-w-sm flex flex-col items-center text-center gap-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Support Hub</DialogTitle>
          </DialogHeader>
          
          <div className="relative w-full aspect-square bg-white rounded-[2rem] p-4 border border-border overflow-hidden shadow-inner">
            <img src={qrLink || undefined} alt="Payment QR" className="w-full h-full object-contain" />
          </div>

          <div className="w-full space-y-4">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Registry UPI ID</span>
              <div className="bg-muted p-4 rounded-2xl flex items-center justify-between border border-border group hover:border-primary/40 transition-all">
                <span className="text-[10px] font-code text-foreground truncate">{upiId}</span>
                <Button variant="ghost" size="icon" onClick={copyUpiId} className="h-8 w-8 rounded-xl shrink-0 ml-2">
                  {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            
            <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-medium">
              Contributions fuel Snapdragon optimizations and community development protocols.
            </p>
          </div>
          
          <Button onClick={() => setIsSupportOpen(false)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest">
            Close Terminal
          </Button>
        </DialogContent>
      </Dialog>
    </header>
  );
}
