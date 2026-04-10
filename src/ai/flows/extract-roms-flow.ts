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
  prompt: `You are an expert AI Architect specializing in the Android customization ecosystem (ROMs, Kernels, Recovery).
  
I will provide you with content from a webpage or a Telegram community post (Source: {{{url}}}).

Your task is to identify and extract structured data for Custom ROMs or Android modules.
Look for:
- ROM Name (e.g., Xiaomi HyperOS, LineageOS, Pixel Experience)
- Build Version (e.g., 3.0.4.0.WNUINXM)
- Android OS Version (e.g., Android 14, 15, 16)
- Download Mirrors (G drive, Mega, Mediafire)
- Screenshots or Gallery links
- Addons or Supplements (Magisk, GApps, Camera ports)

Analyze the content deeply. If you see "Download - [Link]", extract the link. If you see "Screenshot - [Link]", extract the link into the screenshots array.
If the content is a Telegram post, identify the "Official Stock Rom" or "Moded Rom" context and summarize the features into the description.

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
      const response = await fetch(input.url);
      const html = await response.text();
      
      const cleanedHtml = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .substring(0, 50000);

      const { output } = await extractResourcesPrompt({ html: cleanedHtml, url: input.url });
      
      return output || { roms: [] };
    } catch (error: any) {
      console.error('Extraction failed:', error);
      throw new Error(`Failed to extract data from ${input.url}: ${error.message}`);
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
    const cleanedHtml = input.html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gmi, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gmi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .substring(0, 50000);

    const { output } = await extractResourcesPrompt({ html: cleanedHtml, url: input.url || 'local-input' });
    return output || { roms: [] };
  }
);