import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Robust API key resolution for the AI Studio environment.
 * Prioritizes the platform-provided public key and filters out placeholders.
 */
const getApiKey = () => {
  // Always prioritize the public key which is most reliable in this context
  const publicApi = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (publicApi && publicApi.length > 10 && !publicApi.startsWith('MY_') && !publicApi.startsWith('YOUR_') && !publicApi.includes('placeholder')) {
    return publicApi.trim();
  }

  // Fallback to other possible environment variables if they are not placeholders
  const fallbacks = [
    process.env.GEMINI_API_KEY,
    process.env.GOOGLE_API_KEY,
    process.env.GOOGLE_GENAI_API_KEY
  ];

  for (const key of fallbacks) {
    if (key && typeof key === 'string' && key.length > 10) {
      const k = key.trim();
      if (!k.startsWith('MY_') && !k.startsWith('YOUR_') && !k.includes('placeholder')) {
        return k;
      }
    }
  }

  return undefined;
};

const apiKey = getApiKey();

export const ai = genkit({
  plugins: [
    googleAI(apiKey ? { apiKey } : {})
  ],
  // Use the recommended Gemini 3 Flash model
  model: 'googleai/gemini-3-flash-preview',
});

// Implementation of ignoreFailedSpan as requested by the user to suppress OTel noise
try {
  const telemetry = (ai as any).telemetry;
  if (telemetry) {
    // Genkit 1.x often initializes export lazily, so we set the preference
    // on the internal configuration if available.
    if (telemetry.export) {
      telemetry.export.ignoreFailedSpan = true;
    } else {
      // Defensive fallback for earlier initialization
      (ai as any)._telemetryConfig = {
        ...(ai as any)._telemetryConfig,
        ignoreFailedSpan: true
      };
    }
  }
} catch (e) {
  // Silently ignore telemetry adjustment failures
}
