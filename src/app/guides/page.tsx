"use client";

import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, User, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const parseLinks = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\[.*?\]\(.*?\))/);
  return parts.map((part, i) => {
    const match = part.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
      return (
        <a 
          key={i} 
          href={match[2]} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary hover:underline font-bold transition-colors mx-1 inline-flex items-center"
        >
          {match[1]}
        </a>
      );
    }
    return part;
  });
};

export default function GuidesBrowsePage() {
  const db = useFirestore();
  const guidesQuery = useMemoFirebase(() => db ? query(collection(db, 'tutorials'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: guides, isLoading } = useCollection(guidesQuery);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      <div className="pt-36 pb-24 px-6 max-w-5xl mx-auto">
        <div className="mb-14">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Hub</span>
            </Button>
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-pill border-primary/20 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Knowledge Base</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground mb-3">
            Technical <span className="text-primary italic">Guides</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl">
            Step-by-step flashing instructions, bootloader unlock protocols, and kernel tuning guides.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 rounded-3xl bg-muted/40 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : !guides || guides.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-border/80 rounded-3xl bg-card/40">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground mb-1">No guides published yet</h3>
            <p className="text-xs text-muted-foreground">New flashing manuals will appear here shortly.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {guides.map((guide, idx) => (
              <motion.div 
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card id={guide.id} className="glass border-border/80 p-6 sm:p-8 rounded-3xl hover:border-primary/40 transition-all bg-card/70 shadow-sm hover:shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-bold uppercase text-[10px] tracking-wider rounded-lg px-3 py-1">
                      {guide.category || 'Tutorial'}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{guide.createdAt?.toDate ? new Date(guide.createdAt.toDate()).toLocaleDateString() : 'Updated recently'}</span>
                    </div>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4">
                    {guide.title}
                  </h2>

                  <div className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap p-4 rounded-2xl bg-muted/30 border border-border/40 font-mono text-xs">
                    {parseLinks(guide.content)}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
