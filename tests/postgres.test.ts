// Run the same real API/business-flow suite against PostgreSQL, not a SQLite mock.
import { PGlite } from '@electric-sql/pglite';
import type { Pool } from 'pg';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { all, one, run, transaction, migrateDatabase, createPostgresConnection, installTestDatabase } from '../src/lib/db';
import { rateLimit } from '../src/lib/auth';
import { GET } from '../src/app/api/[...path]/route';
import { NextRequest } from 'next/server';
Object.assign(process.env, {NODE_ENV:'test'});
const engine = new PGlite();
const client = {
  async query(sql: string, params?: any[]) {
    const result = params === undefined ? (await engine.exec(sql)).at(-1)! : await engine.query(sql,params);
    return {rows:result.rows, rowCount:result.affectedRows ?? result.rows.length};
  }
};
const raw = createPostgresConnection(client as unknown as Pick<Pool,'query'>);
let queue = Promise.resolve();
async function acquire() {
  const previous=queue;
  let release!:()=>void;
  queue=new Promise<void>(done=>{release=done;});
  await previous;
  return release;
}
installTestDatabase({
  ...raw, kind:'postgresql',
  async query(...args) {const release=await acquire();try{return await raw.query(...args);}finally{release();}},
  async exec(sql) {const release=await acquire();try{await raw.exec(sql);}finally{release();}},
  async connect(){return {...raw,release:await acquire()};},
  async close(){await engine.close();}
});
await migrateDatabase();
await import('./core.test');

test('PostgreSQL migratsiyasi qayta ishlaganda ma’lumotlar saqlanadi',async()=>{
  const before=await all('SELECT id FROM users');
  await migrateDatabase();
  assert.deepEqual(await all('SELECT id FROM users'),before);
});
test('PostgreSQL tranzaksiya xatosida yarim yozuvlarni rollback qiladi',async()=>{
  await assert.rejects(transaction(async()=>{
    await run('INSERT INTO courses(title,description,subject) VALUES(?,?,?)','Rollback kursi','Sinov kontenti','Sinov');
    throw new Error('rollback-test');
  }),/rollback-test/);
  assert.equal(await one('SELECT id FROM courses WHERE title=?','Rollback kursi'),undefined);
});
test('PostgreSQL email unique indeksi katta/kichik harfni ajratmaydi',async()=>{
  await assert.rejects(run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)','Duplicate','STUDENT@ILMORA.LOCAL','unused','student',Date.now()),(e:any)=>e.code==='23505');
});
test('PostgreSQL rate limit bir oynadagi so‘rovlarni atomik chegaralaydi',async()=>{
  const results=await Promise.allSettled(Array.from({length:8},()=>rateLimit('postgres-rate-test',3,60000)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,3);
  assert.equal(results.filter(r=>r.status==='rejected').length,5);
});
test('Health PostgreSQL ulanishi va schema tayyorligini tekshiradi',async()=>{
  const response=await GET(new NextRequest('http://localhost:3000/api/health'),{params:Promise.resolve({path:['health']})});
  assert.equal(response.status,200);
  assert.equal((await response.json()).database,'postgresql');
});
