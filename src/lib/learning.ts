import { all, one, run, transaction } from './db';
import { check } from './auth';

type Question = { id: number; prompt: string; options: string[]; correctIndex: number; explanation: string };
export function reward(userId: number, source: string, xp: number) {
  run('INSERT OR IGNORE INTO rewards(user_id,source,xp,created_at) VALUES(?,?,?,?)', userId, source, xp, Date.now());
}
export function startAttempt(userId: number, assessmentId: number, now = Date.now()) {
  return transaction(() => {
    const assessment = one('SELECT * FROM assessments WHERE id=?', assessmentId);
    check(assessment, 'Test topilmadi.', 404);
    const existing = one('SELECT id FROM attempts WHERE user_id=? AND assessment_id=? AND submitted_at IS NULL', userId, assessmentId);
    if (existing) return readAttempt(userId, existing.id);
    const questions = all('SELECT * FROM questions WHERE assessment_id=? ORDER BY id', assessmentId).map(q => ({ id: q.id, prompt: q.prompt, options: JSON.parse(q.options_json), correctIndex: q.correct_index, explanation: q.explanation }));
    check(questions.length > 0, 'Bu test uchun savollar hali kiritilmagan.');
    const result = run('INSERT INTO attempts(user_id,assessment_id,started_at,deadline,questions_json) VALUES(?,?,?,?,?)', userId, assessmentId, now, now + assessment.duration_seconds * 1000, JSON.stringify(questions));
    return readAttempt(userId, Number(result.lastInsertRowid));
  });
}
export function readAttempt(userId: number, attemptId: number) {
  const a = one('SELECT a.*,s.title,s.kind FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.id=? AND a.user_id=?', attemptId, userId);
  check(a, 'Urinish topilmadi.', 404);
  const questions: Question[] = JSON.parse(a.questions_json);
  return { id: a.id, assessmentId: a.assessment_id, title: a.title, kind: a.kind, deadline: a.deadline, submittedAt: a.submitted_at,
    questions: questions.map(q => ({ id: q.id, prompt: q.prompt, options: q.options })),
    score: a.score, answers: a.answers_json ? JSON.parse(a.answers_json) : [], feedback: a.submitted_at ? JSON.parse(a.feedback_json) : null };
}
export function submitAttempt(userId: number, attemptId: number, answers: unknown, now = Date.now()) {
  return transaction(() => {
    const a = one('SELECT a.*,s.kind FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.id=? AND a.user_id=?', attemptId, userId);
    check(a, 'Urinish topilmadi.', 404);
    if (a.submitted_at) return readAttempt(userId, attemptId);
    const questions: Question[] = JSON.parse(a.questions_json);
    check(Array.isArray(answers) && answers.length <= questions.length && answers.every(v => v === null || (Number.isInteger(v) && v >= 0 && v < 8)), 'Javoblar noto‘g‘ri.');
    // Late submissions cannot introduce answers after the deadline.
    const accepted: Array<number|null> = now > a.deadline ? JSON.parse(a.answers_json || '[]') : answers;
    const feedback = questions.map((q, i) => ({ questionId: q.id, correct: accepted[i] === q.correctIndex, correctIndex: q.correctIndex, explanation: q.explanation }));
    const score = Math.round(feedback.filter(f => f.correct).length / questions.length * 100);
    run('UPDATE attempts SET submitted_at=?,answers_json=?,score=?,feedback_json=? WHERE id=?', now, JSON.stringify(accepted), score, JSON.stringify(feedback), attemptId);
    if (score >= 60) reward(userId, `assessment:${a.assessment_id}`, a.kind === 'exam' ? 50 : 30);
    return readAttempt(userId, attemptId);
  });
}
export function saveAnswers(userId: number, attemptId: number, answers: unknown, now = Date.now()) {
  const a=one('SELECT * FROM attempts WHERE id=? AND user_id=?',attemptId,userId);
  check(a,'Urinish topilmadi.',404);
  check(!a.submitted_at && now <= a.deadline,'Test muddati tugagan.',409);
  const questions: Question[]=JSON.parse(a.questions_json);
  check(Array.isArray(answers) && answers.length<=questions.length && answers.every((v,i)=>v===null||(Number.isInteger(v)&&v>=0&&v<questions[i].options.length)),'Javoblar noto‘g‘ri.');
  run('UPDATE attempts SET answers_json=? WHERE id=? AND submitted_at IS NULL',JSON.stringify(answers),attemptId);
  return {ok:true};
}
export function studentReport(userId: number) {
  const student = one('SELECT id,name,avatar FROM users WHERE id=? AND role=?', userId, 'student');
  check(student, 'O‘quvchi topilmadi.', 404);
  const progress = all('SELECT p.*,l.title FROM progress p JOIN lessons l ON l.id=p.lesson_id WHERE user_id=? ORDER BY updated_at DESC', userId);
  const attempts = all('SELECT a.id,a.score,a.submitted_at,s.title,s.kind FROM attempts a JOIN assessments s ON s.id=a.assessment_id WHERE a.user_id=? AND a.submitted_at IS NOT NULL ORDER BY a.submitted_at DESC', userId);
  const labs = all('SELECT b.*,l.title,l.lab_type FROM labs b JOIN lessons l ON l.id=b.lesson_id WHERE user_id=? ORDER BY updated_at DESC', userId);
  const focus = all('SELECT f.*,l.title FROM focus_sessions f JOIN lessons l ON l.id=f.lesson_id WHERE user_id=? ORDER BY created_at DESC LIMIT 100', userId);
  const xp = one('SELECT COALESCE(SUM(xp),0) AS total FROM rewards WHERE user_id=?', userId)!.total;
  return { student, progress, attempts, labs, focus, xp };
}
