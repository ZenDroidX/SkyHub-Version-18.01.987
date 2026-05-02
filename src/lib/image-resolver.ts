export function isVideoUrl(url: string | undefined): boolean {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.mp3', '.wav']; // Adding audio for safety if they paste audio links too
  const lowUrl = url.toLowerCase();
  
  // Direct extension check
  if (videoExtensions.some(ext => lowUrl.includes(ext))) return true;
  
  // Link containing typical video keywords
  if (lowUrl.includes('clouddn.com') || lowUrl.includes('video-content') || lowUrl.includes('live-wallpaper')) return true;
  
  // Specific patterns for cloud storage that might be videos
  if (url.includes('firebasestorage.googleapis.com') && url.includes('alt=media')) {
    // If it's a firebase link, it might be a video. 
    // We can't be 100% sure without metadata, but we can look for common video keywords in the path
    if (lowUrl.includes('video') || lowUrl.includes('animation') || lowUrl.includes('mp4') || lowUrl.includes('clip')) return true;
  }

  // Check for common video hosting subdomains or path segments
  if (lowUrl.includes('/videos/') || lowUrl.includes('/vids/') || lowUrl.includes('stream')) return true;

  // Google Drive and Photos are tricky but we can try to guess if they have visual indicators
  return false;
}

/**
 * Resolves various external image links (Google Photos, Google Drive, etc.) 
 * into direct image sources that can be used in <img> tags or Next.js <Image>.
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';

  // 1. Google Drive Links
  // Patterns: 
  // https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  // https://drive.google.com/open?id=FILE_ID
  if (url.includes('drive.google.com')) {
    const fileId = url.match(/\/file\/d\/(.+?)\//)?.[1] || 
                   url.match(/id=(.+?)(&|$)/)?.[1] ||
                   url.match(/\/file\/d\/(.+)$/)?.[1];
    
    if (fileId) {
      // Use the thumbnail/view link which is often more reliable than /uc?id for embedding in some contexts,
      // but /uc?id is the standard for direct image source.
      return `https://docs.google.com/uc?export=view&id=${fileId}`;
    }
  }

  // 2. Google Photos Links
  // Note: Standard sharing links (https://photos.app.goo.gl/...) cannot be resolved 
  // easily client-side because of redirect/CORS. 
  // However, we can handle direct links from lh3.googleusercontent.com 
  // and ensure they have a size parameter if missing.
  if (url.includes('googleusercontent.com')) {
    // If it doesn't have a size parameter (e.g. =w1000 or -no), we can't easily guess,
    // but usually these direct links work as is. 
    // If it's a profile photo link, it might have =s96-c etc.
    return url;
  }

  // 3. Imgur (Ensure direct link)
  if (url.includes('imgur.com') && !url.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    // Basic attempt to fix page links
    if (url.includes('/a/') || url.includes('/gallery/')) {
       // Too complex for simple regex, return as is
       return url;
    }
    const slug = url.split('/').pop();
    if (slug) return `https://i.imgur.com/${slug}.jpg`;
  }

  return url;
}
