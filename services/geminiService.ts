import { GoogleGenAI, Modality, GenerateContentResponse } from '@google/genai';

let ai: GoogleGenAI | null = null;

const getAiClient = (): GoogleGenAI => {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const model = 'gemini-2.5-flash-image-preview';

type ImageData = {
  data: string; // base64 encoded string
  mimeType: string;
};

/**
 * Calls the Gemini API to edit an image.
 * @param baseImage The base image to be modified.
 * @param partImage An optional image of a part to add.
 * @param prompt The text instructions for the modification.
 * @returns A promise that resolves to the base64 encoded string of the new image.
 */
export const callGeminiApi = async (
  baseImage: ImageData,
  partImage: ImageData | undefined,
  prompt: string
): Promise<string> => {
  const imageParts = [
    { inlineData: { data: baseImage.data, mimeType: baseImage.mimeType } },
  ];

  if (partImage) {
    imageParts.push({ inlineData: { data: partImage.data, mimeType: partImage.mimeType } });
  }

  const contents = {
    parts: [
      ...imageParts,
      { text: prompt },
    ],
  };

  try {
    const aiClient = getAiClient();
    const response: GenerateContentResponse = await aiClient.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    // Find the image part in the response
    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
      }
    }
    
    throw new Error('No image was generated. The model may have refused the request.');

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while contacting the Gemini API.');
  }
};
