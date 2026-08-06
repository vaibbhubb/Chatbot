import { redirect } from 'next/navigation';
import { getSession } from '../../lib/session';
import ChatUI from './ChatUI';

export const metadata = {
  title: 'Chat with AI Vaibhav',
  description: "Talk to Vaibhav's personal AI clone.",
};

export default async function ChatPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return <ChatUI username={session.username} tier={session.tier || 'public'} />;
}