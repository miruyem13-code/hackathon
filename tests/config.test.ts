import { test,after } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/[...path]/route';
import { closeDatabase } from '../src/lib/db';
Object.assign(process.env, {NODE_ENV:'test'});
process.env.VERCEL='1';
delete process.env.DATABASE_URL;
after(async()=>{await closeDatabase();});
test('Vercel DATABASE_URL bo‘lmasa lokal faylga yozmay, aniq 503 beradi',async()=>{
  const response=await GET(new NextRequest('https://ilmora.example/api/health'),{params:Promise.resolve({path:['health']})});
  assert.equal(response.status,503);
  assert.match((await response.json()).error,/DATABASE_URL/);
});
