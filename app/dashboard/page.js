import DashboardLoginForm from './DashboardLoginForm';
import DashboardView from './DashboardView';
import { getDashboardSession } from '../../lib/dashboard-session';
import { getUsers, getChatQueries } from '../../lib/chat-queries';

export const metadata = {
  title: 'Dashboard — AI Vaibhav',
  description: 'Private admin dashboard',
};

export default async function DashboardPage() {
  const session = await getDashboardSession();

  if (!session) {
    return <DashboardLoginForm />;
  }

  const [users, recentQueries] = await Promise.all([
    getUsers(),
    getChatQueries(500),
  ]);

  return <DashboardView users={users} recentQueries={recentQueries} />;
}