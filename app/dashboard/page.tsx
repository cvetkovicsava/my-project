'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Zap, GitBranch, Search, Bot, Sparkles, RefreshCw, CheckCircle2,
  AlertCircle, AlertTriangle, Info, LogOut, ChevronRight, ExternalLink,
  ArrowUp, FileText, TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { AiLoader } from '@/components/ui/ai-loader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { useTheme } from '@/components/providers/theme-provider';

// ─────────────────────── Types ───────────────────────

type Repo = {
  id: number; name: string; fullName: string; description: string | null;
  url: string; homepage: string | null; stars: number; language: string | null;
  updatedAt: string; isPrivate: boolean;
};

type AuditResult = {
  seo: {
    score: number; url: string;
    issues: { type: string; severity: string; message: string; recommendation: string }[];
    meta: { title: string | null; description: string | null; hasH1: boolean; hasCanonical: boolean; hasRobots: boolean; hasSitemap: boolean; hasSchemaMarkup: boolean; hasOgTags: boolean };
  };
  geo: {
    score: number; totalModels: number; mentionedIn: number;
    results: { model: string; mentioned: boolean; context: string | null }[];
    recommendations: string[];
  };
};

type HistoryItem = {
  id: string; createdAt: string; seoScore: number | null; geoScore: number | null; url: string | null;
};

// ─────────────────────── Helpers ─────────────────────

function scoreColor(s: number) { return s >= 80 ? '#4ade80' : s >= 50 ? '#facc15' : '#f87171'; }
function scoreBg(s: number)    { return s >= 80 ? 'rgba(74,222,128,0.1)' : s >= 50 ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)'; }
function scoreBorder(s: number){ return s >= 80 ? 'rgba(74,222,128,0.25)' : s >= 50 ? 'rgba(250,204,21,0.25)' : 'rgba(248,113,113,0.25)'; }
function scoreLabel(s: number) { return s >= 80 ? 'Odličan' : s >= 50 ? 'Osrednji' : 'Loš'; }
function scoreGlow(s: number)  { return s >= 80 ? 'rgba(74,222,128,0.25)' : s >= 50 ? 'rgba(250,204,21,0.20)' : 'rgba(248,113,113,0.22)'; }
function scoreGradient(s: number) {
  return s >= 80
    ? 'linear-gradient(135deg, rgba(74,222,128,0.18) 0%, rgba(16,185,129,0.08) 100%)'
    : s >= 50
    ? 'linear-gradient(135deg, rgba(250,204,21,0.18) 0%, rgba(234,179,8,0.08) 100%)'
    : 'linear-gradient(135deg, rgba(248,113,113,0.18) 0%, rgba(239,68,68,0.08) 100%)';
}

function modelIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('claude'))  return { emoji: '🟣', color: '#a855f7', name: 'Claude' };
  if (n.includes('gpt') || n.includes('openai') || n.includes('chatgpt')) return { emoji: '🟢', color: '#22c55e', name: 'ChatGPT' };
  if (n.includes('gemini') || n.includes('google')) return { emoji: '🔵', color: '#3b82f6', name: 'Gemini' };
  if (n.includes('perplexity')) return { emoji: '🩵', color: '#06b6d4', name: 'Perplexity' };
  return { emoji: '🤖', color: '#818cf8', name: name };
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─────────────────────── Animated counter hook ───────

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);
  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return count;
}

// ─────────────────────── Generic Card ────────────────

function Card({ children, className = '', style = {}, glow }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties; glow?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.045)' : 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.14)'}`,
        boxShadow: glow
          ? `0 0 40px ${glow}, 0 4px 24px rgba(0,0,0,0.2)`
          : isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(99,102,241,0.07)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────── Step badge ──────────────────

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all`}
      style={done ? { background: '#22c55e', color: '#fff', boxShadow: '0 0 12px rgba(34,197,94,0.4)' } : {
        background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.1)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(99,102,241,0.3)'}`,
        color: isDark ? '#a5b4fc' : '#4f46e5',
      }}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </div>
  );
}

// ─────────────────────── Big Score Ring ──────────────

function BigScoreRing({ score, label, sub }: { score: number; label: string; sub: string }) {
  const [mounted, setMounted] = useState(false);
  const display = useCountUp(score);
  const color = scoreColor(score);
  const size = 140;
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = mounted ? circ - (score / 100) * circ : circ;
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow bg */}
        <div className="absolute inset-4 rounded-full" style={{
          background: scoreGradient(score),
          boxShadow: `0 0 50px ${scoreGlow(score)}`,
          filter: 'blur(8px)',
        }} />
        <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
          {/* Track */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={10}
            stroke="rgba(255,255,255,0.06)" />
          {/* Progress with gradient */}
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={10}
            stroke={color} strokeLinecap="round"
            strokeDasharray={`${circ}`} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-black leading-none" style={{ fontSize: 38, color, textShadow: `0 0 20px ${color}` }}>
            {display}
          </span>
          <span className="text-[11px] mt-0.5" style={{ color: 'rgba(200,195,255,0.4)' }}>/100</span>
        </div>
      </div>
      <div className="text-center mt-3">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.45)' }}>{label}</p>
        <span className="inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full"
          style={{ color, background: scoreBg(score), border: `1px solid ${scoreBorder(score)}` }}>
          {scoreLabel(score)}
        </span>
        <p className="text-[11px] mt-2" style={{ color: 'rgba(200,195,255,0.40)' }}>{sub}</p>
      </div>
    </div>
  );
}

// ─────────────────────── Animated Score Chart ────────

