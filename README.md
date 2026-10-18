# ILMORA — Zamonaviy ta’lim

Node.js 24, Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 va **SQLite** bilan ishlaydigan lokal ta’lim platformasi. Backend Next.js’ning Node.js API route’larida ishlaydi; SQLite uchun Node.js’ning ichki `node:sqlite` moduli ishlatiladi. Tashqi hisob yoki database xizmati talab qilinmaydi.

## Tez ishga tushirish

Terminalni loyiha papkasida oching:

```powershell
npm.cmd install
npm.cmd run setup
npm.cmd run dev
```

Brauzer: **http://localhost:3000**.

Port band bo‘lgani uchun Next.js boshqa port (masalan, 3001) tanlasa, terminal ko‘rsatgan `Local` manzilni oching. Serverda portni o‘zgartirish bilan birga Origin tekshiruvi ham o‘sha manzilni qabul qiladi.

Bir loyiha uchun `next start` eski oynada ishlab turgan bo‘lsa, uni o‘sha terminalda `Ctrl+C` bilan to‘xtating. Keyin faqat `npm.cmd run dev`ni ishga tushirib, terminal ko‘rsatgan `Local` manzilni oching. Eski production server ishlab turganida dev server avtomatik boshqa portni tanlaydi.

`setup` mavjud bo‘lmasa `.env.local` yaratadi, tasodifiy 24 belgili demo parolini yozadi, migratsiyani bajaradi va kurs/demo hisoblarni bazaga kiritadi. **Demo parol `.env.local` faylidagi `DEMO_PASSWORD` qiymati.** Parol kodga kiritilmagan. Mavjud konfiguratsiya yoki hisob parollari qayta yozilmaydi. Bu buyruq faqat lokal ishlab chiqish uchun.

PowerShell `npm.ps1` faylini bloklasa, yuqoridagi kabi `npm.cmd` ishlating. Boshqa terminallarda `npm` ham ishlaydi.

| Hisob | Email | Kabinet |
| --- | --- | --- |
| O‘quvchi | `student@ilmora.local` | `/student` |
| Ota-ona | `parent@ilmora.local` | `/parent` |
| Ustoz | `teacher@ilmora.local` | `/teacher` |
| Administrator | `admin@ilmora.local` | `/admin` |

Demo hisoblarning barchasi `.env.local` dagi `DEMO_PASSWORD` bilan kiradi. Ota-ona va ustoz demo o‘quvchiga oldindan ishonchli seed orqali bog‘langan. Ochiq registratsiya faqat o‘quvchi yaratadi.

## Qo‘lda sozlash va migratsiya

`.env.example` ni `.env.local` ga nusxalang. `DEMO_PASSWORD` ga kamida 12 belgili yangi parol yozing:

```powershell
npm.cmd run db:migrate
npm.cmd run db:seed
```

Migratsiya: `database/001_initial.sql`. Kontent va xavfsiz demo seed: `src/lib/seed.ts`. Qayta ishga tushirish mavjud kurs va hisoblarni ko‘paytirmaydi. Seed mavjud hisoblarning parolini almashtirmaydi.

## Taqdimot uchun oqim

1. O‘quvchi bilan kiring. Focus’da maqsad yozib, darsni tanlang va 25 daqiqali sessiyani boshlang. Pauza/davom etish va sahifani yangilashni sinang.
2. «O‘rganishni davom ettirish» orqali `/lessons/1` ni oching. 5 slaydni o‘qib «Darsni tugatish»ni bosing.
3. «Laboratoriya»da matematika uchun 3/4 va 6/8 ni tekshiring yoki fizika kursida masofa-vaqt simulyatorini bajaring; xulosani ustozga yuboring.
4. «Test va imtihon»da 5 savolli dars testini yoki mini imtihonni ishlang. Xato javoblarning izohi yakunlagandan keyin chiqadi. Qayta urinish mumkin.
5. Ota-onani boshqa brauzer profilida oching: dars, baho, laboratoriya va Focus tarixi ko‘rinadi.
6. O‘quvchidan «Ustozga savol» yuboring. Biriktirilgan ustoz bilan kirib javob yozing. O‘quvchi kabinetida javobni tekshiring.
7. Administrator kabinetida kurs → modul → dars → test → savol tartibida yangi kontent yarating yoki mavjudini tahrirlang. «Bog‘lanishlar» bo‘limida ota-ona/ustoz yaratish va o‘quvchini biriktirish mumkin.

