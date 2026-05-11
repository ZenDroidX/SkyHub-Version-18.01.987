import React from 'react';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { Toaster } from '@/components/ui/toaster';
import ThemeProvider from '@/components/ThemeProvider';
import { SearchProvider } from '@/context/SearchContext';
import { NotificationProvider } from '@/components/NotificationProvider';
import { RootContent } from '@/components/layout/RootContent';

import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
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
