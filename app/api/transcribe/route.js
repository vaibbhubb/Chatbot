import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req) {
  try {
    const { audio, mimeType } = await req.json();

    if (!audio) {
      return Response.json({ success: false, error: 'No audio provided' }, { status: 400 });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    });

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
