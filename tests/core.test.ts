import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { GET, POST } from '../src/app/api/[...path]/route';
import { all, one, run } from '../src/lib/db';
import { currentUser, hashPassword, makeSession, requireStudentAccess, verifyPassword, type User } from '../src/lib/auth';
import { seedContent, seedDemo } from '../src/lib/seed';
import { readAttempt, saveAnswers, startAttempt, submitAttempt } from '../src/lib/learning';
import { BREAK_MS, currentFocus, startFocus, STUDY_MS, updateFocus } from '../src/lib/focus';
process.env.DATABASE_PATH=':memory:';
const password=randomBytes(20).toString('base64url');
let student:User,parent:User,teacher:User,admin:User,stranger:User;
const tokens:Record<string,string>={};
before(()=>{
  seedDemo(password);
  [student,parent,teacher,admin]=['student','parent','teacher','admin'].map(role=>one<User>('SELECT id,name,email,role,avatar FROM users WHERE role=?',role)!);
  const inserted=run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)','Begona o‘quvchi','other@example.uz',hashPassword(password),'student',Date.now());
  stranger=one<User>('SELECT * FROM users WHERE id=?',Number(inserted.lastInsertRowid))!;
  for(const u of [student,parent,teacher,admin,stranger])tokens[u.id]=makeSession(u.id);
});
async function call(path:string,body?:unknown,user?:User) {
  const req=new NextRequest(`http://localhost:3000/api/${path}`,{method:body===undefined?'GET':'POST',headers:{...(user?{cookie:`ilmora_session=${tokens[user.id]}`} : {}),...(body!==undefined?{'content-type':'application/json',origin:'http://localhost:3000'}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  const response=await(body===undefined?GET:POST)(req,{params:Promise.resolve({path:path.split('/')})});
  return {response,data:await response.json()};
}
test('Demo: 4 kurs, 8 modul, 24 dars; testlarda 5, imtihonlarda 10 savol',()=>{
  assert.equal(Object.getPrototypeOf(student),Object.prototype,'SQLite rows must be serializable React props');
  assert.equal(all('SELECT * FROM courses').length,4);assert.equal(all('SELECT * FROM modules').length,8);
  assert.equal(all('SELECT * FROM lessons').length,24);
  for(const l of all('SELECT * FROM lessons')) {
    const slides=JSON.parse(l.slides_json);
    assert.equal(slides.length,5);
    assert.deepEqual(slides.map((slide:any)=>slide.section),['Mavzuga kirish','Asosiy qoida','Misolni yechamiz','Mustaqil mashq','Xulosa']);
    assert.ok(slides.every((slide:any)=>slide.body.length>80&&slide.example.length>20),`${l.title} uchun dars mazmuni to‘liq bo‘lishi kerak`);
  }
  for(const a of all('SELECT * FROM assessments'))assert.equal(all('SELECT * FROM questions WHERE assessment_id=?',a.id).length,a.kind==='exam'?10:5);
  const counts=[all('SELECT * FROM courses').length,all('SELECT * FROM modules').length,all('SELECT * FROM lessons').length];
  seedContent();
  assert.deepEqual([all('SELECT * FROM courses').length,all('SELECT * FROM modules').length,all('SELECT * FROM lessons').length],counts,'Qayta seed dublikat yaratmasligi kerak');
});
test('Parollar salt bilan hash qilinadi va to‘g‘ri tekshiriladi',()=>{
  const h=hashPassword(password);assert.notEqual(h,password);assert.notEqual(h,hashPassword(password));assert.equal(verifyPassword(password,h),true);assert.equal(verifyPassword('boshqa parol',h),false);
});
test('Login HttpOnly/SameSite cookie beradi, sessiya tokeni bazada hash bo‘ladi',async()=>{
  const {response,data}=await call('auth/login',{email:student.email,password});assert.equal(response.status,200);assert.equal(data.user.role,'student');
  const cookie=response.headers.get('set-cookie')!;assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=lax/i);assert.ok(!('password_hash' in data.user));
  const raw=cookie.match(/ilmora_session=([^;]+)/)![1];assert.equal(one('SELECT * FROM sessions WHERE token_hash=?',raw),undefined);
  const req=new Request('http://localhost',{headers:{cookie:`ilmora_session=${raw}`}});assert.equal(currentUser(req)?.id,student.id);
  assert.equal((await call('auth/login',{email:student.email,password:'noto‘g‘ri'})).response.status,401);
});
test('Ochiq registratsiya admin/teacher rolini yarata olmaydi',async()=>{
  for(const role of ['admin','teacher','parent'])assert.equal((await call('auth/register',{email:`${role}@example.uz`,password,name:'Begona',role})).response.status,403);
  const r=await call('auth/register',{email:'new@example.uz',password,name:'Yangi O‘quvchi'});assert.equal(r.response.status,200);assert.equal(r.data.user.role,'student');
  const spaced=`  ${password}  `;
  assert.equal((await call('auth/register',{email:'spaces@example.uz',password:spaced,name:'Parol testi'})).response.status,200);
  assert.equal((await call('auth/login',{email:'spaces@example.uz',password:spaced})).response.status,200);
  assert.equal((await call('auth/login',{email:'spaces@example.uz',password})).response.status,401);
});
test('Server rollari va CSRF manbasi tekshiriladi',async()=>{
  assert.equal((await call('admin/content')).response.status,401);
  for(const u of [student,parent,teacher])assert.equal((await call('admin/content',undefined,u)).response.status,403);
  assert.equal((await call('admin/content',undefined,admin)).response.status,200);
  const request=new NextRequest('http://localhost:3000/api/profile',{method:'POST',headers:{origin:'https://evil.example',cookie:`ilmora_session=${tokens[student.id]}`},body:JSON.stringify({avatar:'blue'})});
  assert.equal((await POST(request,{params:Promise.resolve({path:['profile']})})).status,403);
});
test('Ota-ona va ustoz faqat tasdiqlangan o‘quvchini ko‘radi',async()=>{
  requireStudentAccess(parent,student.id);requireStudentAccess(teacher,student.id);
  assert.throws(()=>requireStudentAccess(parent,stranger.id));assert.throws(()=>requireStudentAccess(teacher,stranger.id));
  assert.equal((await call(`reports?studentId=${stranger.id}`,undefined,parent)).response.status,404);
  const req=new NextRequest(`http://localhost:3000/api/reports?studentId=${stranger.id}`,{headers:{cookie:`ilmora_session=${tokens[parent.id]}`}});
  assert.equal((await GET(req,{params:Promise.resolve({path:['reports']})})).status,403);
  const r=await call('reports',undefined,parent);assert.equal(r.data.reports.length,1);assert.equal(r.data.reports[0].student.id,student.id);
});
test('Dars → laboratoriya oqimi va XP qayta yozilmaydi',async()=>{
  for(let i=0;i<2;i++)assert.equal((await call('lessons/1/progress',{slide:4,completed:true},student)).response.status,200);
  assert.equal(one('SELECT * FROM progress WHERE user_id=? AND lesson_id=1',student.id)?.completed,1);
  for(let i=0;i<2;i++)assert.equal((await call('labs',{lessonId:1,numerator:3,denominator:4,conclusion:'3/4 va 6/8 ikkalasi ham 75 foizga teng.',submit:true},student)).response.status,200);
  assert.equal(all('SELECT * FROM rewards WHERE user_id=?',student.id).length,2);
  assert.equal((await call('labs',{lessonId:1,numerator:3,denominator:0,conclusion:'xulosa',submit:true},student)).response.status,400);
  assert.equal((await call('lessons/1',undefined,parent)).response.status,403);
});
test('Fizika onlayn laboratoriyasi masofa/vaqtni serverda saqlaydi',async()=>{
  const lesson=one<{id:number}>("SELECT l.id FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE c.title='Fizika: harakat va kuch' AND l.title='Tezlikni hisoblash'")!;
  const result=await call('labs',{lessonId:lesson.id,numerator:180,denominator:30,conclusion:'Tezlik masofa va vaqt nisbatiga teng.',submit:true},student);
  assert.equal(result.response.status,200);
  const saved=one('SELECT * FROM labs WHERE user_id=? AND lesson_id=?',student.id,lesson.id)!;
  assert.equal(saved.numerator,180);assert.equal(saved.denominator,30);assert.equal(saved.status,'submitted');
});
test('Har bir rol o‘z ismi va avatarini o‘zgartira oladi',async()=>{
  for(const account of [student,parent,teacher,admin]) {
    const oldName=account.name;
    const changed=await call('profile',{name:`${oldName} Yangilandi`,avatar:'purple'},account);
    assert.equal(changed.response.status,200);assert.equal(one('SELECT name FROM users WHERE id=?',account.id)?.name,`${oldName} Yangilandi`);
    await call('profile',{name:oldName,avatar:account.avatar},account);
  }
  assert.equal((await call('profile',{name:'Buzilgan',avatar:'admin'},student)).response.status,400);
});
test('AI materialdan javob oladi va faol modul imtihonida bloklanadi',async()=>{
  const oldKey=process.env.AI_API_KEY,oldUrl=process.env.AI_API_URL,oldModel=process.env.AI_MODEL,originalFetch=globalThis.fetch;
  process.env.AI_API_KEY='test-only-key';process.env.AI_API_URL='https://ai.example.test/v1/chat/completions';process.env.AI_MODEL='test-model';
  let providerBody='';
  globalThis.fetch=(async(_input:any,init?:RequestInit)=>{assert.equal(new Headers(init?.headers).get('authorization'),'Bearer test-only-key');providerBody=String(init?.body);return Response.json({choices:[{message:{content:'1/2 = 2/4, chunki surat va maxrajni 2 ga ko‘paytirdik.'}}]});}) as typeof fetch;
  try {
    const lesson=one<{id:number;module_id:number}>("SELECT id,module_id FROM lessons WHERE id=1")!;
    const exam=one<{id:number}>("SELECT id FROM assessments WHERE module_id=? AND kind='exam'",lesson.module_id)!;
    const attempt=startAttempt(student.id,exam.id);
    assert.equal((await call('ai',{lessonId:lesson.id,action:'explain'},student)).response.status,403);
    submitAttempt(student.id,attempt.id,new Array(attempt.questions.length).fill(null));
    const reply=await call('ai',{lessonId:lesson.id,action:'explain'},student);
    assert.equal(reply.response.status,200);assert.match(reply.data.answer,/2\/4/);assert.match(providerBody,/Tasdiqlangan material/);assert.ok(!providerBody.includes(student.email));
  } finally {
    globalThis.fetch=originalFetch;
    if(oldKey===undefined)delete process.env.AI_API_KEY;else process.env.AI_API_KEY=oldKey;
    if(oldUrl===undefined)delete process.env.AI_API_URL;else process.env.AI_API_URL=oldUrl;
    if(oldModel===undefined)delete process.env.AI_MODEL;else process.env.AI_MODEL=oldModel;
  }
});
test('Savol kalitlari brauzerga chiqarilmaydi, baholash va mukofot idempotent',()=>{
  const a=startAttempt(student.id,1,1000);assert.equal(a.questions.length,5);assert.equal(a.feedback,null);assert.ok(!JSON.stringify(a).includes('correctIndex'));
  const keys=JSON.parse(one('SELECT questions_json FROM attempts WHERE id=?',a.id)!.questions_json).map((q:any)=>q.correctIndex);
  const result=submitAttempt(student.id,a.id,keys,2000);assert.equal(result.score,100);assert.equal(result.feedback.length,5);
  assert.equal(submitAttempt(student.id,a.id,[],3000).score,100);
  const second=startAttempt(student.id,1,4000);assert.equal(submitAttempt(student.id,second.id,keys,5000).score,100);
  assert.equal(all('SELECT * FROM rewards WHERE user_id=? AND source=?',student.id,'assessment:1').length,1);
  assert.throws(()=>readAttempt(stranger.id,a.id));
});
test('Imtihon deadline refresh bilan uzaymaydi; kech javob qabul qilinmaydi',()=>{
  const a=startAttempt(student.id,2,1000),again=startAttempt(student.id,2,9000);assert.equal(a.id,again.id);assert.equal(a.deadline,again.deadline);
  const keys=JSON.parse(one('SELECT questions_json FROM attempts WHERE id=?',a.id)!.questions_json).map((q:any)=>q.correctIndex);
  saveAnswers(student.id,a.id,keys,2000);assert.throws(()=>saveAnswers(student.id,a.id,[],a.deadline+1));
  const result=submitAttempt(student.id,a.id,[],a.deadline+10);assert.equal(result.score,100);assert.equal(one('SELECT xp FROM rewards WHERE user_id=? AND source=?',student.id,'assessment:2')?.xp,50);
  const late=startAttempt(stranger.id,2,1000);assert.equal(submitAttempt(stranger.id,late.id,keys,late.deadline+1).score,0);
});
test('Focus yagona sessiya, pause/resume va refresh vaqtni saqlaydi',()=>{
  const f=startFocus(student.id,1,'Kasrlarni o‘rganish',1000)!;assert.equal(f.deadline,1000+STUDY_MS);
  assert.throws(()=>startFocus(student.id,1,'Boshqa maqsad',2000));
  assert.equal(currentFocus(student.id,11000)!.deadline,f.deadline);
  const paused=updateFocus(student.id,'pause',false,11000);assert.equal(paused.remaining_ms,STUDY_MS-10000);assert.equal(paused.deadline,null);
  assert.equal(currentFocus(student.id,70000)!.remaining_ms,paused.remaining_ms);
  const resumed=updateFocus(student.id,'resume',false,80000);assert.equal(resumed.deadline,80000+paused.remaining_ms);
  updateFocus(student.id,'finish',false,85000);assert.equal(currentFocus(student.id,85001),null);
});
test('Yashirin/harakatsiz vaqt va uzoq heartbeat faol o‘qishga qo‘shilmaydi',()=>{
  startFocus(stranger.id,1,'Vaqtni tekshirish',1000);
  updateFocus(stranger.id,'heartbeat',true,11000);assert.equal(updateFocus(stranger.id,'heartbeat',true,21000).active_seconds,10);
  assert.equal(updateFocus(stranger.id,'heartbeat',false,31000).active_seconds,10);
  assert.equal(updateFocus(stranger.id,'heartbeat',true,41000).active_seconds,10);
  assert.equal(updateFocus(stranger.id,'heartbeat',true,100000).active_seconds,10);
  const rest=currentFocus(stranger.id,1000+STUDY_MS)!;assert.equal(rest.phase,'break');assert.equal(rest.deadline,1000+STUDY_MS+BREAK_MS);
  assert.equal(currentFocus(stranger.id,1000+STUDY_MS+BREAK_MS)!.state,'completed');
  assert.equal(all('SELECT * FROM rewards WHERE user_id=?',stranger.id).length,0);
});
test('Savol yuboriladi, faqat biriktirilgan ustoz javob beradi',async()=>{
  assert.equal((await call('support',{lessonId:1,question:'Kasrlarni qanday qisqartirish mumkin?'},student)).response.status,200);
  const list=await call('support',undefined,teacher),q=list.data.questions[0];assert.equal(q.student_id,student.id);
  assert.equal((await call(`support/${q.id}/reply`,{answer:'Surat va maxrajni bir xil songa bo‘ling.'},teacher)).response.status,200);
  const own=await call('support',undefined,student);assert.match(own.data.questions[0].answer,/bir xil/);
  assert.equal((await call(`support/${q.id}/reply`,{answer:'Taqiqlangan javob'},parent)).response.status,403);
  assert.equal((await call('support',undefined,stranger)).data.questions.length,0);
});
test('Admin kontenti tahrirlanadi, yangi hisob va bog‘lanish ruxsati tekshiriladi',async()=>{
  const payload={type:'course',title:'Yangi fan kursi',description:'Keyingi fan uchun kontent',subject:'Fizika'};
  assert.equal((await call('admin/content',payload,student)).response.status,403);
  assert.equal((await call('admin/content',payload,admin)).response.status,200);
  assert.equal(all('SELECT * FROM courses').length,5);
  assert.equal((await call('admin/users',{name:'Yangi ustoz',email:'newteacher@example.uz',password,role:'teacher'},admin)).response.status,200);
  assert.equal((await call('admin/users',{name:'Admin',email:'bad@example.uz',password,role:'admin'},admin)).response.status,400);
});
test('AI kalitisiz dars yordamchisi ishlaydi; logout sessiyani bekor qiladi',async()=>{
  const prior=process.env.AI_API_KEY;delete process.env.AI_API_KEY;
  const result=await call('ai',{lessonId:1,action:'explain'},student);
  assert.equal(result.response.status,200);
  assert.equal(result.data.configured,false);
  assert.equal(result.data.mode,'lesson');
  assert.match(result.data.answer,/Soddaroq tushuntirish/);
  if(prior!==undefined)process.env.AI_API_KEY=prior;
  assert.equal((await call('auth/logout',{},stranger)).response.status,200);
  assert.equal((await call('auth/me',undefined,stranger)).data.user,null);
});
