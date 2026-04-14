'use client';

import React from 'react';
import { useSearch } from '@/context/SearchContext';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ROMCard } from '@/components/sections/content-grid'; // Assuming these components exist
import { Card } from '@/components/ui/card';

export default function SearchResultsPage() {
  const { searchQuery } = useSearch();
  const db = useFirestore();
  
  const romsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'roms'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: roms } = useCollection(romsQuery);

  const filteredRoms = roms?.filter(rom => 
    (rom.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rom.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="py-32 max-w-7xl mx-auto px-6">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-10">Search Results for "{searchQuery}"</h1>
      {filteredRoms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRoms.map(rom => <ROMCard key={rom.id} rom={rom} />)}
        </div>
      ) : (
        <p className="text-muted-foreground">No results found.</p>
      )}
    </div>
  );
}
