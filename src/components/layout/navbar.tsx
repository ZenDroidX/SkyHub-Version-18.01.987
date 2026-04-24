
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
import { DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { AuthModal } from '@/components/auth/auth-modal';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

export function Navbar() {
  const { user, auth, firestore: db } = useFirebase();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const userProfileRef = useMemoFirebase(() => 
    (user && db) ? doc(db, 'users', user.uid) : null
  , [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const settingsRef = useMemoFirebase(() => db ? doc(db, 'donation', 'settings') : null, [db]);
  const { data: settings } = useDoc(settingsRef);

  const globalSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(globalSettingsRef);

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
    setMounted(true);
    const savedTheme = localStorage.getItem('skyhub-theme') as 'light' | 'dark' | null;
    setTheme(savedTheme || 'dark');
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

  const navLinks = [
    { name: 'ROMs', href: '/#roms', icon: <Cpu className="w-3.5 h-3.5" /> },
    { name: 'Modules', href: '/#modules', icon: <Smartphone className="w-3.5 h-3.5" /> },
    { name: 'Mod APKs', href: '/#rooted-apks', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
    { name: 'Wallpapers', href: '/#wallpapers', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { name: 'Tutorials', href: '/#guides', icon: <BookOpen className="w-3.5 h-3.5" /> },
  ];

  const getWorkspaceInfo = () => {
    if (isSuperAdmin) return { label: 'Super Admin Console', icon: <Crown className="w-3.5 h-3.5" />, color: 'text-red-600 bg-red-600/10' };
    if (isAdminRole) return { label: 'Admin Control Center', icon: <Shield className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-600/10' };
    if (isDeveloperRole) return { label: 'Developer Workspace', icon: <Code className="w-3.5 h-3.5" />, color: 'text-blue-600 bg-blue-600/10' };
    return null;
  };

  const workspace = getWorkspaceInfo();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
      <nav className="hidden md:flex items-center gap-4 glass-pill px-6 py-3 rounded-full pointer-events-auto border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
        <Link href="/" className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} className="h-8 w-auto object-contain" alt="Logo" />
          ) : (
            <span className="font-black text-lg uppercase tracking-tighter text-white">{brandName}</span>
          )}
        </Link>

        <div className="flex items-center gap-6 ml-4">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 flex items-center justify-center p-0"
            >
              {!mounted ? <Moon className="w-5 h-5" /> : theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSupportClick}
              className="w-8 h-8 rounded-full hover:bg-white/10 text-red-500 flex items-center justify-center p-0"
            >
              <Heart className="w-5 h-5 fill-current" />
            </Button>
          </motion.div>

          {user ? (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="w-8 h-8 rounded-full hover:bg-white/10 text-red-500 flex items-center justify-center p-0"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsAuthOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-white/10 text-blue-500 flex items-center justify-center p-0"
              >
                <LogIn className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-white/10 text-white/70 flex items-center justify-center p-0">
                  <Menu className="w-5 h-5" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-black/95 backdrop-blur-3xl border-l border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden text-white"
            >
              <SheetHeader className="p-8 border-b border-white/10">
                <SheetTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                  <Terminal className="w-5 h-5 text-white" />
                  TERMINAL
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-8 py-4">
                <div className="flex flex-col gap-2">
                  {[...navLinks, { name: 'Search', href: '/search', icon: <Search className="w-3.5 h-3.5" /> }].map((link, idx) => (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.5 }}
                    >
                      <SheetClose asChild>
                        <Link
                          href={link.href}
                          className="flex items-center justify-between py-4 group transition-all active:scale-95 border-b border-white/5 last:border-0"
                        >
                          <motion.div 
                            className="flex items-center gap-4"
                            whileHover={{ x: 10 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 group-hover:bg-white/10 group-hover:text-white transition-all">
                              {link.icon}
                            </div>
                            <span className="font-black uppercase text-[10px] tracking-[0.2em] text-white/60 group-hover:text-white">{link.name}</span>
                          </motion.div>
                          <ChevronRight className="w-3.5 h-3.5 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                        </Link>
                      </SheetClose>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-8 border-t border-white/10 space-y-3 bg-white/5">
                {workspace && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <SheetClose asChild>
                      <Link href="/dashboard" className="w-full block">
                        <Button className="w-full h-12 rounded-2xl font-black uppercase tracking-widest gap-3 justify-start px-6 bg-white text-black hover:bg-white/90 shadow-xl transition-all active:scale-95 text-[9px]">
                          {workspace.icon}
                          {workspace.label}
                        </Button>
                      </Link>
                    </SheetClose>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    onClick={() => window.open(telegramChannel, '_blank')}
                    variant="outline"
                    className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-white/10 text-white/70 hover:bg-white/10 transition-all active:scale-95 text-[8px]"
                  >
                    <Send className="w-4 h-4" />
                    Telegram
                  </Button>
                  
                  {user ? (
                    <Button 
                      variant="outline" 
                      onClick={handleLogout} 
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 border-red-500/20 text-red-500 hover:bg-red-500/10 transition-all active:scale-95 text-[8px]"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => setIsAuthOpen(true)} 
                      className="w-full h-11 rounded-xl font-black uppercase tracking-widest gap-3 justify-start px-6 bg-white text-black shadow-xl transition-all active:scale-95 text-[8px]"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className="md:hidden w-full max-w-[90%] flex justify-between items-center pointer-events-auto px-6 py-3 glass-pill rounded-full border border-white/10 shadow-2xl bg-black/60 backdrop-blur-xl">
        <Link href="/" className="flex items-center">
          {logoUrl ? (
            <img src={logoUrl} className="h-8 w-auto object-contain" alt="Logo" />
          ) : (
            <span className="font-black text-lg uppercase tracking-tighter text-white">{brandName}</span>
          )}
        </Link>
        <div className="flex items-center gap-4">
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full text-white/70 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              {!mounted ? <Moon className="w-5 h-5" /> : theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </motion.div>

          <motion.div whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSupportClick}
              className="w-8 h-8 rounded-full text-red-500 flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <Heart className="w-5 h-5 fill-current" />
            </Button>
          </motion.div>

          {user && (
            <motion.div whileTap={{ scale: 0.9 }}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="w-8 h-8 rounded-full text-red-500 hover:bg-white/10 flex items-center justify-center transition-all"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </motion.div>
          )}

          <Sheet>
            <SheetTrigger asChild>
              <motion.div whileTap={{ scale: 0.9 }}>
                <Button variant="ghost" size="icon" className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-all text-white/70">
                  <Menu className="w-5 h-5" />
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className="bg-black/95 backdrop-blur-3xl border-l border-white/10 p-0 flex flex-col shadow-2xl overflow-hidden text-white"
            >
              {/* Reuse Desktop Sheet Content logic but adapted for mobile */}
              <SheetHeader className="p-8 border-b border-white/10">
                <SheetTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 text-white">
                  <Terminal className="w-5 h-5 text-white" />
                  TERMINAL
                </SheetTitle>
              </SheetHeader>
              
              <ScrollArea className="flex-1 px-8 py-4">
                <div className="flex flex-col gap-1">
                  {[...navLinks, { name: 'Search', href: '/search', icon: <Search className="w-3.5 h-3.5" /> }].map((link, idx) => (
                    <SheetClose asChild key={link.name}>
                      <Link
                        href={link.href}
                        className="flex items-center justify-between py-4 border-b border-white/5 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50">{link.icon}</div>
                          <span className="font-black uppercase text-[10px] tracking-widest text-white/60">{link.name}</span>
                        </div>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-8 border-t border-white/10 space-y-3 bg-white/5">
                <Button onClick={handleSupportClick} variant="outline" className="w-full h-11 rounded-xl text-red-500 border-red-500/20 text-[10px] uppercase font-black tracking-widest">Support Hub</Button>
                {user ? (
                   <Button onClick={handleLogout} variant="outline" className="w-full h-11 rounded-xl text-red-500 border-red-500/20 text-[10px] uppercase font-black tracking-widest">Logout</Button>
                ) : (
                  <Button onClick={() => setIsAuthOpen(true)} className="w-full h-11 rounded-xl bg-white text-black text-[10px] uppercase font-black tracking-widest">Login</Button>
                )}
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
            <img src={qrLink} alt="Payment QR" className="w-full h-full object-contain" />
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
