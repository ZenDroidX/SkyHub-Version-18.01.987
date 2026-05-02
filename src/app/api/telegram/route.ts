import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

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
    const posts: any[] = [];
    
    $('.tgme_widget_message').each((i, el) => {
      const text = $(el).find('.tgme_widget_message_text').text();
      const buttons: { text: string; url: string }[] = [];
      
      $(el).find('.tgme_widget_message_inline_button').each((j, btn) => {
        const btnText = $(btn).text();
        const btnUrl = $(btn).attr('href');
        if (btnUrl) {
          buttons.push({ text: btnText, url: btnUrl });
        }
      });

      if (text || buttons.length > 0) {
        posts.push({
          text,
          buttons,
          date: $(el).find('time').attr('datetime')
        });
      }
    });

    return NextResponse.json({ posts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
