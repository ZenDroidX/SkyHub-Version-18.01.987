'use client';

import { Terminal } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white font-mono selection:bg-primary selection:text-black antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center">
          <div className="w-24 h-24 mb-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 animate-pulse">
            <Terminal className="w-12 h-12 text-red-500" />
          </div>
          
          <h1 className="text-4xl font-black mb-6 uppercase tracking-[0.3em] text-red-500">Critical Failure</h1>
          <div className="p-6 bg-red-950/20 border border-red-900/50 rounded-2xl max-w-xl w-full mb-10">
            <p className="text-red-400 text-sm mb-4 font-bold uppercase tracking-widest leading-none">Global Kernel Panic</p>
            <p className="text-muted-foreground text-[11px] uppercase tracking-widest leading-relaxed">
              The neural interface has experienced a fatal segmentation fault. 
              The entire registry has been locked to prevent data corruption.
            </p>
            <p className="text-[10px] mt-4 font-bold text-red-900 break-all bg-black/50 p-2 rounded">
              {error.message}
            </p>
          </div>

          <button 
            onClick={() => reset()}
            className="px-12 py-5 bg-red-600 text-white font-black uppercase tracking-[0.2em] text-xs rounded-full hover:bg-red-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(220,38,38,0.3)]"
          >
            Attempt System Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
