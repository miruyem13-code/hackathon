import './env';
import { closeDatabase, DatabaseConfigurationError, migrateDatabase } from '../src/lib/db';
import { seedContent } from '../src/lib/seed';
try {
  if (!process.env.DATABASE_URL) throw new DatabaseConfigurationError();
  await migrateDatabase();
  await seedContent();
  console.log('PostgreSQL kurs kontenti tayyor. Demo hisoblar yaratilmagan.');
} finally { await closeDatabase(); }
