
'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth, useFirestore } from '@/firebase';
import { 
  initiateEmailSignIn, 
  initiateEmailSignUp, 
  initiatePasswordReset 
} from '@/firebase/non-blocking-login';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, UserPlus, LogIn, Key, Chrome, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOtp } from '@/ai/flows/send-otp-flow';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

type AuthMode = 'auth' | 'reset' | 'otp_verify' | 'register_password';

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const auth = useAuth();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AuthMode>('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

  const syncUserProfile = async (firebaseUser: any, isNew: boolean = false) => {
    const userRef = doc(db, 'users', firebaseUser.uid);
    const syncData = {
      email: firebaseUser.email,
      username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Sky User',
      profileImageUrl: firebaseUser.photoURL || '',
      lastLogin: serverTimestamp()
    };

    if (isNew) {
      await setDoc(userRef, {
        ...syncData,
        id: firebaseUser.uid,
        role: HUB_OWNERS.includes(firebaseUser.email?.toLowerCase()) ? 'admin' : 'user',
        createdAt: serverTimestamp()
      }, { merge: true });
    } else {
      await updateDoc(userRef, syncData);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userSnap = await getDoc(doc(db, 'users', result.user.uid));
      await syncUserProfile(result.user, !userSnap.exists());
      toast({ title: "Access Granted", description: "Google identity synchronized." });
      onOpenChange(false);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({ variant: "destructive", title: "Protocol Error", description: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterStart = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Email bio-signature required." });
      return;
    }
    setIsLoading(true);
    try {
      const result = await sendOtp({ email });
      if (result.success) {
        setMode('otp_verify');
        toast({ 
          title: "Code Transmitted", 
          description: "SIMULATOR ACTIVE: Check the system terminal (console) for your 6-digit code." 
        });
      } else {
        toast({ variant: "destructive", title: "Sync Failed", description: result.message });
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Identity transmission failed." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      toast({ variant: "destructive", title: "Invalid Code", description: "Enter the 6-digit protocol code." });
      return;
    }
    setIsLoading(true);
    try {
      const otpSnap = await getDoc(doc(db, 'otp_codes', email));
      if (!otpSnap.exists()) {
        toast({ variant: "destructive", title: "Verification Failed", description: "No code found. Try sending it again." });
        return;
      }
      
      if (otpSnap.data()?.code !== otp) {
        toast({ variant: "destructive", title: "Verification Failed", description: "Incorrect code. Check terminal logs." });
        return;
      }

      setMode('register_password');
      toast({ title: "Identity Verified", description: "Bio-signature confirmed. Establish your secure key." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalizeRegistration = async () => {
    if (!password || password.length < 6) {
      toast({ variant: "destructive", title: "Security Error", description: "Key must be at least 6 characters." });
      return;
    }
    setIsLoading(true);
    try {
      const result = await initiateEmailSignUp(auth, email, password);
      await syncUserProfile(result.user, true);
      toast({ title: "Profile Initialized", description: "Bio-signature registered successfully." });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Auth Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Email and password required." });
      return;
    }
    setIsLoading(true);
    try {
      await initiateEmailSignIn(auth, email, password);
      toast({ title: "Access Granted", description: "Bio-signature verified." });
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Protocol Error", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      toast({ variant: "destructive", title: "Protocol Error", description: "Email required for recovery." });
      return;
    }
    setIsLoading(true);
    try {
      await initiatePasswordReset(auth, email);
      toast({ title: "Recovery Sent", description: "Check your inbox for reset instructions." });
      setMode('auth');
    } catch (error: any) {
      toast({ variant: "destructive", title: "Recovery Failed", description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-[3rem] p-0 overflow-hidden max-w-md shadow-2xl">
        <div className="p-8 space-y-6">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-center">
              {mode === 'auth' ? 'Terminal Entry' : 
               mode === 'otp_verify' ? 'Identity Verification' : 
               mode === 'register_password' ? 'Set Secure Key' : 
               'Recovery Protocol'}
            </DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {mode === 'auth' ? 'Synchronize your bio-signature' : 
               mode === 'otp_verify' ? 'Verifying email authenticity' : 
               mode === 'register_password' ? 'Establish permanent access' : 
               'Re-establish identity access'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {mode === 'auth' ? (
              <motion.div
                key="auth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-muted rounded-2xl h-12 p-1 mb-6">
                    <TabsTrigger value="login" className="rounded-xl font-black text-[9px] uppercase tracking-widest">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-xl font-black text-[9px] uppercase tracking-widest">Register</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Email Terminal</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="architect@sky.hub" 
                          className="pl-12 bg-muted h-12 rounded-xl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Secure Key</Label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-12 bg-muted h-12 rounded-xl"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button 
                      onClick={handleEmailLogin}
                      disabled={isLoading}
                      className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10 mt-4"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <><LogIn className="w-4 h-4 mr-2" /> Verify Signature</>}
                    </Button>
                    <button 
                      onClick={() => setMode('reset')}
                      className="w-full mt-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                    >
                      Forgot Secure Key?
                    </button>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Email Bio-Signature</Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="architect@sky.hub" 
                          className="pl-12 bg-muted h-12 rounded-xl"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <p className="text-[7px] text-muted-foreground uppercase italic px-1 mt-1">SIMULATOR: Code will be logged to terminal for verification.</p>
                    </div>
                    <Button 
                      onClick={handleRegisterStart}
                      disabled={isLoading}
                      className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10 mt-4"
                    >
                      {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="w-4 h-4 mr-2" /> Send Verification Code</>}
                    </Button>
                  </TabsContent>
                </Tabs>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-[8px] uppercase font-black bg-card px-4 text-muted-foreground tracking-widest">
                    OR FAST-SYNC
                  </div>
                </div>

                <Button 
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full h-14 rounded-2xl border-border bg-muted/30 hover:bg-muted font-black uppercase text-[10px] tracking-widest gap-3"
                >
                  <Chrome className="w-4 h-4 text-blue-500" />
                  Google Identity Sync
                </Button>
              </motion.div>
            ) : mode === 'otp_verify' ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Identity Authenticity Check</p>
                    <p className="text-[8px] text-muted-foreground uppercase mt-1">Retrieving code from terminal for: {email}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Verification Code</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                      <Input 
                        type="text" 
                        placeholder="6-DIGIT CODE" 
                        maxLength={6}
                        className="pl-12 bg-muted h-16 rounded-xl text-center text-2xl font-black tracking-[0.5em] focus:ring-primary/20"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={handleVerifyOtp}
                    disabled={isLoading}
                    className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10"
                  >
                    {isLoading ? <Loader2 className="animate-spin" /> : <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Authenticity</>}
                  </Button>
                  
                  <Button 
                    variant="ghost"
                    onClick={() => setMode('auth')}
                    disabled={isLoading}
                    className="w-full h-12 rounded-xl text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-3 h-3 mr-2" /> Back to Entry
                  </Button>
                </div>
              </motion.div>
            ) : mode === 'register_password' ? (
              <motion.div
                key="password_set"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-green-500/5 border border-green-500/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-green-600">Bio-Signature Verified</p>
                    <p className="text-[8px] text-muted-foreground uppercase mt-1">Identity confirmed. Now establish your secure key.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Set Secure Key (Password)</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-12 bg-muted h-12 rounded-xl"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleFinalizeRegistration}
                  disabled={isLoading}
                  className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" /> Initialize Profile</>}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="reset"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase tracking-widest ml-1">Identity Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="architect@sky.hub" 
                      className="pl-12 bg-muted h-12 rounded-xl"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordReset}
                  disabled={isLoading}
                  className="w-full h-14 bg-primary text-primary-foreground font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-primary/10"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <><Key className="w-4 h-4 mr-2" /> Send Recovery Link</>}
                </Button>

                <button 
                  onClick={() => setMode('auth')}
                  className="w-full text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Return to Entry Terminal
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
