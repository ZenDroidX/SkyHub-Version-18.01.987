
"use client";

import { loadUserTheme } from '@/lib/userTheme';
import { auth } from '@/firebase/config';
import React, { useState, useEffect } from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AudioLobby } from '@/components/layout/audio-lobby';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG } from '@/lib/store';
import ThemeProvider from '@/components/ThemeProvider';
import { SearchProvider } from '@/context/SearchContext';
import { NotificationProvider } from '@/components/NotificationProvider';

function RootContent({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const settingsRef = useMemoFirebase(() => doc(db, 'donation', 'settings'), [db]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasResolvedSettings, setHasResolvedSettings] = useState(false);

  // Determine if it should be enabled.
  // We default to the registry value once loaded, or the DEFAULT config if never set.
  const isEnabled = settings?.loading 
    ? (settings.loading.enabled !== false)
    : (DEFAULT_DONATION_CONFIG.loading?.enabled !== false);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hasUserTheme = await loadUserTheme(user.uid);
        if (hasUserTheme) return;
      }
    });

    // Once settings are resolved, we decide whether to show the loader or skip it.
    if (!isSettingsLoading) {
      setHasResolvedSettings(true);
      if (!isEnabled) {
        setIsInitialLoad(false);
      }
    }
  }, [isSettingsLoading, isEnabled]);

  // Final visibility check: 
  // We only show the loading screen if we have resolved the settings AND it is enabled AND we are still in initial load.
  const showLoadingScreen = isInitialLoad && hasResolvedSettings && isEnabled;

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hasUserTheme = await loadUserTheme(user.uid);
        if (hasUserTheme) return;
      }
    });
  }, []);

  return (
    <>
      {showLoadingScreen && (
        <LoadingScreen 
          config={settings?.loading || DEFAULT_DONATION_CONFIG.loading} 
          onFinished={() => setIsInitialLoad(false)} 
        />
      )}
      <div className={showLoadingScreen ? 'hidden' : 'block'}>
        {children}
        <AudioLobby />
      </div>
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hasUserTheme = await loadUserTheme(user.uid);
        if (hasUserTheme) return;
      }
    });
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800;900&family=Source+Code+Pro:wght@400;600&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('skyhub-theme');
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (!theme && supportDarkMode) theme = 'dark';
                  if (!theme) theme = 'dark'; // Default to dark for this hub
                  document.documentElement.classList.add(theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body style={{backgroundColor:'var(--bg)', color:'white'}} className="font-body antialiased selection:bg-primary/30 min-h-screen overflow-x-hidden">
        <FirebaseClientProvider>
          <SearchProvider>
            <ThemeProvider>
              <NotificationProvider>
                <RootContent>
                  {children}
                </RootContent>
              </NotificationProvider>
            </ThemeProvider>
          </SearchProvider>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
