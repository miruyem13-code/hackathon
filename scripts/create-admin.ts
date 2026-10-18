import './env';
import { check, hashPassword } from '../src/lib/auth';
import { one, run, closeDatabase } from '../src/lib/db';
try {
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';
check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'ADMIN_EMAIL kiriting.');
check(password.length >= 12, 'ADMIN_PASSWORD kamida 12 belgi bo‘lsin.');
check(!(await one('SELECT id FROM users WHERE email=?', email)), 'Bu email allaqachon mavjud.');
(await run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)', process.env.ADMIN_NAME || 'Administrator', email, hashPassword(password), 'admin', Date.now()));
console.log('Administrator yaratildi:', email);

} finally { await closeDatabase(); }
