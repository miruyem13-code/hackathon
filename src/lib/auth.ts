import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { one, run } from './db';

export type Role = 'student' | 'parent' | 'teacher' | 'admin';
export type User = { id: number; name: string; email: string; role: Role; avatar: string };
export class AppError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function check(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) throw new AppError(message, status);
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':');
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const digest = Buffer.from(expected, 'hex');
  return digest.length === actual.length && timingSafeEqual(actual, digest);
}
const digestToken = (token: string) => createHash('sha256').update(token).digest('hex');
export function makeSession(userId: number) {
  const token = randomBytes(32).toString('base64url');
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
  run('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)', digestToken(token), userId, Date.now() + 7 * 86400000);
  return token;
}
export function currentUser(request: Request): User | undefined {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('ilmora_session='))?.slice(15);
  if (!token) return;
  return one<User>('SELECT u.id,u.name,u.email,u.role,u.avatar FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', digestToken(token), Date.now());
}
export function deleteSession(request: Request) {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith('ilmora_session='))?.slice(15);
  if (token) run('DELETE FROM sessions WHERE token_hash=?', digestToken(token));
}
export function requireUser(request: Request, roles?: Role[]): User {
  const user = currentUser(request);
  check(user, 'Avval hisobingizga kiring.', 401);
  check(!roles || roles.includes(user.role), 'Bu amal uchun ruxsatingiz yo‘q.', 403);
  return user;
}
export function requireStudentAccess(adult: User, studentId: number) {
  check(adult.role === 'admin' || (adult.role === 'student' && adult.id === studentId) ||
    one('SELECT 1 FROM relations WHERE adult_id=? AND student_id=?', adult.id, studentId), 'Bu o‘quvchiga kirish taqiqlangan.', 403);
}
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const row = one('SELECT * FROM rate_limits WHERE key=?', key);
  if (!row || row.reset_at <= now) {
    run('INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=1,reset_at=excluded.reset_at', key, now + windowMs);
    return;
  }
  check(row.count < limit, 'So‘rovlar ko‘payib ketdi. Birozdan so‘ng qayta urinib ko‘ring.', 429);
  run('UPDATE rate_limits SET count=count+1 WHERE key=?', key);
}
export function textField(value: unknown, label: string, min = 1, max = 2000): string {
  check(typeof value === 'string', `${label} matn bo‘lishi kerak.`);
  const result = value.trim();
  check(result.length >= min && result.length <= max, `${label}: ${min}–${max} belgi kiriting.`);
  return result;
}
export function passwordField(value: unknown, min = 12): string {
  check(typeof value === 'string' && value.length >= min && value.length <= 128, `Parol ${min}–128 belgi bo‘lsin.`);
  return value;
}
export function integer(value: unknown, min = 1, max = Number.MAX_SAFE_INTEGER) {
  check(typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max, 'Son noto‘g‘ri.');
  return value;
}
