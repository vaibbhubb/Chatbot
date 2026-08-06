import { deleteChatSeeSession } from '../../../../lib/chat-see-session';
import { redirect } from 'next/navigation';

export async function POST() {
  await deleteChatSeeSession();
  redirect('/chat/see');
}