function ScoreHistoryChart({ history }: { history: HistoryItem[] }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, []);

  const items = [...history].reverse().slice(-10);
  if (items.length < 2) return null;

  const W = 520, H = 100, PAD_X = 16, PAD_Y = 14;
  const plotW = W - PAD_X * 2;
  const plotH = H - PAD_Y * 2;
  const seoScores = items.map(h => h.seoScore ?? 0);
  const geoScores = items.map(h => h.geoScore ?? 0);
  const xStep = plotW / Math.max(items.length - 1, 1);

  const toLine = (scores: number[]) =>
    scores.map((s, i) => {
      const x = PAD_X + i * xStep;
      const y = PAD_Y + ((100 - s) / 100) * plotH;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');

  const toArea = (scores: number[]) => {
    const line = toLine(scores);
    const lastX = (PAD_X + (scores.length - 1) * xStep).toFixed(1);
    const lastY = (PAD_Y + plotH).toFixed(1);
    const firstX = PAD_X.toFixed(1);
    return `${line} L ${lastX} ${lastY} L ${firstX} ${lastY} Z`;
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.45)' }}>
            Historija Skorova
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(200,195,255,0.3)' }}>
            Posljednjih {items.length} mjerenja
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full bg-indigo-400" />
            <span className="text-[10px]" style={{ color: 'rgba(200,195,255,0.5)' }}>SEO</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 rounded-full bg-purple-400" />
            <span className="text-[10px]" style={{ color: 'rgba(200,195,255,0.5)' }}>GEO</span>
          </div>
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }}>
        <defs>
          <linearGradient id="seoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={mounted ? 0.35 : 0} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="geoGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity={mounted ? 0.28 : 0} />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <filter id="lineGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[25, 50, 75].map(v => {
          const y = PAD_Y + ((100 - v) / 100) * plotH;
          return (
            <g key={v}>
              <line x1={PAD_X} y1={y} x2={W - PAD_X} y2={y} stroke="rgba(148,163,184,0.08)" strokeWidth={1} />
              <text x={PAD_X - 4} y={y + 3.5} textAnchor="end" fontSize={8} fill="rgba(148,163,184,0.3)">{v}</text>
            </g>
          );
        })}

        {/* Area fills */}
        <path d={toArea(geoScores)} fill="url(#geoGrad)" style={{ transition: 'opacity 1s ease', opacity: mounted ? 1 : 0 }} />
        <path d={toArea(seoScores)} fill="url(#seoGrad)" style={{ transition: 'opacity 1s ease 200ms', opacity: mounted ? 1 : 0 }} />

        {/* Lines */}
        <path d={toLine(geoScores)} fill="none" stroke="#a78bfa" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" filter="url(#lineGlow)" />
        <path d={toLine(seoScores)} fill="none" stroke="#818cf8" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" filter="url(#lineGlow)" />

        {/* Dots */}
        {seoScores.map((s, i) => {
          const x = PAD_X + i * xStep;
          const y = PAD_Y + ((100 - s) / 100) * plotH;
          return (
            <g key={`s${i}`}>
              <circle cx={x} cy={y} r={5} fill="#818cf8" opacity={0.25} />
              <circle cx={x} cy={y} r={2.5} fill="#818cf8" />
            </g>
          );
        })}
        {geoScores.map((s, i) => {
          const x = PAD_X + i * xStep;
          const y = PAD_Y + ((100 - s) / 100) * plotH;
          return (
            <g key={`g${i}`}>
              <circle cx={x} cy={y} r={5} fill="#a78bfa" opacity={0.25} />
              <circle cx={x} cy={y} r={2.5} fill="#a78bfa" />
            </g>
          );
        })}
      </svg>

      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px]" style={{ color: 'rgba(200,195,255,0.3)' }}>{timeAgo(items[0].createdAt)} ago</span>
        <span className="text-[10px]" style={{ color: 'rgba(200,195,255,0.3)' }}>Sada</span>
      </div>
    </Card>
  );
}

// ─────────────────────── Meta Tile Grid ──────────────

