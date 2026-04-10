
'use server';
/**
 * @fileOverview A flow to generate and "send" an OTP for email verification.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const SendOtpInputSchema = z.object({
  email: z.string().email().describe('The user email to send the OTP to.'),
});
export type SendOtpInput = z.infer<typeof SendOtpInputSchema>;

const SendOtpOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  // In development, we might return the code for testing, 
  // but for this protocol we'll stick to terminal logging.
});
export type SendOtpOutput = z.infer<typeof SendOtpOutputSchema>;

/**
 * Generates a 6-digit OTP and saves it to Firestore for verification.
 * In this prototype, we simulate transmission by logging to the terminal.
 */
export async function sendOtp(input: SendOtpInput): Promise<SendOtpOutput> {
  return sendOtpFlow(input);
}

const sendOtpFlow = ai.defineFlow(
  {
    name: 'sendOtpFlow',
    inputSchema: SendOtpInputSchema,
    outputSchema: SendOtpOutputSchema,
  },
  async (input) => {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Initialize Firebase (Server-Safe)
      const { firestore } = initializeFirebase();
      const otpRef = doc(firestore, 'otp_codes', input.email);

      // Save OTP to Firestore for client-side verification
      await setDoc(otpRef, {
        code: otp,
        createdAt: serverTimestamp(),
      });

      // Simulation Layer: Log the code to the system terminal for the developer
      console.log('\n--------------------------------------------------');
      console.log(`[IDENTITY SYSTEM] AUTH PROTOCOL INITIATED`);
      console.log(`[IDENTITY SYSTEM] TARGET: ${input.email}`);
      console.log(`[IDENTITY SYSTEM] VERIFICATION CODE: ${otp}`);
      console.log('--------------------------------------------------\n');

      return {
        success: true,
        message: 'Identity verification protocol initialized. Check your terminal logs.',
      };
    } catch (error: any) {
      console.error('[IDENTITY SYSTEM] CRITICAL ERROR:', error);
      return {
        success: false,
        message: `Protocol failure: ${error.message || 'Identity transmission interrupted.'}`,
      };
    }
  }
);
