export type LessonSlide = {
  title: string;
  body: string;
  example: string;
  visual?: string;
  section: 'Mavzuga kirish' | 'Asosiy qoida' | 'Misolni yechamiz' | 'Mustaqil mashq' | 'Xulosa';
  prompt?: string;
};

type Lesson = { description: string; slides: LessonSlide[] };

function lesson(description: string, intro: string, rule: string, worked: string, practice: string, takeaway: string): Lesson {
  return {
    description,
    slides: [
      { section: 'Mavzuga kirish', title: 'Bu mavzu qayerda kerak bo‘ladi?', body: intro, example: 'Hayotiy vaziyat: ' + worked.split('\n')[0], visual: 'KUZAT → TUSHUN → QO‘LLA' },
      { section: 'Asosiy qoida', title: 'Muhim tushuncha va qoida', body: rule, example: 'Yodda tuting: ' + takeaway, visual: 'ASOSIY QOIDA' },
      { section: 'Misolni yechamiz', title: 'Birgalikda bosqichma-bosqich', body: worked, example: worked.split('\n').at(-1) || worked, visual: '1 → 2 → 3' },
      { section: 'Mustaqil mashq', title: 'Endi o‘zingiz sinab ko‘ring', body: practice, example: 'Avval taxmin qiling, keyin qoidani qo‘llab javobingizni tekshiring.', visual: 'SIZNING NAVBATINGIZ', prompt: practice },
      { section: 'Xulosa', title: 'Bilimingizni mustahkamlang', body: takeaway + ' Javobingizni tekshirish uchun birlik, ishora va natija vaziyatga mos kelishiga qarang.', example: 'O‘zingizga savol: qoidani boshqa bir misolda ham tushuntira olamanmi?', visual: 'ESLAB QOLING' }
    ]
  };
}

