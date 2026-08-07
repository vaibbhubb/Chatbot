import { createChatSeeSession } from '../../../../lib/chat-see-session';

const ADMIN_USERNAME = 'test';
const ADMIN_PASSWORD = 'Brrt@227';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return Response.json({ success: false, error: 'Invalid dashboard credentials.' }, { status: 401 });
    }

    await createChatSeeSession({ username: ADMIN_USERNAME });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Chat-see login error:', error);
    return Response.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}