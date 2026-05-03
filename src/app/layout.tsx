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
    const config = require('../../firebase-applet-config.json');
    const projectId = config.projectId;
    const databaseId = config.firestoreDatabaseId;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/settings/global`;
    
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) throw new Error('Failed to fetch settings');
    
    const data = await res.json();
    const seo = data.fields?.seo?.mapValue?.fields;
    
    return {
      title: seo?.title?.stringValue || "Skyhub - Professional Hub",
      description: seo?.description?.stringValue || "Custom ROMs, Modules and System Modifications.",
      keywords: seo?.keywords?.stringValue || "android, roms, custom, modules",
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
