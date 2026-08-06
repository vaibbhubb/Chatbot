import { GoogleGenAI } from '@google/genai';
import { getSession } from '../../../lib/session';
import { getSystemPrompt } from '../../../lib/vaibhav-context';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export async function POST(req) {
  try {
    const { messages } = await req.json();

    // Get the user's tier from session for context control
    const session = await getSession();
    const userTier = session?.tier || 'public';

    // Load tiered system prompt
    const systemInstruction = getSystemPrompt(userTier);

    // Format chat history for Gemini
    const formattedContents = messages.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    // Generate text response
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: { systemInstruction },
    });

    const replyText = aiResponse.text;

    // Audio is now handled client-side via browser SpeechSynthesis — no server TTS needed
    return Response.json({
      reply: replyText,
      tier: userTier,
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}