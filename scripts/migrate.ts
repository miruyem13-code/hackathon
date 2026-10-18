import './env';
import { closeDatabase, databaseKind, migrateDatabase } from '../src/lib/db';
try {
  await migrateDatabase();
  console.log(databaseKind() + ' migratsiyasi muvaffaqiyatli bajarildi.');
} finally { await closeDatabase(); }
