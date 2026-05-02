import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Robust API key resolution for the AI Studio environment.
 */
const getApiKey = () => {
  // Priority 1: Public key (most reliable in this environment)
  const publicApi = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (publicApi && publicApi.length > 20 && !publicApi.includes('placeholder')) {
    return publicApi.trim();
  }

  // Priority 2: Standard environment variable
  const privateApi = process.env.GEMINI_API_KEY;
  if (privateApi && privateApi.length > 20 && !privateApi.includes('placeholder')) {
    return privateApi.trim();
  }

  // Fallback for cloud environment if no key is provided yet
  return undefined;
};

const apiKey = getApiKey();

if (!apiKey && typeof window === 'undefined') {
  console.warn("AI CONFIG WARNING: No valid Gemini API key found in server environment. Extraction flows may fail.");
}

// In the browser context (e.g. when Action stubs are loaded), we provide a dummy key
// to satisfy the constructor if no public key is found. The real calls happen on the server.
const genkitKey = apiKey || (typeof window !== 'undefined' ? 'BROWSER_CLIENT_STUB' : '');

export const ai = genkit({
  plugins: [
    googleAI(genkitKey ? { apiKey: genkitKey } : {})
  ],
  model: 'googleai/gemini-1.5-flash',
});

// Implementation of ignoreFailedSpan as requested by the user to suppress OTel noise
try {
  if ((ai as any).telemetry) {
     (ai as any).telemetry.ignoreFailedSpan = true;
  }
} catch (e) {
  // Silently ignore telemetry adjustment failures
}
