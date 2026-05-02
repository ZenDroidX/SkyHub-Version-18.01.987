import { ai } from '../genkit';
import { z } from 'genkit';

export const RomSchema = z.object({
  name: z.string().describe('Name of the custom ROM'),
  date: z.string().describe('Release or update date'),
  device: z.string().describe('Full device name (e.g. Redmi Note 10 Pro)'),
  codename: z.string().describe('Device codename (e.g. sweet)'),
  androidVersion: z.string().describe('Android version number'),
  author: z.string().describe('Name of the ROM developer'),
  downloadUrl: z.string().describe('URL to download the ROM'),
  screenshot: z.string().optional().describe('URL to a screenshot of the ROM'),
  changelog: z.string().optional().describe('URL to the changelog'),
  support: z.string().optional().describe('URL to support group or thread'),
  thumbnail: z.string().optional().describe('URL of the thumbnail image if available'),
});

export const romExtractor = ai.defineFlow(
  {
    name: 'romExtractor',
    inputSchema: z.string(),
    outputSchema: z.array(RomSchema),
  },
  async (text) => {
    const { output } = await ai.generate({
      prompt: `Extract structured Custom ROM data from the following Telegram message.
      
      TELEGRAM MESSAGE:
      ${text}
      
      RULES:
      - ROM Name: Identify the brand (e.g. LineageOS, Pixel Experience).
      - Links Detection:
        - "Download" -> downloadUrl
        - "Screenshot" or "Banner" -> screenshot
        - "Changelog" -> changelog
        - "Support" or "Discussion" -> support
      - Clean text: Remove emojis, technical symbols like **, and decorative borders.
      - First Image: If the message text contains a direct link to an image at the start, use it as thumbnail.
      - Return an array of ROM objects.
      `,
      output: {
        schema: z.array(RomSchema),
      },
    });

    if (!output) return [];
    return output;
  }
);
