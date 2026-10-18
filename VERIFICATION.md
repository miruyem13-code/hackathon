# Tekshiruv natijalari

Sana: **2026-10-18**, Asia/Tashkent. Muhit: Windows, Node.js **24.18.0**, Next.js **16.4.2**, lokal Chrome. Tekshiruvlar amalda ishga tushirildi.

| Tekshiruv | Natija |
| --- | --- |
| `npm.cmd run setup` | O‘tdi: `.env.local`, tasodifiy demo parol, SQLite va seed yaratildi |
| `npm.cmd test` | **17 / 17 o‘tdi** |
| `npm.cmd run typecheck` | O‘tdi, TypeScript xatosi yo‘q |
| `npm.cmd run build` | O‘tdi, Origin/health tuzatishidan keyin qayta build qilindi |
| `npm.cmd run test:e2e` | **3 / 3 o‘tdi**, 30,7 soniya |
| Asosiy lokal baza | 4 demo hisob, 4 kurs, 8 modul, 24 dars, 120 slayd, 24 ta 5-savolli dars testi va 8 ta 10-savolli modul imtihoni (200 savol) |

## Server qoidalari

Parol hash’i va sessiya cookie’si, ochiq registratsiyadagi rol cheklovi, API ruxsatlari va Origin tekshiruvi, ota-ona/ustozning begona o‘quvchiga kira olmasligi tekshirildi. Dars va laboratoriya saqlanishi, server baholashi, javob kalitini yashirish, savol snapshot’i, deadline uzaymasligi, muddatdan keyingi javoblar va XP bir marta berilishi tekshirildi.

Focus uchun bitta faol sessiya, refresh, pause/resume, tanaffusga o‘tish, yashirin/harakatsiz heartbeat va uzoq tanaffusni faol vaqtga qo‘shmaslik tekshirildi. Timer sinovlari boshqariladigan vaqt bilan bajarildi; brauzer sinovida ham real refresh va pause/resume ishlatildi.

## Brauzer oqimlari

1. O‘quvchi kirishi → Focus → refresh/pause/resume → 5 slayd → laboratoriyada 6/8 = 75% → xulosani topshirish → test 100% → refreshda javob/natijaning saqlanishi → ota-onaning natija va xulosani ko‘rishi → savol → ustoz javobi → o‘quvchining javobni ko‘rishi. Yakuniy XP: 20 + 25 + 30 = 75.
2. Admin oddiy formada yangi kurs yaratishi; o‘quvchining `/admin` dan o‘z kabinetiga yo‘naltirilishi, admin API va rol oshirish so‘rovining 403 bilan rad etilishi.
3. Mobil landing → ochiq registratsiya → yangi o‘quvchi kabineti → mobil hisobdan chiqish → himoyalangan sahifaning login’ga qaytarishi.

1440 px desktop va 390 px mobil ekran ishlatildi. O‘quvchi dashboard’i, laboratoriya, ota-ona, admin va landing’da gorizontal overflow yo‘qligi tekshirildi. Mobil landing bezagining chiqib ketishi tuzatilib, yakuniy testda qayta tekshirildi.

SQLite natijalarining null-prototype obyektlarini React Client Component’ga uzatish xatosi brauzer sinovida topildi, DB yordamchisida oddiy obyektga aylantirish orqali tuzatildi va regressiya tekshiruvi qo‘shildi.

Qo‘shimcha tekshiruv 3000-portda eski `next start` serveri ishlab turganini ko‘rsatdi, shu sabab brauzer yangilangan manzil o‘rniga eskirgan backendga ulanayotgan edi. Next.js bo‘sh 3001-portga o‘tganida, Origin tekshiruvi yangi portdan kelgan POST so‘rovlarini 403 bilan rad etdi. Tekshiruv haqiqiy request host/port bilan moslashtirildi. Eskirgan loyiha serveri yangilangan production serverga almashtirildi. Build va typecheck qaytadan o‘tdi; **`npm.cmd run smoke -- http://localhost:3000`** muvaffaqiyatli yakunlandi: health, demo login, sessiya, kurslar, 5 slaydli dars, laboratoriya ulanishi va hisobot API’si ishladi. Production server hozir `http://127.0.0.1:3000` da ishga tushgan.

2026-10-18 yangilanishi: oldingi bazani o‘chirmasdan seed’ni kengaytirish tekshirildi; ingliz tili, web dasturlash va fizika kurslari qo‘shildi. Har biri 2 modul, 6 dars, 30 slayd, 6 test va 2 imtihondan iborat. Profil barcha rollarda yangilanadi, AI provider server tomondan chaqiriladi, matematika va fizika laboratoriyalari natijani bazaga yozadi. `npm.cmd test` — 17/17, `npm.cmd run typecheck` — muvaffaqiyatli, `npm.cmd run build` — muvaffaqiyatli. Smoke 4 kurs va 24 darsni tasdiqlaydi. Yangi Playwright ssenariysi student profilida qorong‘i rejim, refreshdan keyingi saqlanish, AI kalitsiz holat, 360 px fizika laboratoriyasi va overflow yo‘qligini tekshirdi; ssenariy `ok` bo‘ldi. Brauzer test runneri muvaffaqiyatli ssenariydan keyin server cleanup’da osilib qolganligi sabab qo‘lda to‘xtatildi.

Skrinshotlar: `artifacts/dashboard-desktop.png`, `artifacts/dashboard-mobile.png`, `artifacts/laboratory-mobile.png`, `artifacts/teacher-desktop.png`, `artifacts/admin-mobile.png`, `artifacts/landing-mobile.png`. HTML hisobot: `playwright-report/index.html`.

## Chegaralar

AI provayderi server API kaliti kiritilmaguncha ulanmaydi; providerning haqiqiy javobi mock orqali sinovdan o‘tdi, tashqi integratsiya kalit yo‘qligi sabab tekshirilmagan. Email/parol tiklash va ommaviy hosting hali tekshirilmagan. Ilova lokal ishlashga tayyor; hostingga chiqarishda doimiy SQLite diski va HTTPS kerak.
