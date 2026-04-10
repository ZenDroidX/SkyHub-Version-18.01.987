'use client';

import { useEffect } from 'react';
import { listenGlobalSettings } from '@/lib/themeManager';

// Helper to convert hex to HSL string format: "H S% L%"
function hexToHSL(hex: string): string {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const unsub = listenGlobalSettings((data: any) => {
      if (data.theme) {
        Object.entries(data.theme).forEach(([key, value]) => {
          const hexValue = value as string;
          if (key === 'primary') {
            document.documentElement.style.setProperty('--primary', hexToHSL(hexValue));
          } else if (key === 'bg') {
            document.documentElement.style.setProperty('--background', hexToHSL(hexValue));
            document.documentElement.style.setProperty('--bg', hexValue); // Keep for inline styles if needed
          } else {
            document.documentElement.style.setProperty(`--color-${key}`, hexValue);
          }
        });
      }

      if (data.faviconUrl) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = data.faviconUrl;
      }

      if (data.siteName) {
        document.title = data.siteName;
      }
    });

    return () => unsub();
  }, []);

  return <>{children}</>;
}
