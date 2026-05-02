'use server';
/**
 * @fileOverview A flow to extract Android resources (ROMs, Wallpapers, Modules) from external website HTML or Telegram posts.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractResourcesInputSchema = z.object({
  url: z.string().url().describe('The URL of the website to scan for data.'),
});
export type ExtractRomsInput = z.infer<typeof ExtractResourcesInputSchema>;

const ExtractResourcesFromRawHtmlInputSchema = z.object({
  html: z.string().describe('The raw HTML or Telegram post content to analyze.'),
  url: z.string().optional().describe('Source URL if available.'),
});

const ResourceExtractionSchema = z.object({
  name: z.string().describe('Name of the resource (ROM name, Wallpaper title, etc.).'),
  androidVersion: z.string().optional().describe('Android version if applicable.'),
  version: z.string().optional().describe('Resource version (e.g. 3.0.4.0).'),
  description: z.string().describe('Detailed description, features, or changelog.'),
  downloadUrl: z.string().describe('Primary download or direct asset link.'),
  imageUrl: z.string().optional().describe('Preview image or thumbnail URL.'),
  bootAnimationUrl: z.string().optional().describe('Link to a custom boot animation GIF or video if available.'),
  mirrors: z.array(z.string()).optional().describe('Additional redundant download links.'),
  screenshots: z.array(z.string()).optional().describe('System screenshot URLs.'),
  addons: z.array(z.object({
    name: z.string(),
    downloadUrl: z.string(),
    description: z.string().optional()
  })).optional().describe('Supplementary files mentioned (APKs, specific modules).')
});

const ExtractResourcesOutputSchema = z.object({
  roms: z.array(ResourceExtractionSchema).describe('List of extracted resources.'),
});
export type ExtractRomsOutput = z.infer<typeof ExtractResourcesOutputSchema>;

const extractResourcesPrompt = ai.definePrompt({
  name: 'extractResourcesPrompt',
  input: { schema: z.object({ html: z.string(), url: z.string() }) },
  output: { schema: ExtractResourcesOutputSchema },
  prompt: `You are an expert AI Architect specializing in the Android customization ecosystem (ROMs, Wallpapers, Modules).
  
I will provide you with content from a webpage (potentially a raw index.html directory listing), a structured article, or a Telegram community post (Source: {{{url}}}).

Your task is to identify and extract structured data for Custom ROMs, Android modules, or kernels.
Look for:
- ROM or Project Name (e.g., Xiaomi HyperOS, LineageOS, Pixel Experience, Evolution X, Magisk Module Name)
- Build Version or Data (e.g., 3.0.4.0.WNUINXM, stable, beta, official)
- Android OS Version (e.g., Android 14, 15, 16)
- Primary Download Links:
  - If the content is an index.html file listing, treat files ending in .zip, .img, .bin, .tar.gz, .tgz as potential download links.
  - Look for external mirror links (G drive, Mega, Mediafire, SourceForge, GitHub releases).
- Screenshots or Gallery links (links to images or sites like imgur, postimg).
- Addons or Supplements (Magisk, GApps, Firmware, Camera ports).

STRATEGY FOR RAW HTML (index.html):
- If you see a list of files, convert each likely ROM/Module file into an entity.
- Clean the filenames to create readable "names". (e.g., "LineageOS-21.0-20231225-OFFICIAL-vayu.zip" -> Name: "LineageOS 21.0 Official")
- Use the filename parts to infer Android version or device name.

STRATEGY FOR TELEGRAM/ARTICLES:
- Identify the "Official Stock Rom" or "Moded Rom" context.
- Summarize features, changelogs, and installation steps into the description.
- Extract any mentioned "Download" or "Mirror" links.

IMPORTANT: Ensure every extracted item has a valid 'downloadUrl'. If multiple mirrors exist, put the best one in 'downloadUrl' and others in 'mirrors'.

Content:
{{{html}}}`,
});

export async function extractRoms(input: ExtractRomsInput): Promise<ExtractRomsOutput> {
  return extractRomsFlow(input);
}

export async function extractRomsFromRawHtml(input: { html: string, url?: string }): Promise<ExtractRomsOutput> {
  return extractRomsFromRawHtmlFlow(input);
}

const extractRomsFlow = ai.defineFlow(
  {
    name: 'extractRomsFlow',
    inputSchema: ExtractResourcesInputSchema,
    outputSchema: ExtractResourcesOutputSchema,
  },
  async (input) => {
    try {
      console.log('Fetching URL:', input.url);
      const response = await fetch(input.url);
      const html = await response.text();
      
      const cleanedHtml = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
        .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gmi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .substring(0, 250000); // Massive context window for large index.html files

      console.log('Sending extraction prompt for URL:', input.url, 'Cleaned HTML size:', cleanedHtml.length);
      const { output } = await extractResourcesPrompt({ 
        html: cleanedHtml, 
        url: input.url 
      });
      
      console.log('Extraction sequence complete. Found:', output?.roms?.length || 0, 'items.');
      if (output?.roms) {
        output.roms.forEach((r, i) => console.log(`Item ${i+1}: ${r.name} - ${r.downloadUrl}`));
      }
      
      return output || { roms: [] };
    } catch (error: any) {
      console.error('Extraction failed for URL:', input.url, error);
      throw new Error(`Failed to extract data: ${error.message}`);
    }
  }
);

const extractRomsFromRawHtmlFlow = ai.defineFlow(
  {
    name: 'extractRomsFromRawHtmlFlow',
    inputSchema: ExtractResourcesFromRawHtmlInputSchema,
    outputSchema: ExtractResourcesOutputSchema,
  },
  async (input) => {
    console.log('Incoming extraction request. HTML length:', input.html.length);
    const cleanedHtml = input.html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
        .replace(/<svg\b[^>]*>([\s\S]*?)<\/svg>/gmi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .substring(0, 250000);

    console.log('Sending extraction prompt for raw HTML/Telegram content... Size:', cleanedHtml.length);
    const { output } = await extractResourcesPrompt({ 
      html: cleanedHtml, 
      url: input.url || 'local-input' 
    });
    
    console.log('Extraction sequence complete. Found:', output?.roms?.length || 0, 'items.');
    if (output?.roms) {
      output.roms.forEach((r, i) => console.log(`Item ${i+1}: ${r.name} - ${r.downloadUrl}`));
    }
    return output || { roms: [] };
  }
);