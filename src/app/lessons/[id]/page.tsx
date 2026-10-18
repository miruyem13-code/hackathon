import { pageUser } from '@/lib/page-auth';
import LessonRoom from '@/components/lesson-room';
export const dynamic = 'force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const user=await pageUser('student'); const {id}=await params;
  return <LessonRoom user={user} lessonId={Number(id)}/>;
}
