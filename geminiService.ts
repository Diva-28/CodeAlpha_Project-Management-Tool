
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const generateTaskSuggestions = async (projectName: string, projectDesc: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest 5 relevant initial tasks for a project named "${projectName}" with the description: "${projectDesc}". Provide the output in a clean JSON array format.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high'] }
            },
            required: ['title', 'description', 'priority']
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Generation Error:", error);
    return [];
  }
};

export const getAIAssistantResponse = async (query: string, context: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a project management assistant. Context: ${context}. User query: ${query}. Provide helpful, concise advice.`,
    });
    return response.text;
  } catch (error) {
    return "I'm sorry, I'm having trouble connecting to my brain right now.";
  }
};
