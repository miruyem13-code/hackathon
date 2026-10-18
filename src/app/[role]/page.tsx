import { notFound } from 'next/navigation';
import { pageUser } from '@/lib/page-auth';
import type { Role } from '@/lib/auth';
import Dashboard from '@/components/dashboard';
export const dynamic = 'force-dynamic';
export default async function Page({params}:{params:Promise<{role:string}>}) {
  const {role}=await params;
  if (!['student','parent','teacher','admin'].includes(role)) notFound();
  const user=await pageUser(role as Role);
  return <Dashboard user={user}/>;
}
