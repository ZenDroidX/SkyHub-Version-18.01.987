import React from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { SearchProvider } from '@/context/SearchContext';
import { NotificationProvider } from '@/components/NotificationProvider';
import { RootContent } from '@/components/layout/RootContent';
import { Metadata } from 'next';

import { Space_Grotesk, Inter, Source_Code_Pro } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Priority 1: Use Environment Variables
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
    
    // Fallback: Fallback to local config if env vars are missing (for local dev/AI Studio)
    let finalProjectId = projectId;
    let finalDatabaseId = databaseId;
    
    if (!finalProjectId || !finalDatabaseId) {
      try {
        const config = require('../../firebase-applet-config.json');
        finalProjectId = finalProjectId || config.projectId;
        finalDatabaseId = finalDatabaseId || config.firestoreDatabaseId;
      } catch (e) {
        // No local config file
      }
    }

    if (!finalProjectId) throw new Error('No Firebase project ID found');

    const url = `https://firestore.googleapis.com/v1/projects/${finalProjectId}/databases/${finalDatabaseId || '(default)'}/documents/settings/global`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } }); // Revalidate every hour for SEO performance
    if (!res.ok) throw new Error('Failed to fetch settings');
    
    const data = await res.json();
    const fields = data.fields;
    const seo = fields?.seo?.mapValue?.fields;
    const faviconUrl = fields?.faviconUrl?.stringValue;
    const siteName = fields?.siteName?.stringValue;
    
    return {
      title: seo?.title?.stringValue || siteName || "Skyhub - Professional Hub",
      description: seo?.description?.stringValue || "Custom ROMs, Modules and System Modifications.",
      keywords: seo?.keywords?.stringValue || "android, roms, custom, modules",
      icons: {
        icon: faviconUrl || '/favicon.ico',
        shortcut: faviconUrl || '/favicon.ico',
        apple: faviconUrl || '/apple-touch-icon.png',
      },
      openGraph: {
        images: [seo?.ogImage?.stringValue || "/og-image.png"],
      }
    };
  } catch (e) {
    return {
      title: "Skyhub - Professional Hub",
      description: "Custom ROMs, Modules and System Modifications.",
    };
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${inter.variable} ${sourceCodePro.variable}`}>
      <head>
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
      <body className="font-body antialiased min-h-screen overflow-x-hidden transition-colors duration-300">
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
