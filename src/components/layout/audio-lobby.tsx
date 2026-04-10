
"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export function AudioLobby() {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings } = useDoc(settingsRef);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const audioConfig = settings?.audio;

  useEffect(() => {
    // Robust interaction listener for browser autoplay policies
    const handleInteraction = () => {
      setHasInteracted(true);
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('mousedown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('mousedown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioConfig) return;

    // Set volume (0.0 to 1.0)
    audio.volume = audioConfig.volume !== undefined ? audioConfig.volume : 0.3;
    
    if (audioConfig.enabled && hasInteracted && audioConfig.url) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Autoplay policy still blocking or invalid URL format
          console.warn("Acoustic Hub: Playback initialization pending interaction or invalid resource.", err.message);
        });
      }
    } else {
      audio.pause();
    }
  }, [audioConfig, hasInteracted]);

  // Render an invisible, sr-only audio element that loops infinitely
  return (
    <div className="sr-only pointer-events-none invisible h-0 w-0" aria-hidden="true">
      {audioConfig?.url && (
        <audio 
          key={audioConfig.url} // Force reload when the registry URL changes
          ref={audioRef} 
          src={audioConfig.url} 
          loop={true} 
          preload="auto"
        />
      )}
    </div>
  );
}
