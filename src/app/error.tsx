'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <div className="error-page"><h1>Sahifani yuklab bo‘lmadi</h1><p>Server holatini tekshiring va qayta urinib ko‘ring.</p><button className="btn primary" onClick={reset}>Qayta urinish</button></div>;}
