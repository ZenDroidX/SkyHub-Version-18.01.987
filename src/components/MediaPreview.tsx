
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { resolveImageUrl, isVideoUrl } from '@/lib/image-resolver';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface MediaPreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export const MediaPreview = ({ src, alt, className }: MediaPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const isVideo = isVideoUrl(src);
  const resolved = resolveImageUrl(src);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-10"
          >
            <Skeleton className="w-full h-full bg-muted/20" />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: isLoading ? 0 : 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="w-full h-full"
      >
        {isVideo ? (
          <video
            src={resolved}
            className="w-full h-full object-cover"
            autoPlay
            loop
            playsInline
            muted
            onLoadedData={() => setIsLoading(false)}
            onMouseOver={(e) => (e.currentTarget.muted = false)}
            onMouseOut={(e) => (e.currentTarget.muted = true)}
            onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)}
          />
        ) : (
          <Image 
            src={resolved} 
            alt={alt || 'Preview'} 
            fill
            className="object-cover"
            onLoadingComplete={() => setIsLoading(false)}
            referrerPolicy="no-referrer"
          />
        )}
      </motion.div>
    </div>
  );
};
