import { ElevenLabsClient } from 'elevenlabs';

const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });

// Replace with your cloned Voice ID when ready
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text) {
      return Response.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text,
      model_id: 'eleven_multilingual_v2',
      output_format: 'mp3_44100_128',
    });

    const chunks = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }
    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString('base64');

    return Response.json({ success: true, audio: audioBase64 });
  } catch (error) {
    console.error('TTS error:', error);
    return Response.json({ success: false, error: 'TTS generation failed' }, { status: 500 });
  }
}
