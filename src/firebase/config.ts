import { initializeFirebase } from './index';

// Initialize Firebase only once and export accessors.
// This ensures that initialization happens when first accessed, 
// rather than strictly at module load time which can crash SSR/build.
let initialized: ReturnType<typeof initializeFirebase> | null = null;

function getServices() {
  if (typeof window === 'undefined') {
    // Return mock or empty services for SSR if initialization is not safe
    // But initializeFirebase handles this to some extent.
    // However, top level call is still the main risk.
  }
  
  if (!initialized) {
    initialized = initializeFirebase();
  }
  return initialized;
}

export const db = typeof window !== 'undefined' ? getServices().firestore : null as any;
export const auth = typeof window !== 'undefined' ? getServices().auth : null as any;
export const storage = typeof window !== 'undefined' ? getServices().storage : null as any;
