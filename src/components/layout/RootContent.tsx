'use client';

import React, { useState, useEffect } from 'react';
import { loadUserTheme } from '@/lib/userTheme';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AudioLobby } from '@/components/layout/audio-lobby';
import { useFirebase, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { DEFAULT_DONATION_CONFIG } from '@/lib/store';

function Countdown({ endDate }: { endDate: Date }) {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => setTimeLeft(endDate.getTime() - Date.now());
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!mounted || timeLeft <= 0) return null;

  const seconds = Math.floor((timeLeft / 1000) % 60);
  const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="text-4xl font-mono mt-4 font-bold">
      {days > 0 && `${days}d `}{hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </div>
  );
}

export function RootContent({ children }: { children: React.ReactNode }) {
  const { auth, firestore: db } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const settingsRef = useMemoFirebase(() => db ? doc(db, 'donation', 'settings') : null, [db]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasResolvedSettings, setHasResolvedSettings] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isEnabled = settings?.loading 
    ? (settings.loading.enabled !== false)
    : (DEFAULT_DONATION_CONFIG.loading?.enabled !== false);

  const globalSettingsRef = useMemoFirebase(() => db ? doc(db, 'settings', 'global') : null, [db]);
  const { data: globalSettings } = useDoc(globalSettingsRef);
  
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const endTime = globalSettings?.maintenanceEndTime && typeof globalSettings.maintenanceEndTime.toDate === 'function' 
    ? globalSettings.maintenanceEndTime.toDate() 
    : null;

  useEffect(() => {
    const checkMaintenance = () => {
      if (!globalSettings) return;
      const now = new Date();
      const startTime = typeof globalSettings.maintenanceStartTime?.toDate === 'function' 
        ? globalSettings.maintenanceStartTime.toDate() 
        : null;
      const endTime = typeof globalSettings.maintenanceEndTime?.toDate === 'function' 
        ? globalSettings.maintenanceEndTime.toDate() 
        : null;
      
      setIsMaintenanceActive(
        !!globalSettings?.maintenanceMode &&
        !!startTime &&
        !!endTime &&
        now >= startTime &&
        now <= endTime
      );
    };
    
    checkMaintenance();
    const timer = setInterval(checkMaintenance, 1000);
    return () => clearInterval(timer);
  }, [globalSettings]);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const hasUserTheme = await loadUserTheme(user.uid);
        if (hasUserTheme) return;
      }
    });

    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!isSettingsLoading) {
      setHasResolvedSettings(true);
      if (!isEnabled) {
        setIsInitialLoad(false);
      }
    }
  }, [isSettingsLoading, isEnabled]);

  const showLoadingScreen = mounted && isInitialLoad && hasResolvedSettings && isEnabled;

  return (
    <>
      {isMaintenanceActive ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 text-white p-8 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl font-black uppercase">System Under Maintenance</h1>
            <p className="text-xl text-muted-foreground">{globalSettings?.maintenanceMessage || 'We will be back shortly.'}</p>
            {endTime && <Countdown endDate={endTime} />}
          </div>
        </div>
      ) : showLoadingScreen && (
        <LoadingScreen 
          config={settings?.loading || DEFAULT_DONATION_CONFIG.loading} 
          onFinished={() => setIsInitialLoad(false)} 
        />
      )}
      <div className={showLoadingScreen || isMaintenanceActive ? 'hidden' : 'block'}>
        {children}
        <AudioLobby />
      </div>
    </>
  );
}
