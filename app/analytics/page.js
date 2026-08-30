import { getDashboardSession } from '../../lib/dashboard-session';
import { getAnalyticsData } from '../../lib/chat-queries';
import DashboardLoginForm from '../dashboard/DashboardLoginForm';
import AnalyticsView from './AnalyticsView';

export const metadata = {
  title: 'Analytics — AI Vaibhav',
  description: 'Chat analytics dashboard',
};

export default async function AnalyticsPage() {
  const session = await getDashboardSession();

  if (!session) {
    return <DashboardLoginForm />;
  }

  const analytics = await getAnalyticsData();

  return <AnalyticsView analytics={analytics} />;
}
