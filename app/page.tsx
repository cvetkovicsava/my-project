'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, GitBranch, Zap, Search, Bot } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Plasma } from '@/components/ui/plasma';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') router.push('/dashboard');
  }, [status, router]);

  return (
    <div className="relative min-h-screen overflow-hidden text-white" style={{ background: '#0a0212' }}>

      {/* ── WebGL Plasma background ── */}
      <Plasma className="absolute inset-0 w-full h-full" />

      {/* ── Dark gradient overlay ── */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,2,18,0.55) 0%, rgba(10,2,18,0.1) 40%, rgba(10,2,18,0.65) 80%, rgba(10,2,18,0.95) 100%)',
        }}
      />

      {/* ── Glassmorphic Navbar (pill) ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4">
        <div
          className="w-full max-w-4xl flex items-center justify-between rounded-full px-5 py-3"
          style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background: '#6366f1',
                boxShadow: '0 0 14px rgba(99,102,241,0.6)',
              }}
            >
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-white">
              SEO<span className="text-indigo-400">·</span>GEO
            </span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/pricing"
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(200,200,220,0.7)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(200,200,220,1)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(200,200,220,0.7)'; }}
            >
              Cijene
            </Link>
            <ThemeToggle />
            <button
              onClick={() => signIn('github')}
              className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold text-white transition-all"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.18)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.10)'; }}
            >
              Prijavi se
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center pt-24 pb-16">
        <div className="max-w-3xl mx-auto space-y-7">

          {/* Announcement pill */}
          <div className="flex justify-center">
            <div
              className="rounded-full px-4 py-2 flex items-center gap-2 w-fit"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span className="text-xs">🥳</span>
              <span className="text-xs text-gray-300">SEO + GEO optimizacija — automatski via Pull Request</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-black leading-tight tracking-tight text-white">
            Optimizuj sajt za{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, #818cf8, #c084fc, #60a5fa)' }}
            >
              AI pretraživače
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base leading-relaxed max-w-xl mx-auto" style={{ color: 'rgba(200,200,220,0.7)' }}>
            Poveži GitHub repozitorijum, pokrenemo SEO i GEO audit na 4 AI modela,
            pa automatski otvorimo Pull Request sa poboljšanjima.
          </p>

          {/* Primary CTA */}
          <div className="flex justify-center pt-2">
            <button
              onClick={() => signIn('github')}
              className="flex items-center gap-3 cursor-pointer rounded-full px-8 py-3.5 text-sm font-bold text-white transition-all"
              style={{
                background: 'rgba(99,102,241,0.25)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(99,102,241,0.45)',
                boxShadow: '0 0 30px rgba(99,102,241,0.2)',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(99,102,241,0.38)';
                el.style.borderColor = 'rgba(99,102,241,0.65)';
                el.style.boxShadow = '0 0 40px rgba(99,102,241,0.35)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(99,102,241,0.25)';
                el.style.borderColor = 'rgba(99,102,241,0.45)';
                el.style.boxShadow = '0 0 30px rgba(99,102,241,0.2)';
              }}
            >
              <GitBranch className="w-5 h-5 text-indigo-300" />
              Nastavi sa GitHub-om
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>→</span>
            </button>
          </div>

          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Sigurno · Bez lozinke · OAuth 2.0
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 pt-4 max-w-sm mx-auto">
            {[
              { value: '4',    label: 'AI Modela'         },
              { value: '100%', label: 'Automatizovano'    },
              { value: 'PR',   label: 'GitHub Pull Request'},
            ].map((stat, i) => (
              <div
                key={i}
                className="rounded-xl p-4 text-center"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <p className="text-2xl font-black text-indigo-300">{stat.value}</p>
                <p className="text-[11px] mt-1" style={{ color: 'rgba(200,200,220,0.5)' }}>{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              { icon: <Search   className="w-3.5 h-3.5" />, text: 'On-Page SEO audit'                },
              { icon: <Bot      className="w-3.5 h-3.5" />, text: 'GEO — Claude, GPT, Gemini, Perplexity' },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'AI generiše GitHub PR'            },
              { icon: <Zap      className="w-3.5 h-3.5" />, text: 'llms.txt automatski'             },
              { icon: <GitBranch className="w-3.5 h-3.5" />, text: 'Schema.org markup'              },
            ].map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm cursor-default transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(200,200,220,0.8)',
                }}
              >
                <span className="text-indigo-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-xs" style={{ color: 'rgba(255,255,255,0.15)' }}>
        SEO·GEO Platform · Sva prava zadržana
      </footer>
    </div>
  );
}