export const professionalLessonContent: Record<string, Lesson> = {
  'Butunning bir bo‘lagi': lesson(
    'Kasr butunni teng qismlarga bo‘lganda tanlangan qismlarni ifodalaydi. Surat va maxrajni o‘qib, kasrni rasm va kundalik vaziyatlarda tushuntirasiz.',
    'Butunni teng qismlarga ajratib, uning bir qismini olganimizda kasr hosil bo‘ladi. “Teng” bo‘lish muhim: turli kattalikdagi bo‘laklarni oddiy kasr bilan bir xil talqin qilib bo‘lmaydi.',
    'Kasr chizig‘ining ustidagi surat olingan qismlar sonini, ostidagi maxraj esa butun nechta teng qismga bo‘linganini bildiradi. Maxraj 0 bo‘la olmaydi; 0/5 esa hech qanday qism olinmaganini bildiradi.',
    'Pitsa 8 ta teng bo‘lakka bo‘lindi va 3 bo‘lagi olindi.\n1) Butun 8 teng qismga ajralgan. 2) Olingan qism 3 ta. 3) Olingan ulush 3/8 bo‘ladi.',
    'Shokolad 10 ta teng bo‘lakka bo‘lingan, 4 tasi yeyildi. Qaysi kasr yeyilgan qismini, qaysi kasr qolgan qismini bildiradi? Ikkala kasr yig‘indisini toping.',
    'Kasrni yozishda avval butun nechta teng qismga bo‘linganini maxrajga, keyin olingan qismlarni suratga yozing. Olingan va qolgan ulushlar yig‘indisi 1 butun bo‘lishi kerak.'
  ),
  'Teng kasrlar va qisqartirish': lesson(
    'Teng kasrlar turlicha yozilsa ham bir xil miqdorni bildiradi. Kasrni qisqartirish va eng sodda ko‘rinishda yozishni o‘rganasiz.',
    'Yarim pitsa 2 bo‘lakdan 1 tasini olish bilan ham, 4 bo‘lakdan 2 tasini olish bilan ham ifodalanadi. Bo‘laklar soni o‘zgaradi, lekin olingan miqdor o‘zgarmaydi.',
    'Surat va maxrajni bir xil noldan farqli songa ko‘paytirish yoki bo‘lish kasr qiymatini saqlaydi. Qisqartirishda ikkalasini umumiy bo‘luvchiga bo‘lamiz; eng sodda kasrda umumiy bo‘luvchi 1 bo‘ladi.',
    '18/24 ni qisqartiramiz.\n1) 18 va 24 ning umumiy bo‘luvchisi 6. 2) Suratni ham, maxrajni ham 6 ga bo‘lamiz. 3) 18/24 = 3/4.',
    '20/30 kasrini eng sodda ko‘rinishga keltiring. Keyin 2/3 bilan tengligini surat va maxrajni bir xil songa ko‘paytirib tekshiring.',
    'Kasrni qisqartirganda surat va maxrajga bir xil amal bajaring. Natijaning qiymatini ko‘paytirish yoki bo‘lish orqali tekshirib, maxrajni hech qachon nol qilmang.'
  ),
  'Kasrlarni qo‘shish va ayirish': lesson(
    'Kasrlarni qo‘shish va ayirishda butun qismlarning bir xil kattalikda bo‘lishi kerak. Maxraj teng bo‘lganda va turlicha bo‘lganda amallarni yechasiz.',
    'Bir xil pitsa bo‘laklaridan 2 tasiga yana 1 tasini qo‘shsak, jami 3 bo‘lak. Kasrlar bilan amalda ham bir xil o‘lchamli ulushlarni sanash kerak.',
    'Maxrajlar teng bo‘lsa suratlarni qo‘shamiz yoki ayiramiz, maxrajni o‘z holicha qoldiramiz. Maxrajlar turlicha bo‘lsa avval umumiy maxraj topib, teng kasrlarga aylantiramiz.',
    '1/4 + 1/6 ni hisoblaymiz.\n1) Umumiy maxraj 12. 2) 1/4=3/12 va 1/6=2/12. 3) 3/12+2/12=5/12.',
    '2/3 − 1/4 ni umumiy maxrajga keltirib hisoblang. Javobingizni taxmin bilan tekshiring: natija 0 bilan 1 orasida chiqishi kerak.',
    'Turli maxrajli kasrlarni qo‘shish yoki ayirishdan oldin teng maxrajga keltiring. Javobni imkon bo‘lsa qisqartiring va taxminan qanchaga tengligini tekshiring.'
  ),
  'Yuzdan bir ulush': lesson(
    'Foiz “yuzdan” degani: miqdorni 100 teng qismga ajratgandagi ulush. Foizni kasr va o‘nli kasr bilan ifodalab, miqdorning qismini topasiz.',
    'Foizlar so‘rovnoma natijasi, chegirma, batareya quvvati va test balida uchraydi. 100% — butun miqdor, 50% — uning yarmi.',
    'p% = p/100. Sonning p foizini topish uchun sonni p ga ko‘paytirib, 100 ga bo‘ling. Foizni kasrga aylantirganda qisqartirish mumkin.',
    '240 000 so‘mning 15 foizini topamiz.\n1) 15% = 15/100. 2) 240 000 × 15 = 3 600 000. 3) 100 ga bo‘lsak 36 000 so‘m.',
    '80 ta daraxtning 35 foizi mevali. Mevali daraxtlar sonini toping. Hisobdan oldin 10% nechta daraxt bo‘lishini aniqlab, javobni solishtiring.',
    'Foizni hisoblashda “qaysi miqdorning necha foizi?” savoliga aniqlik kiriting. 100% boshlang‘ich butun miqdorni anglatadi.'
  ),
  'Foiz va kasrlar': lesson(
    'Kasr, o‘nli kasr va foiz bir xil ulushni turli ko‘rinishda ifodalaydi. Ularni biridan boshqasiga aylantirib, miqdorlarni solishtirasiz.',
    '1/2, 0,5 va 50% bir xil miqdor. Qaysi yozuv qulay bo‘lsa, vazifaga qarab undan foydalanish mumkin.',
    'Kasrni o‘nli ko‘rinishga o‘tkazish uchun suratni maxrajga bo‘ling. Foiz uchun o‘nli sonni 100 ga ko‘paytiring; foizni o‘nli songa o‘tkazish uchun 100 ga bo‘ling.',
    '3/8 ni foizga aylantiramiz.\n1) 3 ÷ 8 = 0,375. 2) 0,375 × 100 = 37,5. 3) Demak, 3/8 = 0,375 = 37,5%.',
    '0,28 ni oddiy kasr va foiz ko‘rinishida yozing. 7/25 ni ham o‘nli kasr va foizga aylantirib, natijalar tengligini tekshiring.',
    'Kasr → bo‘lish → o‘nli son → 100 ga ko‘paytirish → foiz. Aksincha, foizdan o‘nli songa o‘tish uchun 100 ga bo‘ling.'
  ),
  'Foizli o‘zgarishlar': lesson(
    'Foizli o‘zgarish boshlang‘ich qiymatga nisbatan qanchaga o‘sish yoki kamayishni bildiradi. Chegirma va narx oshishini to‘g‘ri hisoblashni o‘rganasiz.',
    '10 000 so‘mlik narx 1 000 so‘mga oshsa, o‘sish 10% bo‘ladi. Foizni yangi qiymatga emas, odatda boshlang‘ich qiymatga nisbatan topamiz.',
    'O‘zgarish miqdori = yangi qiymat − boshlang‘ich qiymat. O‘zgarish foizi = o‘zgarish miqdori ÷ boshlang‘ich qiymat × 100%. Kamayishda ayirmani musbat miqdor sifatida olib, yo‘nalishni “kamayish” deb ko‘rsating.',
    'Narx 80 000 so‘mdan 92 000 so‘mga chiqdi.\n1) O‘sish 12 000. 2) 12 000 ÷ 80 000 = 0,15. 3) O‘sish 15%.',
    '120 000 so‘mlik sumka 102 000 so‘m bo‘ldi. Chegirma miqdori va boshlang‘ich narxga nisbatan chegirma foizini toping.',
    'Foizli o‘zgarishda taqqoslash uchun boshlang‘ich qiymatni asos qilib oling. Natijaning o‘sishmi yoki kamayishmi ekanini alohida ayting.'
  ),
  'Salomlashish iboralari': lesson(
    'Ingliz tilida vaziyat va vaqtga mos salomlashish, odobli javob berish va suhbatni xayrlashib tugatishni mashq qilasiz.',
    'Salomlashuv suhbatni iliq va hurmatli boshlaydi. Do‘st, o‘qituvchi yoki rasmiy uchrashuvda iborani vaziyatga mos tanlash kerak.',
    'Hello — betaraf salom; Hi — norasmiy salom; Good morning — ertalab; Good afternoon — kunduz; Good evening — kechqurun salomlashishda ishlatiladi. Goodbye yoki See you xayrlashuv uchun, Good night esa tunash oldidan aytiladi.',
    'Ertalab o‘qituvchini ko‘rdingiz.\n1) Vaqt ertalab ekanini aniqlang. 2) Hurmatli betaraf iborani tanlang. 3) “Good morning, teacher.” deb salom bering.',
    'Do‘stingiz bilan kunduz uchrashganda salomlashuv yozing. Suhbat oxirida “Good night”mi yoki “Goodbye”mi mos kelishini izohlang.',
    'Salomlashuv va xayrlashuv iboralarini farqlang. Good night salomlashish emas, odatda kechasi xayrlashish yoki uxlash oldidan ishlatiladi.'
  ),
  'O‘zingizni tanishtiring': lesson(
    'Ism, kelib chiqish va qiziqishlaringizni inglizcha sodda gaplar bilan aytishni hamda suhbatdoshdan ma’lumot so‘rashni o‘rganasiz.',
    'Tanishuvda qisqa va aniq gaplar yetarli. Avval salomlashib, ismingizni ayting, keyin suhbatdoshga savol bering.',
    'My name is … yoki I’m … ismni aytadi. I am from … kelib chiqishni, I live in … yashash joyini bildiradi. What is your name? suhbatdoshning ismini so‘raydi.',
    'O‘zingizni uch gapda tanishtiring.\n1) “Hello!” deb salomlashing. 2) “My name is Dilnoza.” deb ism ayting. 3) “I am from Samarkand. What is your name?” deb davom eting.',
    'O‘zingiz haqingizda ism va shaharni aytadigan ikki gap yozing, so‘ng suhbatdoshning ismini so‘raydigan savol qo‘shing.',
    'I bilan am ishlatiladi: I am …; qisqartirib I’m … deyish mumkin. Savolda What is your name? shaklida so‘z tartibini saqlang.'
  ),
  'Hol-ahvol so‘rash': lesson(
    'How are you? savoliga tabiiy javob qaytarish, muloyimlik bildirish va suhbatni davom ettirish iboralarini o‘rganasiz.',
    'Hol-ahvol so‘rash suhbatdoshga e’tibor ko‘rsatadi. Javob bergach, “And you?” deb savolni qaytarish suhbatni davom ettiradi.',
    'How are you? — Ahvolingiz qalay? I’m fine, thank you — Yaxshiman, rahmat. I’m good / I’m well ham ishlatiladi. And you? — Siz-chi?',
    'Ikki kishilik suhbatni tuzamiz.\n1) A: “How are you?” 2) B: “I’m fine, thank you.” 3) B: “And you?” deb suhbatdoshdan ham so‘raydi.',
    'Bir do‘stingiz bilan uch replika yozing: salomlashuv, How are you? savoli va “I’m good, thanks. And you?” javobi.',
    'Javobni to‘liq gapda bering va suhbatdoshga muloyimlik bilan savol qaytaring. Fine — sifat, I’m fine jumlasida am fe’li kerak.'
  ),
  'Maktab buyumlari': lesson(
    'Sinfdagi buyumlarning inglizcha nomlarini, birlik va ko‘plik shaklini hamda ularni sodda gaplarda ishlatishni o‘rganasiz.',
    'Atrofdagi narsalarni inglizcha nomlash kundalik muloqotda kerak bo‘ladi. Buyumlarni ko‘rsatib “This is …” deb tanishtirish mumkin.',
    'Book — kitob, pen — ruchka, pencil — qalam, desk — parta, board — doska, bag — sumka. Bitta buyum uchun a/an ishlatilishi mumkin: a book, an eraser. Ko‘plikda odatda -s qo‘shiladi: books.',
    'Partani ta’riflaymiz.\n1) Buyum desk ekanini tanlang. 2) Yaqindagi bitta buyum uchun “This is …” ishlating. 3) “This is my desk.” deb ayting.',
    'Atrofingizdan uchta maktab buyumini tanlab, “This is my …” qolipi bilan gap tuzing. Keyin bitta buyumni ko‘plikda tasvirlang.',
    'Buyum nomini yodlash bilan birga uni gap ichida ishlating. This is birlikdagi bitta narsani ko‘rsatadi; these are bir nechta narsaga ishlatiladi.'
  ),
  'Present Simple: odatlar': lesson(
    'Present Simple doimiy odatlar, jadval va umumiy haqiqatlarni ifodalaydi. Darak gap tuzish va takrorlanish bildiruvchi so‘zlardan foydalanishni o‘rganasiz.',
    'Har kuni takrorlanadigan ishlar “hozir ayni damda” bo‘layotgan ishlar bilan bir xil emas. Present Simple odat yoki muntazam holatni aytishga qulay.',
    'I/you/we/they + fe’lning oddiy shakli: I read. He/she/it bilan odatda fe’lga -s yoki -es qo‘shiladi. Every day, often, usually kabi so‘zlar takrorlanishni bildiradi.',
    '“U har kuni kitob o‘qiydi” gapini tuzamiz.\n1) Ega she. 2) She bilan read → reads. 3) “She reads a book every day.”',
    'O‘zingizning bir odatingiz haqida I bilan, do‘stingizning odati haqida He yoki She bilan bittadan gap yozing.',
    'Ega va fe’l shaklini moslang: I study, they study, lekin he studies. Present Simple odatni bildiradi; ayni paytdagi jarayon uchun boshqa zamon ishlatiladi.'
  ),
  'He / She bilan fe’l': lesson(
    'Present Simple zamonida he, she va it bilan fe’lning uchinchi shaxs shaklini to‘g‘ri tanlaysiz. -s, -es va -ies qo‘shimchalari qoidasini mashq qilasiz.',
    'O‘zingiz haqida I play deymiz, lekin boshqa bir kishi haqida He plays deymiz. Fe’l oxiridagi kichik o‘zgarish gapni grammatik jihatdan to‘g‘ri qiladi.',
    'Ko‘p fe’llarga -s qo‘shiladi: reads. -sh, -ch, -x, -s, -o bilan tugaganlariga ko‘pincha -es: watches, goes. Undosh + y bo‘lsa y → ies: study → studies; unli + y bo‘lsa plays.',
    '“Malika ingliz tilini o‘rganadi” gapini yasaymiz.\n1) Ega she. 2) Study undosh + y bilan tugaydi, shuning uchun studies. 3) “She studies English.”',
    'He bilan watch, She bilan go va He bilan play fe’llarini Present Simple shaklida gapga qo‘ying.',
    'He/she/it uchun fe’lga mos qo‘shimcha tanlang. Inkor va savol shaklida does ishlatilsa, asosiy fe’l oddiy shaklga qaytadi: She doesn’t play.'
  ),
  'HTML nima?': lesson(
    'HTML veb-sahifa mazmunini semantik elementlar bilan tuzadi. Teg, element va atributlarni farqlab, kichik sahifa skeletini yaratasiz.',
    'Brauzer sahifadagi sarlavha, matn, rasm va havolani qanday ko‘rsatishni HTML tuzilishidan biladi. HTML sahifaning mazmuni va tuzilishini belgilaydi.',
    'Ko‘p HTML elementlari ochuvchi teg, mazmun va yopuvchi tegdan tashkil topadi: <p>Matn</p>. Teglar ma’noga ega bo‘lishi kerak; bezak uchun CSS, interaktivlik uchun JavaScript qo‘llanadi.',
    'Sodda sahifa yaratamiz.\n1) <!doctype html> hujjat turini bildiradi. 2) <html> ichida <head> va <body> bo‘ladi. 3) <body> ichiga <h1>Salom</h1> yozing.',
    '“Mening sevimli mashg‘ulotim” sarlavhasi va bitta izoh paragrafi bo‘lgan HTML parchasini yozing. Ochilgan teglar yopilganini tekshiring.',
    'HTML — mazmun va tuzilma. Teglar to‘g‘ri ichma-ich joylashsin, atribut qiymatlari qo‘shtirnoqda bo‘lsin va mazmun uchun semantik teg tanlang.'
  ),
  'Sarlavha va paragraf': lesson(
    'HTML sarlavhalari mazmun iyerarxiyasini, paragraf esa matn bo‘limlarini belgilaydi. O‘qilishi qulay va semantik hujjat tuzasiz.',
    'Sahifa skaner qilinadigan bo‘lishi uchun bo‘limlar aniq sarlavhaga ega bo‘ladi. Sarlavha darajasi matnning ko‘rinishiga emas, mazmundagi o‘rniga qarab tanlanadi.',
    '<h1> sahifaning asosiy mavzusi, <h2> uning bo‘limlari, <h3> esa kichik bo‘limlari uchun ishlatiladi. Oddiy matnni <p> bilan belgilang; darajalarni tartib bilan qo‘llang.',
    'Maqola tuzamiz.\n1) <h1>Yashil tabiat</h1> — sahifa mavzusi. 2) <h2>Daraxtlar</h2> — bo‘lim. 3) <p>Daraxtlar havoni tozalashga yordam beradi.</p> — izoh.',
    '“Mening maktabim” mavzusida bitta h1, ikkita h2 va har birining tagida paragraf yozing. h1 ni bir nechta takrorlash kerakmi, izohlang.',
    'Sarlavha tegini faqat kattaroq harf chiqarish uchun tanlamang. Mazmun iyerarxiyasi aniq bo‘lsa, ekran o‘quvchi va qidiruv tizimi sahifani yaxshiroq tushunadi.'
  ),
  'Havola va rasm': lesson(
    'HTML’da havola orqali sahifalar o‘rtasida o‘tiladi, rasm esa mazmunni boyitadi. href, src va alt atributlarini to‘g‘ri yozishni mashq qilasiz.',
    'Havola foydalanuvchiga keyingi manzilni ko‘rsatadi; rasm esa ma’lumot yoki tasvir beradi. Atribut elementga qo‘shimcha xususiyat va manzil beradi.',
    '<a href="manzil">Havola matni</a> havola yaratadi. <img src="rasm.jpg" alt="…"> rasmni yuklaydi; img bo‘sh element. Alt matn rasm mazmunini tasvirlaydi, bezakli rasmda alt="" ishlatilishi mumkin.',
    'Sayt logotipiga havola qo‘shamiz.\n1) <a> elementini oching. 2) href ga https://example.com yozing. 3) Matn qo‘shing: <a href="https://example.com">Saytga o‘tish</a>.',
    'O‘zingiz tanlagan saytga havola va “olma rasmi” uchun img elementi yozing. Rasm yo‘q bo‘lganda foydalanuvchiga ko‘rinadigan mazmunli alt matn kiriting.',
    'Manzil href da, rasm fayli src da yoziladi. Havola matni nimaga olib borishini anglatsin, alt matn esa rasmni ko‘ra olmaydigan foydalanuvchiga yordam bersin.'
  ),
  'CSS nima?': lesson(
    'CSS veb-sahifaning rang, shrift, masofa va joylashuvini boshqaradi. HTML tuzilmasiga zarar bermasdan bir xil uslubni ko‘p elementga qo‘llaysiz.',
    'Bir xil HTML mazmunini turli rang va joylashuvda ko‘rsatish mumkin. CSS taqdimotni tuzilmadan ajratib, sahifani boshqarish va yangilashni osonlashtiradi.',
    'CSS qoidasi tanlovchi va deklaratsiyalardan iborat: p { color: navy; }. color — xususiyat, navy — qiymat. Tashqi .css faylini HTML head qismida link orqali ulash odatiy usul.',
    'Barcha paragraf matnini ko‘k qilamiz.\n1) style.css faylini oching. 2) p tanlovchisini yozing. 3) color: blue; deklaratsiyasini qo‘shing.',
    'h1 sarlavhasini kattaroq va to‘q rangda, p matnini esa o‘qilishi qulay qilib bezaydigan ikkita CSS qoida yozing.',
    'HTML mazmunni belgilaydi, CSS ko‘rinishni. Xususiyatdan keyin ikki nuqta, deklaratsiya oxirida nuqtali vergul yozing; tashqi CSS sahifalar bo‘yicha bir xil dizaynni saqlaydi.'
  ),
  'Tanlovchi va xususiyat': lesson(
    'CSS tanlovchisi qaysi elementga, xususiyat va qiymat esa qanday uslub berilishini belgilaydi. Teg, klass va identifikator tanlovchilarini ishlatasiz.',
    'Bir xil tegdagi elementlarning hammasini yoki faqat belgilangan kartani bezash mumkin. Tanlovchini maqsadga mos tanlash CSS ni tushunarli qiladi.',
    'p teg tanlovchisi barcha paragraflarni tanlaydi; .card klassi class="card" elementlarni tanlaydi; #header id="header" elementini tanlaydi. Klassni qayta ishlatish, id ni esa sahifada noyob saqlash ma’qul.',
    'Faqat ogohlantirish qutisini ranglaymiz.\n1) Elementga class="notice" bering. 2) CSS da .notice yozing. 3) .notice { background-color: #fff3cd; } qoidasini qo‘llang.',
    'Uch paragrafdan faqat ikkinchisiga .important klassini bering va uning matnini qalin ko‘rsating. Nega p emas, klass tanlovchisi kerakligini tushuntiring.',
    'Nuqta klassni, # belgisi id ni bildiradi. Tanlovchini kerakli darajada aniq tanlang; ortiqcha aniq qoidalar keyingi uslubni o‘zgartirishni qiyinlashtiradi.'
  ),
  'Moslashuvchan dizayn': lesson(
    'Moslashuvchan dizayn sahifani telefon, planshet va kompyuter ekranlariga moslaydi. Nisbiy o‘lchamlar, viewport va media query bilan foydalanishni qulay qilasiz.',
    'Kichik ekranda yonma-yon turgan ikki ustun siqilib, matnni o‘qishni qiyinlashtirishi mumkin. Moslashuvchan sahifa ekran kengligiga qarab tartibini o‘zgartiradi.',
    'HTML head ichida viewport meta teg bo‘lsin. Kenglikda % yoki fr kabi mos birliklar, elementlarda max-width:100% ishlating. Media query ma’lum breakpointdan boshlab ustunlar soni yoki shriftni o‘zgartiradi.',
    'Ikki ustunli kartani telefonda bitta ustun qilamiz.\n1) Grid ni display:grid qiling. 2) Kompyuterda grid-template-columns: 1fr 1fr. 3) @media (max-width: 600px) ichida 1fr ga o‘zgartiring.',
    'Rasmli kartaning telefon ekranidan chiqib ketmasligini ta’minlaydigan CSS yozing. Keyin 400px kenglikda sahifani tasavvur qilib, qanday tekshirishni ayting.',
    'Kichik ekrandan boshlanib kattasiga kengayadigan uslubni qo‘llang. Matn, tugma va rasmlarni haqiqiy mobil kenglikda sinab, gorizontal ortiqcha siljishni tekshiring.'
  ),
  'Masofa va vaqt': lesson(
    'Masofa qancha yo‘l bosib o‘tilganini, vaqt esa harakat davomiyligini bildiradi. O‘lchov birliklarini tanlab, masofa-vaqt jadvalini o‘qiysiz.',
    'Avtobus bekatgacha qancha yo‘l yurgani va qancha vaqtda yetgani harakatni tushunishga yordam beradi. Hisobdan avval kattalik va uning birligini aniqlang.',
    'Masofa s bilan, vaqt t bilan belgilanadi. SI birliklari metr (m) va sekund (s); kundalik hisobda km va soat ishlatilishi mumkin. Bir formulada birliklarni moslashtirish lozim: 1 km = 1000 m, 1 soat = 3600 s.',
    '2,4 km ni metrga aylantiramiz.\n1) 1 km = 1000 m. 2) 2,4 × 1000 = 2400. 3) Masofa 2400 m; bu yo‘lni 8 daqiqada bosib o‘tish vaqti 480 sekund.',
    'Velosipedchi 1500 metr yo‘l yursa, bu necha kilometr? 3 daqiqa necha sekund? Har bir javobda birlikni yozing.',
    'Masofa va vaqt — alohida kattaliklar. Sonni birliksiz qoldirmang va formulada qo‘shilayotgan yoki taqqoslanayotgan birliklar mos ekanini tekshiring.'
  ),
  'Tezlikni hisoblash': lesson(
    'Tezlik masofa va vaqt orasidagi bog‘lanishni ko‘rsatadi. v = s/t formulasidan foydalanib, tezlikni hisoblash va natijani izohlashni o‘rganasiz.',
    'Bir xil masofani kim tezroq bosib o‘tganini bilish uchun vaqtni ham hisobga olish zarur. Tezlik masofa vaqt birligida qanchaga o‘zgarishini ko‘rsatadi.',
    'Tekis harakat uchun v = s/t; masofa s = v×t, vaqt t = s/v. Tezlik birligi km/soat yoki m/s bo‘lishi mumkin. Masofa va vaqt birliklari bir-biriga mos bo‘lsin.',
    'Yuguruvchi 100 metrni 20 sekundda bosib o‘tdi.\n1) Formula v=s/t. 2) 100 m ni 20 s ga bo‘lamiz. 3) v=5 m/s.',
    'Mashina 180 km yo‘lni 3 soatda bosdi. O‘rtacha tezligini toping. Keyin shu tezlik saqlansa 5 soatda qancha yo‘l yurishini hisoblang.',
    'Tezlikni topishda masofani vaqtga bo‘ling. Natija birlikda ham yozilsin; s/t va v×t formulalari bir-birini tekshirishga yordam beradi.'
  ),
  'O‘rtacha tezlik': lesson(
    'O‘rtacha tezlik butun yo‘lga ketgan jami vaqt va bosib o‘tilgan jami masofaga qarab topiladi. Turli tezlikda yurgan qismlarni to‘g‘ri birlashtirasiz.',
    'Safarning birinchi qismi tez, ikkinchisi sekin bo‘lishi mumkin. O‘rtacha tezlikni topishda har bir qism tezligini oddiy qo‘shib ikkiga bo‘lish har doim ham to‘g‘ri emas.',
    'O‘rtacha tezlik = jami masofa ÷ jami vaqt. To‘xtash vaqti masalaga kiritilgan bo‘lsa, umumiy vaqtga qo‘shing; bir xil birlikdan foydalaning.',
    '60 km yo‘l 2 soat, keyingi 40 km yo‘l 1 soat davom etdi.\n1) Jami masofa 100 km. 2) Jami vaqt 3 soat. 3) O‘rtacha tezlik 100/3 ≈ 33,3 km/soat.',
    'Piyoda 2 soatda 8 km yurdi, keyin 1 soat dam oldi va yana 4 km ni 1 soatda bosdi. Harakat vaqti bo‘yicha hamda dam olishni qo‘shgan holdagi o‘rtacha tezlikni taqqoslang.',
    'Avval jami masofa va kerakli vaqt oralig‘ini aniqlang. Keyin ularni bo‘ling. O‘rtacha tezlikni alohida qismlarning tezliklari o‘rtachasi deb taxmin qilmang.'
  ),
  'Kuch nima?': lesson(
    'Kuch jismlarning harakat holati yoki shaklini o‘zgartirishi mumkin. Kuch, uning yo‘nalishi va nyuton birligi haqidagi tushunchalarni kundalik misollar bilan o‘rganasiz.',
    'Aravani itarish, to‘pni tepish yoki prujinani cho‘zish — kuch ta’sirining ko‘rinishlari. Kuchni faqat “jism yurdi” deb emas, tezlik, yo‘nalish yoki shakl o‘zgarishi orqali ham payqash mumkin.',
    'Kuch F bilan belgilanadi va SI da nyuton (N) bilan o‘lchanadi. Natijaviy kuch nol bo‘lsa, jismning harakat holati o‘zgarmaydi; kuchlar muvozanatlashmaganida tezlik yoki yo‘nalish o‘zgarishi mumkin.',
    'Aravachani itarganda nima bo‘lishini ko‘ramiz.\n1) Qo‘l aravachaga kuch beradi. 2) Kuch yo‘nalishi oldinga. 3) Aravacha tinch holatdan harakatga keladi; kuch birligi N.',
    'Stol ustidagi kitobga pastga tortish kuchi va stolning tayanch kuchi ta’sir qiladi. Kitob nega tinch turishini kuchlar muvozanati bilan izohlang.',
    'Kuch — yo‘nalishga ega ta’sir. Kuchlar jismning tezligini yoki shaklini o‘zgartirishi mumkin; o‘lchov birligi nyuton ekanini eslang.'
  ),
  'Massa va og‘irlik': lesson(
    'Massa jismdagi modda miqdorini, og‘irlik esa gravitatsiya tufayli jismga ta’sir qiluvchi kuchni ifodalaydi. kg va N birliklarini ajratishni o‘rganasiz.',
    'Tarozida kundalik tilda “vazn” deyiladi, ammo fizikada massa va og‘irlik kuchi boshqa-boshqa tushuncha. Boshqa sayyorada massa o‘zgarmaydi, gravitatsiya boshqacha bo‘lgani uchun og‘irlik kuchi o‘zgarishi mumkin.',
    'Massa m bilan belgilanadi va kilogrammda (kg) o‘lchanadi. Og‘irlik kuchi P yoki Fg bilan belgilanib, P = m·g orqali topiladi; Yer yaqinida g ≈ 9,8 N/kg. Natija nyutonda (N).',
    'Massasi 2 kg jismning Yerda og‘irlik kuchini taxmin qilamiz.\n1) P=m·g. 2) 2×9,8=19,6. 3) Og‘irlik kuchi taxminan 19,6 N.',
    'Massasi 5 kg bo‘lgan jism uchun g≈10 N/kg deb olib, og‘irlik kuchini hisoblang. Javobingiz kg dami yoki N dami bo‘lishini sabablang.',
    'Massa kilogrammda, og‘irlik kuchi nyutonda o‘lchanadi. P=m·g formulasida g tortishish maydonining kuchini bildiradi.'
  ),
  'Energiya va ish': lesson(
    'Mexanik ish kuch siljish hosil qilganda bajariladi, energiya esa ish bajarish qobiliyatini ifodalaydi. Joul birligi, sodda ish formulasi va energiya almashinuvini tushunasiz.',
    'Qutini ko‘tarish, aravani itarish yoki to‘pni tepish energiya uzatilishi va ish bajarilishiga misol bo‘ladi. Jismga kuch qo‘yilib, siljish bo‘lmasa, mexanik ish nol bo‘lishi mumkin.',
    'Kuch siljish yo‘nalishida bo‘lsa, mexanik ish A=F·s; kuch nyutonda, masofa metrda bo‘lsa ish joul (J) chiqadi. Energiya ham joul bilan o‘lchanadi; energiya bir turdan boshqasiga o‘tadi.',
    'Qutini 10 N kuch bilan 3 m ko‘tardik.\n1) A=F·s. 2) 10×3=30. 3) Bajarilgan ish 30 J.',
    '5 N kuch jismni kuch yo‘nalishida 4 m siljitdi. Ishni toping. Keyin jism siljimagan vaziyatda mexanik ish qanday bo‘lishini tushuntiring.',
    'Ish uchun kuch ham, uning yo‘nalishidagi siljish ham kerak. Energiya saqlanadi, lekin foydali energiyaning bir qismi issiqlik kabi boshqa ko‘rinishga o‘tishi mumkin.'
  )
};
