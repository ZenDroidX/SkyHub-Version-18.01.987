'use client';

import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { SiteSettings, DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function FloatingKitten() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: settings } = useDoc<SiteSettings>(settingsRef);
  
  const kittenConfig = settings?.kittenConfig || {
    enabled: false,
    imageUrl: 'https://media.giphy.com/media/VbnUQpnihPSIgIXuZv/giphy.gif', // placeholder cute kitten
    speed: 2,
    size: 100
  };

  const [isOpen, setIsOpen] = useState(false);

  if (!kittenConfig.enabled) return null;

  const handleKittenClick = () => {
    setIsOpen(true);
    const upiLink = settings?.supportLinks?.paymentLink || DEFAULT_DONATION_CONFIG.paymentLink;
    if (upiLink) {
        window.location.href = upiLink;
    }
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
        <DialogContent className="sm:max-w-[400px] glass border-white/10 rounded-[2rem] overflow-hidden p-8 shadow-2xl z-[100]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-center">Support Us!</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 mt-4">
             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">
                Scan QR or wait to be redirected to your UPI app.
             </p>
             <div className="bg-white p-4 rounded-xl shadow-inner w-48 h-48 border border-white/20">
               {qrUrl ? <img src={qrUrl} alt="UPI QR" className="w-full h-full object-cover" /> : null}
             </div>
             <p className="text-xs font-black uppercase tracking-widest bg-primary/20 text-primary py-2 px-4 rounded-full">
                {settings?.upiId || DEFAULT_DONATION_CONFIG.upiId}
             </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
