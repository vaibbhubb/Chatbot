import { redirect } from 'next/navigation';
import { getSession } from '../lib/session';

export const metadata = {
  title: 'Chat with AI Vaibhav',
  description: 'A personal AI chatbot built by Vaibhav.',
};

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect('/chat');
  } else {
    redirect('/login');
  }
}
