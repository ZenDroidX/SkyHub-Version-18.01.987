'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ExternalLink, QrCode, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SiteSettings, DEFAULT_DONATION_CONFIG } from '@/lib/store';
import { MediaPreview } from '@/components/MediaPreview';
import { cn } from '@/lib/utils';

interface PaymentFloatingButtonProps {
  settings: SiteSettings | undefined;
}

export function PaymentFloatingButton({ settings }: PaymentFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const upiId = settings?.upiId || DEFAULT_DONATION_CONFIG.upiId;
  const upiAmount = settings?.upiAmount || DEFAULT_DONATION_CONFIG.upiAmount;
  const qrImageUrl = settings?.qrImageUrl || DEFAULT_DONATION_CONFIG.qrImageUrl;

  if (!upiId) return null;

  const upiLink = `upi://pay?pa=${upiId}&pn=SkyHub&am=${upiAmount || ''}&cu=INR`;

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96"
          >
            <Card className="glass border-border shadow-2xl rounded-[2.5rem] overflow-hidden overflow-y-auto max-h-[80vh] scrollbar-hide">
              <div className="relative p-8">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 rounded-full h-8 w-8 bg-muted hover:bg-muted/80"
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="text-center space-y-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-2">
                      <Heart className="w-6 h-6 fill-current" />
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tighter italic">Support the <span className="text-primary underline decoration-2 underline-offset-4">Protocol</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Contribute to the survival of the registry</p>
                  </div>

                  {qrImageUrl && (
                    <div className="relative aspect-square w-48 mx-auto rounded-3xl overflow-hidden border-2 border-primary/20 p-2 bg-white">
                      <MediaPreview src={qrImageUrl} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="space-y-4 pt-4">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-left">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">UPI Identity</p>
                      <p className="text-xs font-mono font-bold break-all select-all">{upiId}</p>
                      {upiAmount && (
                        <div className="mt-2 text-[8px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          Target: ₹{upiAmount}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        asChild
                        className="flex-1 h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-primary/20"
                      >
                        <a href={upiLink}>
                          Pay via App <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => {
                          const link = prompt('Deep link for manual override:', upiLink);
                          if (link) window.location.href = link;
                        }}
                        className="w-14 h-14 rounded-2xl bg-muted hover:bg-muted/80 flex items-center justify-center"
                      >
                        <QrCode className="w-5 h-5" />
                      </Button>
                    </div>
                    <p className="text-[8px] font-black uppercase text-center text-muted-foreground/40 leading-relaxed italic">
                      Transactions are processed via your local UPI provider.<br />
                      Thank you for keeping the nodes running.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 relative overflow-hidden",
          isOpen ? "bg-muted text-foreground" : "bg-primary text-white"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Heart className="w-6 h-6 fill-current animate-pulse" />}
        </motion.div>
        {!isOpen && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        )}
      </motion.button>
    </div>
  );
}
