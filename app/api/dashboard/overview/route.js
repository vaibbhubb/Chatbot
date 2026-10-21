import { getDashboardSession } from '../../../../lib/dashboard-session';
import { getUsers, getChatQueries } from '../../../../lib/chat-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getDashboardSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [users, recentQueries] = await Promise.all([
      getUsers(),
      getChatQueries(500),
    ]);

    return Response.json(
      { users, recentQueries },
      { headers: { 'Cache-Control': 'private, no-store' } }
    );
  } catch (error) {
    console.error('Dashboard overview API error:', error);
    return Response.json({ error: 'Could not load dashboard data.' }, { status: 500 });
  }
}
