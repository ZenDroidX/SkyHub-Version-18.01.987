'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function PostSection() {
  const db = useFirestore();
  const postsRef = useMemo(() => collection(db, 'posts'), [db]);
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    const fetchPosts = async () => {
      const q = query(postsRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPosts(fetchedPosts);
    };
    fetchPosts();
  }, [postsRef]);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-black uppercase mb-8">Post</h2>
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <CardTitle>{new Date(post.date).toLocaleDateString()}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4">{post.content}</p>
                <Button asChild variant="outline">
                  <a href={post.url} target="_blank" rel="noopener noreferrer">
                    Visit Post <ExternalLink className="ml-2 w-4 h-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
