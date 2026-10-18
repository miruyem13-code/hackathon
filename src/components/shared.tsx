'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon, Logo } from './icons';
import type { User } from '@/lib/auth';
export async function api(path:string, body?:unknown) {
  const isRead = body === undefined;
  const options:RequestInit = { method:isRead ? 'GET' : 'POST', headers:isRead ? {} : {'Content-Type':'application/json'}, body:isRead ? undefined : JSON.stringify(body), cache:'no-store' };
  let response:Response;
  // Safe reads can be retried once after a brief server restart or transient disconnect.
  for (let attempt=0;;attempt++) {
    try {
      response = await fetch(`/api/${path}`, options);
      break;
    } catch (error) {
      if (isRead && attempt===0 && error instanceof TypeError) {
        await new Promise(resolve=>window.setTimeout(resolve,350));
        continue;
      }
      if (error instanceof DOMException && error.name==='AbortError') throw new Error('So‘rov vaqti tugadi. Qayta urinib ko‘ring.');
      throw new Error(isRead
        ? 'Server bilan aloqa uzildi. Internetni tekshirib, sahifani qayta yuklang.'
        : 'Javob serverdan olinmadi. Amal saqlangan bo‘lishi mumkin — holatini tekshirib, keyin qayta urinib ko‘ring.');
    }
  }
  let data:any;
  try { data=await response.json(); }
  catch { throw new Error('Server javobi o‘qilmadi. Sahifani qayta yuklab, yana urinib ko‘ring.'); }
  if (!response.ok) throw new Error(data?.error || (response.status>=500
    ? 'Serverda vaqtinchalik xatolik. Birozdan so‘ng qayta urinib ko‘ring.'
    : 'So‘rov bajarilmadi. Kiritilgan ma’lumotlarni tekshirib ko‘ring.'));
  return data;
}
export function formatTime(ms:number) { const s=Math.max(0,Math.ceil(ms/1000)); return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`; }
const months=['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
export function uzDate(n:number,withTime=false) {
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Tashkent',day:'numeric',month:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(n).map(x=>[x.type,x.value]));
  return `${p.day}-${months[Number(p.month)-1]}${withTime?`, ${p.hour}:${p.minute}`:''}`;
}
export const dateText = (n:number) => uzDate(n,true);
export const roleText:Record<string,string> = {student:'O‘quvchi',parent:'Ota-ona',teacher:'Ustoz',admin:'Administrator'};
export function Alert({children,success=false}:{children:React.ReactNode;success?:boolean}) { return <div className={`alert ${success?'success':''}`} role={success?'status':'alert'}>{children}</div>; }
export function Empty({children}:{children:React.ReactNode}) { return <div className="empty"><Icon name="book" size={30}/><p>{children}</p></div>; }
export function Avatar({user,size=''}:{user:{name:string;avatar?:string};size?:string}) { return <span className={`avatar ${user.avatar || 'orange'} ${size}`}>{user.name.split(' ').map(s=>s[0]).slice(0,2).join('')}</span>; }
export function ProfilePanel({user}:{user:User}) {
  const [name,setName]=useState(user.name),[avatar,setAvatar]=useState(user.avatar),[error,setError]=useState(''),[success,setSuccess]=useState(''),[busy,setBusy]=useState(false);
  const save=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setSuccess('');try{await api('profile',{name,avatar});setSuccess('Profil saqlandi.');window.setTimeout(()=>window.location.reload(),500);}catch(e){setError((e as Error).message);}finally{setBusy(false);}};
  return <div className="profile-page"><div className="page-heading"><div><span className="eyebrow">SHAXSIY MA’LUMOTLAR</span><h1>Profilim</h1><p>Ismingiz va avataringizni barcha kabinetlarda yangilang.</p></div><Avatar user={{name,avatar}} size="large"/></div><section className="card profile-card"><form onSubmit={save}><label>Ism va familiya<input value={name} onChange={e=>setName(e.target.value)} minLength={2} maxLength={80} required/></label><label>Email manzil<input value={user.email} readOnly aria-readonly="true"/><small className="fine-print">Emailni administrator orqali o‘zgartirish mumkin.</small></label><fieldset className="avatar-options"><legend>Avatar rangini tanlang</legend><div className="button-row">{['orange','blue','green','purple'].map(color=><button key={color} type="button" aria-label={`${color} avatar`} aria-pressed={avatar===color} className={`avatar ${color} ${avatar===color?'avatar-chosen':''}`} onClick={()=>setAvatar(color)}>{name.trim().split(/\s+/).map(x=>x[0]).slice(0,2).join('').toUpperCase()}</button>)}</div></fieldset>{error&&<Alert>{error}</Alert>}{success&&<Alert success>{success}</Alert>}<button className="btn primary" disabled={busy}>{busy?'Saqlanmoqda…':'Profilni saqlash'}</button></form></section><section className="card profile-role"><span className="icon-badge blue"><Icon name="shield"/></span><div><b>Hisob turi</b><p className="muted">{roleText[user.role]}</p></div><span className="pill">Himoyalangan</span></section></div>;
}
export function Shell({user,tab,setTab,children,focusMode=false}:{user:User;tab:string;setTab?:(tab:string)=>void;children:React.ReactNode;focusMode?:boolean}) {
  const [error,setError]=useState(''),[theme,setTheme]=useState<'light'|'dark'>('light');
  const links=user.role==='student' ? [['home','grid','Bosh sahifa'],['courses','book','Mening kurslarim'],['focus','target','Focus va vaqt'],['results','chart','Natijalarim'],['support','chat','Ustozga savol']] : user.role==='admin' ? [['home','grid','Boshqaruv paneli'],['content','book','Kurs va darslar'],['relations','users','Bog‘lanishlar']] : [['home','grid','Bosh sahifa'],['results','chart','O‘quvchi natijalari'],...(user.role==='teacher'?[['support','chat','Savollar qutisi']]:[])];
  const navLinks=[...links,['profile','users','Profilim']];
  useEffect(()=>{const saved=localStorage.getItem('ilmora-theme');const initial=saved==='dark'||saved==='light'?saved:window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=initial;setTheme(initial);},[]);
  const toggleTheme=()=>{const next=theme==='dark'?'light':'dark';document.documentElement.dataset.theme=next;localStorage.setItem('ilmora-theme',next);setTheme(next);};
  const logout=async()=>{try{await api('auth/logout',{});window.location.href='/login';}catch(e){setError((e as Error).message);}};
  return <div className={`app-shell ${focusMode?'focus-mode':''}`}><aside className="sidebar"><a href={`/${user.role}`} className="logo-link" aria-label="ILMORA bosh sahifa"><Logo/></a><div className="workspace-label">SHAXSIY KABINET</div><nav aria-label="Asosiy menyu">{navLinks.map(([id,icon,title])=>setTab?<button key={id} className={`nav-item ${tab===id?'selected':''}`} onClick={()=>setTab(id)}><Icon name={icon}/><span>{title}</span>{tab===id&&<span className="nav-dot"/>}</button>:<a key={id} className={`nav-item ${tab===id?'selected':''}`} href={`/${user.role}?tab=${id}`}><Icon name={icon}/><span>{title}</span></a>)}</nav><div className="sidebar-tip"><span className="tip-icon"><Icon name="sun" size={24}/></span><b>Kelajagingiz bugundan</b><p>Har bir kichik qadam — katta imkoniyat sari.</p></div><div className="sidebar-bottom"><div className="user-mini"><Avatar user={user}/><div><b>{user.name}</b><small>{roleText[user.role]}</small></div></div><button className="logout" onClick={logout}><Icon name="exit" size={18}/> Hisobdan chiqish</button>{error&&<Alert>{error}</Alert>}</div></aside><div className="main-wrap"><header className="topbar"><div className="breadcrumb">Mening makonim <span>/</span><b>{navLinks.find(l=>l[0]===tab)?.[2] || 'Dars xonasi'}</b></div><div className="topbar-right"><button className="theme-toggle" onClick={toggleTheme} aria-label={theme==='dark'?'Yorug‘ rejimga o‘tish':'Qorong‘i rejimga o‘tish'} title={theme==='dark'?'Yorug‘ rejim':'Qorong‘i rejim'}><span aria-hidden="true">{theme==='dark'?'☀':'◐'}</span><span>{theme==='dark'?'Yorug‘':'Qorong‘i'}</span></button><span className="today"><Icon name="sun" size={17}/> O‘rganish uchun ajoyib kun</span><a href={`/${user.role}?tab=profile`} aria-label="Profilim"><Avatar user={user} size="small"/></a><button className="header-logout" aria-label="Hisobdan chiqish" onClick={logout}><Icon name="exit" size={18}/></button></div></header><main className="main-content">{children}</main><footer className="app-footer"><span>© {new Date().getFullYear()} ILMORA</span><span>Bilim bilan yangi imkoniyatlar sari.</span></footer></div></div>;
}
export function useFocus() {
  const [current,setCurrent]=useState<any>(null),[history,setHistory]=useState<any[]>([]),[now,setNow]=useState(Date.now()),[error,setError]=useState('');
  const offset=useRef(0), lastActivity=useRef(Date.now());
  const refresh=useCallback(async()=>{const d=await api('focus');offset.current=d.serverTime-Date.now();setCurrent(d.current);setHistory(d.history);},[]);
  useEffect(()=>{refresh().catch(e=>setError(e.message)); const tick=setInterval(()=>setNow(Date.now()+offset.current),1000);return()=>clearInterval(tick);},[refresh]);
  useEffect(()=>{
    const activity=()=>{lastActivity.current=Date.now();};
    const heartbeat=async()=>{try{const d=await api('focus',{action:'heartbeat',active:document.visibilityState==='visible'&&Date.now()-lastActivity.current<60000});offset.current=d.serverTime-Date.now();setCurrent(d.current);setHistory(rows=>rows.map(r=>r.id===d.current?.id?{...r,...d.current}:r));}catch(e){setError((e as Error).message);}};
    for(const event of ['pointerdown','pointermove','keydown','scroll','touchstart']) window.addEventListener(event,activity,{passive:true});
    if(current?.state==='running') { const id=setInterval(heartbeat,10000);document.addEventListener('visibilitychange',heartbeat);return()=>{clearInterval(id);document.removeEventListener('visibilitychange',heartbeat);for(const event of ['pointerdown','pointermove','keydown','scroll','touchstart'])window.removeEventListener(event,activity);}; }
    return()=>{for(const event of ['pointerdown','pointermove','keydown','scroll','touchstart'])window.removeEventListener(event,activity);};
  },[current?.id,current?.state]);
  const action=async(action:string,extra:Record<string,unknown>={})=>{setError('');try{const d=await api('focus',{action,...extra});offset.current=d.serverTime-Date.now();setCurrent(d.current);await refresh();}catch(e){setError((e as Error).message);}};
  return {current,history,now,error,action,refresh};
}
export function FocusPanel({focus,lessons,compact=false}:{focus:ReturnType<typeof useFocus>;lessons:any[];compact?:boolean}) {
  const [goal,setGoal]=useState(''),[lessonId,setLessonId]=useState('');
  const c=focus.current, active=c&&c.state!=='completed';
  const remaining=active?(c.state==='paused'?c.remaining_ms:Math.max(0,c.deadline-focus.now)):25*60000;
  const today=new Date().toDateString(); const sessions=focus.history.filter(s=>new Date(s.created_at).toDateString()===today);
  return <section className={`card focus-card ${compact?'compact':''}`}><div className="card-heading"><h3><span className="icon-badge orange"><Icon name="target"/></span>Focus vaqti</h3><span className="pill">25 / 5</span></div><p className="muted">Bir maqsad. To‘liq diqqat.</p><div className={`timer-ring ${active?'active':''}`}><div><span className="timer-digits">{formatTime(remaining)}</span><small>{active?(c.state==='paused'?'Pauza':c.phase==='break'?'Tanaffus vaqti':'O‘rganish vaqti'):'Boshlashga tayyormisiz?'}</small></div></div>{active?<><p className="focus-goal">{c.goal}</p><div className="button-row"><button className="btn primary" onClick={()=>focus.action(c.state==='paused'?'resume':'pause')}><Icon name={c.state==='paused'?'play':'pause'} size={16}/>{c.state==='paused'?'Davom etish':'Pauza'}</button><button className="btn secondary" onClick={()=>focus.action('finish')}>Yakunlash</button></div><p className="fine-print">Taxminiy faol o‘qish: {Math.floor(c.active_seconds/60)} daq {c.active_seconds%60} son.</p></>:<form onSubmit={e=>{e.preventDefault();focus.action('start',{goal,lessonId:Number(lessonId||lessons[0]?.id)});}}><label>Maqsadingiz<input placeholder="Masalan, kasrlarni tushunib olish" value={goal} onChange={e=>setGoal(e.target.value)} minLength={3} maxLength={200} required/></label><label>Dars<select value={lessonId||lessons[0]?.id||''} onChange={e=>setLessonId(e.target.value)} required>{lessons.map(l=><option key={l.id} value={l.id}>{l.title}</option>)}</select></label><button className="btn primary full" disabled={!lessons.length}><Icon name="play" size={16}/> Focusni boshlash</button></form>}{focus.error&&<Alert>{focus.error}</Alert>}<div className="focus-totals"><div><b>{sessions.length}</b><span>bugungi sessiya</span></div><div><b>{Math.floor(sessions.reduce((n,s)=>n+s.active_seconds,0)/60)}</b><span>faol daqiqa</span></div></div><p className="fine-print">Yashirin yoki 60 soniya harakatsiz sahifa faol vaqtga qo‘shilmaydi. Taymer XP bermaydi.</p></section>;
}
export function Fraction({numerator,denominator,large=false}:{numerator:number;denominator:number;large?:boolean}) {
  const pct=Math.min(100,numerator/denominator*100);
  return <div className={`fraction-visual ${large?'large':''}`}><div className="fraction-disc" style={{background:`conic-gradient(var(--orange) 0% ${pct}%, #f9e8db ${pct}% 100%)`}}>{Array.from({length:denominator},(_,i)=><span key={i} className="disc-line" style={{transform:`rotate(${i*360/denominator}deg)`}}/>)}<span className="disc-center"/></div><span className="fraction-shadow"/></div>;
}