## Ishlaydigan imkoniyatlar

- 4 ta to‘liq demo kursi: Matematika (kasrlar va foizlar), Ingliz tili (kundalik muloqot), IT (HTML/CSS) va Fizika (harakat va kuch). Har kursda 2 modul, jami 6 dars; har dars 5 slayd va 5 savolli testdan, har modul 10 savolli imtihondan iborat. Jami 24 dars, 120 slayd, 24 dars testi va 8 modul imtihoni. Seed takror ishlatilsa kontent dublikat qilinmaydi.
- Student, parent, teacher va admin uchun alohida kabinet va haqiqiy server ruxsatlari; begona o‘quvchiga API orqali ham kirish cheklangan.
- Salt bilan `scrypt` parol hash’i; tasodifiy server sessiyasi, bazada tokenning SHA-256 hash’i; HttpOnly/SameSite cookie, production’da Secure; login so‘rovlariga limit va Origin tekshiruvi.
- Serverda baholash, savollar snapshot’i, test deadline’i, javoblarni muddat tugashidan oldin bazaga avtomatik saqlash. Refresh imtihonni uzaytirmaydi; kech javoblar hisoblanmaydi. Javob kaliti faqat yakunlangan urinish izohida ochiladi.
- Dars: 20 XP, laboratoriya: 25 XP, test: 30 XP, imtihon: 50 XP. Har manba uchun faqat bir marta; test/imtihon uchun kamida 60% talab etiladi. Focus uchun XP yo‘q.
- Dars progressi, natijalar, kasr va harakat laboratoriyasi xulosalari, profil ismi/avatari va savol-javob bazada saqlanadi. Har bir rol o‘z profilini tahrirlaydi.
- Qorong‘i/yorug‘ ko‘rinish kabinetlarda ishlaydi va tanlov qurilmada eslab qolinadi; mobil menyu 360 px ekranlarda moslashadi.
- Focus: maqsad, bog‘langan dars, start/pause/resume/finish. 25 daqiqa tugaganda avtomatik 5 daqiqali tanaffus. Har o‘quvchiga bittadan faol sessiya bazadagi unique index bilan kafolatlanadi.
- Deadline asosidagi countdown va taxminiy faol o‘qish soniyasi alohida. Heartbeat har 10 soniyada; yashirin yoki 60 soniya harakatsiz tab faol vaqtga qo‘shilmaydi. 15 soniyadan uzoq heartbeat oralig‘i sanalmaydi. Bu o‘quvchi faoliyatining taxmini, imtihon nazorati vositasi emas.
- Diqqat rejimi ichki yon panel va chalg‘ituvchi yordamchi bloklarni yashiradi.
- Mobil menyu, moslashuvchan dars/laboratoriya/test/admin formalari. Barcha mahsulot matnlari o‘zbekcha.

## Administrator yaratish

Demo hisoblarisiz muhitda `.env.local` yoki server muhiti orqali quyidagilarni belgilang:

```dotenv
ADMIN_EMAIL=your-admin@example.uz
ADMIN_PASSWORD=<kamida 12 belgili yangi maxfiy parol>
ADMIN_NAME=Administrator
```

```powershell
npm.cmd run admin:create
```

Mavjud email qayta yozilmaydi. Keyin `/login` orqali kirib `/admin` → «Bog‘lanishlar»dan ota-ona va ustoz yarating. Student ochiq registratsiyadan ro‘yxatdan o‘tadi; uni administrator tasdiqlab biriktiradi.

## Production

```powershell
npm.cmd run build
npm.cmd run start
```

**Doimiy diskli Node.js server kerak.** `DATABASE_PATH` ni yozish mumkin bo‘lgan doimiy diskka qo‘ying. SQLite fayli, `-wal` va `-shm` fayllari runtime ma’lumotlaridir; Git’ga kiritilmaydi. Vaqtinchalik serverless diskda yoki Vercel Functions’da doimiy saqlanish kafolatlanmaydi. Bu versiya Sites/Cloudflare Workers uchun mo‘ljallanmagan va hostingga joylashtirilmagan.

