"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Search,
  Sparkles,
  Command,
  User as UserIcon,
  X,
  ExternalLink,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
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
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_DONATION_CONFIG, SiteSettings } from '@/lib/store';
import { AuthModal } from '@/components/auth/auth-modal';
import { SearchOverlay } from '@/components/ui/SearchOverlay';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

export function Navbar() {
  const { user, auth, firestore: db } = useFirebase();
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
  const brandName = globalSettings?.brandName || 'SkyHub';
  const logoUrl = settings?.logoUrl || DEFAULT_DONATION_CONFIG.logoUrl;
  const telegramChannel = globalSettings?.socialLinks?.telegramChannel || DEFAULT_DONATION_CONFIG.telegramChannelUrl;
  const telegramDiscussion = globalSettings?.socialLinks?.discussion || DEFAULT_DONATION_CONFIG.telegramDiscussionUrl;

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Signed Out", description: "Logged out of SkyHub." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Logout failed." });
    }
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    toast({ title: "UPI ID Copied", description: "UPI ID copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const navLinks = [
    { name: 'ROMs', href: '/#roms', icon: Cpu },
    { name: 'Devices', href: '/#devices', icon: Smartphone },
    { name: 'Modules', href: '/#modules', icon: PackageIcon },
    { name: 'Recoveries', href: '/#recoveries', icon: ShieldAlert },
    { name: 'Guides', href: '/guides', icon: BookOpen },
    { name: 'Wallpapers', href: '/wallpapers', icon: ImageIcon },
  ];

  function PackageIcon(props: any) {
    return <Layers {...props} />;
  }

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 inset-x-0 z-50 transition-all duration-300 px-4 sm:px-6 md:px-8",
          scrolled ? "py-3" : "py-5"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <nav 
            className={cn(
              "flex items-center justify-between px-4 sm:px-6 py-2.5 rounded-full transition-all duration-300 border",
              scrolled 
                ? "glass-pill shadow-xl shadow-black/5 bg-card/85 border-border/80" 
                : "bg-card/60 backdrop-blur-lg border-border/50 shadow-md"
            )}
          >
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="relative flex items-center justify-center">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt="SkyHub" 
                    className="w-8 h-8 rounded-full object-cover border border-primary/40 group-hover:scale-105 transition-transform" 
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-background animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground flex items-center gap-1.5">
                  {brandName}
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 font-semibold uppercase tracking-wider hidden sm:inline-block">
                    4G/5G
                  </span>
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Right Action Tools */}
            <div className="flex items-center gap-2 sm:gap-2.5">
              {/* Command Search Trigger Pill */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-medium border border-border/60 transition-all duration-200 shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Search</span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-background/80 text-[10px] font-mono text-muted-foreground border border-border/40">
                  <span>⌘</span><span>K</span>
                </kbd>
              </button>

              {/* Support Modal Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSupportOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-medium border-primary/30 text-primary hover:bg-primary/10 transition-colors"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                <span>Support</span>
              </Button>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                aria-label="Toggle Theme"
                className="w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-sky-400" />
                )}
              </button>

              {/* User / Auth State */}
              {user ? (
                <div className="flex items-center gap-1.5">
                  {(isSuperAdmin || isAdminRole || isDeveloperRole) && (
                    <Link href="/dashboard">
                      <Button 
                        size="sm" 
                        variant="default"
                        className="h-8 px-3 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-sm hover:opacity-90"
                      >
                        <Shield className="w-3.5 h-3.5 mr-1" />
                        <span>Admin</span>
                      </Button>
                    </Link>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-8 h-8 p-0 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setIsAuthOpen(true)}
                  className="h-8 px-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1.5" />
                  <span>Sign In</span>
                </Button>
              )}

              {/* Mobile Drawer Trigger */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-8 h-8 rounded-full flex items-center justify-center bg-muted/60 hover:bg-muted text-foreground border border-border/60 transition-colors"
                aria-label="Open Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[360px] p-6 flex flex-col justify-between glass border-l border-border bg-card/95">
          <SheetHeader className="text-left space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <SheetTitle className="text-lg font-black tracking-tight">{brandName}</SheetTitle>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Android customization & Snapdragon 4 Gen 2 development platform.
            </p>
          </SheetHeader>

          {/* Nav List */}
          <div className="py-6 space-y-2 flex-1 overflow-y-auto">
            {navLinks.map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-muted/70 text-foreground text-sm font-medium transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span>{link.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </Link>
              );
            })}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted text-foreground text-sm font-medium transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <span>Search Everything</span>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-card text-[10px] font-mono text-muted-foreground border">⌘K</kbd>
            </button>
          </div>

          {/* Bottom Mobile Actions */}
          <div className="pt-4 border-t border-border space-y-3">
            <Button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsSupportOpen(true);
              }}
              className="w-full h-11 rounded-2xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 font-semibold text-xs transition-colors"
            >
              <Heart className="w-4 h-4 mr-2 fill-current" />
              Support Developer Hub
            </Button>

            {user ? (
              <div className="space-y-2">
                {(isSuperAdmin || isAdminRole || isDeveloperRole) && (
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                    <Button className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs">
                      <Shield className="w-4 h-4 mr-2" />
                      Admin Command Console
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full h-10 rounded-2xl border-border text-xs"
                >
                  <LogOut className="w-3.5 h-3.5 mr-2" />
                  Sign Out ({user.email?.split('@')[0]})
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsAuthOpen(true);
                }}
                className="w-full h-11 rounded-2xl bg-primary text-primary-foreground font-semibold text-xs"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign In to Account
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Modern Support Modal */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="max-w-md rounded-3xl border border-border glass bg-card/95 p-6 sm:p-8 shadow-2xl">
          <DialogHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-6 h-6 fill-rose-500/20" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Support SkyHub Development</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Your donations directly support continuous Snapdragon 4 Gen 2 build testing, server bandwidth, and kernel maintenance.
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* QR Code Container */}
            {qrUrl && (
              <div className="p-4 rounded-2xl bg-white border border-border/80 shadow-inner flex flex-col items-center justify-center max-w-[220px] mx-auto">
                <img src={qrUrl} alt="UPI QR Code" className="w-44 h-44 object-contain" />
                <span className="text-[10px] font-bold text-slate-800 tracking-wider mt-2 uppercase">Scan with any UPI App</span>
              </div>
            )}

            {/* UPI ID Copy Card */}
            {upiId && (
              <div className="p-3.5 rounded-2xl bg-muted/50 border border-border/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">UPI Address</span>
                  <span className="text-xs font-mono font-bold text-foreground">{upiId}</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyUpiId}
                  className="h-8 px-3 rounded-xl border-border bg-card text-xs font-semibold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            )}

            {/* Telegram Community Quick Links */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {telegramChannel && (
                <a 
                  href={telegramChannel} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500 text-sky-500 hover:text-white border border-sky-500/20 text-xs font-semibold transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Channel</span>
                </a>
              )}
              {telegramDiscussion && (
                <a 
                  href={telegramDiscussion} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-muted/60 hover:bg-muted text-foreground border border-border/80 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Discussion</span>
                </a>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Command Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </>
  );
}
