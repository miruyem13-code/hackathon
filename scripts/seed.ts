import './env';
import { seedContent, seedDemo } from '../src/lib/seed';
seedContent();
if (process.env.NODE_ENV === 'production') console.log('Kurs kontenti kiritildi. Production uchun demo hisoblar yaratilmaydi.');
else {
  seedDemo(process.env.DEMO_PASSWORD || '');
  console.log('Demo tayyor: student@ilmora.local, parent@ilmora.local, teacher@ilmora.local, admin@ilmora.local. Parol: DEMO_PASSWORD qiymati.');
}
