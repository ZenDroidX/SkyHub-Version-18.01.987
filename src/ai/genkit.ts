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

  return undefined;
};

const apiKey = getApiKey();

if (!apiKey) {
  console.error("AI CONFIG ERROR: No valid Gemini API key found in environment variables. Extraction will fail.");
}

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : {})
  ],
  model: 'googleai/gemini-3-flash-preview',
});

// Implementation of ignoreFailedSpan as requested by the user to suppress OTel noise
try {
  if ((ai as any).telemetry) {
     (ai as any).telemetry.ignoreFailedSpan = true;
  }
} catch (e) {
  // Silently ignore telemetry adjustment failures
}
