'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@/lib/auth';

type Message={role:'user'|'assistant';content:string};
type ContextLesson={id:number;title:string;description?:string};
const quickActions=[
  {label:'Soddaroq tushuntir',action:'explain'},
  {label:'Kodimni tushuntir',action:'code'},
  {label:'Yana misol',action:'example'},
  {label:'Savol bilan tekshir',action:'quiz'}
];

export function AIChatWidget({user,lesson:lessonProp}:{user:User;lesson?:ContextLesson|null}) {
  const [lesson,setLesson]=useState<ContextLesson|null>(lessonProp||null);
  const [configured,setConfigured]=useState<boolean|null>(null),[configError,setConfigError]=useState('');
  const [open,setOpen]=useState(false),[messages,setMessages]=useState<Message[]>([]),[draft,setDraft]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [retry,setRetry]=useState<{action:string;text:string}|null>(null),[ready,setReady]=useState(false);
  const busyRef=useRef(false),abortRef=useRef<AbortController|null>(null),bottomRef=useRef<HTMLDivElement|null>(null),inputRef=useRef<HTMLTextAreaElement|null>(null),launcherRef=useRef<HTMLButtonElement|null>(null);
  const storageKey=useMemo(()=>`ilmora-ai:${user.id}:${lesson?.id||'default'}`,[user.id,lesson?.id]);

  useEffect(()=>{setLesson(lessonProp||null);},[lessonProp?.id,lessonProp?.title]);
  useEffect(()=>{
    let cancelled=false;
    fetch('/api/ai/status',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'AI holatini aniqlab bo‘lmadi.');return d;}).then(d=>{if(!cancelled){setConfigured(Boolean(d.configured));setConfigError('');}}).catch(()=>{if(!cancelled){setConfigured(null);setConfigError('AI holatini serverdan tekshirib bo‘lmadi. Aloqani tekshirib, qayta oching.');}});
    if(!lessonProp) fetch('/api/courses',{cache:'no-store'}).then(r=>r.json()).then(d=>{
      if(cancelled||!d.courses)return;
      const allLessons=d.courses.flatMap((c:any)=>c.modules.flatMap((m:any)=>m.lessons));
      const current=allLessons.find((l:any)=>!l.completed&&(l.slide>0))||allLessons.find((l:any)=>!l.completed)||allLessons[0];
      if(current)setLesson({id:current.id,title:current.title,description:current.description});
    }).catch(()=>{});
    return()=>{cancelled=true;};
  },[lessonProp?.id]);
  useEffect(()=>{
    setReady(false);setError('');setRetry(null);
    try { const saved=sessionStorage.getItem(storageKey);const value=saved?JSON.parse(saved):null;setMessages(Array.isArray(value?.messages)?value.messages.slice(-24):[]);setDraft(typeof value?.draft==='string'?value.draft:''); }
    catch { setMessages([]);setDraft(''); }
    setReady(true);
  },[storageKey]);
  useEffect(()=>{if(!ready)return;try{sessionStorage.setItem(storageKey,JSON.stringify({messages:messages.slice(-24),draft}));}catch{}}
  ,[ready,storageKey,messages,draft]);
  useEffect(()=>{if(open)inputRef.current?.focus();},[open]);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:'smooth',block:'end'});},[messages,busy,open]);
  useEffect(()=>{
    if(!open)return;
    const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();setOpen(false);window.setTimeout(()=>launcherRef.current?.focus(),0);}};
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[open]);
  useEffect(()=>()=>abortRef.current?.abort(),[]);

  const ask=useCallback(async(action:string,text:string)=>{
    if(busyRef.current||!lesson)return;
    if(!configured){setError('AI javob berishi uchun serverda API kaliti kerak. Yozgan savolingiz saqlanadi.');return;}
    busyRef.current=true;setBusy(true);setError('');setRetry(null);setOpen(true);
    const userMessage=text.trim()||quickActions.find(item=>item.action===action)?.label||'Joriy darsni tushuntir.';
    const prior=messages.slice(-8);
    setMessages(old=>[...old,{role:'user' as const,content:userMessage},{role:'assistant' as const,content:''}].slice(-24));setDraft('');
    const controller=new AbortController();abortRef.current=controller;
    const timeout=window.setTimeout(()=>controller.abort(),30000);
    try {
      const response=await fetch('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({lessonId:lesson.id,action,question:userMessage,history:prior,stream:true}),signal:controller.signal,cache:'no-store'});
      if(!response.ok){const d=await response.json().catch(()=>({}));throw new Error(d.error||'AI javob bera olmadi. Qayta urinib ko‘ring.');}
      if(response.headers.get('content-type')?.includes('text/event-stream')&&response.body){
        const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',answer='';
        while(true){const {done,value}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';for(const line of lines){if(!line.startsWith('data:'))continue;const payload=line.slice(5).trim();if(payload==='[DONE]')continue;try{const chunk=JSON.parse(payload).choices?.[0]?.delta?.content;if(typeof chunk==='string'){answer+=chunk;setMessages(old=>old.map((message,index)=>index===old.length-1?{...message,content:answer}:message));}}catch{}}}
        if(!answer.trim())throw new Error('AI bo‘sh javob qaytardi. Qayta urinib ko‘ring.');
      } else {
        const data=await response.json();if(typeof data.answer!=='string'||!data.answer.trim())throw new Error('AI bo‘sh javob qaytardi. Qayta urinib ko‘ring.');
        setMessages(old=>old.map((message,index)=>index===old.length-1?{...message,content:data.answer}:message));
      }
    } catch(e) {
      const message=controller.signal.aborted?'AI javobini kutish vaqti tugadi. Qayta urinib ko‘ring.':(e as Error).message||'Tarmoq bilan aloqa uzildi. Qayta urinib ko‘ring.';
      setMessages(old=>old.filter((item,index)=>!(index===old.length-1&&item.role==='assistant'&&!item.content)));
      setError(message);setRetry({action,text:userMessage});
    } finally {window.clearTimeout(timeout);abortRef.current=null;busyRef.current=false;setBusy(false);}
  },[configured,lesson,messages]);
  const send=(event:React.FormEvent)=>{event.preventDefault();if(draft.trim())void ask('ask',draft);};
  const keyDown=(event:React.KeyboardEvent<HTMLTextAreaElement>)=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();if(draft.trim())void ask('ask',draft);}};
  if(user.role!=='student')return null;
  return <div className="ilmora-ai-widget">
    {!open&&<button ref={launcherRef} className="ilmora-ai-launcher" aria-label="ILMORA yordamchini ochish" aria-expanded={open} onClick={()=>setOpen(true)}><span aria-hidden="true">✦</span><span>AI yordamchi</span></button>}
    {open&&<section className="ilmora-ai-panel" role="dialog" aria-modal="false" aria-label="ILMORA yordamchi">
      <header className="ilmora-ai-header"><div className="ilmora-ai-brand"><span className="ilmora-ai-mark" aria-hidden="true">✦</span><div><b>ILMORA yordamchi</b><small>{lesson?.title||'Dars tanlanmagan'}</small></div></div><div className="ilmora-ai-window-actions"><button type="button" aria-label="Kichraytirish" title="Kichraytirish" onClick={()=>setOpen(false)}>−</button><button type="button" aria-label="Yopish" title="Yopish" onClick={()=>setOpen(false)}>×</button></div></header>
      <div className="ilmora-ai-status">{configured===null?(configError?'AI holati tekshirilmayapti':'AI holati tekshirilmoqda…'):configured?'Dars materialiga tayangan yordam':'AI ulanmagan'}</div>
      <div className="ilmora-ai-messages" aria-live="polite" aria-relevant="additions text">
        {configured===false&&<div className="ilmora-ai-notice">AI ishlashi uchun serverda <code>AI_API_KEY</code> yoki <code>OPENAI_API_KEY</code> sozlang.</div>}{configError&&<div className="ilmora-ai-error" role="alert">{configError}</div>}
        {!messages.length&&<div className="ilmora-ai-empty"><b>Salom, {user.name.split(' ')[0]}!</b><span>{lesson?`“${lesson.title}” bo‘yicha qanday yordam beray?`:'Kurs ochilganda savolingizni joriy dars mazmuni bilan yuboraman.'}</span></div>}
        {messages.map((message,index)=><div key={`${index}-${message.role}`} className={`ilmora-ai-message ${message.role}`}><span>{message.role==='user'?'Siz':'ILMORA'}</span><p>{message.content|| (busy&&index===messages.length-1?'Javob yozilmoqda…':'')}</p></div>)}
        {error&&<div className="ilmora-ai-error" role="alert">{error}{retry&&!busy&&configured&&<button type="button" onClick={()=>void ask(retry.action,retry.text)}>Qayta urinish</button>}</div>}
        <div ref={bottomRef}/>
      </div>
      <div className="ilmora-ai-quick-actions">{quickActions.map(item=><button key={item.action} type="button" disabled={!configured||configured===null||busy||!lesson} onClick={()=>void ask(item.action,item.action==='code'?draft:'')}>{item.label}</button>)}</div>
      <form className="ilmora-ai-form" onSubmit={send}><label className="sr-only" htmlFor="ilmora-ai-input">Xabaringiz</label><textarea id="ilmora-ai-input" ref={inputRef} rows={2} value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={keyDown} placeholder={lesson?'Savolingizni yozing...':'Darsni oching'} disabled={busy||!lesson} maxLength={1200}/><button type="submit" aria-label="Xabar yuborish" disabled={busy||!draft.trim()||!lesson}>{busy?'…':'Yuborish'}</button></form>
      <div className="ilmora-ai-footnote">Enter — yuborish · Shift+Enter — yangi qator</div>
    </section>}
  </div>;
}
