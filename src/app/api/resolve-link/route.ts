import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!res.ok) throw new Error('Failed to fetch link');
    
    // Follow redirect for Google Photos links
    const targetUrl = res.url;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extract OG Image
    let imageUrl = $('meta[property="og:image"]').attr('content') || 
                   $('meta[name="twitter:image"]').attr('content');

    // Special handling for Google Photos
    if (targetUrl.includes('photos.google.com') || targetUrl.includes('photos.app.goo.gl')) {
        // Look for the larger image in scripts or tags
        // Usually, Google Photos uses a meta tag for the preview which is okay,
        // but we can try to find a higher res version if available in script data.
        const imageSearch = html.match(/https:\/\/lh3\.googleusercontent\.com\/[a-zA-Z0-9\-_]+/g);
        if (imageSearch && imageSearch.length > 0) {
            // Pick the first one and ensure it's not a tiny thumb
            // Appending =w2400-h1600 ensures high resolution if it's the base URL
            imageUrl = `${imageSearch[0]}=w2400-h1600`;
        }
    }

    return NextResponse.json({ 
        resolvedUrl: targetUrl,
        imageUrl: imageUrl || null
    });

  } catch (error: any) {
    console.error('[RESOLVE LINK ERROR]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
