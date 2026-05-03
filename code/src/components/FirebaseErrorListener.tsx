'use client';

import { useState, useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { toast } from '@/hooks/use-toast';

/**
 * An invisible component that listens for globally emitted Firebase events.
 * - Throws 'permission-error' to be caught by global-error.tsx.
 * - Displays a toast for 'connectivity-error'.
 */
export function FirebaseErrorListener() {
  const [permError, setPermError] = useState<FirestorePermissionError | null>(null);

  useEffect(() => {
    const handlePermissionError = (error: FirestorePermissionError) => {
      setPermError(error);
    };

    const handleConnectivityError = (payload: { message: string, code: string }) => {
      toast({
        variant: "destructive",
        title: "Network Pulse Weak",
        description: payload.message,
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    errorEmitter.on('connectivity-error', handleConnectivityError);

    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
      errorEmitter.off('connectivity-error', handleConnectivityError);
    };
  }, []);

  if (permError) {
    throw permError;
  }

  return null;
}
