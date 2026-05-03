'use client';

import React from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';

export function MessageHistory() {
  const db = useFirestore();
  const romsCollection = useMemoFirebase(() => collection(db, 'roms'), [db]);
  const romsQuery = useMemoFirebase(() => query(romsCollection, orderBy('created_at', 'desc')), [romsCollection]);
  const { data: messages, isLoading } = useCollection(romsQuery);

  if (isLoading) return <div>Loading history...</div>;

  return (
    <Card className="p-6 h-[500px]">
      <h3 className="text-lg font-semibold mb-4">Sync Message History</h3>
      <ScrollArea className="h-full">
        {messages ? (
          <ul className="space-y-4">
            {messages.map((message) => (
              <li key={message.id} className="p-4 border rounded-lg bg-muted/50">
                <p className="text-sm text-foreground/80">{message.raw_text}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {message.created_at ? format(message.created_at.toDate(), 'PPP p') : 'Unknown date'}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No history found.</p>
        )}
      </ScrollArea>
    </Card>
  );
}
