import { NextRequest, NextResponse } from 'next/server';
import { all, db, one, run, transaction } from '@/lib/db';
import { AppError, check, currentUser, deleteSession, hashPassword, integer, makeSession, passwordField, rateLimit, requireStudentAccess, requireUser, textField, verifyPassword } from '@/lib/auth';
import { readAttempt, reward, saveAnswers, startAttempt, studentReport, submitAttempt } from '@/lib/learning';
import { currentFocus, startFocus, updateFocus } from '@/lib/focus';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ path: string[] }> };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
type TutorSlide = { title:string; body:string; example?:string; prompt?:string; section?:string; code?:string; expected?:string };
function sessionResponse(userId: number) {
  const user = one('SELECT id,name,email,role,avatar FROM users WHERE id=?', userId);
  const response = json({ user });
  response.cookies.set('ilmora_session', makeSession(userId), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
  return response;
}
async function handle(request: NextRequest, context: Context) {
  try {
    const { path } = await context.params;
    const route = path.join('/');
    const method = request.method;
    if (route === 'ai/status' && method === 'GET') {
      requireUser(request,['student']);
      return json({configured:Boolean((process.env.AI_API_KEY||process.env.OPENAI_API_KEY)?.trim())});
    }
    let b: Record<string, any> = {};
    if (method !== 'GET') {
      const origin = request.headers.get('origin');
      const requestOrigin = request.nextUrl.origin;
      const requestHost = request.headers.get('host');
      const hostOrigin = requestHost ? new URL(`${request.nextUrl.protocol}//${requestHost}`).origin : null;
      const configuredOrigin = process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : null;
      check(!origin || origin === requestOrigin || origin === hostOrigin || origin === configuredOrigin ||
        (process.env.NODE_ENV !== 'production' && ['http://localhost:3000', 'http://127.0.0.1:3000'].includes(origin)), 'So‘rov manbasi taqiqlangan.', 403);
      check(Number(request.headers.get('content-length') || 0) <= 100000, 'So‘rov juda katta.', 413);
      const raw = await request.text();
      check(raw.length <= 100000, 'So‘rov juda katta.', 413);
      if (raw) { try { b = JSON.parse(raw); } catch { throw new AppError('JSON noto‘g‘ri.'); } }
      check(b && typeof b === 'object' && !Array.isArray(b), 'So‘rov noto‘g‘ri.');
    }
    if (route === 'auth/me' && method === 'GET') return json({ user: currentUser(request) || null });
    if (route === 'health' && method === 'GET') {
      const result = db().prepare('SELECT 1 AS ok').get();
      check(result?.ok === 1, 'SQLite bazasiga ulanib bo‘lmadi.', 503);
      return json({ ok:true, backend:'nodejs', database:'sqlite' });
    }
    if ((route === 'auth/login' || route === 'auth/register') && method === 'POST') {
      const email = textField(b.email, 'Email', 5, 200).toLowerCase();
      check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email manzili noto‘g‘ri.');
      const password = passwordField(b.password, route.endsWith('register') ? 12 : 1);
      // Global bucket supplements per-account throttling without trusting forwarded IP headers.
      rateLimit('auth:global', 100, 60000);
      rateLimit(`auth:${email}`, 12, 10 * 60000);
      if (route.endsWith('login')) {
        const user = one('SELECT * FROM users WHERE email=?', email);
        check(user && verifyPassword(password, user.password_hash), 'Email yoki parol noto‘g‘ri.', 401);
        return sessionResponse(user.id);
      }
      check(!b.role || b.role === 'student', 'Ochiq ro‘yxatdan faqat o‘quvchi hisobi yaratiladi.', 403);
      check(!one('SELECT id FROM users WHERE email=?', email), 'Bu email band.', 409);
      const result = run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)', textField(b.name, 'Ism', 2, 80), email, hashPassword(password), 'student', Date.now());
      return sessionResponse(Number(result.lastInsertRowid));
    }
    if (route === 'auth/logout' && method === 'POST') {
      deleteSession(request); const response = json({ ok: true });
      response.cookies.set('ilmora_session', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }); return response;
    }
    const user = requireUser(request);
    if (route === 'profile' && method === 'POST') {
      check(['orange','blue','green','purple'].includes(b.avatar), 'Avatar noto‘g‘ri.');
      const name = textField(b.name ?? user.name, 'Ism', 2, 80);
      run('UPDATE users SET name=?,avatar=? WHERE id=?', name, b.avatar, user.id); return json({ ok: true, user:{...user,name,avatar:b.avatar} });
    }
    if (route === 'courses' && method === 'GET') {
      requireUser(request, ['student','admin']);
      return json({ courses: all('SELECT * FROM courses').map(c => ({ ...c, modules: all('SELECT * FROM modules WHERE course_id=? ORDER BY position,id', c.id).map(m => ({ ...m,
        lessons: all('SELECT l.id,l.title,l.description,l.lab_type,COALESCE(p.slide,0) AS slide,COALESCE(p.completed,0) AS completed FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=? WHERE l.module_id=? ORDER BY l.position,l.id', user.id, m.id),
        assessments: all('SELECT a.id,a.title,a.kind,a.lesson_id,a.duration_seconds,(SELECT MAX(score) FROM attempts WHERE assessment_id=a.id AND user_id=?) AS best FROM assessments a WHERE a.module_id=? ORDER BY a.kind DESC,a.id', user.id, m.id)
      })) })) });
    }
    if (path[0] === 'lessons' && path.length === 2 && method === 'GET') {
      requireUser(request, ['student']); const id = integer(Number(path[1]));
      const lesson = one('SELECT l.*,m.title AS module_title,c.title AS course_title FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE l.id=?', id);
      check(lesson, 'Dars topilmadi.', 404);
      const { slides_json, ...meta } = lesson;
      return json({ lesson: { ...meta, slides: JSON.parse(slides_json) }, progress: one('SELECT * FROM progress WHERE user_id=? AND lesson_id=?', user.id, id) || null,
        assessments: all('SELECT id,title,kind,duration_seconds FROM assessments WHERE lesson_id=? OR (module_id=? AND kind=?)', id, lesson.module_id, 'exam'),
        lab: one('SELECT * FROM labs WHERE user_id=? AND lesson_id=?', user.id, id) || null, aiConfigured: Boolean((process.env.AI_API_KEY||process.env.OPENAI_API_KEY)?.trim()) });
    }
    if (path[0] === 'lessons' && path[2] === 'progress' && path.length === 3 && method === 'POST') {
      requireUser(request, ['student']); const id = integer(Number(path[1]));
      const lesson = one('SELECT slides_json FROM lessons WHERE id=?', id); check(lesson, 'Dars topilmadi.', 404);
      const last = JSON.parse(lesson.slides_json).length - 1;
      const slide = integer(b.slide, 0, last);
      const completed = b.completed === true && slide === last ? 1 : 0;
      transaction(() => {
        run('INSERT INTO progress(user_id,lesson_id,slide,completed,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET slide=MAX(slide,excluded.slide),completed=MAX(completed,excluded.completed),updated_at=excluded.updated_at', user.id, id, slide, completed, Date.now());
        if (completed) reward(user.id, `lesson:${id}`, 20);
      }); return json({ ok: true });
    }
    if (path[0] === 'assessments' && path[2] === 'start' && path.length === 3 && method === 'POST') {
      requireUser(request, ['student']); return json({ attempt: startAttempt(user.id, integer(Number(path[1]))) });
    }
    if (path[0] === 'attempts' && path.length === 2) {
      requireUser(request, ['student']); const id = integer(Number(path[1]));
      if (method === 'GET') return json({ attempt: readAttempt(user.id, id) });
      if (method === 'POST') return json({ attempt: submitAttempt(user.id, id, b.answers) });
    }
    if (path[0] === 'attempts' && path[2] === 'answers' && path.length === 3 && method === 'POST') {
      requireUser(request,['student']); return json(saveAnswers(user.id,integer(Number(path[1])),b.answers));
    }
    if (route === 'focus') {
      requireUser(request, ['student']);
      if (method === 'GET') {
        const current = currentFocus(user.id);
        return json({ current, history: all('SELECT f.*,l.title FROM focus_sessions f JOIN lessons l ON l.id=f.lesson_id WHERE user_id=? ORDER BY created_at DESC LIMIT 100', user.id), serverTime: Date.now() });
      }
      if (method === 'POST') {
        const current = b.action === 'start' ? startFocus(user.id, integer(b.lessonId), textField(b.goal, 'Maqsad', 3, 200)) : updateFocus(user.id, b.action, b.active === true);
        return json({ current, serverTime: Date.now() });
      }
    }
    if (route === 'labs' && method === 'POST') {
      requireUser(request, ['student']); const lessonId = integer(b.lessonId);
      const lesson = one('SELECT * FROM lessons WHERE id=?', lessonId); check(lesson && ['fraction','motion'].includes(lesson.lab_type), 'Bu darsda faol laboratoriya yo‘q.');
      const denominator = integer(b.denominator, 1, lesson.lab_type==='motion'?10000:20); const numerator = integer(b.numerator, 0, lesson.lab_type==='motion'?10000:denominator);
      const conclusion = textField(b.conclusion, 'Xulosa', b.submit ? 10 : 0, 3000);
      transaction(() => {
        run('INSERT INTO labs(user_id,lesson_id,numerator,denominator,conclusion,status,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET numerator=excluded.numerator,denominator=excluded.denominator,conclusion=excluded.conclusion,status=excluded.status,updated_at=excluded.updated_at', user.id, lessonId, numerator, denominator, conclusion, b.submit ? 'submitted' : 'draft', Date.now());
        if (b.submit) reward(user.id, `lab:${lessonId}`, 25);
      }); return json({ ok: true });
    }
    if (route === 'reports' && method === 'GET') {
      const requested = request.nextUrl.searchParams.get('studentId');
      if (requested) { const id = integer(Number(requested)); requireStudentAccess(user, id); currentFocus(id); return json({ reports: [studentReport(id)] }); }
      const ids = user.role === 'student' ? [{ id: user.id }] : user.role === 'admin' ? all('SELECT id FROM users WHERE role=?', 'student') : all('SELECT student_id AS id FROM relations WHERE adult_id=?', user.id);
      return json({ reports: ids.map(r => { currentFocus(r.id); return studentReport(r.id); }) });
    }
    if (route === 'support' && method === 'GET') {
      requireUser(request, ['student','teacher']);
      const where = user.role === 'student' ? 's.student_id=?' : 's.student_id IN (SELECT student_id FROM relations WHERE adult_id=?)';
      return json({ questions: all(`SELECT s.*,u.name AS student_name,l.title AS lesson_title,t.name AS teacher_name FROM support s JOIN users u ON u.id=s.student_id JOIN lessons l ON l.id=s.lesson_id LEFT JOIN users t ON t.id=s.teacher_id WHERE ${where} ORDER BY s.created_at DESC`, user.id) });
    }
    if (route === 'support' && method === 'POST') {
      requireUser(request, ['student']); rateLimit(`support:${user.id}`, 10, 3600000);
      const lessonId = integer(b.lessonId); check(one('SELECT id FROM lessons WHERE id=?', lessonId), 'Dars topilmadi.', 404);
      const question = textField(b.question, 'Savol', 5, 3000);
      check(/\s/u.test(question) || /[aeiouаеиоуыэюя]/iu.test(question), 'Savolni tushunarli so‘zlar bilan yozing. Masalan: “Foiz qanday hisoblanadi?”');
      run('INSERT INTO support(student_id,lesson_id,question,created_at) VALUES(?,?,?,?)', user.id, lessonId, question, Date.now()); return json({ ok: true });
    }
    if (path[0] === 'support' && path[2] === 'reply' && path.length === 3 && method === 'POST') {
      requireUser(request, ['teacher']); const id = integer(Number(path[1]));
      const question = one('SELECT * FROM support WHERE id=?', id); check(question, 'Savol topilmadi.', 404);
      requireStudentAccess(user, question.student_id);
      run('UPDATE support SET answer=?,teacher_id=?,answered_at=? WHERE id=?', textField(b.answer, 'Javob', 3, 5000), user.id, Date.now(), id); return json({ ok: true });
    }
    if (route === 'admin/users' && method === 'POST') {
      requireUser(request,['admin']);
      check(['parent','teacher'].includes(b.role),'Ota-ona yoki ustoz rolini tanlang.');
      const email=textField(b.email,'Email',5,200).toLowerCase();
      check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),'Email noto‘g‘ri.');
      check(!one('SELECT id FROM users WHERE email=?',email),'Bu email band.',409);
      run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)',textField(b.name,'Ism',2,80),email,hashPassword(passwordField(b.password)),b.role,Date.now());
      return json({ok:true});
    }
    if (route === 'admin/content') {
      requireUser(request, ['admin']);
      if (method === 'GET') return json({ courses: all('SELECT * FROM courses'), modules: all('SELECT * FROM modules'), lessons: all('SELECT * FROM lessons'), assessments: all('SELECT * FROM assessments'), questions: all('SELECT * FROM questions'), users: all('SELECT id,name,email,role FROM users'), relations: all('SELECT * FROM relations') });
      if (method === 'POST') {
        const id = b.id == null ? null : integer(b.id);
        if (b.type === 'course') {
          const values = [textField(b.title,'Sarlavha',3,150), textField(b.description,'Tavsif',3,2000), textField(b.subject,'Fan',2,80)];
          if (id) { check(one('SELECT id FROM courses WHERE id=?', id), 'Kurs topilmadi.', 404); run('UPDATE courses SET title=?,description=?,subject=? WHERE id=?', ...values, id); }
          else run('INSERT INTO courses(title,description,subject) VALUES(?,?,?)', ...values);
        } else if (b.type === 'module') {
          const courseId = integer(b.courseId); check(one('SELECT id FROM courses WHERE id=?',courseId), 'Kurs topilmadi.');
          if (id) run('UPDATE modules SET course_id=?,title=?,position=? WHERE id=?',courseId,textField(b.title,'Sarlavha',3,150),integer(b.position,1,1000),id);
          else run('INSERT INTO modules(course_id,title,position) VALUES(?,?,?)',courseId,textField(b.title,'Sarlavha',3,150),integer(b.position,1,1000));
        } else if (b.type === 'lesson') {
          const moduleId = integer(b.moduleId); check(one('SELECT id FROM modules WHERE id=?',moduleId), 'Modul topilmadi.');
          check(Array.isArray(b.slides) && b.slides.length > 0 && b.slides.length <= 30, '1–30 ta slayd kiriting.');
          const slides = b.slides.map((s: Record<string, any>) => ({title:textField(s.title,'Slayd sarlavhasi',2,150), body:textField(s.body,'Slayd matni',5,5000), example:textField(s.example || '', 'Misol',0,1200), visual:textField(s.visual || '', 'Vizual',0,80), numerator:integer(s.numerator ?? 1,0,20), denominator:integer(s.denominator ?? 4,1,20), section:textField(s.section || '', 'Bo‘lim',0,60), prompt:textField(s.prompt || '', 'Mashq',0,1200)}));
          check(b.labType === null || ['fraction','motion'].includes(b.labType), 'Laboratoriya turi noto‘g‘ri.');
          const values = [moduleId,textField(b.title,'Sarlavha',3,150),textField(b.description || '', 'Tavsif',0,2000),JSON.stringify(slides),b.labType];
          if (id) run('UPDATE lessons SET module_id=?,title=?,description=?,slides_json=?,lab_type=? WHERE id=?', ...values,id);
          else run('INSERT INTO lessons(module_id,title,description,slides_json,lab_type) VALUES(?,?,?,?,?)', ...values);
        } else if (b.type === 'assessment') {
          const moduleId = integer(b.moduleId); check(one('SELECT id FROM modules WHERE id=?',moduleId), 'Modul topilmadi.');
          check(['test','exam'].includes(b.kind),'Test turi noto‘g‘ri.');
          const lessonId = b.kind === 'test' ? integer(b.lessonId) : null;
          if (lessonId) check(one('SELECT id FROM lessons WHERE id=? AND module_id=?',lessonId,moduleId),'Dars shu modulga tegishli bo‘lsin.');
          const values = [lessonId,moduleId,textField(b.title,'Sarlavha',3,150),b.kind,integer(b.durationSeconds,60,7200)];
          if (id) run('UPDATE assessments SET lesson_id=?,module_id=?,title=?,kind=?,duration_seconds=? WHERE id=?',...values,id);
          else run('INSERT INTO assessments(lesson_id,module_id,title,kind,duration_seconds) VALUES(?,?,?,?,?)',...values);
        } else if (b.type === 'question') {
          const assessmentId = integer(b.assessmentId); check(one('SELECT id FROM assessments WHERE id=?',assessmentId),'Test topilmadi.');
          check(Array.isArray(b.options) && b.options.length >= 2 && b.options.length <= 8,'2–8 javob varianti kiriting.');
          const options = b.options.map((s: unknown) => textField(s,'Variant',1,500));
          const values = [assessmentId,textField(b.prompt,'Savol',3,2000),JSON.stringify(options),integer(b.correctIndex,0,options.length-1),textField(b.explanation,'Izoh',3,3000)];
          if (id) run('UPDATE questions SET assessment_id=?,prompt=?,options_json=?,correct_index=?,explanation=? WHERE id=?',...values,id);
          else run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)',...values);
        } else if (b.type === 'relation') {
          const adultId=integer(b.adultId), studentId=integer(b.studentId);
          check(one('SELECT id FROM users WHERE id=? AND role IN (?,?)',adultId,'parent','teacher'),'Ota-ona yoki ustoz tanlang.');
          check(one('SELECT id FROM users WHERE id=? AND role=?',studentId,'student'),'O‘quvchi tanlang.');
          run('INSERT OR IGNORE INTO relations(adult_id,student_id) VALUES(?,?)',adultId,studentId);
        } else check(false, 'Noma’lum kontent turi.');
        return json({ok:true});
      }
    }
    if (route === 'ai' && method === 'POST') {
      requireUser(request,['student']);
      const apiKey=(process.env.AI_API_KEY||process.env.OPENAI_API_KEY)?.trim();
      rateLimit(`ai:${user.id}`,15,60*60*1000);
      const lessonId=integer(b.lessonId);
      const lesson=one('SELECT l.*,m.title AS module_title,c.title AS course_title FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE l.id=?',lessonId);
      check(lesson,'Dars topilmadi.',404);
      check(!one("SELECT a.id FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=? AND s.module_id=? AND s.kind='exam' AND a.submitted_at IS NULL",user.id,lesson.module_id),'Modul imtihoni davomida AI vaqtincha o‘chiriladi.',403);
      check(apiKey,'AI xizmati ulanmagan. Serverga AI_API_KEY yoki OPENAI_API_KEY sozlang.',503);
      const action=String(b.action||'explain');
      check(['explain','example','steps','quiz','review','ask','code'].includes(action),'Yordam turini tanlang.');
      const question=['ask','code'].includes(action)&&b.question?textField(b.question,'Savol',3,1200).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[email manzil]').replace(/\+?\d(?:[\s().-]*\d){9,}/g,'[telefon raqami]'):'';
      const slides=JSON.parse(lesson.slides_json) as TutorSlide[];
      const material=slides.map(s=>`${s.section?`[${s.section}] `:''}${s.title}: ${s.body}${s.example?` Misol: ${s.example}`:''}${s.code?`\nKod:\n${s.code.slice(0,2800)}`:''}${s.expected?`\nKutiladigan natija: ${s.expected}`:''}${s.prompt?` Mashq: ${s.prompt}`:''}`).join('\n\n').slice(0,8500);
      let mistakes='';
      if(action==='review') {
        const attempt=one<{questions_json:string;answers_json:string|null;feedback_json:string|null}>('SELECT a.questions_json,a.answers_json,a.feedback_json FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=? AND s.lesson_id=? AND s.kind=\'test\' AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC LIMIT 1',user.id,lessonId);
        if(attempt) {
          const qs=JSON.parse(attempt.questions_json),answers=JSON.parse(attempt.answers_json||'[]'),feedback=JSON.parse(attempt.feedback_json||'[]');
          mistakes=qs.map((q:any,i:number)=>feedback[i]?.correct?null:`Savol: ${q.prompt}; tanlangan javob: ${q.options[answers[i]]??'javob berilmagan'}; to‘g‘ri javob: ${q.options[q.correctIndex]}; izoh: ${q.explanation}`).filter(Boolean).join('\n');
        }
      }
      let endpoint:URL;try{endpoint=new URL(process.env.AI_API_URL||'https://api.openai.com/v1/chat/completions');}catch{throw new AppError('AI_API_URL noto‘g‘ri. Administrator provayder manzilini tekshirishi kerak.',503);}
      check(endpoint.protocol==='https:'||(process.env.NODE_ENV!=='production'&&endpoint.protocol==='http:'),'AI_API_URL xavfsiz HTTPS manzili bo‘lsin.');
      check(endpoint.protocol==='https:'||(process.env.NODE_ENV!=='production'&&endpoint.protocol==='http:'),'AI_API_URL xavfsiz HTTPS manzili bo‘lsin.');
      const instruction:Record<string,string>={explain:'Mavzuni sodda va aniq tushuntir.',example:'Mavzuga mos yangi va aniq misol keltir; natijasini tushuntir.',steps:'Tayyor javobni darrov bermay, masalani kichik qadamlar bilan yechishga yo‘naltir.',quiz:'Mavzu bo‘yicha bitta yangi savol ber; javobini hozir aytma.',review:'O‘quvchining xatosini muloyim tushuntir, keyin o‘xshash mashq taklif qil.',ask:question,code:'O‘quvchining kodini tushuntir. Kod berilmagan bo‘lsa, darsdagi kod misolini izohla; aks holda yuborilgan koddagi buyruqlar va natijani tushuntir. '+question};
      const history=Array.isArray(b.history)?b.history.slice(-8).flatMap((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.trim()? [{role:m.role,content:m.content.slice(0,1200)}]:[]):[];
      const stream=b.stream===true;
      const system='Sen ILMORA platformasida o‘zbek tilida sodda, aniq va muloyim tushuntiradigan ustozsan. Javobni joriy dars mazmuni va kodiga tayab ber; boshqa mavzuni h1 misoliga majburan bog‘lama. Yetarli ma’lumot bo‘lmasa buni ochiq ayt. Imtihon javobi yoki yashirin test kalitini bermagin. Shaxsiy ma’lumot so‘rama.\nJoriy kurs: '+lesson.course_title+'. Modul: '+lesson.module_title+'. Dars: '+lesson.title+'.\nDarsning qisqa mazmuni: '+lesson.description+'\nTasdiqlangan slaydlar va kod:\n'+material+(mistakes?'\nO‘quvchining oxirgi test xatolari:\n'+mistakes:'');
      try {
        const providerPayload={model:process.env.AI_MODEL||'gpt-4o-mini',temperature:0.2,max_tokens:800,stream,messages:[{role:'system',content:system},...history,{role:'user',content:'Yordam turi: '+action+'. '+instruction[action]}]};
        const providerRequest={method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000)} as const;
        let response=await fetch(endpoint,{...providerRequest,body:JSON.stringify(providerPayload)});
        if(!response.ok&&stream&&(response.status===400||response.status===422)) response=await fetch(endpoint,{...providerRequest,body:JSON.stringify({...providerPayload,stream:false})});
        if(!response.ok) {
          if(response.status===401) throw new AppError("AI provayderi API kalitni qabul qilmadi (401). Kalit faol va shu provayderga tegishli ekanini tekshiring.",502);
          if(response.status===403) throw new AppError("AI kalitida modeldan foydalanish huquqi mavjud emas (403). Provayder kabinetidagi ruxsat va billing holatini tekshiring.",502);
          if(response.status===404) throw new AppError("AI modeli yoki endpoint topilmadi (404). AI_API_URL va AI_MODEL mos provayderga qarashini tekshiring.",502);
          if(response.status===429) throw new AppError("AI provayder so'rovlar limitiga yetdi (429). Billing yoki quota holatini tekshiring, so'ng qayta urinib ko'ring.",503);
          if(response.status===400||response.status===422) throw new AppError("AI provayder so'rov formatini qabul qilmadi ("+response.status+"). AI_MODEL va provayder endpointini tekshiring.",502);
          throw new AppError("AI provayderi vaqtincha javob bermadi ("+response.status+"). Birozdan keyin qayta urinib ko'ring.",502);
        }
        if(stream&&response.body&&response.headers.get('content-type')?.includes('text/event-stream')) return new Response(response.body,{status:200,headers:{'Content-Type':'text/event-stream; charset=utf-8','Cache-Control':'no-cache, no-transform','X-Accel-Buffering':'no'}});
        const payload=await response.json();
        const answer=payload.choices?.[0]?.message?.content;
        check(typeof answer==='string'&&answer.trim().length>0,'AI javob qaytarmadi.',502);
        return json({answer:answer.trim(),configured:true});
      } catch(error) {
        if(error instanceof AppError) throw error;
        console.error('AI provayderi javob bermadi:',error instanceof Error?error.message:'noma’lum xato');
        if(error instanceof DOMException&&error.name==='TimeoutError') throw new AppError('AI javobi uzoq kutilgani uchun vaqt tugadi. Qayta urinib ko‘ring.',504); throw new AppError('AI hozir javob bera olmadi. Birozdan keyin qayta urinib ko‘ring.',502);
      }
    }
    throw new AppError('Manzil topilmadi.',404);
  } catch (error) {
    if (error instanceof AppError) return json({ error: error.message },error.status);
    console.error('API xatosi:', error instanceof Error ? error.message : 'Noma’lum xato');
    return json({error:'Serverda xato yuz berdi. Qayta urinib ko‘ring.'},500);
  }
}
export { handle as GET, handle as POST };
