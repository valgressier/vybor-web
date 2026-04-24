import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Vybor — Partagez vos opinions',
  description:
    "Vybor est l'app mobile pour partager et découvrir des opinions sous forme de sondages.",
  icons: { icon: '/icon.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Prevent flash: apply dark class before React hydration if stored */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem('theme')==='dark')document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
