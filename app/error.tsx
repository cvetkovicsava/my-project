'use client';

import { useEffect } from 'react';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { useTheme } from '@/components/providers/theme-provider';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    console.error('[Error boundary]', error);
  }, [error]);

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
          border: '1px solid rgba(248,113,113,0.2)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          boxShadow: '0 0 60px rgba(248,113,113,0.08), 0 4px 32px rgba(0,0,0,0.15)',
        }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
        >
          <AlertTriangle size={24} color="#f87171" />
        </div>

        <h1
          className="text-xl font-semibold mb-2"
          style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}
        >
          Nešto je pošlo po krivu
        </h1>
        <p
          className="text-sm mb-2"
          style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)' }}
        >
          Došlo je do neočekivane greške. Pokušaj ponovo.
        </p>

        {error.digest && (
          <p className="text-xs mb-6 font-mono" style={{ color: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }}>
            Kod greške: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #818cf8, #a855f7)',
              color: 'white',
              boxShadow: '0 0 20px rgba(129,140,248,0.35)',
            }}
          >
            <RefreshCw size={14} />
            Pokušaj ponovo
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
              color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.65)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
            }}
          >
            Početna
          </a>
        </div>
      </div>
    </div>
  );
}
