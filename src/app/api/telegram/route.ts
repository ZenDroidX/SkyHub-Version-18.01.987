import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const targetUrl = new URL(url);
    if (!targetUrl.pathname.startsWith('/s/')) {
      const parts = targetUrl.pathname.split('/').filter(Boolean);
      if (parts.length > 0) {
        targetUrl.pathname = `/s/${parts[0]}`;
      }
    }

    const res = await fetch(targetUrl.toString());
    if (!res.ok) throw new Error('Failed to fetch from Telegram');
    const html = await res.text();
    
    const $ = cheerio.load(html);
    const posts: string[] = [];
    
    $('.tgme_widget_message_text').each((i, el) => {
      posts.push($(el).text());
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
