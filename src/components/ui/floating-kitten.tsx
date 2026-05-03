'use client';

import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { SiteSettings, DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function FloatingKitten() {
  const db = useFirestore();
  const { data: rawSettings } = useDoc(doc(db, 'settings', 'global'));
  const settings = (rawSettings as SiteSettings) || null;
  const kittenConfig = settings?.kittenConfig || {
    enabled: true,
    imageUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif',
    size: 100
  };

  const [isOpen, setIsOpen] = useState(false);

  if (!kittenConfig.enabled) return null;

  const handleKittenClick = () => {
    setIsOpen(true);
  };

  const qrUrl = settings?.supportLinks?.qrLink || settings?.qrImageUrl || DEFAULT_DONATION_CONFIG.qrImageUrl;

  return (
    <>
      <div 
        className="fixed z-50 cursor-pointer pointer-events-auto hover:scale-110 transition-transform drop-shadow-2xl right-4 bottom-4 animate-in fade-in zoom-in duration-500"
        style={{
           width: kittenConfig.size,
           height: kittenConfig.size
        }}
        onClick={handleKittenClick}
      >
        <img 
          src={kittenConfig.imageUrl || 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif'} 
          alt="Floating Kitten" 
          className="w-full h-full object-contain"
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] border-white/20 rounded-[2.5rem] overflow-hidden p-8 shadow-[inset_0_0_20px_rgba(255,255,255,0.2),_0_20px_50px_rgba(0,0,0,0.5)] z-[100] backdrop-blur-[40px] bg-white/5 dark:bg-black/20 before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-br before:from-white/20 before:via-transparent before:to-black/30">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">Support Us!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 mt-4 relative z-10">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                Scan QR using your UPI app.
             </p>
             <div className="bg-white p-4 rounded-3xl shadow-[0_0_20px_rgba(255,255,255,0.5)] w-48 h-48 border border-white/40 transform hover:scale-105 transition-transform duration-300">
               {qrUrl ? <img src={qrUrl} alt="UPI QR" className="w-full h-full object-cover rounded-xl" /> : null}
             </div>
             <p className="text-xs font-black uppercase tracking-widest bg-primary/20 backdrop-blur-md text-primary py-3 px-6 rounded-full border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                {settings?.upiId || DEFAULT_DONATION_CONFIG.upiId}
             </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
