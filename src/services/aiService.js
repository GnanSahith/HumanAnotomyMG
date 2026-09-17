import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with the key from environment variables
const apiKey = import.meta.env.VITE_AI_API_KEY;

export const streamChatbot = async (message, onChunk) => {
  if (!apiKey || apiKey.trim() === '') {
    onChunk("⚠️ The AI is currently disconnected. To fix this, please go to your Vercel Dashboard -> Settings -> Environment Variables, and add 'VITE_AI_API_KEY' with your Google Gemini key. Then redeploy the app!");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert AI study assistant for a student platform that teaches biology, physics, chemistry, and math. 
    Explain the following query clearly, engagingly, and correctly for a high school or early college student level. 
    CRITICAL: Keep your explanation extremely concise, ideally 2-3 short sentences, getting straight to the point without any fluff.
    
    Student Query: ${message}`;

    const result = await model.generateContentStream(prompt);
    
    let text = "";
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      text += chunkText;
      onChunk(text);
    }
  } catch (error) {
    console.error("AI Service Error:", error);
    onChunk(`⚠️ Error connecting to AI: ${error.message}`);
  }
};
