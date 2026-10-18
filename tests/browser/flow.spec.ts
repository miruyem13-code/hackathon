import { test, expect, type Page } from '@playwright/test';
const password=process.env.ILMORA_E2E_PASSWORD!;
async function login(page:Page,role:string) {
  await page.goto('/login');await page.getByLabel('Email manzil').fill(`${role}@ilmora.local`);await page.getByLabel('Parol',{exact:true}).fill(password);await page.getByRole('button',{name:'Hisobga kirish'}).click();await expect(page).toHaveURL(new RegExp(`/${role}$`));
}
test('To‘liq oqim: Focus → dars → lab → test → parent → teacher javobi',async({page,browser})=>{
  await page.goto('/student');await expect(page).toHaveURL(/\/login$/);
  await login(page,'student');await expect(page.getByRole('heading',{name:/Salom, Aziza/})).toBeVisible();
  await page.screenshot({path:'artifacts/dashboard-desktop.png',fullPage:true});
  await page.getByLabel('Maqsadingiz').fill('Kasrlarni amalda tushunib olish');await page.getByRole('button',{name:'Focusni boshlash'}).click();await expect(page.getByRole('button',{name:'Pauza',exact:true})).toBeVisible();
  const before=await(await page.request.get('/api/focus')).json();await page.reload();await expect(page.getByRole('button',{name:'Pauza',exact:true})).toBeVisible();
  const after=await(await page.request.get('/api/focus')).json();expect(after.current.id).toBe(before.current.id);expect(after.current.deadline).toBe(before.current.deadline);
  await page.getByRole('button',{name:'Pauza',exact:true}).click();await page.reload();await expect(page.getByRole('button',{name:'Davom etish',exact:true})).toBeVisible();await page.getByRole('button',{name:'Davom etish',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/dashboard-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  await page.getByRole('link',{name:'O‘rganishni davom ettirish'}).click();await expect(page.getByRole('heading',{name:'Butunning bir bo‘lagi',exact:true})).toBeVisible();
  for(let i=0;i<4;i++)await page.getByRole('button',{name:'Keyingi',exact:true}).click();await page.getByRole('button',{name:'Darsni tugatish'}).click();await expect(page.getByText('Dars tugallandi!')).toBeVisible();
  await page.reload();await expect(page.getByRole('heading',{name:'Kasrlarni qo‘shib ko‘ramiz'})).toBeVisible();
  await page.getByRole('tab',{name:'Laboratoriya',exact:true}).click();
  const denominator=page.getByRole('slider',{name:/Maxraj/});await denominator.focus();await denominator.press('Home');for(let i=0;i<7;i++)await denominator.press('ArrowRight');
  const numerator=page.getByRole('slider',{name:/Surat/});await numerator.focus();await numerator.press('Home');for(let i=0;i<6;i++)await numerator.press('ArrowRight');
  await expect(page.locator('.lab-number')).toContainText('6/8');await expect(page.locator('.lab-number')).toContainText('75.0');
  await page.getByLabel('Tajriba xulosangiz').fill('3/4 va 6/8 bir xil: ikkalasi ham butunning 75 foizini ko‘rsatadi.');await page.getByRole('button',{name:'Ustozga topshirish',exact:true}).click();await expect(page.getByText('Xulosangiz ustozga topshirildi.')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:'artifacts/laboratory-mobile.png',fullPage:true});
  await page.getByRole('tab',{name:'Test va imtihon'}).click();await page.locator('.assessment-option').first().getByRole('button',{name:'Boshlash'}).click();
  await expect(page.locator('.question')).toHaveCount(5);
  const choices=[1,1,2,2,1];for(let i=0;i<choices.length;i++)await page.locator('.question').nth(i).locator('.answer-option').nth(choices[i]).click();
  await page.reload();await expect(page.locator('.question')).toHaveCount(5);await expect(page.locator('input[type=radio]:checked')).toHaveCount(5);
  await page.getByRole('button',{name:'Testni yakunlash'}).click();await expect(page.getByRole('heading',{name:'Ajoyib, uddaladingiz!'})).toBeVisible();await expect(page.locator('.result-circle')).toContainText('100');
  await page.reload();await expect(page.locator('.result-circle')).toContainText('100');
  const rewards=await(await page.request.get('/api/reports')).json();expect(rewards.reports[0].xp).toBe(75);
  await page.getByRole('tab',{name:'Ustozga savol',exact:true}).click();await page.getByLabel('Savol',{exact:true}).fill('Nima uchun 3/4 va 6/8 kasrlari teng?');await page.getByRole('button',{name:'Savolni yuborish'}).click();await expect(page.getByText('Savolingiz yuborildi.')).toBeVisible();
  const parentContext=await browser.newContext(),parent=await parentContext.newPage();await login(parent,'parent');await expect(parent.getByText('Aziza Karimova',{exact:true})).toBeVisible();await expect(parent.locator('.score-badge')).toHaveText('100%');await expect(parent.getByText(/3\/4 va 6\/8 bir xil:/)).toBeVisible();
  await parent.setViewportSize({width:390,height:844});expect(await parent.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
  expect((await parent.request.get('/api/admin/content')).status()).toBe(403);
  const teacherContext=await browser.newContext(),teacher=await teacherContext.newPage();await login(teacher,'teacher');await teacher.getByRole('button',{name:'Savollar qutisi',exact:true}).first().click();await expect(teacher.getByText('Nima uchun 3/4 va 6/8 kasrlari teng?')).toBeVisible();await teacher.getByLabel('Javobingiz').fill('Surat va maxrajni 2 ga ko‘paytirsak, kasr qiymati o‘zgarmaydi.');await teacher.getByRole('button',{name:'Javobni saqlash'}).click();await expect(teacher.getByText('Javob saqlandi.')).toBeVisible();
  await page.reload();await page.getByRole('tab',{name:'Ustozga savol',exact:true}).click();await expect(page.getByText('Surat va maxrajni 2 ga ko‘paytirsak, kasr qiymati o‘zgarmaydi.')).toBeVisible();
  await teacher.screenshot({path:'artifacts/teacher-desktop.png',fullPage:true});
  await parentContext.close();await teacherContext.close();
});
test('Admin formasi va o‘quvchining kabinet/API himoyasi',async({page,browser})=>{
  await login(page,'admin');await expect(page.getByRole('heading',{name:'Bilim makonini boshqaring'})).toBeVisible();
  await page.getByLabel('Sarlavha',{exact:true}).fill('Geometriyaga kirish');await page.getByLabel('Fan',{exact:true}).fill('Matematika');await page.getByLabel('Tavsif',{exact:true}).fill('Yangi fan kontenti bazadan boshqariladi.');await page.getByRole('button',{name:'O‘zgarishlarni saqlash'}).click();await expect(page.getByText('O‘zgarishlar bazaga saqlandi.')).toBeVisible();
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();await page.screenshot({path:'artifacts/admin-mobile.png',fullPage:true});
  const ctx=await browser.newContext(),student=await ctx.newPage();await login(student,'student');await student.goto('/admin');await expect(student).toHaveURL(/\/student$/);expect((await student.request.get('/api/admin/content')).status()).toBe(403);expect((await student.request.post('/api/auth/register',{data:{name:'Hacker',email:'blocked@example.uz',password,role:'admin'}})).status()).toBe(403);await ctx.close();
});
test('Mobil landing, ochiq registratsiya va hisobdan chiqish',async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.getByRole('heading',{name:/Bilimga bir qadam/})).toBeVisible();
  const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).map(e=>({tag:e.tagName,cls:e.className,right:Math.round(e.getBoundingClientRect().right)}))}));
  expect(overflow.scroll,JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width);await page.screenshot({path:'artifacts/landing-mobile.png',fullPage:true});
  await page.getByRole('link',{name:'O‘rganishni boshlash'}).click();await page.getByLabel('Ism va familiya').fill('Yangi Demo O‘quvchi');await page.getByLabel('Email manzil').fill('browser-new@example.uz');await page.getByLabel('Parol',{exact:true}).fill(password);await page.getByRole('button',{name:'Hisob yaratish'}).click();await expect(page).toHaveURL(/\/student$/);await expect(page.getByRole('heading',{name:/Salom, Yangi/})).toBeVisible();
  await page.getByRole('button',{name:'Hisobdan chiqish',exact:true}).click();await expect(page).toHaveURL(/\/login$/);await page.goto('/student');await expect(page).toHaveURL(/\/login$/);
});
test('Profil, dark mode va 360px fizik laboratoriya',async({page})=>{
  await page.setViewportSize({width:360,height:800});await login(page,'student');
  await page.getByRole('button',{name:'Profilim'}).click();await expect(page.getByRole('heading',{name:'Profilim'})).toBeVisible();
  await expect(page.getByLabel('Email manzil')).toHaveAttribute('readonly','');
  await page.getByRole('button',{name:'Qorong‘i rejimga o‘tish'}).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');await page.reload();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  const courses=await(await page.request.get('/api/courses')).json();const physics=courses.courses.find((c:any)=>c.title==='Fizika: harakat va kuch');const speed=physics.modules.flatMap((m:any)=>m.lessons).find((l:any)=>l.title==='Tezlikni hisoblash');const me=await(await page.request.get('/api/auth/me')).json();
  await page.evaluate(({userId,lessonId})=>sessionStorage.setItem(`ilmora-ai:${userId}:${lessonId}`,JSON.stringify({messages:[{role:'user',content:'Oldingi savolim'},{role:'assistant',content:'Oldingi saqlangan javob'}],draft:'Saqlangan qoralama'})),{userId:me.user.id,lessonId:speed.id});
  await page.goto(`/lessons/${speed.id}`);await expect(page.getByRole('button',{name:'ILMORA yordamchini ochish'})).toBeVisible();await page.getByRole('button',{name:'ILMORA yordamchini ochish'}).click();await expect(page.getByText('AI ulanmagan',{exact:true})).toBeVisible();await expect(page.getByText('AI_API_KEY',{exact:true})).toBeVisible();await expect(page.getByText('Oldingi saqlangan javob')).toBeVisible();await expect(page.getByLabel('Xabaringiz')).toHaveValue('Saqlangan qoralama');await expect(page.getByLabel('Xabaringiz')).toBeEnabled();await page.getByRole('button',{name:'Xabar yuborish'}).click();await expect(page.getByText(/Yozgan savolingiz saqlanadi/)).toBeVisible();await expect(page.getByLabel('Xabaringiz')).toHaveValue('Saqlangan qoralama');
  await page.getByRole('button',{name:'Kichraytirish'}).click();await page.getByRole('button',{name:'ILMORA yordamchini ochish'}).click();await expect(page.getByText('Oldingi saqlangan javob')).toBeVisible();await expect(page.getByLabel('Xabaringiz')).toHaveValue('Saqlangan qoralama');await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'ILMORA yordamchi'})).toHaveCount(0);await expect(page.getByRole('button',{name:'ILMORA yordamchini ochish'})).toBeFocused();
  await page.setViewportSize({width:360,height:800});await page.getByRole('button',{name:'ILMORA yordamchini ochish'}).click();await expect(page.getByRole('dialog',{name:'ILMORA yordamchi'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();await page.getByRole('button',{name:'Yopish'}).click();await page.getByRole('tab',{name:'Laboratoriya',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Harakat va tezlik simulyatori'})).toBeVisible();await expect(page.getByText('v = 6.00 m/s')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
  await page.getByRole('button',{name:'Yorug‘ rejimga o‘tish'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
});
