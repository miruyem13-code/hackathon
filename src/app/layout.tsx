import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'ILMORA — Zamonaviy ta’lim', description: 'Har kuni kichik qadam. Katta kelajak sari. Dars, interaktiv laboratoriya va diqqatli ta’lim bir joyda.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="uz"><body>{children}</body></html>; }
