import Link from 'next/link';
import { Terminal } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-black text-white selection:bg-primary selection:text-black">
      <div className="w-20 h-20 mb-8 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <Terminal className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-4xl font-black mb-4 uppercase tracking-[0.2em]">404: Node Missing</h1>
      <p className="text-muted-foreground font-mono text-sm mb-8 max-w-md">
        The requested transmission URI could not be located in the current neural net registry.
      </p>
      <Link 
        href="/"
        className="px-8 py-4 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-primary/80 transition-all hover:scale-105 active:scale-95"
      >
        Return to Core
      </Link>
    </div>
  );
}
