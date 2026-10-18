import { NextRequest, NextResponse } from 'next/server';
import { all, databaseKind, DatabaseConfigurationError, one, run, transaction } from '@/lib/db';
import { AppError, check, currentUser, deleteSession, hashPassword, integer, makeSession, passwordField, rateLimit, requireStudentAccess, requireUser, textField, verifyPassword } from '@/lib/auth';
import { readAttempt, reward, saveAnswers, startAttempt, studentReport, submitAttempt } from '@/lib/learning';
import { currentFocus, startFocus, updateFocus } from '@/lib/focus';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = {
    params: Promise<{
        path: string[];
    }>;
};
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
type TutorSlide = {
    title: string;
    body: string;
    example?: string;
    prompt?: string;
    section?: string;
};
function localTutorAnswer(action: string, question: string, lesson: any, slides: TutorSlide[], mistakes: string) {
    const terms = (question.toLocaleLowerCase().match(/[\p{L}\p{N}]+/gu) || []).filter(word => word.length > 2 && !['qanday', 'qaysi', 'nima', 'nega', 'menga', 'iltimos', 'haqida', 'bilan', 'uchun'].includes(word));
    const ranked = slides.map(slide => ({ slide, score: terms.reduce((score, term) => score + (`${slide.title} ${slide.body} ${slide.example || ''} ${slide.prompt || ''}`.toLocaleLowerCase().includes(term) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
    const slideIndex = action === 'quiz' ? Math.min(3, slides.length - 1) : ['example', 'steps'].includes(action) ? Math.min(2, slides.length - 1) : 0;
    const focused = action === 'ask' && ranked[0]?.score > 0 ? ranked[0].slide : null;
    const slide = focused || (slides[slideIndex] || slides[0]);
    const example = slide.example?.trim();
    if (action === 'quiz')
        return { answer: slide.prompt ? `Mashq: ${slide.prompt}\n\nIshora: ${slides[1]?.body || slide.body}\n\nJavobingizda qoida va hisoblash qadamlarini ko‘rsating.` : `Mini savol: “${slide.title}” mavzusidagi asosiy qoida nima? ${example ? `Darsdagi “${example}” misolidan foydalanib javob toping.` : 'Dars izohini o‘qib, o‘z so‘zingiz bilan tushuntirib ko‘ring.'}`, configured: false, mode: 'lesson' };
    if (action === 'review')
        return { answer: mistakes ? `Oxirgi testdagi xato javob(lar)ingizni yana bir ko‘rib chiqamiz:\n${mistakes}\nIzohdagi qoidani qayta o‘qing, so‘ng dars misolini o‘zingiz yechib ko‘ring.` : 'Bu dars bo‘yicha yakunlangan test natijangiz hali topilmadi. Avval testni ishlang, keyin xatolaringizni shu yerda birga ko‘rib chiqamiz.', configured: false, mode: 'lesson' };
    if (action === 'example')
        return { answer: `${slide.title}\n${slide.body}${example ? `\n\nNatija: ${example}` : ''}\n\nShu qoidani o‘zingizga tanish boshqa vaziyatda ham sinab ko‘ring.`, configured: false, mode: 'lesson' };
    if (action === 'steps')
        return { answer: `Keling, bosqichma-bosqich ko‘ramiz:\n1. Mavzu: ${slide.title}.\n2. Asosiy qoida: ${slide.body}\n${example ? `3. Dars misoli: ${example}\n4. Misolni shu qoida bilan o‘zingiz yechib ko‘ring.` : '3. Darsdagi qoidani kichik bir misolda qo‘llab ko‘ring.'}`, configured: false, mode: 'lesson' };
    if (action === 'ask' && ranked[0]?.score === 0)
        return { answer: `Savolingizni shu darsdagi mavzu bilan boglay olmadim. Bu darsda ${slides.map(item => item.title).join(', ')} korib chiqiladi. Shu mavzulardan qaysi birini tushuntiray?`, configured: false, mode: 'lesson' };
    const intro = focused ? `${focused.title}: ${focused.body}` : `${slides[0]?.body || slide.body}`;
    const rule = slides[1]?.body || slide.body;
    const worked = slides[2];
    return { answer: `Soddaroq tushuntirish\n${lesson.title}\n\nTushuncha: ${intro}\n\nAsosiy qoida: ${rule}${worked ? `\n\nYechilgan misol:\n${worked.body}${worked.example ? `\n${worked.example}` : ''}` : example ? `\n\nMisol: ${example}` : ''}\n\nXulosa: ${slides.at(-1)?.body || rule}`, configured: false, mode: 'lesson' };
}
async function sessionResponse(userId: number) {
    const user = (await one('SELECT id,name,email,role,avatar FROM users WHERE id=?', userId));
    const response = json({ user });
    response.cookies.set('ilmora_session', (await makeSession(userId)), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 7 * 86400 });
    return response;
}
async function handle(request: NextRequest, context: Context) {
    try {
        const { path } = await context.params;
        const route = path.join('/');
        const method = request.method;
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
            if (raw) {
                try {
                    b = JSON.parse(raw);
                }
                catch {
                    throw new AppError('JSON noto‘g‘ri.');
                }
            }
            check(b && typeof b === 'object' && !Array.isArray(b), 'So‘rov noto‘g‘ri.');
        }
        if (route === 'auth/me' && method === 'GET')
            return json({ user: (await currentUser(request)) || null });
        if (route === 'health' && method === 'GET') {
            const result = await one<{ok:number}>('SELECT 1 AS ok');
            await all('SELECT id FROM users LIMIT 1');
            await all('SELECT key FROM rate_limits LIMIT 1');
            check(result?.ok === 1, 'Bazasiga ulanib bo‘lmadi.', 503);
            return json({ ok: true, backend: 'nodejs', database: databaseKind() });
        }
        if ((route === 'auth/login' || route === 'auth/register') && method === 'POST') {
            const email = textField(b.email, 'Email', 5, 200).toLowerCase();
            check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email manzili noto‘g‘ri.');
            const password = passwordField(b.password, route.endsWith('register') ? 12 : 1);
            // Global bucket supplements per-account throttling without trusting forwarded IP headers.
            (await rateLimit('auth:global', 100, 60000));
            (await rateLimit(`auth:${email}`, 12, 10 * 60000));
            if (route.endsWith('login')) {
                const user = (await one('SELECT * FROM users WHERE email=?', email));
                check(user && verifyPassword(password, user.password_hash), 'Email yoki parol noto‘g‘ri.', 401);
                return (await sessionResponse(user.id));
            }
            check(!b.role || b.role === 'student', 'Ochiq ro‘yxatdan faqat o‘quvchi hisobi yaratiladi.', 403);
            check(!(await one('SELECT id FROM users WHERE email=?', email)), 'Bu email band.', 409);
            const result = (await run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)', textField(b.name, 'Ism', 2, 80), email, hashPassword(password), 'student', Date.now()));
            return (await sessionResponse(Number(result.lastInsertRowid)));
        }
        if (route === 'auth/logout' && method === 'POST') {
            (await deleteSession(request));
            const response = json({ ok: true });
            response.cookies.set('ilmora_session', '', { path: '/', httpOnly: true, maxAge: 0, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
            return response;
        }
        const user = (await requireUser(request));
        if (route === 'profile' && method === 'POST') {
            check(['orange', 'blue', 'green', 'purple'].includes(b.avatar), 'Avatar noto‘g‘ri.');
            const name = textField(b.name ?? user.name, 'Ism', 2, 80);
            (await run('UPDATE users SET name=?,avatar=? WHERE id=?', name, b.avatar, user.id));
            return json({ ok: true, user: { ...user, name, avatar: b.avatar } });
        }
        if (route === 'courses' && method === 'GET') {
            (await requireUser(request, ['student', 'admin']));
            return json({ courses: (await Promise.all((await all('SELECT * FROM courses')).map(async (c) => ({ ...c, modules: (await Promise.all((await all('SELECT * FROM modules WHERE course_id=? ORDER BY position,id', c.id)).map(async (m) => ({ ...m,
                        lessons: (await all('SELECT l.id,l.title,l.description,l.lab_type,COALESCE(p.slide,0) AS slide,COALESCE(p.completed,0) AS completed FROM lessons l LEFT JOIN progress p ON p.lesson_id=l.id AND p.user_id=? WHERE l.module_id=? ORDER BY l.position,l.id', user.id, m.id)),
                        assessments: (await all('SELECT a.id,a.title,a.kind,a.lesson_id,a.duration_seconds,(SELECT MAX(score) FROM attempts WHERE assessment_id=a.id AND user_id=?) AS best FROM assessments a WHERE a.module_id=? ORDER BY a.kind DESC,a.id', user.id, m.id))
                    })))) })))) });
        }
        if (path[0] === 'lessons' && path.length === 2 && method === 'GET') {
            (await requireUser(request, ['student']));
            const id = integer(Number(path[1]));
            const lesson = (await one('SELECT l.*,m.title AS module_title,c.title AS course_title FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE l.id=?', id));
            check(lesson, 'Dars topilmadi.', 404);
            const { slides_json, ...meta } = lesson;
            return json({ lesson: { ...meta, slides: JSON.parse(slides_json) }, progress: (await one('SELECT * FROM progress WHERE user_id=? AND lesson_id=?', user.id, id)) || null,
                assessments: (await all('SELECT id,title,kind,duration_seconds FROM assessments WHERE lesson_id=? OR (module_id=? AND kind=?)', id, lesson.module_id, 'exam')),
                lab: (await one('SELECT * FROM labs WHERE user_id=? AND lesson_id=?', user.id, id)) || null, aiConfigured: Boolean(process.env.AI_API_KEY) });
        }
        if (path[0] === 'lessons' && path[2] === 'progress' && path.length === 3 && method === 'POST') {
            (await requireUser(request, ['student']));
            const id = integer(Number(path[1]));
            const lesson = (await one('SELECT slides_json FROM lessons WHERE id=?', id));
            check(lesson, 'Dars topilmadi.', 404);
            const last = JSON.parse(lesson.slides_json).length - 1;
            const slide = integer(b.slide, 0, last);
            const completed = b.completed === true && slide === last ? 1 : 0;
            (await transaction(async () => {
                (await run('INSERT INTO progress(user_id,lesson_id,slide,completed,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET slide=CASE WHEN progress.slide>excluded.slide THEN progress.slide ELSE excluded.slide END,completed=CASE WHEN progress.completed>excluded.completed THEN progress.completed ELSE excluded.completed END,updated_at=excluded.updated_at', user.id, id, slide, completed, Date.now()));
                if (completed)
                    (await reward(user.id, `lesson:${id}`, 20));
            }));
            return json({ ok: true });
        }
        if (path[0] === 'assessments' && path[2] === 'start' && path.length === 3 && method === 'POST') {
            (await requireUser(request, ['student']));
            return json({ attempt: (await startAttempt(user.id, integer(Number(path[1])))) });
        }
        if (path[0] === 'attempts' && path.length === 2) {
            (await requireUser(request, ['student']));
            const id = integer(Number(path[1]));
            if (method === 'GET')
                return json({ attempt: (await readAttempt(user.id, id)) });
            if (method === 'POST')
                return json({ attempt: (await submitAttempt(user.id, id, b.answers)) });
        }
        if (path[0] === 'attempts' && path[2] === 'answers' && path.length === 3 && method === 'POST') {
            (await requireUser(request, ['student']));
            return json((await saveAnswers(user.id, integer(Number(path[1])), b.answers)));
        }
        if (route === 'focus') {
            (await requireUser(request, ['student']));
            if (method === 'GET') {
                const current = (await currentFocus(user.id));
                return json({ current, history: (await all('SELECT f.*,l.title FROM focus_sessions f JOIN lessons l ON l.id=f.lesson_id WHERE user_id=? ORDER BY created_at DESC LIMIT 100', user.id)), serverTime: Date.now() });
            }
            if (method === 'POST') {
                const current = b.action === 'start' ? (await startFocus(user.id, integer(b.lessonId), textField(b.goal, 'Maqsad', 3, 200))) : (await updateFocus(user.id, b.action, b.active === true));
                return json({ current, serverTime: Date.now() });
            }
        }
        if (route === 'labs' && method === 'POST') {
            (await requireUser(request, ['student']));
            const lessonId = integer(b.lessonId);
            const lesson = (await one('SELECT * FROM lessons WHERE id=?', lessonId));
            check(lesson && ['fraction', 'motion'].includes(lesson.lab_type), 'Bu darsda faol laboratoriya yo‘q.');
            const denominator = integer(b.denominator, 1, lesson.lab_type === 'motion' ? 10000 : 20);
            const numerator = integer(b.numerator, 0, lesson.lab_type === 'motion' ? 10000 : denominator);
            const conclusion = textField(b.conclusion, 'Xulosa', b.submit ? 10 : 0, 3000);
            (await transaction(async () => {
                (await run('INSERT INTO labs(user_id,lesson_id,numerator,denominator,conclusion,status,updated_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(user_id,lesson_id) DO UPDATE SET numerator=excluded.numerator,denominator=excluded.denominator,conclusion=excluded.conclusion,status=excluded.status,updated_at=excluded.updated_at', user.id, lessonId, numerator, denominator, conclusion, b.submit ? 'submitted' : 'draft', Date.now()));
                if (b.submit)
                    (await reward(user.id, `lab:${lessonId}`, 25));
            }));
            return json({ ok: true });
        }
        if (route === 'reports' && method === 'GET') {
            const requested = request.nextUrl.searchParams.get('studentId');
            if (requested) {
                const id = integer(Number(requested));
                (await requireStudentAccess(user, id));
                (await currentFocus(id));
                return json({ reports: [(await studentReport(id))] });
            }
            const ids = user.role === 'student' ? [{ id: user.id }] : user.role === 'admin' ? (await all('SELECT id FROM users WHERE role=?', 'student')) : (await all('SELECT student_id AS id FROM relations WHERE adult_id=?', user.id));
            return json({ reports: (await Promise.all(ids.map(async (r) => { (await currentFocus(r.id)); return (await studentReport(r.id)); }))) });
        }
        if (route === 'support' && method === 'GET') {
            (await requireUser(request, ['student', 'teacher']));
            const where = user.role === 'student' ? 's.student_id=?' : 's.student_id IN (SELECT student_id FROM relations WHERE adult_id=?)';
            return json({ questions: (await all(`SELECT s.*,u.name AS student_name,l.title AS lesson_title,t.name AS teacher_name FROM support s JOIN users u ON u.id=s.student_id JOIN lessons l ON l.id=s.lesson_id LEFT JOIN users t ON t.id=s.teacher_id WHERE ${where} ORDER BY s.created_at DESC`, user.id)) });
        }
        if (route === 'support' && method === 'POST') {
            (await requireUser(request, ['student']));
            (await rateLimit(`support:${user.id}`, 10, 3600000));
            const lessonId = integer(b.lessonId);
            check((await one('SELECT id FROM lessons WHERE id=?', lessonId)), 'Dars topilmadi.', 404);
            (await run('INSERT INTO support(student_id,lesson_id,question,created_at) VALUES(?,?,?,?)', user.id, lessonId, textField(b.question, 'Savol', 5, 3000), Date.now()));
            return json({ ok: true });
        }
        if (path[0] === 'support' && path[2] === 'reply' && path.length === 3 && method === 'POST') {
            (await requireUser(request, ['teacher']));
            const id = integer(Number(path[1]));
            const question = (await one('SELECT * FROM support WHERE id=?', id));
            check(question, 'Savol topilmadi.', 404);
            (await requireStudentAccess(user, question.student_id));
            (await run('UPDATE support SET answer=?,teacher_id=?,answered_at=? WHERE id=?', textField(b.answer, 'Javob', 3, 5000), user.id, Date.now(), id));
            return json({ ok: true });
        }
        if (route === 'admin/users' && method === 'POST') {
            (await requireUser(request, ['admin']));
            check(['parent', 'teacher'].includes(b.role), 'Ota-ona yoki ustoz rolini tanlang.');
            const email = textField(b.email, 'Email', 5, 200).toLowerCase();
            check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Email noto‘g‘ri.');
            check(!(await one('SELECT id FROM users WHERE email=?', email)), 'Bu email band.', 409);
            (await run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)', textField(b.name, 'Ism', 2, 80), email, hashPassword(passwordField(b.password)), b.role, Date.now()));
            return json({ ok: true });
        }
        if (route === 'admin/content') {
            (await requireUser(request, ['admin']));
            if (method === 'GET')
                return json({ courses: (await all('SELECT * FROM courses')), modules: (await all('SELECT * FROM modules')), lessons: (await all('SELECT * FROM lessons')), assessments: (await all('SELECT * FROM assessments')), questions: (await all('SELECT * FROM questions')), users: (await all('SELECT id,name,email,role FROM users')), relations: (await all('SELECT * FROM relations')) });
            if (method === 'POST') {
                const id = b.id == null ? null : integer(b.id);
                if (b.type === 'course') {
                    const values = [textField(b.title, 'Sarlavha', 3, 150), textField(b.description, 'Tavsif', 3, 2000), textField(b.subject, 'Fan', 2, 80)];
                    if (id) {
                        check((await one('SELECT id FROM courses WHERE id=?', id)), 'Kurs topilmadi.', 404);
                        (await run('UPDATE courses SET title=?,description=?,subject=? WHERE id=?', ...values, id));
                    }
                    else
                        (await run('INSERT INTO courses(title,description,subject) VALUES(?,?,?)', ...values));
                }
                else if (b.type === 'module') {
                    const courseId = integer(b.courseId);
                    check((await one('SELECT id FROM courses WHERE id=?', courseId)), 'Kurs topilmadi.');
                    if (id)
                        (await run('UPDATE modules SET course_id=?,title=?,position=? WHERE id=?', courseId, textField(b.title, 'Sarlavha', 3, 150), integer(b.position, 1, 1000), id));
                    else
                        (await run('INSERT INTO modules(course_id,title,position) VALUES(?,?,?)', courseId, textField(b.title, 'Sarlavha', 3, 150), integer(b.position, 1, 1000)));
                }
                else if (b.type === 'lesson') {
                    const moduleId = integer(b.moduleId);
                    check((await one('SELECT id FROM modules WHERE id=?', moduleId)), 'Modul topilmadi.');
                    check(Array.isArray(b.slides) && b.slides.length > 0 && b.slides.length <= 30, '1–30 ta slayd kiriting.');
                    const slides = b.slides.map((s: Record<string, any>) => ({ title: textField(s.title, 'Slayd sarlavhasi', 2, 150), body: textField(s.body, 'Slayd matni', 5, 5000), example: textField(s.example || '', 'Misol', 0, 1200), visual: textField(s.visual || '', 'Vizual', 0, 80), numerator: integer(s.numerator ?? 1, 0, 20), denominator: integer(s.denominator ?? 4, 1, 20), section: textField(s.section || '', 'Bo‘lim', 0, 60), prompt: textField(s.prompt || '', 'Mashq', 0, 1200) }));
                    check(b.labType === null || ['fraction', 'motion'].includes(b.labType), 'Laboratoriya turi noto‘g‘ri.');
                    const values = [moduleId, textField(b.title, 'Sarlavha', 3, 150), textField(b.description || '', 'Tavsif', 0, 2000), JSON.stringify(slides), b.labType];
                    if (id)
                        (await run('UPDATE lessons SET module_id=?,title=?,description=?,slides_json=?,lab_type=? WHERE id=?', ...values, id));
                    else
                        (await run('INSERT INTO lessons(module_id,title,description,slides_json,lab_type) VALUES(?,?,?,?,?)', ...values));
                }
                else if (b.type === 'assessment') {
                    const moduleId = integer(b.moduleId);
                    check((await one('SELECT id FROM modules WHERE id=?', moduleId)), 'Modul topilmadi.');
                    check(['test', 'exam'].includes(b.kind), 'Test turi noto‘g‘ri.');
                    const lessonId = b.kind === 'test' ? integer(b.lessonId) : null;
                    if (lessonId)
                        check((await one('SELECT id FROM lessons WHERE id=? AND module_id=?', lessonId, moduleId)), 'Dars shu modulga tegishli bo‘lsin.');
                    const values = [lessonId, moduleId, textField(b.title, 'Sarlavha', 3, 150), b.kind, integer(b.durationSeconds, 60, 7200)];
                    if (id)
                        (await run('UPDATE assessments SET lesson_id=?,module_id=?,title=?,kind=?,duration_seconds=? WHERE id=?', ...values, id));
                    else
                        (await run('INSERT INTO assessments(lesson_id,module_id,title,kind,duration_seconds) VALUES(?,?,?,?,?)', ...values));
                }
                else if (b.type === 'question') {
                    const assessmentId = integer(b.assessmentId);
                    check((await one('SELECT id FROM assessments WHERE id=?', assessmentId)), 'Test topilmadi.');
                    check(Array.isArray(b.options) && b.options.length >= 2 && b.options.length <= 8, '2–8 javob varianti kiriting.');
                    const options = b.options.map((s: unknown) => textField(s, 'Variant', 1, 500));
                    const values = [assessmentId, textField(b.prompt, 'Savol', 3, 2000), JSON.stringify(options), integer(b.correctIndex, 0, options.length - 1), textField(b.explanation, 'Izoh', 3, 3000)];
                    if (id)
                        (await run('UPDATE questions SET assessment_id=?,prompt=?,options_json=?,correct_index=?,explanation=? WHERE id=?', ...values, id));
                    else
                        (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', ...values));
                }
                else if (b.type === 'relation') {
                    const adultId = integer(b.adultId), studentId = integer(b.studentId);
                    check((await one('SELECT id FROM users WHERE id=? AND role IN (?,?)', adultId, 'parent', 'teacher')), 'Ota-ona yoki ustoz tanlang.');
                    check((await one('SELECT id FROM users WHERE id=? AND role=?', studentId, 'student')), 'O‘quvchi tanlang.');
                    (await run('INSERT OR IGNORE INTO relations(adult_id,student_id) VALUES(?,?)', adultId, studentId));
                }
                else
                    check(false, 'Noma’lum kontent turi.');
                return json({ ok: true });
            }
        }
        if (route === 'ai' && method === 'POST') {
            (await requireUser(request, ['student']));
            const apiKey = process.env.AI_API_KEY;
            (await rateLimit(`ai:${user.id}`, 15, 60 * 60 * 1000));
            const lessonId = integer(b.lessonId);
            const lesson = (await one('SELECT l.*,m.title AS module_title,c.title AS course_title FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE l.id=?', lessonId));
            check(lesson, 'Dars topilmadi.', 404);
            check(!(await one("SELECT a.id FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=? AND s.module_id=? AND s.kind='exam' AND a.submitted_at IS NULL", user.id, lesson.module_id)), 'Modul imtihoni davomida AI vaqtincha o‘chiriladi.', 403);
            const action = String(b.action || 'explain');
            check(['explain', 'example', 'steps', 'quiz', 'review', 'ask'].includes(action), 'Yordam turini tanlang.');
            const question = action === 'ask' ? textField(b.question, 'Savol', 3, 1200).replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email manzil]').replace(/\+?\d(?:[\s().-]*\d){9,}/g, '[telefon raqami]') : '';
            const slides = JSON.parse(lesson.slides_json) as TutorSlide[];
            const material = slides.map(s => `${s.section ? `[${s.section}] ` : ''}${s.title}: ${s.body}${s.example ? ` Misol: ${s.example}` : ''}${s.prompt ? ` Mashq: ${s.prompt}` : ''}`).join('\n');
            let mistakes = '';
            if (action === 'review') {
                const attempt = (await one<{
                    questions_json: string;
                    answers_json: string | null;
                    feedback_json: string | null;
                }>('SELECT a.questions_json,a.answers_json,a.feedback_json FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=? AND s.lesson_id=? AND s.kind=\'test\' AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC LIMIT 1', user.id, lessonId));
                if (attempt) {
                    const qs = JSON.parse(attempt.questions_json), answers = JSON.parse(attempt.answers_json || '[]'), feedback = JSON.parse(attempt.feedback_json || '[]');
                    mistakes = qs.map((q: any, i: number) => feedback[i]?.correct ? null : `Savol: ${q.prompt}; tanlangan javob: ${q.options[answers[i]] ?? 'javob berilmagan'}; to‘g‘ri javob: ${q.options[q.correctIndex]}; izoh: ${q.explanation}`).filter(Boolean).join('\n');
                }
            }
            if (!apiKey)
                return json(localTutorAnswer(action, question, lesson, slides, mistakes));
            const endpoint = new URL(process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions');
            check(endpoint.protocol === 'https:' || (process.env.NODE_ENV !== 'production' && endpoint.protocol === 'http:'), 'AI_API_URL xavfsiz HTTPS manzili bo‘lsin.');
            const instruction: Record<string, string> = { explain: 'Mavzuni sodda va aniq tushuntir.', example: 'Mavzuga mos yangi hayotiy misol keltir va yechimini bosqichma-bosqich ko‘rsat.', steps: 'Tayyor javobni darrov bermay, masalani kichik qadamlar bilan yechishga yo‘naltir.', quiz: 'Mavzu bo‘yicha bitta yangi savol ber; javobini hozir aytma.', review: 'O‘quvchining xatosini muloyim tushuntir, keyin o‘xshash mashq taklif qil.', ask: question };
            try {
                const response = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', temperature: 0.2, max_tokens: 650, messages: [{ role: 'system', content: 'Sen ILMORA platformasidagi aniq va muloyim o‘zbekcha ustozsan. Javobni faqat berilgan dars materiali va ishonchli umumiy bilimga tayab ber. Hisobni tekshir; material yetarli bo‘lmasa buni ochiq ayt va ustozdan so‘rashni taklif qil. O‘quvchiga fikrlash yo‘lini ko‘rsat. Hozirgi imtihon javoblarini yoki yashirin kalitlarni bermagin. Shaxsiy ma’lumot so‘rama.' }, { role: 'user', content: `Kurs: ${lesson.course_title}. Modul: ${lesson.module_title}. Dars: ${lesson.title}.\nTasdiqlangan material:\n${material}\n${mistakes ? `O‘quvchining oldingi test xatolari:\n${mistakes}\n` : ''}Amal: ${instruction[action]}` }] }), signal: AbortSignal.timeout(20000) });
                if (!response.ok)
                    throw new Error(`provider ${response.status}`);
                const payload = await response.json();
                const answer = payload.choices?.[0]?.message?.content;
                check(typeof answer === 'string' && answer.trim().length > 0, 'AI javob qaytarmadi.', 502);
                return json({ answer: answer.trim(), configured: true });
            }
            catch (error) {
                if (error instanceof AppError)
                    throw error;
                console.error('AI provayderi javob bermadi:', error instanceof Error ? error.message : 'noma’lum xato');
                throw new AppError('AI hozir javob bera olmadi. Birozdan keyin qayta urinib ko‘ring yoki ustozga murojaat qiling.', 502);
            }
        }
        throw new AppError('Manzil topilmadi.', 404);
    }
    catch (error) {
        if (error instanceof DatabaseConfigurationError) return json({error:error.message},503);
        const code = (error as {code?:string}).code;
        const constraint = (error as {constraint?:string}).constraint || '';
        if(code === '23505' && constraint.startsWith('users_email')) return json({error:'Bu email band.'},409);
        if(code === '42P01') return json({error:'Database jadvallari tayyor emas. db:migrate buyrug‘ini bajaring.'},503);
        if (error instanceof AppError)
            return json({ error: error.message }, error.status);
        console.error('API xatosi:', {name:error instanceof Error ? error.name : 'UnknownError',code:code || 'unknown'});
        return json({ error: 'Serverda xato yuz berdi. Qayta urinib ko‘ring.' }, 500);
    }
}
export { handle as GET, handle as POST };