`APP_ORIGIN` ni haqiqiy HTTPS domeningizga o‘rnating. Production’da Secure cookie ishlagani uchun ommaviy serverni HTTPS reverse proxy ortida ishlating. `next start` va `next dev` lokal xavfsiz ishlatish uchun `127.0.0.1` ga bog‘langan; reverse proxy shu portga yo‘naltirsin. Kurs kontentini production’da kiritish uchun `NODE_ENV=production` bilan `db:seed` ishlating: demo hisoblar yaratilmaydi. `DEMO_PASSWORD` ni production muhitiga qo‘ymang.

Bitta Node.js server jarayoni/doimiy disk uchun mo‘ljallangan. Bir nechta serverga o‘tishdan oldin umumiy PostgreSQL kabi saqlashga ko‘chirish kerak. Zaxira olishda serverni to‘xtating va SQLite bazasini nusxalang yoki SQLite’ning muvofiqlashtirilgan backup vositasidan foydalaning.

## Tekshiruvlar

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd run build
npm.cmd run test:e2e
```

Ishlayotgan server backendini amalda tekshirish uchun `npm.cmd run smoke` buyrug‘ini bajaring. U SQLite ulanishi, demo login/session, kurs, dars, laboratoriya bog‘lanishi va hisobot API’sini ko‘radi, javoblarni yoki progressni o‘zgartirmaydi. Port avtomatik o‘zgargan bo‘lsa:

```powershell
npm.cmd run smoke -- http://localhost:3001
```

- `tests/core.test.ts`: 14 ta test — login/cookie/hash, rol/CSRF, registratsiyada rol oshirishning oldini olish, ota-ona izolyatsiyasi, dars/lab, server baholashi, vaqt tugashi, XP idempotentligi, Focus pause/resume/yagona sessiya/heartbeat, teacher javobi va admin ruxsatlari.
- `tests/browser/flow.spec.ts`: haqiqiy production serverga qarshi brauzer sinovlari; Focus refresh/pause, dars → lab → test, javoblarning refreshdan tiklanishi, ota-ona ko‘rishi, ustoz javobi, admin formasi va ruxsatlar. Desktop 1440px va mobil 390px holatlari, gorizontal overflow tekshiruvi.
- E2E alohida tasodifiy parol va `data/e2e-*.sqlite` bazasidan foydalanadi. Asosiy bazani o‘zgartirmaydi. Server test tugagach yopiladi. Skrinshotlar: `artifacts/`; hisobot: `playwright-report/`.
- Windows’da o‘rnatilgan Chrome avtomatik ishlatiladi. Chrome bo‘lmasa `npx.cmd playwright install chromium` ishlating. Boshqa tizimlarda ham Playwright Chromium talab qilinadi.

Haqiqiy tekshiruv natijalari `VERIFICATION.md` da qayd etiladi.

## Sozlama kutayotgan va keyingi ishlar

**AI ixtiyoriy sozlanadi.** `.env.local` fayliga `AI_API_KEY` kiriting; kerak bo‘lsa `AI_API_URL` (OpenAI-compatible Chat Completions endpoint) va `AI_MODEL` ni ham belgilang, so‘ng serverni qayta ishga tushiring. Kalit faqat serverda qoladi. Yordamchi joriy dars slaydlari va test xatolaridan kontekst oladi, soatiga 15 so‘rov bilan cheklanadi va faol modul imtihonida bloklanadi. Kalit bo‘lmasa interfeys ulangan deb ko‘rsatmaydi. Har qanday generativ AI ba’zan xato qilishi mumkin; muhim javobni dars materiali yoki ustoz bilan tekshiring.

Keyingi bosqich: email tasdiqlash/parol tiklash, bildirishnomalar, audit jurnali, katta kontent kutubxonasi va ko‘p serverli deploy. Murakkab do‘kon, turnir va nishonlar MVP doirasiga kiritilmagan.

## Papkalar

```text
database/             SQLite migratsiyasi
scripts/              Setup, migratsiya, seed va admin CLI
src/app/              Sahifalar va Node.js API route
src/components/       Kabinetlar, dars, laboratoriya, test va Focus
src/lib/              Baza, ruxsatlar, baholash va Focus qoidalari
tests/                Server qoidalari va brauzer tekshiruvlari
```
