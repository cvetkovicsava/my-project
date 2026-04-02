'use client';

import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Zap, GitBranch, Search, Bot, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/components/providers/theme-provider';
import { WovenCanvas } from '@/components/ui/woven-canvas';

// ─── Main Hero ────────────────────────────────────────────────────────────────

export const WovenLightHero = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textControls   = useAnimation();
  const pillControls   = useAnimation();
  const buttonControls = useAnimation();

  const line1 = 'Optimizuj sajt za AI';
  const line2 = 'pretraživače';

  useEffect(() => {
    textControls.start(i => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.04 + 1.2, duration: 1.0, ease: [0.2, 0.65, 0.3, 0.9] },
    }));
    pillControls.start({ opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.8 } });
    buttonControls.start({ opacity: 1, y: 0, transition: { delay: 2.2, duration: 0.9 } });
  }, [textControls, pillControls, buttonControls]);

  const chars = [...line1.split(''), ' ', ...line2.split('')];

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden"
      style={{ background: isDark ? '#07010f' : '#f3f0ff' }}
    >
      {/* WovenCanvas — re-mounts on theme change via key */}
      <WovenCanvas key={theme} isDark={isDark} position="absolute" />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, rgba(7,1,15,0.55) 0%, rgba(7,1,15,0.05) 40%, rgba(7,1,15,0.65) 85%, rgba(7,1,15,0.97) 100%)'
            : 'linear-gradient(to bottom, rgba(243,240,255,0.55) 0%, rgba(243,240,255,0.05) 40%, rgba(243,240,255,0.65) 85%, rgba(243,240,255,0.97) 100%)',
        }}
      />

      <HeroNav isDark={isDark} />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-24 pb-16">

        {/* Announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={pillControls}
          className="mb-8 flex items-center gap-2 rounded-full px-4 py-2"
          style={{
            background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.10)',
            border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.25)'}`,
            backdropFilter: 'blur(8px)',
          }}
        >
          <span className="text-xs">🥳</span>
          <span className="text-xs font-medium"
            style={{ color: isDark ? 'rgba(200,195,255,0.85)' : 'rgba(79,70,229,0.9)' }}>
            SEO + GEO optimizacija — automatski via Pull Request
          </span>
        </motion.div>

        {/* Headline — char-by-char */}
        <h1 className="text-5xl sm:text-7xl font-black leading-tight tracking-tight mb-6 max-w-3xl">
          {chars.map((char, i) => (
            <motion.span
              key={i}
              custom={i}
              initial={{ opacity: 0, y: 40 }}
              animate={textControls}
              style={{
                display: 'inline-block',
                color: i < line1.length ? (isDark ? '#ffffff' : '#1e1b4b') : '#818cf8',
                textShadow: isDark && i >= line1.length ? '0 0 40px rgba(129,140,248,0.4)' : 'none',
                whiteSpace: 'pre',
              }}
            >
              {char}
            </motion.span>
          ))}
        </h1>

        {/* Subtitle */}
        <motion.p
          custom={chars.length + 2}
          initial={{ opacity: 0, y: 20 }}
          animate={textControls}
          className="max-w-xl text-base leading-relaxed mb-10"
          style={{ color: isDark ? 'rgba(200,195,255,0.6)' : 'rgba(79,70,229,0.65)' }}
        >
          Poveži GitHub repozitorijum, pokrenemo SEO i GEO audit na 4 AI modela,
          pa automatski otvorimo Pull Request sa poboljšanjima.
        </motion.p>

        {/* CTA + stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={buttonControls}
          className="flex flex-col items-center gap-6"
        >
          <button
            onClick={() => signIn('github')}
            className="flex items-center gap-3 cursor-pointer rounded-full px-8 py-3.5 text-sm font-bold transition-all"
            style={{
              background: 'rgba(99,102,241,0.28)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(99,102,241,0.5)', boxShadow: '0 0 32px rgba(99,102,241,0.22)',
              color: isDark ? '#fff' : '#1e1b4b',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.42)'; el.style.boxShadow = '0 0 48px rgba(99,102,241,0.38)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(99,102,241,0.28)'; el.style.boxShadow = '0 0 32px rgba(99,102,241,0.22)'; }}
          >
            <GitBranch className="w-5 h-5 text-indigo-300" />
            Nastavi sa GitHub-om
            <span style={{ color: 'rgba(255,255,255,0.35)' }}>→</span>
          </button>

          <p className="text-xs" style={{ color: isDark ? 'rgba(255,255,255,0.22)' : 'rgba(79,70,229,0.4)' }}>
            Sigurno · Bez lozinke · OAuth 2.0
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 max-w-sm w-full mt-2">
            {[
              { value: '4',    label: 'AI Modela'           },
              { value: '100%', label: 'Automatizovano'      },
              { value: 'PR',   label: 'GitHub Pull Request' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl p-4 text-center" style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)',
                backdropFilter: 'blur(8px)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.14)'}`,
              }}>
                <p className="text-2xl font-black text-indigo-400">{stat.value}</p>
                <p className="text-[11px] mt-1" style={{ color: isDark ? 'rgba(200,195,255,0.45)' : 'rgba(79,70,229,0.55)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {[
              { icon: <Search   className="w-3.5 h-3.5" />, text: 'On-Page SEO audit'                     },
              { icon: <Bot      className="w-3.5 h-3.5" />, text: 'GEO — Claude, GPT, Gemini, Perplexity' },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: 'AI generiše GitHub PR'                 },
              { icon: <Zap      className="w-3.5 h-3.5" />, text: 'llms.txt automatski'                   },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs" style={{
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.07)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.14)'}`,
                color: isDark ? 'rgba(200,195,255,0.75)' : 'rgba(79,70,229,0.8)',
                backdropFilter: 'blur(6px)',
              }}>
                <span className="text-indigo-400">{f.icon}</span>
                {f.text}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <footer className="relative z-10 text-center py-6 text-xs w-full"
        style={{ color: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(79,70,229,0.3)' }}>
        SEO·GEO Platform · Sva prava zadržana
      </footer>
    </div>
  );
};

// ─── Navbar ───────────────────────────────────────────────────────────────────

const HeroNav = ({ isDark }: { isDark: boolean }) => (
  <motion.nav
    initial={{ opacity: 0, y: -16 }}
    animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.8 } }}
    className="absolute top-0 left-0 right-0 z-20 flex justify-center pt-4 px-4"
  >
    <div className="w-full max-w-4xl flex items-center justify-between rounded-full px-5 py-3" style={{
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
      backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.18)'}`,
      boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
    }}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: '#6366f1', boxShadow: '0 0 14px rgba(99,102,241,0.55)' }}>
          <Zap className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-sm tracking-tight"
          style={{ color: isDark ? '#fff' : '#1e1b4b' }}>
          SEO<span className="text-indigo-400">·</span>GEO
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/pricing"
          className="text-sm font-medium transition-opacity hover:opacity-80 hidden sm:block"
          style={{ color: isDark ? 'rgba(200,195,255,0.65)' : 'rgba(79,70,229,0.7)' }}>
          Cijene
        </Link>
        <ThemeToggle />
        <button
          onClick={() => signIn('github')}
          className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
          style={{
            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.12)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(99,102,241,0.25)'}`,
            color: isDark ? '#fff' : '#1e1b4b',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
        >
          Prijavi se
        </button>
      </div>
    </div>
  </motion.nav>
);
