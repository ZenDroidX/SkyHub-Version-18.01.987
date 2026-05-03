'use client';

import { useEffect, useState } from 'react';
import { listenGlobalSettings } from '@/lib/themeManager';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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
  const { user } = useUser();
  const db = useFirestore();
  const userProfileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userProfileRef);
  const [globalData, setGlobalData] = useState<any>(null);

  useEffect(() => {
    const unsub = listenGlobalSettings((data: any) => {
      setGlobalData(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const applyStyles = () => {
      console.log('Applying styles, globalData:', globalData, 'profile:', profile);
      const isLightMode = document.documentElement.classList.contains('light');
      
      // Determine which theme to apply: global theme takes precedence over user theme
      const themeToApply = globalData?.theme || profile?.theme;
      console.log('Theme to apply:', themeToApply);

      if (isLightMode) {
        // Clear inline styles to allow CSS classes to take over
        [
          '--primary', '--background', '--bg', '--site-gradient', 
          '--font-sans', '--font-body', '--radius', '--spacing-custom'
        ].forEach(prop => document.documentElement.style.removeProperty(prop));
        return;
      }

      if (themeToApply) {
        // Reset gradient to transparent first to avoid lingering gradients
        document.documentElement.style.setProperty('--site-gradient', 'transparent');
        
        // Apply theme properties
        Object.entries(themeToApply).forEach(([key, value]) => {
          const stringValue = value as string;
          if (key === 'primary') {
            document.documentElement.style.setProperty('--primary', hexToHSL(stringValue));
          } else if (key === 'textColor') {
            document.documentElement.style.setProperty('--foreground', hexToHSL(stringValue));
          } else if (key === 'gradient') {
            document.documentElement.style.setProperty('--site-gradient', stringValue);
            document.documentElement.style.setProperty('--button-gradient', stringValue);
          } else if (key === 'bg') {
            document.documentElement.style.setProperty('--background', hexToHSL(stringValue));
            document.documentElement.style.setProperty('--bg', stringValue);
            // If no gradient is set, use the background color as the gradient
            if (!themeToApply.gradient) {
              document.documentElement.style.setProperty('--site-gradient', stringValue);
            }
          } else if (key === 'fontFamily') {
            document.documentElement.style.setProperty('--font-sans', stringValue);
            document.documentElement.style.setProperty('--font-body', stringValue);
          } else if (key === 'borderRadius') {
            document.documentElement.style.setProperty('--radius', stringValue);
          } else if (key === 'spacing') {
            document.documentElement.style.setProperty('--spacing-custom', stringValue);
          } else {
            document.documentElement.style.setProperty(`--color-${key}`, stringValue);
          }
        });
      } else {
        // Reset to default (Dark Mode)
        document.documentElement.style.setProperty('--site-gradient', '#000000'); 
        document.documentElement.style.setProperty('--primary', '160 70% 45%');
        document.documentElement.style.setProperty('--background', '0 0% 0%');
        document.documentElement.style.setProperty('--bg', '#000000');
        document.documentElement.style.setProperty('--foreground', '200 20% 90%');
        document.documentElement.style.setProperty('--font-sans', 'Inter');
        document.documentElement.style.setProperty('--font-body', 'Inter');
        document.documentElement.style.setProperty('--radius', '1.5rem');
        document.documentElement.style.setProperty('--spacing-custom', '1rem');
      }
    };

    applyStyles();

    if (globalData?.faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = globalData.faviconUrl;
    }

    if (globalData?.siteName) {
      document.title = globalData.siteName;
    }

    const observer = new MutationObserver(applyStyles);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [globalData, profile]);

  return <>{children}</>;
}
