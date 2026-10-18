import type { CSSProperties } from 'react';
const paths: Record<string,string> = {
  grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  book:'M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v16h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3z M12 6v16',
  target:'M21 12a9 9 0 1 1-9-9 M17 12a5 5 0 1 1-5-5 M12 12l9-9 M16 3h5v5',
  flask:'M9 3h6 M10 3v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3 M7 15h10',
  chat:'M21 11a8 8 0 0 1-8 8H7l-4 3V11a9 9 0 0 1 18 0z M8 11h.01 M12 11h.01 M16 11h.01',
  chart:'M4 3v18h17 M8 16v-5 M13 16V7 M18 16V4',
  arrow:'M5 12h14 M13 6l6 6-6 6',
  chevron:'M9 5l7 7-7 7',
  clock:'M12 8v5l3 2 M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  check:'M5 12l4 4L19 6',
  bolt:'M13 2L4 14h7l-1 8 10-13h-7z',
  play:'M8 4l12 8-12 8z',
  pause:'M8 4v16 M16 4v16',
  exit:'M9 4H4v16h5 M10 12h11 M16 7l5 5-5 5',
  users:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M20 21v-2a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 3a4 4 0 0 1 0 8',
  settings:'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',
  shield:'M12 2l9 4v6c0 6-9 10-9 10S3 18 3 12V6z M8 12l3 3 5-6',
  sun:'M12 3v2 M12 19v2 M3 12h2 M19 12h2 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  plus:'M12 5v14 M5 12h14',
  cap:'M2 9l10-5 10 5-10 5z M6 11v6c4 3 8 3 12 0v-6 M22 9v7',
  close:'M6 6l12 12 M6 18L18 6'
};
export function Icon({name,size=20,style}:{name:string;size?:number;style?:CSSProperties}) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name] || paths.book}/></svg>; }
export function Logo() { return <span className="brand"><span className="brand-mark"><Icon name="book" size={23}/></span>ilmora<span className="brand-dot">.</span></span>; }
