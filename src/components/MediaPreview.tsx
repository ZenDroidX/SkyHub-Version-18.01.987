
'use client';

import React from 'react';
import { resolveImageUrl, isVideoUrl } from '@/lib/image-resolver';

interface MediaPreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export const MediaPreview = ({ src, alt, className }: MediaPreviewProps) => {
  const isVideo = isVideoUrl(src);
  const resolved = resolveImageUrl(src);

  if (isVideo) {
    return (
      <video
        src={resolved}
        className={className}
        autoPlay
        loop
        playsInline
        webkit-playsinline="true"
        muted
        onMouseOver={(e) => (e.currentTarget.muted = false)}
        onMouseOut={(e) => (e.currentTarget.muted = true)}
        onClick={(e) => (e.currentTarget.muted = !e.currentTarget.muted)}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    );
  }

  return <img src={resolved} alt={alt} className={className} />;
};
