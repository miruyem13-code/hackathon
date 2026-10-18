import './env';
import { closeDatabase, migrateDatabase } from '../src/lib/db';
import { seedContent, seedDemo } from '../src/lib/seed';
try {
  await migrateDatabase();
  if (process.env.NODE_ENV === 'production') {
    await seedContent();
    console.log('Kurs kontenti kiritildi. Demo hisoblar yaratilmaydi.');
  } else {
    await seedDemo(process.env.DEMO_PASSWORD || '');
    console.log('Demo tayyor. Parol .env.local dagi DEMO_PASSWORD qiymati.');
  }
} finally { await closeDatabase(); }
