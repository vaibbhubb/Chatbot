import { GoogleGenAI } from '@google/genai';
import { ElevenLabsClient } from 'elevenlabs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

export async function POST(req) {
  try {
    const { message } = await req.json();

    // 1. Generate text response using Gemini 2.5 Flash
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: message,
    });

    const replyText = aiResponse.text;

    // 2. Convert text to speech using ElevenLabs (using a default popular voice ID, e.g., "Adam")
    const audioStream = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
      text: replyText,
      model_id: "eleven_multilingual_v2",
      output_format: "mp3_44100_128",
    });

    // Read the stream into a buffer
    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    return Response.json({ 
      reply: replyText, 
      audio: audioBase64 
    });

  } catch (error) {
    console.error(error);
    return Response.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}