import { all, one, run, transaction, databaseKind, synchronizeIdentitySequences } from './db';
import { hashPassword, check } from './auth';
import { professionalLessonContent } from './lesson-content';
export async function seedContent() {
    return transaction(async () => {
        if(databaseKind() === 'postgresql') await one('SELECT pg_advisory_xact_lock(124223020)');
    if ((await one('SELECT id FROM courses LIMIT 1'))) {
        (await seedRemainingContent());
        (await seedAdditionalCourses());
        (await applyProfessionalLessonContent());
        return;
    }
    (await transaction(async () => {
        (await run('INSERT INTO courses(id,title,description,subject,color) VALUES(1,?,?,?,?)', 'Kasrlar va foizlar', 'Butunning bo‘laklaridan kundalik hisob-kitoblargacha. Ko‘ring, sinab ko‘ring va o‘zingizni tekshiring.', 'Matematika', 'orange'));
        const modules = [
            { title: 'Kasrlar olamiga sayohat', lesson: 'Butunning bir bo‘lagi', desc: 'Kasrni tushuning, taqqoslang va shakllarda ko‘ring.', lab: 'fraction', slides: [
                    { title: 'Bir butun, ko‘p imkoniyat', body: 'Pitsani 4 ta teng bo‘lakka bo‘ldik. Bitta bo‘lak — butunning to‘rtdan biri. Buni 1/4 deb yozamiz. Kasrlar butunning teng qismlarini ifodalaydi.', example: '1 ta bo‘lak / 4 ta teng bo‘lak = 1/4', numerator: 1, denominator: 4 },
                    { title: 'Surat va maxraj bilan tanishing', body: 'Kasr chizig‘i ustidagi son — surat: nechta bo‘lak olingani. Pastidagi son — maxraj: butun nechta teng bo‘lakka bo‘lingani. Maxraj nol bo‘la olmaydi.', example: '3/8 da surat 3, maxraj 8.', numerator: 3, denominator: 8 },
                    { title: 'Turlicha yozuv, bir xil qiymat', body: 'Surat va maxrajni bir xil noldan farqli songa ko‘paytirsak yoki bo‘lsak, kasrning qiymati o‘zgarmaydi. Bular teng kasrlardir.', example: '1/2 = 2/4 = 4/8', numerator: 4, denominator: 8 },
                    { title: 'Qaysi kasr kattaroq?', body: 'Maxrajlar bir xil bo‘lsa, surati katta kasr kattaroq. Suratlar bir xil bo‘lsa, maxraji kichik kasr kattaroq: butun kamroq, lekin yirikroq qismlarga bo‘lingan.', example: '3/4 > 1/4 va 1/2 > 1/4', numerator: 3, denominator: 4 },
                    { title: 'Kasrlarni qo‘shib ko‘ramiz', body: 'Maxrajlar teng bo‘lsa, suratlarni qo‘shamiz, maxraj o‘zgarmaydi. Natijani mumkin bo‘lsa qisqartiramiz. Endi laboratoriyada 3/4 butunning qancha qismini egallashini tekshiring.', example: '1/4 + 2/4 = 3/4', numerator: 3, denominator: 4 }
                ] },
            { title: 'Foizlar kundalik hayotda', lesson: 'Yuzdan bir ulush', desc: 'Foiz, chegirma va oddiy hayotiy masalalar.', lab: null, slides: [
                    { title: 'Foiz nima o‘zi?', body: 'Foiz — yuzdan bir ulush. 1% = 1/100. 100% — bir butun. Masalan, sinfdagi 100 kitobning 25 tasi ertak bo‘lsa, kitoblarning 25 foizi ertak.', example: '25% = 25/100 = 1/4', numerator: 1, denominator: 4 },
                    { title: 'Kasrdan foizga', body: 'Kasrni foizga aylantirish uchun suratni maxrajga bo‘lib, 100 ga ko‘paytiramiz. Yarim butun doim 50 foizga teng.', example: '3/4 × 100 = 75%', numerator: 3, denominator: 4 },
                    { title: 'Sonning foizini topamiz', body: 'Sonning berilgan foizini topish uchun sonni foizga ko‘paytirib, 100 ga bo‘lamiz. 200 ta olmaning 10 foizi: 200 × 10 / 100 = 20 ta olma.', example: '200 ning 10% i = 20', numerator: 1, denominator: 10 },
                    { title: 'Chegirmani hisoblaymiz', body: '100 000 so‘mlik kitobga 20% chegirma bo‘lsa, chegirma 20 000 so‘m. Yangi narxni topish uchun boshlang‘ich narxdan chegirmani ayiramiz.', example: '100 000 − 20 000 = 80 000 so‘m', numerator: 8, denominator: 10 },
                    { title: 'Bilimingizni hayotga tatbiq qiling', body: 'Foizlar chegirma, natija va o‘sishni ifodalaydi. 20 savoldan 15 tasini to‘g‘ri yechsangiz, 15/20 × 100 = 75% natijaga erishasiz. Endi testda o‘zingizni sinang!', example: '15/20 = 0,75 = 75%', numerator: 3, denominator: 4 }
                ] }
        ];
        const sets = [
            [
                ['1/4 kasrida maxraj qaysi son?', ['1', '4', '5', '0'], 1, 'Maxraj kasr chizig‘i ostidagi son. U butun nechta teng bo‘lakka bo‘linganini bildiradi.'],
                ['1/2 ga teng kasrni toping.', ['1/4', '2/4', '3/4', '2/3'], 1, '1/2 ning surat va maxrajini 2 ga ko‘paytirsak, 2/4 hosil bo‘ladi.'],
                ['2/5 + 1/5 = ?', ['3/10', '1/5', '3/5', '2/10'], 2, 'Maxraj bir xil: suratlarni qo‘shamiz. (2 + 1)/5 = 3/5.'],
                ['Qaysi kasr kattaroq?', ['1/8', '1/4', '1/2', 'Barchasi teng'], 2, 'Bir butun 2 ga bo‘linsa, har bir bo‘lak 4 yoki 8 ga bo‘lingandagidan kattaroq.'],
                ['Pitsaning 8 bo‘lagidan 3 tasi olindi. Bu qaysi kasr?', ['8/3', '3/8', '5/8', '3/5'], 1, 'Olingan qismlar suratga (3), barcha teng bo‘laklar maxrajga (8) yoziladi.']
            ],
            [
                ['50% qaysi kasrga teng?', ['1/4', '1/2', '3/4', '1/5'], 1, '50/100 ni 50 ga qisqartirsak, 1/2 hosil bo‘ladi.'],
                ['200 ning 10% i qancha?', ['10', '40', '20', '100'], 2, '200 × 10 / 100 = 20.'],
                ['3/4 necha foiz?', ['25%', '50%', '75%', '100%'], 2, '3 ni 4 ga bo‘lib, 100 ga ko‘paytiramiz: 75%.'],
                ['100 000 so‘mlik kitob 20% chegirmada qancha turadi?', ['20 000', '80 000', '120 000', '90 000'], 1, 'Chegirma 20 000 so‘m. 100 000 − 20 000 = 80 000 so‘m.'],
                ['20 savoldan 15 tasi to‘g‘ri. Natija necha foiz?', ['15%', '20%', '50%', '75%'], 3, '15/20 × 100 = 75%.']
            ]
        ];
        const examSets = [
            [
                ['3/7 kasrida surat qaysi?', ['7', '3', '10', '4'], 1, 'Surat kasr chizig‘i ustidagi 3 sonidir.'],
                ['2/6 ni qisqartiring.', ['1/3', '1/6', '2/3', '3/6'], 0, 'Surat va maxrajni 2 ga bo‘lamiz: 2/6 = 1/3.'],
                ['4/9 + 2/9 = ?', ['6/18', '2/9', '6/9', '8/9'], 2, 'Maxraj o‘zgarmaydi, 4 + 2 = 6. Javob 6/9.'],
                ['Qaysi biri 2/5 dan katta?', ['1/5', '3/5', '1/10', '0/5'], 1, 'Maxraj teng bo‘lsa, surati katta bo‘lgan kasr kattaroq.'],
                ['6 teng bo‘lakning 5 tasi bo‘yaldi. Bo‘yalmagan qism?', ['5/6', '6/5', '1/6', '1/5'], 2, '6 − 5 = 1 ta bo‘lak qolgan. Bu butunning 1/6 qismi.']
            ],
            [
                ['1% nimani bildiradi?', ['O‘ndan bir', 'Yuzdan bir', 'Yarim', 'Bir butun'], 1, 'Foiz yuzdan bir ulushni bildiradi: 1% = 1/100.'],
                ['80 ning 25% ini toping.', ['10', '15', '20', '25'], 2, '80 × 25 / 100 = 20.'],
                ['1/5 ni foizga aylantiring.', ['5%', '10%', '20%', '50%'], 2, '1/5 = 0,2. Uni 100 ga ko‘paytirsak 20% bo‘ladi.'],
                ['50 000 so‘mning 10% chegirmali narxi?', ['40 000', '45 000', '5 000', '55 000'], 1, '10% = 5 000 so‘m. 50 000 − 5 000 = 45 000.'],
                ['10 masaladan 8 tasi to‘g‘ri. Natija?', ['8%', '20%', '80%', '90%'], 2, '8/10 × 100 = 80%.']
            ]
        ];
        (await Promise.all(modules.map(async (m, i) => {
            const id = i + 1;
            (await run('INSERT INTO modules(id,course_id,title,position) VALUES(?,1,?,?)', id, m.title, id));
            (await run('INSERT INTO lessons(id,module_id,title,description,slides_json,lab_type) VALUES(?,?,?,?,?,?)', id, id, m.lesson, m.desc, JSON.stringify(m.slides), m.lab));
            (await Promise.all(['test', 'exam'].map(async (kind, k) => {
                const aid = i * 2 + k + 1;
                (await run('INSERT INTO assessments(id,lesson_id,module_id,title,kind,duration_seconds) VALUES(?,?,?,?,?,?)', aid, k === 0 ? id : null, id, `${m.title} — ${k === 0 ? 'dars testi' : 'mini imtihon'}`, kind, k === 0 ? 600 : 300));
                const items = k === 0 ? sets[i] : examSets[i];
                (await Promise.all(items.map(async (q) => (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', aid, q[0] as string, JSON.stringify(q[1]), q[2] as number, q[3] as string)))));
            })));
        })));
    }));
    await synchronizeIdentitySequences();
    (await seedRemainingContent());
    (await seedAdditionalCourses());
    (await applyProfessionalLessonContent());
    });
}
// Apply the authored curriculum once per lesson so database seeding remains safe
// for learner progress and later teacher edits.
async function applyProfessionalLessonContent() {
    (await transaction(async () => {
        (await run('CREATE TABLE IF NOT EXISTS lesson_content_versions (lesson_id INTEGER PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE, version INTEGER NOT NULL)'));
        for (const [title, content] of Object.entries(professionalLessonContent)) {
            const row = (await one<{
                id: number;
            }>('SELECT id FROM lessons WHERE title=? ORDER BY id LIMIT 1', title));
            if (!row)
                continue;
            const version = (await one<{
                version: number;
            }>('SELECT version FROM lesson_content_versions WHERE lesson_id=?', row.id));
            if (version?.version && version.version >= 2)
                continue;
            (await run('UPDATE lessons SET description=?, slides_json=? WHERE id=?', content.description, JSON.stringify(content.slides), row.id));
            (await run('INSERT INTO lesson_content_versions(lesson_id,version) VALUES(?,2) ON CONFLICT(lesson_id) DO UPDATE SET version=excluded.version', row.id));
        }
    }));
}
type ContentQuestion = [
    string,
    string[],
    number,
    string
];
async function seedAdditionalCourses() {
    const curricula = [
        {
            title: 'Ingliz tili: kundalik muloqot', subject: 'Ingliz tili', color: 'blue',
            modules: [
                { title: 'Salomlashuv va tanishuv', lessons: [
                        ['Salomlashish iboralari', 'Ingliz tilida salomlashish va xayrlashishning odobli shakllari.', 'Hi — do‘stona salom; Hello — betaraf salom; Good morning — ertalabki salom.', 'Hello! Good morning!', 'HELLO', 'Salomlashuvning odobli betaraf shakli qaysi?', ['Hello', 'Goodbye', 'Thanks', 'Please'], 0, 'Hello salomlashish uchun ishlatiladi.'],
                        ['O‘zingizni tanishtiring', 'Ism aytish, qayerdan ekaningizni bildirish va suhbatdoshdan so‘rash.', 'My name is Ali. I am from Tashkent. What is your name?', 'My name is Malika.', 'MY NAME', 'Ismni aytish uchun qaysi ibora ishlatiladi?', ['My name is…', 'How old are…', 'See you…', 'Good night'], 0, 'My name is… — Mening ismim… degani.'],
                        ['Hol-ahvol so‘rash', 'How are you? savoliga sodda va tabiiy javob berish.', 'How are you? — I’m fine, thank you. And you?', 'I’m fine, thank you.', 'HOW ARE YOU?', 'How are you? savoliga mos javobni tanlang.', ['I’m fine, thank you.', 'My name is Sam.', 'Good night.', 'I am from here.'], 0, 'Bu ibora hol-ahvol so‘rashga javob beradi.']
                    ], quiz: [
                        ['“Xayrli tong” inglizchada qanday?', ['Good morning', 'Good night', 'Goodbye', 'Good afternoon'], 0, 'Good morning ertalab salomlashganda ishlatiladi.'],
                        ['“Mening ismim Lola”ni toping.', ['I am fine.', 'My name is Lola.', 'Where are you?', 'See you Lola.'], 1, 'My name is… o‘zini tanishtirish uchun ishlatiladi.'],
                        ['“How are you?” nimani so‘raydi?', ['Ismingiz nima?', 'Qayerdansiz?', 'Ahvolingiz qalay?', 'Yoshingiz nechada?'], 2, 'How are you? — Ahvolingiz qalay?'],
                        ['“Thank you” ma’nosi nima?', ['Iltimos', 'Rahmat', 'Salom', 'Xayr'], 1, 'Thank you — rahmat.'],
                        ['Suhbatni xayrlashib tugatish iborasi qaysi?', ['Hello', 'Please', 'Goodbye', 'Welcome'], 2, 'Goodbye xayrlashish uchun ishlatiladi.']
                    ] as ContentQuestion[], exam: [
                        ['“Salom”ning keng tarqalgan shakli qaysi?', ['Hello', 'Thanks', 'Sorry', 'Please'], 0, 'Hello — salom.'], ['“Xayrli kech” iborasi?', ['Good morning', 'Good evening', 'Goodbye morning', 'Thank evening'], 1, 'Good evening kechki salomlashuv.'], ['Ismni so‘rash iborasi?', ['What is your name?', 'How are you?', 'Where is it?', 'How old is it?'], 0, 'What is your name? — Ismingiz nima?'], ['“Men Toshkentdanman”ni toping.', ['I from Tashkent.', 'I am from Tashkent.', 'I is Tashkent.', 'My from Tashkent.'], 1, 'I am from… grammatik jihatdan to‘g‘ri.'], ['“Please” nimani anglatadi?', ['Rahmat', 'Iltimos', 'Xayr', 'Salom'], 1, 'Please — iltimos.'], ['“I’m fine” ma’nosi?', ['Men yaxshiman', 'Men ketdim', 'Mening ismim', 'Men charchadim'], 0, 'I’m fine — Men yaxshiman.'], ['Suhbatdoshga qayta savol berish?', ['And you?', 'Good night?', 'Thank you?', 'Goodbye?'], 0, 'And you? — Siz-chi?'], ['Kechasi xayrlashish iborasi?', ['Good morning', 'Good night', 'Good afternoon', 'Hello'], 1, 'Good night — xayrli tun.'], ['“Nice to meet you” qachon aytiladi?', ['Tanishganda', 'Ovqat buyurganda', 'Xayrlashganda', 'Yo‘l so‘raganda'], 0, 'Bu ibora tanishganidan xursandlikni bildiradi.'], ['Xushmuomalalik bilan iltimos qilishda?', ['Please', 'Bye', 'No', 'Name'], 0, 'Please iltimosni odobli qiladi.']
                    ] as ContentQuestion[] },
                { title: 'Kundalik hayot va maktab', lessons: [
                        ['Maktab buyumlari', 'Sinfdagi tanish buyumlarni inglizcha nomlash.', 'book — kitob; pen — ruchka; desk — parta; board — doska.', 'This is my book.', 'A BOOK', '“Ruchka” so‘zining inglizcha tarjimasi?', ['pen', 'desk', 'board', 'bag'], 0, 'Pen — ruchka.'],
                        ['Present Simple: odatlar', 'Doimiy odatlar va takrorlanadigan ishlar uchun Present Simple ishlatiladi.', 'I study every day. They play after school.', 'We read books every week.', 'EVERY DAY', 'Doimiy odatni ifodalovchi gapni toping.', ['I am reading now.', 'I study every day.', 'I studied yesterday.', 'I will study tomorrow.'], 1, 'Every day takroriy odatni bildiradi.'],
                        ['He / She bilan fe’l', 'He yoki She bilan Present Simple’da fe’lga odatda -s qo‘shiladi.', 'I play, but she plays. He reads.', 'She studies English.', 'HE / SHE + S', 'To‘g‘ri shaklni tanlang.', ['He play football.', 'He plays football.', 'He playing football.', 'He are play football.'], 1, 'He bilan plays shakli ishlatiladi.']
                    ], quiz: [
                        ['“Kitob” inglizchada?', ['book', 'desk', 'pen', 'door'], 0, 'Book — kitob.'], ['Present Simple nimaga ishlatiladi?', ['Odatlarga', 'Faqat hozir sodir bo‘layotgan ishga', 'Faqat o‘tgan zamonga', 'Buyruqqa'], 0, 'Present Simple odat va umumiy haqiqatlarni ifodalaydi.'], ['She bilan to‘g‘ri fe’l shakli?', ['read', 'reads', 'reading', 'are read'], 1, 'She bilan fe’lga odatda -s qo‘shiladi.'], ['“Ular maktabda o‘qiydi”ni toping.', ['They study at school.', 'They studies school.', 'They studying.', 'They is study.'], 0, 'They ko‘plik bo‘lgani uchun study ishlatiladi.'], ['“Every day” nimani bildiradi?', ['Har kuni', 'Kecha', 'Hozir', 'Ertaga'], 0, 'Every day — har kuni.']
                    ] as ContentQuestion[], exam: [
                        ['“Doska” tarjimasi?', ['board', 'book', 'bag', 'desk'], 0, 'Board — doska.'], ['I bilan fe’l shakli qaysi?', ['plays', 'play', 'playing', 'is play'], 1, 'I bilan asosiy fe’l shakli ishlatiladi.'], ['He bilan to‘g‘ri gap?', ['He read every day.', 'He reads every day.', 'He reading every day.', 'He are read every day.'], 1, 'He bilan reads shakli.'], ['“They” olmoshi ma’nosi?', ['U', 'Ular', 'Men', 'Sen'], 1, 'They — ular.'], ['“I study at school” tarjimasi?', ['Men maktabda o‘qiyman', 'U maktabga boradi', 'Biz uyda o‘ynaymiz', 'Men kitob yozaman'], 0, 'I study at school — Men maktabda o‘qiyman.'], ['Odatni bildiruvchi so‘z qaysi?', ['usually', 'yesterday', 'now', 'tomorrow'], 0, 'Usually — odatda, takroriy odat.'], ['“Ruchka” tarjimasi?', ['pen', 'pencil case', 'paper', 'desk'], 0, 'Pen — ruchka.'], ['She bilan “go” fe’li qanday?', ['go', 'goes', 'going', 'gos'], 1, 'Go fe’li he/she bilan goes bo‘ladi.'], ['“We play”da ega kim?', ['Men', 'Biz', 'Ular', 'U'], 1, 'We — biz.'], ['Present Simple inkorida yordamchi fe’l?', ['do/does', 'will', 'was', 'has'], 0, 'Do yoki does inkor gapda ishlatiladi.']
                    ] as ContentQuestion[] }
            ]
        },
        {
            title: 'Web dasturlash asoslari', subject: 'IT', color: 'purple',
            modules: [
                { title: 'HTML: sahifa tuzilishi', lessons: [
                        ['HTML nima?', 'HTML brauzerga sahifadagi matn va qismlarning ma’nosini bildiradi.', '<h1> — asosiy sarlavha; <p> — paragraf; <a> — havola.', '<h1>Salom, dunyo!</h1>', '<HTML>', 'HTML nimani belgilaydi?', ['Sahifa tuzilishi va mazmunini', 'Internet tezligini', 'Kompyuter rangini', 'Fayl hajmini'], 0, 'HTML sahifa mazmunining tuzilishini belgilaydi.'],
                        ['Sarlavha va paragraf', 'Sarlavhalar mavzular iyerarxiyasini, paragraf esa oddiy matnni ko‘rsatadi.', '<h1> eng muhim sarlavha; <h2> ichki bo‘lim; <p> matn.', '<h1>Tabiat</h1><p>Daraxtlar muhim.</p>', 'h1 → p', 'Paragraf uchun qaysi teg ishlatiladi?', ['<p>', '<img>', '<br>', '<title>'], 0, 'p paragraf tegi.'],
                        ['Havola va rasm', 'Havola <a>, rasm esa <img> tegi bilan qo‘shiladi.', '<a href="...">Matn</a>; rasmga src va alt beriladi.', '<img src="gul.jpg" alt="Qizil gul">', '<a> + <img>', 'Rasmning qisqa matnli tavsifi qaysi atributda?', ['alt', 'href', 'class', 'title'], 0, 'alt rasmni ko‘ra olmaydigan foydalanuvchi va qidiruv tizimlari uchun tavsif beradi.']
                    ], quiz: [
                        ['HTMLning asosiy vazifasi?', ['Sahifa mazmuni tuzilishi', 'Ranglarni hisoblash', 'Serverni sovitish', 'Video tahrirlash'], 0, 'HTML hujjat tuzilishi va mazmunini ifodalaydi.'], ['Sarlavha tegi qaysi?', ['<h1>', '<p>', '<img>', '<a>'], 0, 'h1 birinchi darajali sarlavha.'], ['Paragraf tegi?', ['<p>', '<div>', '<src>', '<href>'], 0, 'p — paragraf.'], ['Havola manzili qaysi atributda?', ['href', 'alt', 'width', 'lang'], 0, 'a tegidagi href manzilni ko‘rsatadi.'], ['Rasm mazmunini matn bilan ifodalash atributi?', ['alt', 'src', 'id', 'style'], 0, 'alt rasm uchun matnli muqobil beradi.']
                    ] as ContentQuestion[], exam: [
                        ['HTML qisqartmasidagi markup nimani anglatadi?', ['Belgilash', 'Hisoblash', 'Uzatish', 'Saqlash'], 0, 'HTML — HyperText Markup Language.'], ['Sarlavha darajalari nechta?', ['6', '2', '10', '1'], 0, 'h1 dan h6 gacha olti daraja bor.'], ['Havola yaratadigan teg?', ['a', 'p', 'img', 'ul'], 0, 'a — anchor havola tegi.'], ['Rasm fayl manzili qaysi atributda?', ['src', 'href', 'alt', 'name'], 0, 'src rasm manzilini beradi.'], ['Ro‘yxatdagi element tegi?', ['li', 'h1', 'body', 'meta'], 0, 'li ro‘yxat elementini bildiradi.'], ['HTML hujjati odatda qaysi teg bilan boshlanadi?', ['DOCTYPE', 'footer', 'img', 'table'], 0, 'DOCTYPE brauzerga hujjat standartini bildiradi.'], ['Sahifa sarlavhasi tabda qayerda ko‘rinadi?', ['title', 'p', 'main', 'aside'], 0, 'title brauzer tabidagi hujjat nomidir.'], ['Bo‘limni semantik belgilovchi teg?', ['main', 'font', 'center', 'big'], 0, 'main sahifaning asosiy mazmunini bildiradi.'], ['Yopuvchi tegda odatda nima bo‘ladi?', ['/ belgisi', '? belgisi', '# belgisi', '@ belgisi'], 0, 'Yopuvchi teg nomidan oldin / keladi.'], ['HTMLga tilni ko‘rsatish qayerda?', ['html lang atributida', 'img alt ichida', 'a href ichida', 'p id ichida'], 0, 'Masalan, <html lang="uz">.']
                    ] as ContentQuestion[] },
                { title: 'CSS: dizayn va joylashuv', lessons: [
                        ['CSS nima?', 'CSS sahifa elementlarining rang, shrift va ko‘rinishini belgilaydi.', 'selector { property: value; } — tanlovchi, xususiyat va qiymat.', 'p { color: navy; }', 'CSS { }', 'CSSning vazifasi nima?', ['Sahifa ko‘rinishini bezash', 'Ma’lumotlar bazasini yaratish', 'Internetga ulash', 'Fayllarni siqish'], 0, 'CSS ko‘rinish va dizaynni boshqaradi.'],
                        ['Tanlovchi va xususiyat', 'Tanlovchi qaysi element uslub olishini, xususiyat esa nima o‘zgarishini bildiradi.', 'h1 { color: blue; } — h1 tanlovchi, color xususiyat.', '.card { padding: 16px; }', '.class → style', 'CSS class tanlovchisi qaysi belgidan boshlanadi?', ['.', '#', '/', '@'], 0, 'Class tanlovchisi nuqta bilan yoziladi.'],
                        ['Moslashuvchan dizayn', 'Media query ekran kengligiga qarab uslublarni o‘zgartirishga yordam beradi.', '@media (max-width: 600px) { ... }', 'Kichik ekranda ustunlarni bittaga tushiring.', '@media', 'Media query nima uchun kerak?', ['Ekran o‘lchamiga moslashish', 'HTMLni o‘chirish', 'Parol yaratish', 'Rasm chizish'], 0, 'Media query turli ekran o‘lchamlariga mos dizayn beradi.']
                    ], quiz: [
                        ['CSS nima uchun ishlatiladi?', ['Ko‘rinish va dizayn', 'Ma’lumotlar bazasi', 'Hisoblash qurilmasi', 'Elektr toki'], 0, 'CSS taqdimot qatlamini bezaydi.'], ['Class tanlovchisi belgisi?', ['.', '#', '&', '/'], 0, 'Masalan .card.'], ['ID tanlovchisi belgisi?', ['#', '.', '@', '!'], 0, 'Masalan #header.'], ['CSS xususiyati qayerda yoziladi?', ['Qavs ichida', 'HTML sarlavhasida', 'URL ichida', 'Kommentariyada'], 0, 'Uslub qoidasi selector { property: value } ko‘rinishida.'], ['Mobil ekran moslashuvi uchun?', ['Media query', 'alt atributi', 'h1 tegi', 'SQL jadvali'], 0, 'Media query kenglikka qarab uslubni o‘zgartiradi.']
                    ] as ContentQuestion[], exam: [
                        ['Matn rangini belgilovchi CSS xususiyati?', ['color', 'font-file', 'text-image', 'paint'], 0, 'color matn rangini belgilaydi.'], ['Fon rangi xususiyati?', ['background-color', 'backdrop', 'fill-text', 'shade'], 0, 'background-color element fonini o‘zgartiradi.'], ['Ichki bo‘shliq xususiyati?', ['padding', 'margin', 'border', 'display'], 0, 'padding kontent bilan chegara orasidagi bo‘shliq.'], ['Tashqi bo‘shliq xususiyati?', ['margin', 'padding', 'font-size', 'color'], 0, 'margin element tashqarisidagi masofa.'], ['Flex konteyneri qanday yoqiladi?', ['display: flex', 'position: flex', 'flex: display', 'layout: row'], 0, 'display:flex flexbox joylashuvini yoqadi.'], ['Class “menu” tanlovchisi?', ['.menu', '#menu', 'menu.', '@menu'], 0, '.menu class elementlarini tanlaydi.'], ['ID “top” tanlovchisi?', ['#top', '.top', 'top#', '*top'], 0, '#top ID elementini tanlaydi.'], ['Ekran kengligi qanday birlikda berilishi mumkin?', ['px', 'kg', 'volt', 'liter'], 0, 'px — ekran o‘lchovi birligi.'], ['Chegara chizig‘i xususiyati?', ['border', 'outline-text', 'edge', 'frame-color'], 0, 'border element chegarasini chizadi.'], ['Uslub qoidasi oxirida odatda nima bor?', [';', '?', '/', '@'], 0, 'Deklaratsiyalar nuqtali vergul bilan tugaydi.']
                    ] as ContentQuestion[] }
            ]
        },
        {
            title: 'Fizika: harakat va kuch', subject: 'Fizika', color: 'green',
            modules: [
                { title: 'Harakat va tezlik', lessons: [
                        ['Masofa va vaqt', 'Harakatni tasvirlash uchun bosib o‘tilgan masofa va unga ketgan vaqtni kuzatamiz.', 'Masofa s harfi, vaqt t harfi bilan belgilanadi.', '120 metr yo‘lni 20 soniyada bosib o‘tdi.', 's / t', 'Tezlikni topishda qaysi ikki kattalik kerak?', ['Masofa va vaqt', 'Rang va harorat', 'Massa va rang', 'Kuch va tovush'], 0, 'Tezlik masofa va vaqtga bog‘liq.'],
                        ['Tezlikni hisoblash', 'Tezlik — vaqt birligida bosib o‘tilgan masofa.', 'v = s / t; birliklari m/s yoki km/soat.', '120 m / 20 s = 6 m/s', 'v = s ÷ t', '120 metrni 20 soniyada bosib o‘tgan jism tezligi?', ['6 m/s', '20 m/s', '100 m/s', '2400 m/s'], 0, '120 ni 20 ga bo‘lamiz: 6 m/s.'],
                        ['O‘rtacha tezlik', 'O‘rtacha tezlik jami masofani jami vaqtga bo‘lish bilan topiladi.', 'Yo‘lning har qismidagi tezlik o‘zgarsa ham, butun yo‘l bo‘yicha jami masofa/jami vaqt olinadi.', '100 m 20 s va 100 m 30 s: 200/50=4 m/s', 'Jami s / jami t', 'O‘rtacha tezlik formulasi?', ['Jami masofa ÷ jami vaqt', 'Vaqt ÷ massa', 'Kuch × rang', 'Masofa + vaqt'], 0, 'O‘rtacha tezlik jami masofani jami vaqtga bo‘lishdir.']
                    ], quiz: [
                        ['Tezlikni qaysi harf bilan belgilaymiz?', ['v', 't', 'm', 'F'], 0, 'Fizikada tezlik odatda v bilan belgilanadi.'], ['Tezlik formulasi?', ['v=s/t', 's=v/t', 't=s×v', 'v=s+t'], 0, 'Tezlik masofani vaqtga bo‘lish bilan topiladi.'], ['Masofaning SI birligi?', ['metr', 'sekund', 'kilogramm', 'nyuton'], 0, 'Masofa SI tizimida metrda o‘lchanadi.'], ['Vaqtning SI birligi?', ['sekund', 'metr', 'nyuton', 'litr'], 0, 'Vaqtning SI birligi sekund.'], ['60 metrni 10 sekundda bosib o‘tdi. Tezlik?', ['6 m/s', '10 m/s', '50 m/s', '600 m/s'], 0, '60/10=6 m/s.']
                    ] as ContentQuestion[], exam: [
                        ['Tezlik nimani bildiradi?', ['Vaqt birligidagi masofani', 'Jism rangini', 'Hajmni', 'Haroratni'], 0, 'Tezlik vaqt birligidagi bosib o‘tilgan masofa.'], ['Masofa formulasi?', ['s=v×t', 's=v/t', 's=t/v', 's=v+t'], 0, 'Masofa tezlikni vaqtga ko‘paytirish bilan topiladi.'], ['5 m/s tezlikda 4 sekundda masofa?', ['20 m', '9 m', '1,25 m', '40 m'], 0, '5×4=20 metr.'], ['km/soat nimaning birligi?', ['Tezlik', 'Massa', 'Kuch', 'Vaqt'], 0, 'Kilometr/soat tezlik birligi.'], ['Bir tekis harakatda tezlik…', ['O‘zgarmaydi', 'Har soniyada ortadi', 'Doim nol', 'Faqat kamayadi'], 0, 'Bir tekis harakatda tezlik o‘zgarmas.'], ['O‘rtacha tezlik nimaga teng?', ['Jami masofa/jami vaqt', 'Jami vaqt/jami masofa', 'Massa/kuch', 'Masofa×rang'], 0, 'O‘rtacha tezlik jami yo‘lni jami vaqtga bo‘lish orqali topiladi.'], ['Harakatning SI tezlik birligi?', ['m/s', 'kg', 'N', 'J'], 0, 'Tezlikning SI birligi metr/sekund.'], ['30 km yo‘l 2 soatda bosib o‘tildi. O‘rtacha tezlik?', ['15 km/soat', '32 km/soat', '60 km/soat', '28 km/soat'], 0, '30/2=15 km/soat.'], ['Tinch turgan jismning bosib o‘tgan masofasi?', ['0', '1 m/s', 'vaqtga teng', 'massaga teng'], 0, 'Jism joyidan siljimasa, bosib o‘tgan masofa nol.'], ['Masofa qanday kattalik?', ['Uzunlik', 'Vaqt', 'Massa', 'Harorat'], 0, 'Masofa uzunlikni ifodalaydi.']
                    ] as ContentQuestion[] },
                { title: 'Kuch va energiya', lessons: [
                        ['Kuch nima?', 'Kuch jismlarning harakatini yoki shaklini o‘zgartirishi mumkin.', 'Kuch F bilan belgilanadi, SI birligi nyuton (N).', 'Aravani itarsak uning harakati o‘zgaradi.', 'F → harakat', 'Kuchning SI birligi qaysi?', ['Nyuton', 'Metr', 'Sekund', 'Kilogramm'], 0, 'Kuch nyutonda o‘lchanadi.'],
                        ['Massa va og‘irlik', 'Massa jismdagi modda miqdorini, og‘irlik esa tortishish ta’siridagi kuchni ifodalaydi.', 'Massa kg da, og‘irlik kuchi N da o‘lchanadi.', 'Yerda 1 kg massaga taxminan 9,8 N og‘irlik kuchi ta’sir qiladi.', 'kg ≠ N', 'Massa qaysi birlikda o‘lchanadi?', ['Kilogramm', 'Nyuton', 'Joul', 'Metr/sekund'], 0, 'Massa kilogrammda o‘lchanadi.'],
                        ['Energiya va ish', 'Energiya ish bajarish qobiliyati; energiya o‘zgarishi mumkin, yo‘qolib ketmaydi.', 'Energiya SI birligi joul (J).', 'Ko‘tarilgan to‘pda tortishish potensial energiyasi ortadi.', 'Energiya: J', 'Energiya birligi qaysi?', ['Joul', 'Nyuton', 'Sekund', 'Kilogramm'], 0, 'Energiya joul bilan o‘lchanadi.']
                    ], quiz: [
                        ['Kuchning belgisi?', ['F', 'v', 't', 's'], 0, 'Kuch odatda F bilan belgilanadi.'], ['Kuch birligi?', ['Nyuton', 'Joul', 'Kilogramm', 'Metr'], 0, 'Kuch nyutonda o‘lchanadi.'], ['Massa birligi?', ['Kilogramm', 'Nyuton', 'Joul', 'Sekund'], 0, 'Massa kilogrammda o‘lchanadi.'], ['Energiya birligi?', ['Joul', 'Metr', 'Nyuton', 'Kilogramm'], 0, 'Energiya joul bilan o‘lchanadi.'], ['Kuch jismga qanday ta’sir qilishi mumkin?', ['Harakatini yoki shaklini o‘zgartiradi', 'Rangini doim o‘zgartiradi', 'Massasini yo‘q qiladi', 'Vaqtni to‘xtatadi'], 0, 'Kuch tezlikni yoki shaklni o‘zgartirishi mumkin.']
                    ] as ContentQuestion[], exam: [
                        ['Kuch qaysi belgi bilan yoziladi?', ['F', 'm', 't', 'v'], 0, 'F kuch uchun ishlatiladi.'], ['Og‘irlik kuchi nimaga bog‘liq?', ['Tortishish maydoniga', 'Rangga', 'Ovozga', 'Hidga'], 0, 'Og‘irlik tortishish ta’siridagi kuch.'], ['Massa va og‘irlik bir xilmi?', ['Yo‘q, biri kg, biri N bilan o‘lchanadi', 'Ha, ikkalasi N', 'Ha, ikkalasi metr', 'Yo‘q, biri litr'], 0, 'Massa kg, og‘irlik kuchi N bilan o‘lchanadi.'], ['Energiya saqlanish qonuni nimani aytadi?', ['Energiya turdan turga o‘tadi, umumiy miqdori saqlanadi', 'Energiya doim yo‘qoladi', 'Energiya faqat ortadi', 'Energiya massaga teng'], 0, 'Energiya saqlanish qonuni umumiy energiyaning saqlanishini bildiradi.'], ['Ishning oddiy formulasi?', ['A=F×s', 'A=m/t', 'A=v+s', 'A=F+t'], 0, 'Kuch siljish yo‘nalishida bo‘lsa, ish A=F×s.'], ['Kuch bo‘lmasa jismning harakati…', ['O‘zgarishi uchun sabab bo‘lmaydi', 'Doim tezlashadi', 'Darhol eriydi', 'Rangini almashtiradi'], 0, 'Harakat o‘zgarishi uchun natijaviy kuch kerak.'], ['Jism shaklini o‘zgartiradigan ta’sir?', ['Kuch', 'Vaqt', 'Massa birligi', 'Harorat birligi'], 0, 'Kuch deformatsiyaga olib kelishi mumkin.'], ['Ish va energiya birligi?', ['Joul', 'Nyuton', 'Kilogramm', 'Sekund'], 0, 'Ish ham, energiya ham joul bilan o‘lchanadi.'], ['1 kg jismning Yerda og‘irligi taxminan?', ['9,8 N', '1 N', '100 N', '0 N'], 0, 'g≈9,8 N/kg, shuning uchun og‘irlik ≈9,8 N.'], ['Harakat energiyasi nima deyiladi?', ['Kinetik energiya', 'Kimyoviy belgi', 'Massa', 'Bosim'], 0, 'Harakatlanayotgan jism kinetik energiyaga ega.']
                    ] as ContentQuestion[] }
            ]
        }
    ] as const;
    for (const coursePlan of curricula) {
        if ((await one('SELECT id FROM courses WHERE title=?', coursePlan.title)))
            continue;
        (await transaction(async () => {
            const courseId = Number((await run('INSERT INTO courses(title,description,subject,color) VALUES(?,?,?,?)', coursePlan.title, `Bosqichma-bosqich darslar, amaliy misollar va o‘zingizni tekshiradigan testlar.`, coursePlan.subject, coursePlan.color)).lastInsertRowid);
            for (let mi = 0; mi < coursePlan.modules.length; mi++) {
                const module = coursePlan.modules[mi];
                const moduleId = Number((await run('INSERT INTO modules(course_id,title,position) VALUES(?,?,?)', courseId, module.title, mi + 1)).lastInsertRowid);
                const examId = Number((await run('INSERT INTO assessments(module_id,title,kind,duration_seconds) VALUES(?,?,\'exam\',600)', moduleId, `${module.title} — modul imtihoni`)).lastInsertRowid);
                for (const q of module.exam)
                    (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', examId, q[0], JSON.stringify(q[1]), q[2], q[3]));
                for (let li = 0; li < module.lessons.length; li++) {
                    const [title, description, concept, example, visual, prompt, options, correct, explanation] = module.lessons[li];
                    const labType = coursePlan.subject === 'Fizika' && title === 'Tezlikni hisoblash' ? 'motion' : null;
                    const lessonId = Number((await run('INSERT INTO lessons(module_id,title,description,slides_json,lab_type,position) VALUES(?,?,?,?,?,?)', moduleId, title, description, JSON.stringify([
                        { title: 'Keling, vaziyatni ko‘ramiz', body: description, example, visual },
                        { title: 'Asosiy tushuncha', body: concept, example, visual },
                        { title: 'Misolni tahlil qilamiz', body: `${example} Ushbu misolda asosiy tushunchani ajratib ko‘ring.`, example, visual },
                        { title: 'O‘zingiz sinab ko‘ring', body: `${prompt} Javobni tanlashdan oldin darsdagi qoida bilan solishtiring.`, example, visual },
                        { title: 'Xulosa', body: `${concept} Endi shu bilimni yakuniy testda tekshiring.`, example, visual }
                    ]), labType, li + 1)).lastInsertRowid);
                    const assessmentId = Number((await run('INSERT INTO assessments(lesson_id,module_id,title,kind,duration_seconds) VALUES(?,?,?,\'test\',600)', lessonId, moduleId, `${title} — dars testi`)).lastInsertRowid);
                    const questionSet = module.quiz;
                    for (const q of questionSet)
                        (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', assessmentId, q[0], JSON.stringify(q[1]), q[2], q[3]));
                }
            }
        }));
    }
    const speedLesson = (await one<{
        id: number;
        lab_type: string | null;
    }>("SELECT l.id,l.lab_type FROM lessons l JOIN modules m ON m.id=l.module_id JOIN courses c ON c.id=m.course_id WHERE c.title='Fizika: harakat va kuch' AND l.title='Tezlikni hisoblash'"));
    if (speedLesson && speedLesson.lab_type !== 'motion')
        (await run('UPDATE lessons SET lab_type=? WHERE id=?', 'motion', speedLesson.id));
}
// Additive, idempotent content expansion. It also upgrades databases created by
// earlier versions without deleting learner progress or saved attempts.
async function seedRemainingContent() {
    const nextLessons = [
        [1, 'Teng kasrlar va qisqartirish', 'Bir xil miqdorni turlicha yozish va kasrni eng sodda ko‘rinishga keltirish.', [
                ['Bir xil ulush', 'Kasrning surat va maxrajini bir xil songa ko‘paytirish qiymatni o‘zgartirmaydi.', '2/3 = 4/6', 2, 3],
                ['Umumiy bo‘luvchi', 'Surat va maxrajni ikkalasiga ham bo‘linadigan songa bo‘lib kasrni qisqartiramiz.', '6/8 = 3/4', 3, 4],
                ['Eng sodda ko‘rinish', 'Umumiy bo‘luvchi 1 dan katta qolmaganda kasr qisqarmaydigan bo‘ladi.', '5/7 qisqarmaydi', 5, 7],
                ['Kundalik misol', '12 bo‘lakli pirogning 8 bo‘lagi olindi. 8/12 ni 4 ga bo‘lib soddalashtiramiz.', '8/12 = 2/3', 2, 3],
                ['O‘zingiz tekshiring', 'Teng kasr tuzish uchun surat va maxrajni bir xil songa ko‘paytiring yoki bo‘ling.', '3/9 = 1/3', 1, 3]
            ]],
        [1, 'Kasrlarni qo‘shish va ayirish', 'Maxrajlar teng yoki turlicha bo‘lganda amallarni bajarish.', [
                ['Teng maxraj', 'Maxrajlar teng bo‘lsa, suratlarni qo‘shamiz va maxrajni saqlaymiz.', '2/7 + 3/7 = 5/7', 5, 7],
                ['Ayirish', 'Teng maxrajli kasrlarni ayirganda suratlar ayiriladi.', '6/9 − 2/9 = 4/9', 4, 9],
                ['Turli maxraj', 'Avval kasrlarni umumiy maxrajga keltiramiz.', '1/2 = 3/6', 3, 6],
                ['Hisoblaymiz', 'Endi teng maxrajli kasrlarni qo‘shamiz.', '1/2 + 1/3 = 3/6 + 2/6 = 5/6', 5, 6],
                ['Tekshiruv', 'Natija butundan oshmasligini taxmin bilan tekshiring: yarimga uchdan bir qo‘shilsa, butundan ozroq.', '5/6 < 1', 5, 6]
            ]],
        [2, 'Foiz va kasrlar', 'Foizni kasrga, kasrni foizga aylantirishni o‘rganing.', [
                ['Yuzdan ulush', 'Foiz “yuzdan” degani. Foizni maxraji 100 bo‘lgan kasr sifatida yozish mumkin.', '35% = 35/100', 35, 100],
                ['Kasrni foizga', 'Kasrni foizga aylantirish uchun 100 ga teng maxrajga keltiring.', '1/4 = 25/100 = 25%', 1, 4],
                ['O‘nli kasr', 'Foizni 100 ga bo‘lsak, o‘nli kasr hosil bo‘ladi.', '40% = 0,4', 2, 5],
                ['Yarim va chorak', 'Ko‘p ishlatiladigan ulushlarni yodda tutish hisobni tezlashtiradi.', '1/2 = 50%, 1/4 = 25%', 1, 2],
                ['Mustahkamlaymiz', 'Foiz, o‘nli kasr va oddiy kasr bir miqdorni ifodalashi mumkin.', '75% = 0,75 = 3/4', 3, 4]
            ]],
        [2, 'Foizli o‘zgarishlar', 'Chegirma, ortish va yangi qiymatni topish.', [
                ['Foiz miqdori', 'Sonning p foizini topish uchun sonni p ga ko‘paytirib, 100 ga bo‘ling.', '80 ning 15% i = 80×15/100 = 12', 3, 20],
                ['Chegirma', 'Chegirmadan keyingi narx boshlang‘ich narxdan chegirma miqdorini ayirish bilan topiladi.', '60 000 − 10% = 54 000 so‘m', 9, 10],
                ['Ortiqcha qiymat', 'Narx 20% oshsa, yangi narx boshlang‘ichning 120 foiziga teng.', '50 000 × 1,2 = 60 000', 6, 5],
                ['Qayta hisoblash', 'Avval foiz miqdorini hisoblang, keyin oshish yoki kamayishni qo‘llang.', '200 ning 25% i = 50', 1, 4],
                ['Ehtiyot bo‘ling', 'Bir xil foizga oshirish va keyin kamaytirish har doim boshlang‘ich qiymatga qaytarmaydi.', '100 → +10% = 110 → −10% = 99', 99, 100]
            ]]
    ] as const;
    type QuizQuestion = [
        string,
        string[],
        number,
        string
    ];
    const quizzes: QuizQuestion[][][] = [
        [
            [['2/3 ga teng kasr qaysi?', ['4/6', '2/6', '3/4', '1/3'], 0, 'Surat va maxrajni 2 ga ko‘paytirsak 4/6 bo‘ladi.'], ['12/18 ni qisqartiring.', ['2/3', '3/2', '6/9', '1/2'], 0, '12 va 18 ni 6 ga bo‘lsak 2/3 chiqadi.'], ['Qaysi kasr qisqarmaydi?', ['4/8', '3/9', '5/7', '6/12'], 2, '5 va 7 ning 1 dan boshqa umumiy bo‘luvchisi yo‘q.'], ['6/10 ning sodda ko‘rinishi?', ['3/5', '2/5', '6/5', '1/5'], 0, 'Surat va maxrajni 2 ga bo‘lamiz.'], ['3/4 ni 8 maxrajga keltiring.', ['6/8', '4/8', '3/8', '8/6'], 0, 'Maxrajni 2 ga ko‘paytirganda surat ham 2 ga ko‘payadi.']],
            [['2/9 + 4/9 = ?', ['6/18', '2/3', '6/9', '2/9'], 2, 'Teng maxraj saqlanadi, suratlar qo‘shiladi.'], ['7/8 − 3/8 = ?', ['4/8', '4/0', '10/8', '1/2'], 0, '7 dan 3 ayiriladi, maxraj 8 qoladi.'], ['1/2 + 1/4 = ?', ['2/6', '3/4', '1/6', '2/4'], 1, '1/2 ni 2/4 deb yozamiz: 2/4+1/4=3/4.'], ['1/3 + 1/6 = ?', ['2/9', '1/2', '2/6', '1/9'], 1, '1/3=2/6; 2/6+1/6=3/6=1/2.'], ['5/6 − 1/3 = ?', ['4/3', '1/2', '4/6', '2/3'], 1, '1/3=2/6; 5/6−2/6=3/6=1/2.']]
        ],
        [
            [['35% ni kasr ko‘rinishida yozing.', ['35/10', '35/100', '3/5', '1/35'], 1, 'Foiz maxraji 100 bo‘lgan kasr.'], ['1/4 necha foiz?', ['20%', '25%', '40%', '50%'], 1, '1/4=25/100=25%.'], ['0,6 necha foiz?', ['6%', '60%', '0,6%', '600%'], 1, '0,6×100=60%.'], ['50% qaysi kasrga teng?', ['1/5', '1/4', '1/2', '2/5'], 2, '50/100 ni qisqartirsak 1/2.'], ['3/5 ni foizga aylantiring.', ['30%', '50%', '60%', '80%'], 2, '3/5=60/100=60%.']],
            [['120 ning 10% i?', ['10', '12', '20', '120'], 1, '120×10/100=12.'], ['80 000 so‘mga 25% chegirma. Yangi narx?', ['20 000', '55 000', '60 000', '75 000'], 2, 'Chegirma 20 000; 80 000−20 000=60 000.'], ['40 ning 15% i?', ['4', '6', '8', '15'], 1, '40×15/100=6.'], ['200 000 so‘m 10% oshsa?', ['210 000', '220 000', '190 000', '240 000'], 1, '10% i 20 000, demak 220 000.'], ['100 dan 80 ga tushish necha foiz kamayish?', ['10%', '20%', '25%', '80%'], 1, '20 ga kamaydi; 20/100=20%.']]
        ]
    ];
    (await transaction(async () => {
        for (let i = 0; i < nextLessons.length; i++) {
            const [moduleId, title, description, slides] = nextLessons[i];
            const position = (await all<{
                n: number;
            }>('SELECT COUNT(*) AS n FROM lessons WHERE module_id=?', moduleId))[0].n + 1;
            if ((await one('SELECT id FROM lessons WHERE module_id=? AND title=?', moduleId, title)))
                continue;
            const lessonId = Number((await run('INSERT INTO lessons(module_id,title,description,slides_json,lab_type,position) VALUES(?,?,?,?,NULL,?)', moduleId, title, description, JSON.stringify(slides.map(([title, body, example, numerator, denominator]) => ({ title, body, example, numerator, denominator }))), position)).lastInsertRowid);
            const assessmentId = Number((await run('INSERT INTO assessments(lesson_id,module_id,title,kind,duration_seconds) VALUES(?,?,?,\'test\',600)', lessonId, moduleId, `${title} — dars testi`)).lastInsertRowid);
            for (const q of quizzes[Math.floor(i / 2)][i % 2])
                (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', assessmentId, q[0], JSON.stringify(q[1]), q[2], q[3]));
        }
        const examAdds = [
            [['9/12 ni qisqartiring.', ['2/3', '3/4', '1/2', '4/3'], 1, '9 va 12 ni 3 ga bo‘lamiz: 3/4.'], ['5/8 + 1/8 = ?', ['6/16', '3/4', '4/8', '5/16'], 1, '6/8 qisqarsa 3/4 bo‘ladi.'], ['3/4 − 1/2 = ?', ['1/4', '2/2', '1/2', '2/4'], 0, '1/2=2/4, demak 3/4−2/4=1/4.'], ['2/5 + 1/10 = ?', ['3/15', '1/2', '3/10', '2/10'], 1, '2/5=4/10; 4/10+1/10=1/2.'], ['1/6 + 1/3 = ?', ['1/9', '1/2', '2/9', '4/6'], 1, '1/3=2/6; jami 3/6=1/2.']],
            [['25% ni oddiy kasrga aylantiring.', ['1/2', '1/3', '1/4', '1/5'], 2, '25/100=1/4.'], ['150 ning 20% i?', ['20', '25', '30', '35'], 2, '150×20/100=30.'], ['2/5 necha foiz?', ['20%', '25%', '40%', '50%'], 2, '2/5=40/100.'], ['120 000 so‘mga 15% chegirma qancha?', ['12 000', '18 000', '20 000', '102 000'], 1, '120 000×15/100=18 000.'], ['Bir qiymat 200 dan 250 ga oshdi. O‘sish foizi?', ['20%', '25%', '40%', '50%'], 1, '50/200=25%.']]
        ] as const;
        for (let moduleId = 1; moduleId <= 2; moduleId++) {
            const exam = (await one<{
                id: number;
            }>('SELECT id FROM assessments WHERE module_id=? AND kind=\'exam\' ORDER BY id LIMIT 1', moduleId));
            if (!exam)
                continue;
            const count = (await all<{
                n: number;
            }>('SELECT COUNT(*) AS n FROM questions WHERE assessment_id=?', exam.id))[0].n;
            for (const q of examAdds[moduleId - 1].slice(Math.max(0, count - 5)))
                (await run('INSERT INTO questions(assessment_id,prompt,options_json,correct_index,explanation) VALUES(?,?,?,?,?)', exam.id, q[0], JSON.stringify(q[1]), q[2], q[3]));
        }
    }));
}
export async function seedDemo(password: string) {
    check(process.env.NODE_ENV !== 'production', 'Demo hisoblar production muhitida yaratilmaydi.');
    check(password.length >= 12, 'DEMO_PASSWORD kamida 12 belgi bo‘lsin.');
    (await seedContent());
    (await transaction(async () => {
        for (const [role, name] of [['student', 'Aziza Karimova'], ['parent', 'Dilnoza Karimova'], ['teacher', 'Javohir Aliyev'], ['admin', 'ILMORA administratori']] as const) {
            const email = `${role}@ilmora.local`;
            if (!(await one('SELECT id FROM users WHERE email=?', email)))
                (await run('INSERT INTO users(name,email,password_hash,role,created_at) VALUES(?,?,?,?,?)', name, email, hashPassword(password), role, Date.now()));
        }
        const student = (await one('SELECT id FROM users WHERE email=?', 'student@ilmora.local'))!;
        for (const adult of (await all('SELECT id FROM users WHERE email IN (?,?)', 'parent@ilmora.local', 'teacher@ilmora.local')))
            (await run('INSERT OR IGNORE INTO relations(adult_id,student_id) VALUES(?,?)', adult.id, student.id));
    }));
}
