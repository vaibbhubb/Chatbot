import { deleteDashboardSession } from '../../../../lib/dashboard-session';
import { redirect } from 'next/navigation';

export async function POST() {
  await deleteDashboardSession();
  redirect('/dashboard');
}