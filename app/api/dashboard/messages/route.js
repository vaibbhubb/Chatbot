import { getDashboardSession } from '../../../../lib/dashboard-session';
import { getUserMessages } from '../../../../lib/chat-queries';

export async function GET(req) {
  try {
    const session = await getDashboardSession();
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return Response.json({ error: 'Missing username parameter' }, { status: 400 });
    }

    const messages = await getUserMessages(username, 500);
    return Response.json({ messages });
  } catch (error) {
    console.error('Chat-see messages error:', error);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
