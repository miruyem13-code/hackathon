import { existsSync } from 'node:fs';

if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const base = new URL(process.argv[2] || process.env.ILMORA_URL || process.env.APP_ORIGIN || 'http://localhost:3000');
if (!['localhost','127.0.0.1','::1'].includes(base.hostname)) {
  console.error('Xavfsizlik uchun smoke faqat lokal ILMORA serveriga ulanadi.');
  process.exit(1);
}
const origin = base.origin;
const url = (path) => new URL(`/api/${path}`, base);
try {
  const health = await fetch(url('health'));
  const healthData = await health.json();
  if (!health.ok || healthData.database !== 'sqlite') throw new Error(`Backend health: HTTP ${health.status}`);

  const login = await fetch(url('auth/login'), {
    method:'POST', headers:{Origin:origin,'Content-Type':'application/json'},
    body:JSON.stringify({email:'student@ilmora.local',password:process.env.DEMO_PASSWORD || ''})
  });
  if (!login.ok) {
    const errorData=await login.json().catch(()=>({}));
    throw new Error(`Demo login: HTTP ${login.status}, ${errorData.error || 'xato'}. Email yoki .env.local dagi DEMO_PASSWORD ni tekshiring.`);
  }
  const cookie = login.headers.getSetCookie().find(value=>value.startsWith('ilmora_session='))?.split(';')[0];
  if (!cookie) throw new Error('Server login qildi, lekin session cookie qaytmadi.');
  const headers={Cookie:cookie};

  const [courses,lesson,reports]=await Promise.all([
    fetch(url('courses'),{headers}),fetch(url('lessons/1'),{headers}),fetch(url('reports'),{headers})
  ]);
  if (!courses.ok) throw new Error(`Courses API: HTTP ${courses.status}`);
  if (!lesson.ok) throw new Error(`Dars API: HTTP ${lesson.status}`);
  if (!reports.ok) throw new Error(`Natijalar API: HTTP ${reports.status}`);
  const courseData=await courses.json(),lessonData=await lesson.json(),reportData=await reports.json();
  if (!courseData.courses.length) throw new Error('Kurs seed qilinmagan. npm.cmd run setup ni bajaring.');
  const lessons=courseData.courses.flatMap(course=>course.modules.flatMap(module=>module.lessons));
  if (courseData.courses.length<4 || lessons.length<24) throw new Error(`Demo kurslari to‘liq emas: ${courseData.courses.length}/4 kurs, ${lessons.length}/24 dars.`);
  if (!lessonData.lesson || lessonData.lesson.slides.length<1) throw new Error('Dars kontenti topilmadi.');
  if (!lessonData.lesson.lab_type) throw new Error('Birinchi darsga laboratoriya ulanmagan.');

  console.log(`Backend tayyor: ${healthData.backend} + ${healthData.database}. Login va sessiya ishladi.`);
  console.log(`Kurslar: ${courseData.courses.length}; darslar: ${lessons.length}; birinchi dars slaydlari: ${lessonData.lesson.slides.length}; laboratoriya: ulangan; hisobot API: HTTP ${reports.status}.`);
} catch (error) {
  console.error(`Backend tekshiruvi muvaffaqiyatsiz: ${error instanceof Error ? error.message : 'Noma’lum xato'}`);
  process.exitCode=1;
}
