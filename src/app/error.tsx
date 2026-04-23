'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an analytics provider or tech log
    console.error('[SYSTEM KERNEL ERROR]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-transparent text-white font-mono selection:bg-primary selection:text-black">
      <div className="w-20 h-20 mb-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-black mb-2 uppercase tracking-[0.2em] text-red-500">Execution Fault</h1>
      <p className="text-muted-foreground text-xs mb-8 max-w-md uppercase tracking-widest leading-relaxed">
        Neural link interrupted. Segment violation detected at registry handle.
        <br />
        <span className="text-[10px] mt-2 block opacity-50">Error Digest: {error.digest || 'UNKNOWN_TRAP'}</span>
      </p>

      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={reset}
          className="rounded-full border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all uppercase text-[10px] tracking-widest font-black"
        >
          <RefreshCcw className="w-3 h-3 mr-2" /> Reboot Logic
        </Button>
        <Button 
          variant="outline"
          asChild
          className="rounded-full border-white/20 text-white hover:bg-white hover:text-black transition-all uppercase text-[10px] tracking-widest font-black"
        >
          <Link href="/">Return to Core</Link>
        </Button>
      </div>
    </div>
  );
}
