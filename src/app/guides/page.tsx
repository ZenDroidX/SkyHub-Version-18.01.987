"use client";

import React from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/sections/footer';
import { useCollection, useMemoFirebase, useFirestore } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Clock, User } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const parseLinks = (text: string) => {
  if (!text) return null;
  // Match standard markdown link pattern [text](url)
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
          className="text-blue-500 hover:text-blue-400 font-bold underline transition-colors mx-1 inline-flex items-center"
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
  const guidesQuery = useMemoFirebase(() => collection(db, 'tutorials'), [db]);
  const { data: guides, isLoading } = useCollection(guidesQuery);

  return (
    <main className="min-h-screen bg-background text-white">
      <Navbar />
      
      <motion.div 
        className="pt-32 pb-20 px-6 max-w-5xl mx-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="mb-20">
          <Link href="/">
            <motion.div whileHover={{ x: -10 }} transition={{ type: "spring", stiffness: 400 }}>
              <Button variant="ghost" className="mb-8 p-0 hover:bg-transparent hover:text-white text-muted-foreground group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Return Home
              </Button>
            </motion.div>
          </Link>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4">TECHNICAL <span className="text-muted-foreground">GUIDES</span></h1>
          <p className="text-muted-foreground text-lg max-w-xl">Official documentation and community tutorials.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Loading Knowledge...</p>
          </div>
        ) : guides?.length === 0 ? (
          <div className="py-40 text-center border border-dashed border-white/10 rounded-[3rem]">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground">No guides published yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {guides?.map((guide, idx) => (
              <motion.div 
                key={guide.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card id={guide.id} className="glass border-white/10 p-10 rounded-[2.5rem] group hover:bg-white/[0.03] transition-all">
                  <div className="flex flex-col md:flex-row justify-between gap-8">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <Badge className="bg-[#2563eb] text-white font-black uppercase text-[8px] tracking-widest rounded-lg px-4 py-1.5 border-none">
                          {guide.category || 'Tutorial'}
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Clock className="w-3 h-3" />
                          {guide.createdAt?.toDate ? new Date(guide.createdAt.toDate()).toLocaleDateString() : 'Feb 2025'}
                        </div>
                      </div>
                      <h2 className="text-3xl font-black uppercase mb-6 group-hover:text-white transition-colors">{guide.title}</h2>
                      <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed mb-8 whitespace-pre-wrap">
                        {parseLinks(guide.content)}
                      </div>
                      {guide.developer && guide.developer !== 'Admin' && guide.developer !== 'mein_kxun' && (
                        <div className="flex items-center gap-4 pt-6 border-t border-white/5">
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white">
                            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </div>
                            {guide.developer}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="hidden md:flex flex-col items-end">
                      <motion.div 
                        className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-muted-foreground"
                        whileHover={{ rotate: 15, scale: 1.1 }}
                      >
                        <BookOpen className="w-8 h-8" />
                      </motion.div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <Footer />
    </main>
  );
}