function MetaGrid({ meta }: { meta: AuditResult['seo']['meta'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  const tiles = [
    { label: 'Title tag',        ok: !!meta.title,          icon: '📝' },
    { label: 'Meta desc',        ok: !!meta.description,    icon: '📄' },
    { label: 'H1 naslov',        ok: meta.hasH1,            icon: '🔤' },
    { label: 'Open Graph',       ok: meta.hasOgTags,        icon: '🔗' },
    { label: 'Canonical',        ok: meta.hasCanonical,     icon: '🎯' },
    { label: 'Sitemap.xml',      ok: meta.hasSitemap,       icon: '🗺️' },
    { label: 'Schema',           ok: meta.hasSchemaMarkup,  icon: '📊' },
    { label: 'Robots.txt',       ok: meta.hasRobots,        icon: '🤖' },
  ];
  const score = tiles.filter(t => t.ok).length;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.4)' }}>
          Meta Provjera
        </p>
        <span className="text-xs font-bold" style={{ color: score >= 6 ? '#4ade80' : score >= 4 ? '#facc15' : '#f87171' }}>
          {score}/{tiles.length}
        </span>
      </div>
      {/* Score bar */}
      <div className="h-1 rounded-full mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-1 rounded-full transition-all duration-1000"
          style={{
            width: mounted ? `${(score / tiles.length) * 100}%` : '0%',
            background: score >= 6 ? 'linear-gradient(90deg,#4ade80,#22d3ee)' : score >= 4 ? 'linear-gradient(90deg,#facc15,#fb923c)' : 'linear-gradient(90deg,#f87171,#ec4899)',
            boxShadow: `0 0 8px ${score >= 6 ? 'rgba(74,222,128,0.5)' : score >= 4 ? 'rgba(250,204,21,0.5)' : 'rgba(248,113,113,0.5)'}`,
          }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {tiles.map(({ label, ok, icon }, i) => (
          <div
            key={label}
            className="rounded-xl p-2.5 flex flex-col items-center gap-1.5 transition-all"
            style={{
              background: ok ? (i % 2 === 0 ? 'rgba(74,222,128,0.08)' : 'rgba(34,197,94,0.07)') : 'rgba(248,113,113,0.07)',
              border: `1px solid ${ok ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.15)'}`,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.95)',
              transition: `all 0.4s ease ${i * 50}ms`,
              boxShadow: ok ? '0 2px 10px rgba(74,222,128,0.08)' : 'none',
            }}
          >
            <span className="text-base leading-none">{icon}</span>
            <span className="text-[9px] text-center leading-tight" style={{ color: ok ? 'rgba(74,222,128,0.9)' : 'rgba(248,113,113,0.7)' }}>
              {label}
            </span>
            <div className={`w-1 h-1 rounded-full`} style={{
              background: ok ? '#4ade80' : '#f87171',
              boxShadow: `0 0 4px ${ok ? 'rgba(74,222,128,0.8)' : 'rgba(248,113,113,0.8)'}`,
            }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────── Severity Chart ──────────────

function SeverityChart({ issues }: { issues: AuditResult['seo']['issues'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  const critical = issues.filter(i => i.severity === 'critical').length;
  const warning  = issues.filter(i => i.severity === 'warning').length;
  const info     = issues.filter(i => i.severity === 'info').length;
  const total    = critical + warning + info;
  if (total === 0) return (
    <div className="mb-4 rounded-xl p-4 flex items-center gap-3"
      style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
      <CheckCircle2 className="w-5 h-5 text-green-400" />
      <span className="text-sm text-green-300 font-medium">Nema pronađenih problema! 🎉</span>
    </div>
  );

  const bars = [
    { count: critical, label: 'Kritično', color: '#f87171', pct: (critical/total)*100 },
    { count: warning,  label: 'Upozorenje', color: '#facc15', pct: (warning/total)*100 },
    { count: info,     label: 'Info', color: '#818cf8', pct: (info/total)*100 },
  ].filter(b => b.count > 0);

  return (
    <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.4)' }}>
          Raspodela Problema
        </p>
        <span className="text-xs font-bold" style={{ color: 'rgba(200,195,255,0.5)' }}>{total} ukupno</span>
      </div>
      {/* Horizontal bars */}
      <div className="flex flex-col gap-2.5">
        {bars.map((b, i) => (
          <div key={b.label} className="flex items-center gap-3">
            <span className="text-[10px] w-20 shrink-0" style={{ color: b.color }}>{b.label}</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-2 rounded-full"
                style={{
                  width: mounted ? `${b.pct}%` : '0%',
                  background: b.color,
                  boxShadow: `0 0 8px ${b.color}`,
                  transition: `width 1s cubic-bezier(0.34,1.2,0.64,1) ${i * 120}ms`,
                }}
              />
            </div>
            <span className="text-xs font-bold w-4 text-right" style={{ color: b.color }}>{b.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────── GEO Model Card ──────────────

function GeoModelCard({ result, index }: { result: AuditResult['geo']['results'][0]; index: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), index * 150 + 100); return () => clearTimeout(t); }, [index]);

  const info = modelIcon(result.model);
  const size = 56;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const pct = result.mentioned ? 1 : 0.05;
  const offset = mounted ? circ * (1 - pct) : circ;

  return (
    <div
      className="p-4 rounded-xl flex items-start gap-3"
      style={{
        background: result.mentioned
          ? 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(34,197,94,0.04) 100%)'
          : 'linear-gradient(135deg, rgba(248,113,113,0.08) 0%, rgba(239,68,68,0.04) 100%)',
        border: `1px solid ${result.mentioned ? 'rgba(74,222,128,0.22)' : 'rgba(248,113,113,0.18)'}`,
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(12px)',
        transition: `all 0.5s ease ${index * 120}ms`,
        boxShadow: result.mentioned ? '0 4px 20px rgba(74,222,128,0.08)' : 'none',
      }}
    >
      {/* Mini ring */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={4}
            stroke={result.mentioned ? 'rgba(74,222,128,0.15)' : 'rgba(248,113,113,0.12)'} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" strokeWidth={4}
            stroke={result.mentioned ? '#4ade80' : '#f87171'}
            strokeLinecap="round"
            strokeDasharray={`${circ}`} strokeDashoffset={offset}
            style={{ transition: `stroke-dashoffset 1s cubic-bezier(0.34,1.2,0.64,1) ${index * 150}ms`, filter: `drop-shadow(0 0 3px ${result.mentioned ? '#4ade80' : '#f87171'})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ fontSize: 18 }}>{info.emoji}</span>
        </div>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>{info.name}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: result.mentioned ? '#4ade80' : '#f87171',
              background: result.mentioned ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${result.mentioned ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.2)'}`,
            }}>
            {result.mentioned ? '✓ Pominje te' : '✗ Ne pominje'}
          </span>
        </div>
        {result.context && (
          <p className="text-[11px] italic leading-relaxed line-clamp-2"
            style={{ color: 'rgba(200,195,255,0.45)' }}>
            "{result.context.substring(0, 100)}..."
          </p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────── Competitor Bar Chart ────────

function CompetitorBars({ auditResult, competitorResult, competitorUrl }: {
  auditResult: AuditResult; competitorResult: AuditResult; competitorUrl: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 100); return () => clearTimeout(t); }, []);

  const rows = [
    { label: 'SEO Score', a: auditResult.seo.score, b: competitorResult.seo.score, max: 100, higher: true },
    { label: 'GEO Score', a: auditResult.geo.score, b: competitorResult.geo.score, max: 100, higher: true },
    { label: 'AI Modeli', a: auditResult.geo.mentionedIn, b: competitorResult.geo.mentionedIn, max: 4, higher: true },
    { label: 'SEO Problemi', a: auditResult.seo.issues.length, b: competitorResult.seo.issues.length, max: Math.max(auditResult.seo.issues.length, competitorResult.seo.issues.length, 1), higher: false },
  ];

  return (
    <Card className="p-5" glow="rgba(168,85,247,0.12)">
      <div className="flex items-center gap-2 mb-5">
        <Bot className="w-4 h-4 text-purple-400" />
        <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Poređenje sa Konkurentom</p>
        <span className="text-xs ml-1 px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: 'rgba(200,195,255,0.65)' }}>
          {competitorUrl.replace(/https?:\/\//, '')}
        </span>
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400" />
          <span className="text-[11px]" style={{ color: 'rgba(200,195,255,0.55)' }}>Vaš sajt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-[11px]" style={{ color: 'rgba(200,195,255,0.55)' }}>Konkurent</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {rows.map(({ label, a, b, max, higher }, i) => {
          const aWins = higher ? a > b : a < b;
          const bWins = higher ? b > a : b < a;
          return (
            <div key={label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px]" style={{ color: 'rgba(200,195,255,0.45)' }}>{label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold flex items-center gap-1" style={{ color: aWins ? '#4ade80' : bWins ? '#f87171' : '#818cf8' }}>
                    {aWins && <TrendingUp className="w-3 h-3" />}
                    {bWins && <TrendingDown className="w-3 h-3" />}
                    {!aWins && !bWins && <Minus className="w-3 h-3" />}
                    {a}{label.includes('Score') ? '' : ''}
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(200,195,255,0.3)' }}>vs</span>
                  <span className="text-xs font-bold" style={{ color: bWins ? '#4ade80' : aWins ? '#f87171' : '#818cf8' }}>{b}</span>
                </div>
              </div>
              {/* Double bars */}
              <div className="flex flex-col gap-1">
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-2 rounded-full" style={{
                    width: mounted ? `${(a / max) * 100}%` : '0%',
                    background: aWins ? 'linear-gradient(90deg,#6366f1,#818cf8)' : 'linear-gradient(90deg,#6366f1,#818cf8)',
                    opacity: aWins ? 1 : 0.55,
                    transition: `width 0.9s cubic-bezier(0.34,1.2,0.64,1) ${i * 80}ms`,
                    boxShadow: aWins ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                  }} />
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-2 rounded-full" style={{
                    width: mounted ? `${(b / max) * 100}%` : '0%',
                    background: 'linear-gradient(90deg,#a855f7,#c084fc)',
                    opacity: bWins ? 1 : 0.55,
                    transition: `width 0.9s cubic-bezier(0.34,1.2,0.64,1) ${i * 80 + 100}ms`,
                    boxShadow: bWins ? '0 0 8px rgba(168,85,247,0.5)' : 'none',
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ═════════════════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════════════════

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos]               = useState<Repo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError]       = useState<string | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [url, setUrl]                   = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult]   = useState<AuditResult | null>(null);
  const [auditError, setAuditError]     = useState<string | null>(null);
  const [optLoading, setOptLoading]     = useState(false);
  const [prUrl, setPrUrl]               = useState<string | null>(null);
  const [history, setHistory]           = useState<HistoryItem[]>([]);
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [competitorResult, setCompetitorResult] = useState<AuditResult | null>(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);

  const githubId = (session as any)?.githubId;

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status, router]);
  useEffect(() => {
    if (status === 'authenticated' && (session as any)?.accessToken) {
      fetchRepos(); fetchHistory();
    }
  }, [status, session]);

  async function fetchRepos() {
    const token = (session as any)?.accessToken;
    if (!token) return;
    setLoadingRepos(true); setRepoError(null);
    try {
      const r = await fetch('/api/github/repos', { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRepos(d.repos);
    } catch (e: any) { setRepoError(e.message); }
    finally { setLoadingRepos(false); }
  }

  async function fetchHistory() {
    if (!githubId) return;
    try {
      const r = await fetch(`/api/history?githubId=${githubId}`);
      const d = await r.json();
      setHistory(d.history || []);
    } catch { }
  }

  async function runAudit() {
    const auditUrl = url || selectedRepo?.homepage;
    if (!auditUrl) { setAuditError('Upiši URL sajta!'); return; }
    setAuditLoading(true); setAuditError(null); setAuditResult(null); setPrUrl(null);
    try {
      const r = await fetch('/api/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: auditUrl, brand: selectedRepo?.name, repoName: selectedRepo?.name, githubId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setAuditResult(d);
      fetchHistory();
    } catch (e: any) { setAuditError(e.message); }
    finally { setAuditLoading(false); }
  }

  async function runCompetitorAudit() {
    if (!competitorUrl) return;
    setCompetitorLoading(true); setCompetitorResult(null);
    try {
      const normalized = competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`;
      const r = await fetch('/api/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalized, brand: normalized }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setCompetitorResult(d);
    } catch { }
    finally { setCompetitorLoading(false); }
  }

  function exportPDF() {
    if (!auditResult) return;
    const seo = auditResult.seo;
    const geo = auditResult.geo;
    const seoColor2 = (s: number) => s >= 80 ? '#16a34a' : s >= 50 ? '#ca8a04' : '#dc2626';
    const seoBg2    = (s: number) => s >= 80 ? '#f0fdf4' : s >= 50 ? '#fefce8' : '#fef2f2';
    const seoBorder2= (s: number) => s >= 80 ? '#4ade80' : s >= 50 ? '#facc15' : '#f87171';
    const metaRows = [
      ['Title tag', !!seo.meta.title], ['Meta description', !!seo.meta.description],
      ['H1 naslov', seo.meta.hasH1], ['Open Graph', seo.meta.hasOgTags],
      ['Canonical URL', seo.meta.hasCanonical], ['Sitemap.xml', seo.meta.hasSitemap],
      ['Schema markup', seo.meta.hasSchemaMarkup],
    ] as [string, boolean][];
    const issueHtml = seo.issues.map(i => `
      <div style="padding:10px 14px;border-radius:8px;margin-bottom:8px;border-left:3px solid ${i.severity==='critical'?'#f87171':i.severity==='warning'?'#facc15':'#818cf8'};background:${i.severity==='critical'?'#fef2f2':i.severity==='warning'?'#fefce8':'#eef2ff'}">
        <strong style="font-size:13px">${i.message}</strong><br>
        <span style="font-size:12px;color:#6b7280">→ ${i.recommendation}</span>
      </div>`).join('');
    const geoHtml = geo.results.map(r => `
      <div style="display:flex;justify-content:space-between;padding:8px 12px;border-radius:8px;margin-bottom:6px;background:${r.mentioned?'#f0fdf4':'#fef2f2'};font-size:13px">
        <span>${r.model}</span>
        <strong style="color:${r.mentioned?'#16a34a':'#dc2626'}">${r.mentioned?'✓ Pominje':'✗ Ne pominje'}</strong>
      </div>`).join('');
    const compSection = competitorResult ? `
      <h2>Poređenje sa Konkurentom</h2>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:#f5f3ff">
          <th style="padding:8px 12px;text-align:left">Metrika</th>
          <th style="padding:8px 12px;text-align:center">Vaš sajt</th>
          <th style="padding:8px 12px;text-align:center">Konkurent</th>
        </tr>
        <tr><td style="padding:8px 12px">SEO Score</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor2(seo.score)}">${seo.score}/100</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor2(competitorResult.seo.score)}">${competitorResult.seo.score}/100</td>
        </tr>
        <tr style="background:#f9fafb"><td style="padding:8px 12px">GEO Score</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor2(geo.score)}">${geo.score}/100</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor2(competitorResult.geo.score)}">${competitorResult.geo.score}/100</td>
        </tr>
      </table>` : '';
    const html = `<!DOCTYPE html><html lang="bs"><head><meta charset="UTF-8"><title>SEO·GEO Audit — ${seo.url}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e1b4b}
h1{font-size:28px;font-weight:900;color:#4f46e5}h2{font-size:16px;font-weight:700;margin:28px 0 12px;border-bottom:2px solid #e0e7ff;padding-bottom:6px;color:#312e81}
.scores{display:flex;gap:20px;margin:20px 0}.score-box{flex:1;padding:20px;border-radius:12px;text-align:center;border:2px solid}
.score-num{font-size:48px;font-weight:900;line-height:1}.meta-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:13px}
.ok{color:#16a34a;font-weight:700}.no{color:#dc2626;font-weight:700}.rec{padding:8px 12px;background:#f5f3ff;border-radius:8px;margin:6px 0;font-size:13px;border-left:3px solid #818cf8}
</style></head><body>
<h1>SEO·GEO Audit Izvještaj</h1>
<p style="color:#6b7280;font-size:13px">URL: <strong>${seo.url}</strong> · ${new Date().toLocaleDateString('bs-BA')}</p>
<div class="scores">
  <div class="score-box" style="border-color:${seoBorder2(seo.score)};background:${seoBg2(seo.score)}">
    <div class="score-num" style="color:${seoColor2(seo.score)}">${seo.score}</div>
    <div style="font-size:12px;font-weight:700;margin-top:6px;color:#6b7280">SEO SCORE</div>
  </div>
  <div class="score-box" style="border-color:${seoBorder2(geo.score)};background:${seoBg2(geo.score)}">
    <div class="score-num" style="color:${seoColor2(geo.score)}">${geo.score}</div>
    <div style="font-size:12px;font-weight:700;margin-top:6px;color:#6b7280">GEO SCORE</div>
  </div>
</div>
<h2>SEO Meta Provjera</h2>${metaRows.map(([l,ok])=>`<div class="meta-row"><span>${l}</span><span class="${ok?'ok':'no'}">${ok?'✓ OK':'✗ Nedostaje'}</span></div>`).join('')}
<h2>SEO Problemi (${seo.issues.length})</h2>${issueHtml||'<p style="color:#6b7280">Nema kritičnih problema 🎉</p>'}
<h2>GEO — AI Vidljivost (${geo.mentionedIn}/${geo.totalModels} modela)</h2>${geoHtml}
<h2>GEO Preporuke</h2>${geo.recommendations.map(r=>`<div class="rec">→ ${r}</div>`).join('')}
${compSection}
<script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
</body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }

  async function runOptimize() {
    if (!auditResult || !selectedRepo) return;
    const token = (session as any)?.accessToken;
    setOptLoading(true);
    try {
      const r = await fetch('/api/optimize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seoResult: auditResult.seo, geoResult: auditResult.geo,
          repoFullName: selectedRepo.fullName, repoName: selectedRepo.name,
          websiteUrl: url || selectedRepo.homepage, accessToken: token, githubId,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setPrUrl(d.prUrl);
      fetchHistory();
    } catch (e: any) { setAuditError(e.message); }
    finally { setOptLoading(false); }
  }

  if (status === 'loading') return <AiLoader text="Učitavam" size={160} />;

  const step = !selectedRepo ? 1 : !auditResult ? 2 : 3;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: isDark ? '#07010f' : '#f3f0ff' }}>
      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-ring { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:.8;transform:scale(1.03)} }
        .anim-in { animation: fadeSlideUp 0.5s ease forwards; }
        .pulse-r { animation: pulse-ring 3s ease-in-out infinite; }
      `}</style>

      <WovenCanvas key={theme} isDark={isDark} position="fixed" opacity={0.7} />
      <div className="fixed inset-0 z-[1] pointer-events-none" style={{
        background: isDark ? 'rgba(7,1,15,0.65)' : 'rgba(243,240,255,0.72)',
      }} />

      {auditLoading && <AiLoader text="Analiziram" size={180} />}
      {optLoading   && <AiLoader text="Generišem"  size={180} />}

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-20 flex justify-center pt-4 px-4">
        <div className="w-full max-w-4xl flex items-center justify-between rounded-full px-5 py-3"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.65)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.18)'}`,
            boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
          }}>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center"
                style={{ boxShadow: '0 0 12px rgba(99,102,241,0.5)' }}>
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm tracking-tight" style={{ color: isDark ? '#fff' : '#1e1b4b' }}>
                SEO<span className="text-indigo-400">·</span>GEO
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              {[1,2,3].map(n => (
                <div key={n} className="h-1.5 rounded-full transition-all duration-500" style={{
                  width: n < step ? 24 : n === step ? 32 : 8,
                  background: n < step ? 'rgba(129,140,248,0.5)' : n === step ? '#6366f1' : (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.2)'),
                  boxShadow: n === step ? '0 0 8px rgba(99,102,241,0.5)' : 'none',
                }} />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {auditResult && (
              <div className="flex items-center gap-2 mr-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: scoreColor(auditResult.seo.score), background: scoreBg(auditResult.seo.score), boxShadow: `0 0 10px ${scoreGlow(auditResult.seo.score)}` }}>
                  SEO {auditResult.seo.score}
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ color: scoreColor(auditResult.geo.score), background: scoreBg(auditResult.geo.score), boxShadow: `0 0 10px ${scoreGlow(auditResult.geo.score)}` }}>
                  GEO {auditResult.geo.score}
                </span>
              </div>
            )}
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" style={{ border: '2px solid rgba(129,140,248,0.4)' }} />
            )}
            <span className="text-xs hidden sm:inline" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(30,27,75,0.5)' }}>
              {session?.user?.name}
            </span>
            <ThemeToggle />
            <button onClick={() => signOut()} style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(79,70,229,0.45)' }}
              className="transition-opacity hover:opacity-80">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-[980px] mx-auto px-4 pt-28 pb-12 flex flex-col gap-5">

        {/* Page title */}
        <div className="anim-in">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: isDark ? '#fff' : '#1e1b4b' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(79,70,229,0.55)' }}>
            Poveži repo → pokreni audit → otvori Pull Request
          </p>
        </div>

        {/* ── History chart ── */}
        {history.length > 1 && !auditResult && (
          <div className="anim-in" style={{ animationDelay: '0.1s' }}>
            <ScoreHistoryChart history={history} />
          </div>
        )}

        {/* ── Recent history list ── */}
        {history.length > 0 && !auditResult && (
          <Card className="p-5" style={{ animationDelay: '0.15s' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(200,195,255,0.4)' }}>
              Prethodna Mjerenja
            </p>
            <div className="flex flex-col gap-0.5">
              {history.slice(0, 5).map((item, i) => (
                <div key={item.id}
                  className="flex items-center justify-between py-2.5 group cursor-pointer rounded-lg px-2 transition-all"
                  style={{ borderBottom: i < 4 ? `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.07)'}` : 'none' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(200,195,255,0.4)' }}>
                      {timeAgo(item.createdAt)} ago
                    </span>
                    {item.url && (
                      <span className="text-xs" style={{ color: isDark ? 'rgba(200,195,255,0.55)' : 'rgba(79,70,229,0.65)' }}>
                        {item.url.replace(/https?:\/\//, '')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.seoScore !== null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: scoreColor(item.seoScore), background: scoreBg(item.seoScore) }}>
                        SEO {item.seoScore}
                      </span>
                    )}
                    {item.geoScore !== null && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ color: scoreColor(item.geoScore), background: scoreBg(item.geoScore) }}>
                        GEO {item.geoScore}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── STEP 1: Repos ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StepBadge n={1} done={step > 1} />
              <div>
                <p className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#1e1b4b' }}>Repozitorijum</p>
                <p className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(79,70,229,0.55)' }}>
                  {selectedRepo ? selectedRepo.fullName : 'Odaberi projekat koji želiš da optimizuješ'}
                </p>
              </div>
            </div>
            <button onClick={fetchRepos}
              className="flex items-center gap-1.5 text-xs rounded-full px-3 py-1.5 transition-all"
              style={{
                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.18)'}`,
                color: isDark ? 'rgba(200,195,255,0.6)' : 'rgba(79,70,229,0.7)',
              }}>
              <RefreshCw className="w-3 h-3" />Osveži
            </button>
          </div>

          {loadingRepos && (
            <div className="flex flex-col gap-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 rounded-xl animate-pulse"
                  style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.05)' }} />
              ))}
            </div>
          )}

          {repoError && (
            <div className="flex items-center gap-2 rounded-xl p-3 text-sm"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#fca5a5' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{repoError}
            </div>
          )}

          {!loadingRepos && repos.length === 0 && !repoError && (
            <div className="rounded-xl p-8 text-center" style={{
              border: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(99,102,241,0.18)'}`,
            }}>
              <GitBranch className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(200,195,255,0.2)' }} />
              <p className="text-sm mb-4" style={{ color: 'rgba(200,195,255,0.4)' }}>Nema repozitorijuma na ovom nalogu.</p>
              <a href="https://github.com/new" target="_blank"
                className="inline-flex items-center gap-2 text-xs rounded-full px-4 py-2 transition-all"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.18)'}`,
                  color: isDark ? 'rgba(200,195,255,0.7)' : 'rgba(79,70,229,0.8)',
                }}>
                <GitBranch className="w-3.5 h-3.5" />Napravi repozitorijum
              </a>
            </div>
          )}

          {repos.length > 0 && (
            <div className="flex flex-col gap-2">
              {repos.map(repo => {
                const isSelected = selectedRepo?.id === repo.id;
                return (
                  <div key={repo.id}
                    onClick={() => { setSelectedRepo(repo); setUrl(repo.homepage || ''); setAuditResult(null); setPrUrl(null); }}
                    className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: isSelected
                        ? (isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.08)')
                        : (isDark ? 'rgba(255,255,255,0.025)' : 'rgba(99,102,241,0.03)'),
                      border: `1px solid ${isSelected
                        ? (isDark ? 'rgba(99,102,241,0.45)' : 'rgba(99,102,241,0.35)')
                        : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.12)')}`,
                      boxShadow: isSelected ? '0 0 20px rgba(99,102,241,0.12)' : 'none',
                    }}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#1e1b4b' }}>{repo.name}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                          style={repo.isPrivate ? {
                            color: 'rgba(200,195,255,0.4)', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                          } : {
                            color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)',
                          }}>
                          {repo.isPrivate ? 'Private' : 'Public'}
                        </span>
                        {repo.language && <span className="text-xs" style={{ color: 'rgba(200,195,255,0.35)' }}>{repo.language}</span>}
                      </div>
                      {repo.description && <p className="text-xs truncate" style={{ color: 'rgba(200,195,255,0.4)' }}>{repo.description}</p>}
                      {repo.homepage && <p className="text-xs mt-0.5" style={{ color: '#6366f1' }}>🌐 {repo.homepage}</p>}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                        style={{ background: '#6366f1', boxShadow: '0 0 10px rgba(99,102,241,0.4)' }}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── STEP 2: Audit Input ── */}
        {selectedRepo && (
          <div>
            <div className="flex items-center gap-3 mb-3 px-1">
              <StepBadge n={2} done={step > 2} />
              <div>
                <p className="text-sm font-semibold" style={{ color: isDark ? '#fff' : '#1e1b4b' }}>SEO + GEO Audit</p>
                <p className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.38)' : 'rgba(79,70,229,0.55)' }}>
                  Upiši URL sajta i pokreni analizu
                </p>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{
              background: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(18px)', WebkitBackdropFilter: 'blur(18px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.13)' : 'rgba(99,102,241,0.25)'}`,
              boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.5)' : '0 8px 32px rgba(99,102,241,0.12)',
            }}>
              <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAudit()}
                  placeholder="https://tvoj-sajt.com"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#1e1b4b', caretColor: '#818cf8' }} />
              </div>
              <div className="flex items-center gap-3 px-4 py-2"
                style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.10)'}` }}>
                <Bot className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <input type="text" value={competitorUrl} onChange={e => setCompetitorUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runCompetitorAudit()}
                  placeholder="URL konkurenta (opcionalno)"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: isDark ? 'rgba(255,255,255,0.7)' : '#3730a3' }} />
                {competitorUrl && (
                  <button onClick={runCompetitorAudit} disabled={competitorLoading}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1">
                    {competitorLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                    Poredi
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between px-3 pb-3 pt-2"
                style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.10)'}` }}>
                <div className="flex items-center gap-1.5">
                  {[
                    { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'AI PR' },
                    { icon: <FileText className="w-3.5 h-3.5" />, label: 'llms.txt' },
                  ].map((a, i) => (
                    <button key={i} className="flex items-center gap-1.5 text-xs rounded-lg px-3 py-1.5 transition-all"
                      style={{
                        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.16)'}`,
                        color: isDark ? 'rgba(200,195,255,0.7)' : 'rgba(79,70,229,0.8)',
                      }}>
                      <span className="text-indigo-400">{a.icon}</span>{a.label}
                    </button>
                  ))}
                </div>
                <button onClick={runAudit} disabled={auditLoading}
                  className="flex items-center gap-2 rounded-xl px-5 py-2 text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
                  }}>
                  <ArrowUp className="w-4 h-4" />Pokreni Audit
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {[
                { icon: <Search className="w-3.5 h-3.5" />, label: 'On-Page SEO' },
                { icon: <Bot className="w-3.5 h-3.5" />, label: 'GEO Provjera' },
                { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Generiši PR' },
                { icon: <GitBranch className="w-3.5 h-3.5" />, label: 'Provjeri Repo' },
                { icon: <Zap className="w-3.5 h-3.5" />, label: 'llms.txt' },
              ].map((a, i) => (
                <button key={i} className="flex items-center gap-2 rounded-full px-4 py-2 text-xs transition-all"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.07)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.16)'}`,
                    color: isDark ? 'rgba(200,195,255,0.7)' : 'rgba(79,70,229,0.8)',
                    backdropFilter: 'blur(8px)',
                  }}>
                  <span className="text-indigo-400">{a.icon}</span>{a.label}
                </button>
              ))}
            </div>

            {auditError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl p-3 text-sm"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#fca5a5' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{auditError}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ RESULTS ══════════════ */}
        {auditResult && (
          <>
            {/* ── Hero Score Section ── */}
            <div className="anim-in">
              <Card className="p-8" glow={`${scoreGlow(auditResult.seo.score)}`}>
                {/* Radial glow background */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
                  <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl"
                    style={{ background: scoreGlow(auditResult.seo.score), opacity: 0.4 }} />
                  <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full blur-3xl"
                    style={{ background: scoreGlow(auditResult.geo.score), opacity: 0.35 }} />
                </div>

                <div className="relative flex items-start justify-around gap-8 flex-wrap">
                  <BigScoreRing
                    score={auditResult.seo.score}
                    label="SEO Score"
                    sub={`${auditResult.seo.issues.length} problema pronađeno`}
                  />
                  {/* Center divider */}
                  <div className="flex flex-col items-center justify-center gap-2 self-center">
                    <div className="w-px h-16" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)' }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.25)' }}>vs</span>
                    <div className="w-px h-16" style={{ background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.12), transparent)' }} />
                  </div>
                  <BigScoreRing
                    score={auditResult.geo.score}
                    label="GEO Score"
                    sub={`${auditResult.geo.mentionedIn} od ${auditResult.geo.totalModels} AI modela te pominje`}
                  />
                </div>

                {/* URL bar */}
                <div className="relative mt-6 flex items-center justify-center gap-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px rgba(74,222,128,0.7)' }} />
                    <span className="text-xs" style={{ color: 'rgba(200,195,255,0.55)' }}>
                      {auditResult.seo.url}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* ── Competitor ── */}
            {competitorResult && (
              <div className="anim-in" style={{ animationDelay: '0.05s' }}>
                <CompetitorBars
                  auditResult={auditResult}
                  competitorResult={competitorResult}
                  competitorUrl={competitorUrl}
                />
              </div>
            )}

            {/* ── SEO + GEO two-col ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 anim-in" style={{ animationDelay: '0.1s' }}>

              {/* ── SEO Card ── */}
              <Card className="p-5" glow="rgba(99,102,241,0.1)">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <Search className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>SEO Analiza</p>
                    <p className="text-[10px]" style={{ color: 'rgba(200,195,255,0.4)' }}>
                      {auditResult.seo.issues.filter(i => i.severity === 'critical').length} kritičnih problema
                    </p>
                  </div>
                </div>

                <SeverityChart issues={auditResult.seo.issues} />
                <MetaGrid meta={auditResult.seo.meta} />

                {auditResult.seo.issues.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(200,195,255,0.4)' }}>
                      Problemi ({auditResult.seo.issues.length})
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {auditResult.seo.issues.map((issue, i) => {
                        const isCrit = issue.severity === 'critical';
                        const isWarn = issue.severity === 'warning';
                        const color  = isCrit ? '#f87171' : isWarn ? '#facc15' : '#818cf8';
                        const Icon   = isCrit ? AlertCircle : isWarn ? AlertTriangle : Info;
                        return (
                          <div key={i} className="p-3 rounded-xl transition-all"
                            style={{
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                              borderLeft: `3px solid ${color}`,
                              border: `1px solid ${isCrit ? 'rgba(248,113,113,0.15)' : isWarn ? 'rgba(250,204,21,0.12)' : 'rgba(129,140,248,0.12)'}`,
                              borderLeftWidth: 3,
                              borderLeftColor: color,
                            }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Icon className="w-3.5 h-3.5" style={{ color }} />
                              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
                                {isCrit ? 'Kritično' : isWarn ? 'Upozorenje' : 'Info'}
                              </span>
                            </div>
                            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{issue.message}</p>
                            <p className="text-xs" style={{ color: 'rgba(200,195,255,0.45)' }}>→ {issue.recommendation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>

              {/* ── GEO Card ── */}
              <Card className="p-5" glow="rgba(168,85,247,0.1)">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>GEO Analiza</p>
                    <p className="text-[10px]" style={{ color: 'rgba(200,195,255,0.4)' }}>
                      AI Vidljivost — {auditResult.geo.mentionedIn}/{auditResult.geo.totalModels} modela
                    </p>
                  </div>
                </div>

                {/* AI visibility overview bar */}
                <div className="mb-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'rgba(200,195,255,0.4)' }}>
                      AI Vidljivost
                    </p>
                    <span className="text-xs font-bold" style={{
                      color: auditResult.geo.mentionedIn >= 3 ? '#4ade80' : auditResult.geo.mentionedIn >= 2 ? '#facc15' : '#f87171',
                    }}>
                      {auditResult.geo.mentionedIn}/{auditResult.geo.totalModels}
                    </span>
                  </div>
                  <div className="h-2 rounded-full mb-1" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <div className="h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${(auditResult.geo.mentionedIn / auditResult.geo.totalModels) * 100}%`,
                        background: 'linear-gradient(90deg,#818cf8,#22d3ee)',
                        boxShadow: '0 0 10px rgba(129,140,248,0.5)',
                        transition: 'width 1.2s cubic-bezier(0.34,1.2,0.64,1) 200ms',
                      }} />
                  </div>
                </div>

                {/* Model cards */}
                <div className="flex flex-col gap-3 mb-5">
                  {auditResult.geo.results.map((r, i) => (
                    <GeoModelCard key={i} result={r} index={i} />
                  ))}
                </div>

                {/* Recommendations */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.14)' }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(200,195,255,0.4)' }}>
                    GEO Preporuke
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {auditResult.geo.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#818cf8', boxShadow: '0 0 4px rgba(129,140,248,0.6)' }} />
                        <span className="text-xs leading-relaxed" style={{ color: 'rgba(200,195,255,0.6)' }}>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── STEP 3: Optimize ── */}
            <Card className="p-6 anim-in" style={{ animationDelay: '0.18s' }} glow="rgba(99,102,241,0.14)">
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={3} done={!!prUrl} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>AI Optimizacija</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(200,195,255,0.4)' }}>
                    Claude generiše izmjene i otvara Pull Request na GitHubu
                  </p>
                </div>
              </div>

              {prUrl ? (
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.22)', boxShadow: '0 0 20px rgba(74,222,128,0.08)' }}>
                  <p className="text-sm font-bold text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Pull Request je uspješno otvoren!
                  </p>
                  <a href={prUrl} target="_blank"
                    className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.3)' }}>
                    <GitBranch className="w-4 h-4" />
                    Otvori PR na GitHubu
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button onClick={runOptimize}
                  className="w-full rounded-xl px-6 py-4 text-sm font-bold text-white flex items-center justify-center gap-2 transition-all group"
                  style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(139,92,246,0.3) 100%)',
                    border: '1px solid rgba(99,102,241,0.4)',
                    boxShadow: '0 4px 30px rgba(99,102,241,0.2)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 40px rgba(99,102,241,0.4)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 30px rgba(99,102,241,0.2)'; }}>
                  <Zap className="w-4 h-4 text-indigo-300 group-hover:text-white transition-colors" />
                  Pokreni AI Optimizaciju → Otvori PR
                </button>
              )}
            </Card>

            {/* ── PDF Export ── */}
            <div className="flex justify-end anim-in" style={{ animationDelay: '0.22s' }}>
              <button onClick={exportPDF}
                className="flex items-center gap-2 text-xs font-semibold rounded-full px-4 py-2 transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: 'rgba(200,195,255,0.55)',
                  backdropFilter: 'blur(8px)',
                }}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Izvezi kao PDF
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
