import { NextResponse } from 'next/server';
import { romExtractor } from '@/ai/flows/rom-extractor';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Text is required' }, { status: 400 });

    const roms = await romExtractor(text);
    return NextResponse.json({ roms });
  } catch (error: any) {
    console.error('[EXTRACT ROM ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
