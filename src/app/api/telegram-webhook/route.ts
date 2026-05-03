import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview Production Webhook for Telegram ROM Sync (Vercel Optimized)
 * Path: /api/telegram-webhook
 * 
 * This handler is strictly optimized for Next.js App Router to prevent redirects (307)
 * and ensure immediate acknowledgment (200) to the Telegram Bot API.
 */

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const update = await req.json();

    // Protocol Verification: Ensure update is a broadcast channel post
    if (!update.channel_post) {
      return Response.json({ success: true, status: 'ignored_not_channel_post' });
    }

    const post = update.channel_post;
    const text = post.text || post.caption;

    // Content Check: Ignore transmissions without technical or descriptive text
    if (!text) {
      return Response.json({ success: true, status: 'ignored_no_text' });
    }

    // Registry Calibration: Connect to Firebase Admin Node
    const db = adminDb();
    if (!db) {
      console.error('[SKY HUB CRITICAL] Firestore Node Offline. Check Vercel Env Variables.');
      return Response.json({ success: true, error: 'database_offline' });
    }

    // Data Synchronization
    // We log the raw_text from Telegram to be processed by the dashboard's AI extraction layer
    await db.collection('roms').add({
      raw_text: text,
      source: "telegram",
      created_at: FieldValue.serverTimestamp()
    });

    // Immediate Acknowledgment to Telegram API to prevent retry loops
    return Response.json({ success: true });

  } catch (error: any) {
    console.error('[SKY HUB WEBHOOK ERROR]', error);
    // Always return a success-style JSON to Telegram to satisfy the webhook protocol
    return Response.json({ success: true, error: error.message });
  }
}

/**
 * Security Layer: Block unauthorized GET requests to the webhook node with a 405.
 */
export async function GET() {
  return new Response('Method Not Allowed', { 
    status: 405,
    headers: { 'Allow': 'POST' }
  });
}
