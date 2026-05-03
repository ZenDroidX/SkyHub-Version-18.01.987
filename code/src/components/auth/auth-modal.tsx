
'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth, useFirestore } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Loader2, Chrome } from 'lucide-react';

const HUB_OWNERS = ['meinkxun@gmail.com', 'skyhubowner@gmail.com'];

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthModal({ isOpen, onOpenChange }: AuthModalProps) {
  const auth = useAuth();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border rounded-[3rem] p-0 overflow-hidden max-w-sm shadow-2xl">
        <div className="p-10 space-y-8 flex flex-col items-center">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black uppercase tracking-tighter text-center">
              Terminal Entry
            </DialogTitle>
            <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Synchronize your Google identity to access the hub.
            </DialogDescription>
          </DialogHeader>

          <Button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full h-16 rounded-2xl border border-border bg-card hover:bg-muted font-black uppercase text-[10px] tracking-widest gap-4 flex items-center justify-center transition-all"
          >
            {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <><Chrome className="w-5 h-5 text-blue-500" /> Google Identity Sync</>}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
