import DashboardLoginForm from './DashboardLoginForm';
import DashboardView from './DashboardView';
import { getChatSeeSession } from '../../../lib/chat-see-session';
import { getUsers, getChatQueries } from '../../../lib/chat-queries';

export const metadata = {
  title: 'Dashboard — AI Vaibhav',
  description: 'Admin dashboard for AI Vaibhav chatbot.',
};

export default async function ChatSeePage() {
  const session = await getChatSeeSession();

  if (!session) {
    return <DashboardLoginForm />;
  }

  const [users, recentQueries] = await Promise.all([
    getUsers(),
    getChatQueries(500),
  ]);

  return <DashboardView users={users} recentQueries={recentQueries} />;
}