import { getDashboardSession } from '../../../../lib/dashboard-session';
import { getAnalyticsData } from '../../../../lib/chat-queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getDashboardSession();

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const analytics = await getAnalyticsData();
    return Response.json(analytics, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json({ error: 'Could not load analytics.' }, { status: 500 });
  }
}