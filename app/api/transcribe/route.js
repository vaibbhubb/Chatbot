import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TRANSCRIBE_MODELS = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-flash-lite-latest'];

export async function POST(req) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio) {
      return Response.json({ success: false, error: 'No audio provided' }, { status: 400 });
    }

    const response = await generateWithFallback({
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: audio,
                mimeType: mimeType || 'audio/webm',
              },
            },
            {
              text: 'Transcribe this audio to text exactly as spoken. Return only the transcription, nothing else. If the audio is in Hindi or a mix of Hindi and English, transcribe it as-is.',
            },
          ],
        },
      ],
    }, TRANSCRIBE_MODELS);

    const transcription = response.text?.trim();

    if (!transcription) {
      return Response.json({ success: false, error: 'Could not transcribe audio' }, { status: 400 });
    }

    return Response.json({ success: true, text: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    return Response.json({ success: false, error: 'Transcription failed' }, { status: 500 });
  }
}

async function generateWithFallback(request, models) {
  let lastError;

  for (const model of models) {
    try {
      return await ai.models.generateContent({ model, ...request });
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.error?.status;
      if (status === 404 || status === 429) continue;
      throw err;
    }
  }

  throw lastError;
}
