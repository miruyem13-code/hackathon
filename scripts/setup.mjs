import { existsSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
if (process.env.NODE_ENV === 'production') throw new Error('Lokal demo sozlamasi production uchun emas.');
if (!existsSync('.env.local')) {
  writeFileSync('.env.local', `DATABASE_PATH=./data/ilmora.sqlite\nAPP_ORIGIN=http://localhost:3000\nDEMO_PASSWORD=${randomBytes(18).toString('base64url')}\n`, {flag:'wx',mode:0o600});
  console.log('.env.local yaratildi. Demo parolingiz DEMO_PASSWORD qatorida.');
}
const result=spawnSync(process.execPath,['--import','tsx','scripts/seed.ts'],{stdio:'inherit',env:process.env});
process.exit(result.status??1);
