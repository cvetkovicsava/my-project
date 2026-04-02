'use client';

import Link from 'next/link';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { useTheme } from '@/components/providers/theme-provider';

export default function NotFound() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center"
      style={{ background: isDark ? '#07010f' : '#f3f0ff' }}
    >
      <WovenCanvas position="fixed" />

      <div
        className="relative z-10 text-center px-6 py-12 rounded-3xl max-w-md mx-auto"
        style={{
          background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 0 60px rgba(129,140,248,0.08), 0 4px 32px rgba(0,0,0,0.15)',
        }}
      >
        <p
          className="text-8xl font-thin mb-4 tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #818cf8, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </p>
        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}
        >
          Stranica nije pronađena
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}
        >
          URL koji tražiš ne postoji ili je premještena.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #a855f7)',
              color: 'white',
              boxShadow: '0 0 20px rgba(129,140,248,0.35)',
            }}
          >
            Idi na početnu
          </Link>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
