'use client';
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
    const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    if (!key || key.includes('placeholder')) {
        console.warn("Neural Pulse Warning: No valid NEXT_PUBLIC_GEMINI_API_KEY found in frontend environment.");
    }
    return key;
};

export const ai = new GoogleGenAI({ 
    apiKey: getApiKey() 
});

export const EXTRACT_RESOURCES_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        roms: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Title of the ROM (rom_name)" },
                    version: { type: Type.STRING, description: "Version mentioned beside title" },
                    androidVersion: { type: Type.STRING, description: "Android OS Version (android_version)" },
                    size: { type: Type.STRING, description: "File size (e.g. 3.1 GB)" },
                    updated: { type: Type.STRING, description: "Update date (e.g. Nov 2025)" },
                    description: { type: Type.STRING, description: "Features and details (features)" },
                    downloadUrl: { type: Type.STRING, description: "Primary download link (download_link)" },
                    imageUrl: { type: Type.STRING, description: "Preview or header image (preview_image)" },
                    mirrors: { type: Type.ARRAY, items: { type: Type.STRING } },
                    screenshots: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["name", "downloadUrl", "description"]
            }
        }
    }
};

export async function extractFromContent(content: string, url: string = 'local-input') {
    const prompt = `You are an intelligent data extraction AI.

Your task is to parse the provided content (HTML, Text, or Telegram) and extract structured data for all Custom ROMs/Modules.

FIELDS:
1. name (string) → Title of the ROM
2. version (string) → Version mentioned beside title
3. androidVersion (string)
4. size (string)
5. updated (string)
6. description (string) → Features, Smoothness, UI type, etc.
7. downloadUrl (URL)
8. imageUrl (URL)

RULES:
- Handle RAW HTML structure if present:
  - Each ROM is often inside class "rom-card"
  - ROM name is inside class "rom-title" 
  - Version is inside class "rom-version"
  - Info inside "rom-info"
  - Download link is inside <a> with class "btn"
  - Images inside "screenshot" sections or header <img> tags.
- Clean all text (remove extra spaces, symbols like **, etc.)
- LIMIT: Return at most 40 distinct items.

Content Source: ${url}
Content:
${content.substring(0, 35000)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: EXTRACT_RESOURCES_SCHEMA,
                // Increase output potential but prompt for brevity
                temperature: 0.2
            }
        });

        let text = response.text?.trim() || "";
        if (!text) throw new Error("Empty response from AI");
        
        // Handle potential truncation manually if JSON is invalid
        try {
            return JSON.parse(text);
        } catch (parseError) {
            console.error("JSON Parse Error. Full text length:", text.length);
            // Attempt a very basic repair if it ends with "..." or is clearly truncated
            if (text.lastIndexOf('}') < text.lastIndexOf('{')) {
                 throw new Error("AI response was truncated due to size. Please try uploading a smaller file or a specific section of the page.");
            }
            throw parseError;
        }
    } catch (error) {
        console.error("AI Extraction Error:", error);
        throw error;
    }
}
