'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Zap, GitBranch, Search, Bot, Sparkles, RefreshCw, CheckCircle2,
  AlertCircle, AlertTriangle, Info, LogOut, ChevronRight, ExternalLink
} from 'lucide-react';
import { AiLoader } from '@/components/ui/ai-loader';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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

function modelIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('claude'))                           return '🟣';
  if (n.includes('gpt') || n.includes('openai') || n.includes('chatgpt')) return '🟢';
  if (n.includes('gemini') || n.includes('google'))  return '🔵';
  if (n.includes('perplexity'))                       return '🩵';
  return '🤖';
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

// ─────────────────────── Animated counter hook ───────

function useCountUp(target: number, duration = 1100) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(eased * target));
      if (p < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

// ─────────────────────── Score Ring ──────────────────

function ScoreRing({ score, size = 108 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  const display = useCountUp(score);
  const color   = scoreColor(score);
  const r       = (size - 14) / 2;
  const circ    = 2 * Math.PI * r;
  const offset  = mounted ? circ - (score / 100) * circ : circ;

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {/* Track */}
      <svg width={size} height={size} className="absolute inset-0 rotate-[-90deg]">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={8}
          className="text-slate-100 dark:text-purple-900/30"
          stroke="currentColor"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={8}
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black leading-none" style={{ color }}>{display}</span>
        <span className="text-[10px] text-slate-400 dark:text-gray-600 mt-0.5">/100</span>
      </div>
    </div>
  );
}

// ─────────────────────── Severity bar chart ──────────

function SeverityBars({ issues }: { issues: AuditResult['seo']['issues'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 120); return () => clearTimeout(t); }, []);

  const critical = issues.filter(i => i.severity === 'critical').length;
  const warning  = issues.filter(i => i.severity === 'warning').length;
  const info     = issues.filter(i => i.severity === 'info').length;
  const total    = critical + warning + info;
  if (total === 0) return null;

  const bars = [
    { count: critical, label: 'Kritično',    color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
    { count: warning,  label: 'Upozorenje',  color: '#facc15', bg: 'rgba(250,204,21,0.15)'  },
    { count: info,     label: 'Info',        color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  ].filter(b => b.count > 0);

  return (
    <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-[#150f20] border border-slate-100 dark:border-purple-900/20">
      <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">
        Raspodela problema
      </p>
      {/* Stacked bar */}
      <div className="flex rounded-full overflow-hidden h-2 mb-3 gap-0.5">
        {bars.map(b => (
          <div
            key={b.label}
            className="h-full rounded-full transition-all duration-1000"
            style={{
              flex: b.count,
              background: b.color,
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'scaleX(1)' : 'scaleX(0)',
              transformOrigin: 'left',
              transition: 'opacity 0.8s ease, transform 1s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="flex items-center gap-4">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: b.color }} />
            <span className="text-[11px] text-slate-500 dark:text-gray-500">
              <span className="font-bold" style={{ color: b.color }}>{b.count}</span>
              {' '}{b.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────── GEO model bar ───────────────

function ModelBar({ mentioned, delay = 0 }: { mentioned: boolean; delay?: number }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div className="w-full h-1.5 rounded-full mt-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div
        className="h-1.5 rounded-full"
        style={{
          width: mounted ? (mentioned ? '100%' : '10%') : '0%',
          background: mentioned ? '#4ade80' : '#f87171',
          transition: `width 1s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          boxShadow: mentioned
            ? '0 0 8px rgba(74,222,128,0.5)'
            : '0 0 6px rgba(248,113,113,0.4)',
        }}
      />
    </div>
  );
}

// ─────────────────────── GEO overview ────────────────

function GeoOverview({ results }: { results: AuditResult['geo']['results'] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const mentionedCount = results.filter(r => r.mentioned).length;

  return (
    <div className="mb-5 p-4 rounded-xl bg-slate-50 dark:bg-[#150f20] border border-slate-100 dark:border-purple-900/20">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest">
          AI Vidljivost
        </p>
        <span className="text-xs font-bold text-slate-600 dark:text-gray-300">
          {mentionedCount}/{results.length} modela
        </span>
      </div>
      {/* Model icons row */}
      <div className="flex gap-2">
        {results.map((r, i) => (
          <div
            key={i}
            className="flex-1 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all"
            style={{
              background: r.mentioned ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.07)',
              border: r.mentioned
                ? '1px solid rgba(74,222,128,0.3)'
                : '1px solid rgba(248,113,113,0.2)',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(6px)',
              transition: `opacity 0.5s ease ${i * 120}ms, transform 0.5s ease ${i * 120}ms`,
            }}
          >
            <span className="text-base leading-none">{modelIcon(r.model)}</span>
          </div>
        ))}
      </div>
      {/* Overall fill bar */}
      <div className="mt-3 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-1.5 rounded-full transition-all duration-1200"
          style={{
            width: mounted ? `${(mentionedCount / results.length) * 100}%` : '0%',
            background: 'linear-gradient(to right, #818cf8, #4ade80)',
            transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1) 300ms',
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────── Score History Chart ─────────

function ScoreHistoryChart({ history }: { history: HistoryItem[] }) {
  const items = [...history].reverse().slice(-10);
  if (items.length < 2) return null;

  const W = 400, H = 80, PAD = 12;
  const seoScores = items.map(h => h.seoScore ?? 0);
  const geoScores = items.map(h => h.geoScore ?? 0);
  const xStep = (W - PAD * 2) / Math.max(items.length - 1, 1);

  const toPath = (scores: number[]) =>
    scores.map((s, i) => {
      const x = PAD + i * xStep;
      const y = PAD + ((100 - s) / 100) * (H - PAD * 2);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest">
          Historija Skorova
        </p>
        <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 border-t-2 border-indigo-400" />SEO
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 border-t-2 border-purple-400" />GEO
          </span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        {[25, 50, 75].map(v => {
          const y = PAD + ((100 - v) / 100) * (H - PAD * 2);
          return <line key={v} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth={1} />;
        })}
        <path d={toPath(geoScores)} fill="none" stroke="#a78bfa" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <path d={toPath(seoScores)} fill="none" stroke="#818cf8" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {seoScores.map((s, i) => (
          <circle key={`s${i}`} cx={PAD + i * xStep} cy={PAD + ((100 - s) / 100) * (H - PAD * 2)} r={3} fill="#818cf8" />
        ))}
        {geoScores.map((s, i) => (
          <circle key={`g${i}`} cx={PAD + i * xStep} cy={PAD + ((100 - s) / 100) * (H - PAD * 2)} r={3} fill="#a78bfa" />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-slate-400 dark:text-gray-600">{timeAgo(items[0].createdAt)} ago</span>
        <span className="text-[10px] text-slate-400 dark:text-gray-600">Sada</span>
      </div>
    </Card>
  );
}

// ─────────────────────── Generic Card ────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#1c1528] border border-slate-200 dark:border-purple-900/40 rounded-2xl shadow-sm dark:shadow-none ${className}`}>
      {children}
    </div>
  );
}

function StepBadge({ n, done }: { n: number; done?: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
      done
        ? 'bg-green-500 text-white'
        : 'bg-slate-100 dark:bg-[#2a1f3d] text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-purple-800/50'
    }`}>
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </div>
  );
}

// ─── Animated ScoreCard ────────────────────────────────

function ScoreCard({ label, score, sub }: { label: string; score: number; sub: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-4">
          <span className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
            {label}
          </span>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full inline-block"
            style={{ color: scoreColor(score), background: scoreBg(score), border: `1px solid ${scoreBorder(score)}` }}
          >
            {scoreLabel(score)}
          </span>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-3 leading-relaxed">{sub}</p>
        </div>
        <ScoreRing score={score} />
      </div>
    </Card>
  );
}

// ═════════════════════════════════════════════════════
//  DASHBOARD
// ═════════════════════════════════════════════════════

export default function Dashboard() {
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
    const seoColor = (s: number) => s >= 80 ? '#16a34a' : s >= 50 ? '#ca8a04' : '#dc2626';
    const seoBg    = (s: number) => s >= 80 ? '#f0fdf4' : s >= 50 ? '#fefce8' : '#fef2f2';
    const seoBorder= (s: number) => s >= 80 ? '#4ade80' : s >= 50 ? '#facc15' : '#f87171';

    const metaRows = [
      ['Title tag', !!seo.meta.title],
      ['Meta description', !!seo.meta.description],
      ['H1 naslov', seo.meta.hasH1],
      ['Open Graph', seo.meta.hasOgTags],
      ['Canonical URL', seo.meta.hasCanonical],
      ['Sitemap.xml', seo.meta.hasSitemap],
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
          <th style="padding:8px 12px;text-align:left;border-radius:6px 0 0 6px">Metrika</th>
          <th style="padding:8px 12px;text-align:center">Vaš sajt</th>
          <th style="padding:8px 12px;text-align:center;border-radius:0 6px 6px 0">Konkurent</th>
        </tr>
        <tr><td style="padding:8px 12px">SEO Score</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor(seo.score)}">${seo.score}/100</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor(competitorResult.seo.score)}">${competitorResult.seo.score}/100</td>
        </tr>
        <tr style="background:#f9fafb"><td style="padding:8px 12px">GEO Score</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor(geo.score)}">${geo.score}/100</td>
          <td style="padding:8px 12px;text-align:center;font-weight:700;color:${seoColor(competitorResult.geo.score)}">${competitorResult.geo.score}/100</td>
        </tr>
        <tr><td style="padding:8px 12px">SEO Problemi</td>
          <td style="padding:8px 12px;text-align:center">${seo.issues.length}</td>
          <td style="padding:8px 12px;text-align:center">${competitorResult.seo.issues.length}</td>
        </tr>
        <tr style="background:#f9fafb"><td style="padding:8px 12px">AI Pominje</td>
          <td style="padding:8px 12px;text-align:center">${geo.mentionedIn}/${geo.totalModels}</td>
          <td style="padding:8px 12px;text-align:center">${competitorResult.geo.mentionedIn}/${competitorResult.geo.totalModels}</td>
        </tr>
      </table>` : '';

    const html = `<!DOCTYPE html>
<html lang="bs">
<head>
  <meta charset="UTF-8">
  <title>SEO·GEO Audit Izvještaj — ${seo.url}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1e1b4b}
    h1{font-size:28px;font-weight:900;color:#4f46e5;margin-bottom:4px}
    h2{font-size:16px;font-weight:700;margin:28px 0 12px;border-bottom:2px solid #e0e7ff;padding-bottom:6px;color:#312e81}
    .scores{display:flex;gap:20px;margin:20px 0}
    .score-box{flex:1;padding:20px;border-radius:12px;text-align:center;border:2px solid}
    .score-num{font-size:48px;font-weight:900;line-height:1}
    .meta-row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #e5e7eb;font-size:13px}
    .ok{color:#16a34a;font-weight:700}.no{color:#dc2626;font-weight:700}
    .rec{padding:8px 12px;background:#f5f3ff;border-radius:8px;margin:6px 0;font-size:13px;border-left:3px solid #818cf8}
    .footer{margin-top:40px;font-size:11px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:16px}
    @media print{body{padding:20px}.no-print{display:none}}
  </style>
</head>
<body>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
    <div style="width:36px;height:36px;border-radius:10px;background:#6366f1;display:flex;align-items:center;justify-content:center;color:white;font-weight:900;font-size:14px">⚡</div>
    <h1 style="margin:0">SEO·GEO Audit Izvještaj</h1>
  </div>
  <p style="color:#6b7280;font-size:13px;margin-bottom:24px">
    URL: <strong>${seo.url}</strong> · Datum: ${new Date().toLocaleDateString('bs-BA', { day: '2-digit', month: '2-digit', year: 'numeric' })}
    ${selectedRepo ? ` · Repo: ${selectedRepo.fullName}` : ''}
  </p>
  <div class="scores">
    <div class="score-box" style="border-color:${seoBorder(seo.score)};background:${seoBg(seo.score)}">
      <div class="score-num" style="color:${seoColor(seo.score)}">${seo.score}</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px;color:#6b7280;letter-spacing:.05em">SEO SCORE</div>
    </div>
    <div class="score-box" style="border-color:${seoBorder(geo.score)};background:${seoBg(geo.score)}">
      <div class="score-num" style="color:${seoColor(geo.score)}">${geo.score}</div>
      <div style="font-size:12px;font-weight:700;margin-top:6px;color:#6b7280;letter-spacing:.05em">GEO SCORE</div>
    </div>
  </div>
  <h2>SEO Meta Provjera</h2>
  ${metaRows.map(([l,ok])=>`<div class="meta-row"><span>${l}</span><span class="${ok?'ok':'no'}">${ok?'✓ OK':'✗ Nedostaje'}</span></div>`).join('')}
  <h2>SEO Problemi (${seo.issues.length})</h2>
  ${issueHtml || '<p style="color:#6b7280;font-size:13px">Nema kritičnih problema 🎉</p>'}
  <h2>GEO — AI Vidljivost (${geo.mentionedIn}/${geo.totalModels} modela)</h2>
  ${geoHtml}
  <h2>GEO Preporuke</h2>
  ${geo.recommendations.map(r=>`<div class="rec">→ ${r}</div>`).join('')}
  ${compSection}
  <div class="footer">Generisano sa <strong>SEO·GEO Platform</strong> · ${new Date().toISOString()}</div>
  <script>window.onload=()=>setTimeout(()=>window.print(),400)</script>
</body>
</html>`;
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0414] text-slate-900 dark:text-white relative overflow-x-hidden transition-colors duration-200">

      {/* AI Loader overlays */}
      {auditLoading && <AiLoader text="Analiziram" size={180} />}
      {optLoading   && <AiLoader text="Generišem"  size={180} />}

      {/* Background gradients */}
      <div className="hidden dark:flex gap-40 rotate-[-20deg] absolute top-[-40rem] right-[-30rem] z-0 blur-[4rem] skew-[-40deg] opacity-20 pointer-events-none">
        <div className="w-40 h-80 bg-gradient-to-b from-white to-blue-300" />
        <div className="w-40 h-80 bg-gradient-to-b from-white to-blue-300" />
        <div className="w-40 h-80 bg-gradient-to-b from-white to-purple-300" />
      </div>
      <div className="flex dark:hidden gap-40 rotate-[-20deg] absolute top-[-40rem] right-[-30rem] z-0 blur-[5rem] skew-[-40deg] opacity-20 pointer-events-none">
        <div className="w-40 h-80 bg-gradient-to-b from-indigo-200 to-purple-200" />
        <div className="w-40 h-80 bg-gradient-to-b from-indigo-200 to-purple-200" />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-10 flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-purple-900/30 bg-white/80 dark:bg-[#0c0414]/80 backdrop-blur-sm sticky top-0 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">
              SEO<span className="text-indigo-500">·</span>GEO
            </span>
          </div>

          {/* Step progress */}
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            {[1, 2, 3].map(n => (
              <div key={n} className={`h-1.5 rounded-full transition-all duration-300 ${
                n < step  ? 'w-6 bg-indigo-400 opacity-40'
                : n === step ? 'w-8 bg-indigo-500'
                : 'w-2 bg-slate-200 dark:bg-purple-900'
              }`} />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {auditResult && (
            <div className="flex items-center gap-2 mr-1">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: scoreColor(auditResult.seo.score), background: scoreBg(auditResult.seo.score) }}>
                SEO {auditResult.seo.score}
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: scoreColor(auditResult.geo.score), background: scoreBg(auditResult.geo.score) }}>
                GEO {auditResult.geo.score}
              </span>
            </div>
          )}
          <img src={session?.user?.image || ''} alt="" className="w-7 h-7 rounded-full border-2 border-slate-200 dark:border-purple-800/50" />
          <span className="text-xs text-slate-500 dark:text-gray-400 hidden sm:inline">{session?.user?.name}</span>
          <ThemeToggle />
          <button onClick={() => signOut()} className="text-slate-400 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </nav>

      <div className="relative z-10 max-w-[960px] mx-auto px-4 py-8 flex flex-col gap-5">

        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-gray-500 mt-1">Poveži repo → pokreni audit → otvori Pull Request</p>
        </div>

        {/* ── History + Chart ── */}
        {history.length > 0 && !auditResult && (
          <>
            <ScoreHistoryChart history={history} />
            <Card className="p-4">
              <p className="text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">Prethodna mjerenja</p>
              <div className="flex flex-col gap-1">
                {history.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-purple-900/20 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 dark:text-gray-600">{timeAgo(item.createdAt)} ago</span>
                      {item.url && <span className="text-xs text-slate-600 dark:text-gray-400">{item.url.replace(/https?:\/\//, '')}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {item.seoScore !== null && (
                        <span className="text-xs font-bold" style={{ color: scoreColor(item.seoScore) }}>SEO {item.seoScore}</span>
                      )}
                      {item.geoScore !== null && (
                        <span className="text-xs font-bold" style={{ color: scoreColor(item.geoScore) }}>GEO {item.geoScore}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* ── STEP 1: Repos ── */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <StepBadge n={1} done={step > 1} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Repozitorijum</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
                  {selectedRepo ? selectedRepo.fullName : 'Odaberi projekat koji želiš da optimizuješ'}
                </p>
              </div>
            </div>
            <button onClick={fetchRepos} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 bg-slate-100 dark:bg-[#2a1f3d] hover:bg-slate-200 dark:hover:bg-purple-900/50 rounded-full px-3 py-1.5 transition-all">
              <RefreshCw className="w-3 h-3" />
              Osveži
            </button>
          </div>

          {loadingRepos && (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-[#2a1f3d] animate-pulse" />
              ))}
            </div>
          )}

          {repoError && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {repoError}
            </div>
          )}

          {!loadingRepos && repos.length === 0 && !repoError && (
            <div className="border border-dashed border-slate-200 dark:border-purple-900/40 rounded-xl p-8 text-center">
              <GitBranch className="w-8 h-8 text-slate-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-gray-500 mb-4">Nema repozitorijuma na ovom nalogu.</p>
              <a href="https://github.com/new" target="_blank" className="text-xs bg-slate-100 dark:bg-[#2a1f3d] hover:bg-slate-200 dark:hover:bg-purple-900/50 border border-slate-200 dark:border-purple-800/40 transition-all rounded-full px-4 py-2 text-slate-600 dark:text-gray-300 inline-flex items-center gap-2">
                <GitBranch className="w-3.5 h-3.5" />
                Napravi repozitorijum
              </a>
            </div>
          )}

          {repos.length > 0 && (
            <div className="flex flex-col gap-2">
              {repos.map(repo => {
                const isSelected = selectedRepo?.id === repo.id;
                return (
                  <div
                    key={repo.id}
                    onClick={() => { setSelectedRepo(repo); setUrl(repo.homepage || ''); setAuditResult(null); setPrUrl(null); }}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-300 dark:border-indigo-500/40 shadow-[0_0_0_1px_rgba(99,102,241,0.1)]'
                        : 'bg-slate-50 dark:bg-[#150f20] border-slate-200 dark:border-purple-900/30 hover:bg-white dark:hover:bg-[#1e1630] hover:border-slate-300 dark:hover:border-purple-800/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{repo.name}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          repo.isPrivate
                            ? 'text-slate-400 dark:text-gray-500 border-slate-200 dark:border-gray-700/50 bg-slate-100 dark:bg-gray-800/30'
                            : 'text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/50 bg-indigo-50 dark:bg-indigo-500/10'
                        }`}>{repo.isPrivate ? 'Private' : 'Public'}</span>
                        {repo.language && <span className="text-xs text-slate-400 dark:text-gray-600">{repo.language}</span>}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-slate-500 dark:text-gray-500 truncate">{repo.description}</p>
                      )}
                      {repo.homepage && (
                        <p className="text-xs text-indigo-500 mt-0.5">🌐 {repo.homepage}</p>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 ml-3">
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ── STEP 2: Audit ── */}
        {selectedRepo && (
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <StepBadge n={2} done={step > 2} />
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">SEO + GEO Audit</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Upiši URL sajta i pokreni analizu</p>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-[#150f20] border border-slate-200 dark:border-purple-900/40 rounded-full flex items-center px-4 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/60 transition-all">
                <Search className="w-4 h-4 text-slate-400 dark:text-gray-600 flex-shrink-0" />
                <input
                  type="text"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAudit()}
                  placeholder="https://tvoj-sajt.com"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-gray-300 placeholder-slate-300 dark:placeholder-gray-700 px-3 py-3"
                />
              </div>
              <button
                onClick={runAudit}
                disabled={auditLoading}
                className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-full px-5 py-2.5 text-sm font-semibold text-white flex items-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.3)] whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4" />
                Pokreni
              </button>
            </div>

            {/* Competitor URL */}
            <div className="mt-3 flex gap-2">
              <div className="flex-1 bg-slate-50 dark:bg-[#150f20] border border-slate-200 dark:border-purple-900/40 rounded-full flex items-center px-4 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/60 transition-all">
                <Bot className="w-4 h-4 text-slate-400 dark:text-gray-600 flex-shrink-0" />
                <input
                  type="text"
                  value={competitorUrl}
                  onChange={e => setCompetitorUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runCompetitorAudit()}
                  placeholder="URL konkurenta (opcionalno)"
                  className="flex-1 bg-transparent outline-none text-sm text-slate-700 dark:text-gray-300 placeholder-slate-300 dark:placeholder-gray-700 px-3 py-3"
                />
              </div>
              <button
                onClick={runCompetitorAudit}
                disabled={!competitorUrl || competitorLoading}
                className="bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all rounded-full px-4 py-2.5 text-sm font-semibold text-white whitespace-nowrap flex items-center gap-1.5"
              >
                {competitorLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                Poredi
              </button>
            </div>

            {auditError && (
              <div className="mt-4 flex items-center gap-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-3 text-sm text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {auditError}
              </div>
            )}
          </Card>
        )}

        {/* ── Results ── */}
        {auditResult && (
          <>
            {/* Score cards with animated rings */}
            <div className="grid grid-cols-2 gap-4">
              <ScoreCard
                label="SEO Score"
                score={auditResult.seo.score}
                sub={`${auditResult.seo.issues.length} problema pronađeno`}
              />
              <ScoreCard
                label="GEO Score"
                score={auditResult.geo.score}
                sub={`${auditResult.geo.mentionedIn} od ${auditResult.geo.totalModels} AI modela te pominje`}
              />
            </div>

            {/* ── Competitor Comparison ── */}
            {competitorResult && (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Poređenje sa Konkurentom</p>
                  <span className="text-xs text-slate-400 dark:text-gray-500 ml-1">{competitorUrl.replace(/https?:\/\//, '')}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest pb-3 pr-4">Metrika</th>
                        <th className="text-center text-xs font-bold text-indigo-500 uppercase tracking-widest pb-3 px-4">Vaš sajt</th>
                        <th className="text-center text-xs font-bold text-purple-500 uppercase tracking-widest pb-3 pl-4">Konkurent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: 'SEO Score', a: auditResult.seo.score, b: competitorResult.seo.score, higher: true },
                        { label: 'GEO Score', a: auditResult.geo.score, b: competitorResult.geo.score, higher: true },
                        { label: 'SEO Problemi', a: auditResult.seo.issues.length, b: competitorResult.seo.issues.length, higher: false },
                        { label: 'AI Pominje', a: auditResult.geo.mentionedIn, b: competitorResult.geo.mentionedIn, higher: true },
                      ].map(({ label, a, b, higher }) => {
                        const aWins = higher ? a > b : a < b;
                        const bWins = higher ? b > a : b < a;
                        return (
                          <tr key={label} className="border-t border-slate-100 dark:border-purple-900/20">
                            <td className="py-2.5 pr-4 text-slate-600 dark:text-gray-400 text-xs">{label}</td>
                            <td className="py-2.5 px-4 text-center">
                              <span className={`font-bold text-sm ${aWins ? 'text-green-500' : bWins ? 'text-red-400' : 'text-slate-500 dark:text-gray-400'}`}>
                                {a}{label.includes('Score') ? '/100' : ''}
                                {aWins && ' ✓'}
                              </span>
                            </td>
                            <td className="py-2.5 pl-4 text-center">
                              <span className={`font-bold text-sm ${bWins ? 'text-green-500' : aWins ? 'text-red-400' : 'text-slate-500 dark:text-gray-400'}`}>
                                {b}{label.includes('Score') ? '/100' : ''}
                                {bWins && ' ✓'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">

              {/* ── SEO card ── */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-4 h-4 text-indigo-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">SEO Analiza</p>
                </div>

                {/* Severity bar chart */}
                <SeverityBars issues={auditResult.seo.issues} />

                {/* Meta checklist */}
                <div className="space-y-0 mb-5">
                  {[
                    { label: 'Title tag',       ok: !!auditResult.seo.meta.title              },
                    { label: 'Meta description', ok: !!auditResult.seo.meta.description        },
                    { label: 'H1 naslov',        ok: auditResult.seo.meta.hasH1               },
                    { label: 'Open Graph',       ok: auditResult.seo.meta.hasOgTags           },
                    { label: 'Canonical URL',    ok: auditResult.seo.meta.hasCanonical        },
                    { label: 'Sitemap.xml',      ok: auditResult.seo.meta.hasSitemap          },
                    { label: 'Schema markup',    ok: auditResult.seo.meta.hasSchemaMarkup     },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-purple-900/20 last:border-0 text-xs">
                      <span className="text-slate-600 dark:text-gray-400">{label}</span>
                      <div className={`flex items-center gap-1.5 font-semibold ${ok ? 'text-green-500' : 'text-red-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.5)]'}`} />
                        {ok ? 'OK' : 'Nedostaje'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Issues list */}
                {auditResult.seo.issues.length > 0 && (
                  <>
                    <p className="text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">
                      Problemi ({auditResult.seo.issues.length})
                    </p>
                    <div className="flex flex-col gap-2">
                      {auditResult.seo.issues.map((issue, i) => {
                        const leftColor = issue.severity === 'critical' ? 'border-l-red-400' : issue.severity === 'warning' ? 'border-l-yellow-400' : 'border-l-indigo-400';
                        const Icon      = issue.severity === 'critical' ? AlertCircle : issue.severity === 'warning' ? AlertTriangle : Info;
                        const iconColor = issue.severity === 'critical' ? 'text-red-500' : issue.severity === 'warning' ? 'text-yellow-500' : 'text-indigo-500';
                        return (
                          <div key={i} className={`bg-slate-50 dark:bg-[#150f20] border border-slate-200 dark:border-purple-900/30 border-l-2 ${leftColor} rounded-xl p-3`}>
                            <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1.5 ${iconColor}`}>
                              <Icon className="w-3.5 h-3.5" />
                              {issue.severity === 'critical' ? 'Kritično' : issue.severity === 'warning' ? 'Upozorenje' : 'Info'}
                            </div>
                            <p className="text-sm font-medium text-slate-800 dark:text-gray-200 mb-1">{issue.message}</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">→ {issue.recommendation}</p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>

              {/* ── GEO card ── */}
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Bot className="w-4 h-4 text-purple-500" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">GEO Analiza</p>
                </div>

                {/* AI Visibility overview */}
                <GeoOverview results={auditResult.geo.results} />

                {/* Model cards with bars */}
                <div className="flex flex-col gap-2 mb-5">
                  {auditResult.geo.results.map((r, i) => (
                    <div key={i} className={`p-3.5 rounded-xl border transition-all ${
                      r.mentioned
                        ? 'bg-green-50 dark:bg-green-500/5 border-green-200 dark:border-green-500/20'
                        : 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/15'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{modelIcon(r.model)}</span>
                          <span className="text-sm font-medium text-slate-800 dark:text-white">{r.model}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs font-semibold ${r.mentioned ? 'text-green-500' : 'text-red-500'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${r.mentioned ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]' : 'bg-red-400 shadow-[0_0_5px_rgba(248,113,113,0.4)]'}`} />
                          {r.mentioned ? 'Pominje te' : 'Ne pominje te'}
                        </div>
                      </div>
                      {/* Animated mention bar */}
                      <ModelBar mentioned={r.mentioned} delay={i * 150} />
                      {r.context && (
                        <p className="text-xs text-slate-500 dark:text-gray-500 italic leading-relaxed border-t border-slate-200/50 dark:border-white/5 pt-2 mt-2">
                          "{r.context.substring(0, 130)}..."
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                <div className="border-t border-slate-100 dark:border-purple-900/20 pt-4">
                  <p className="text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest mb-3">Preporuke</p>
                  <div className="flex flex-col gap-2">
                    {auditResult.geo.recommendations.map((rec, i) => (
                      <div key={i} className="flex gap-2 text-xs text-slate-600 dark:text-gray-400 leading-relaxed">
                        <ChevronRight className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0 mt-0.5" />
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>

            {/* ── STEP 3: Optimize ── */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={3} done={!!prUrl} />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">AI Optimizacija</p>
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">Claude generiše izmjene i otvara Pull Request na GitHubu</p>
                </div>
              </div>

              {prUrl ? (
                <div className="bg-green-50 dark:bg-green-500/8 border border-green-200 dark:border-green-500/25 rounded-xl p-4">
                  <p className="text-sm font-bold text-green-600 dark:text-green-400 mb-3">✅ Pull Request je uspješno otvoren!</p>
                  <a href={prUrl} target="_blank" className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 transition-all rounded-full px-5 py-2 text-sm font-semibold text-white">
                    <GitBranch className="w-4 h-4" />
                    Otvori PR na GitHubu
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <button
                  onClick={runOptimize}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 transition-all rounded-xl px-6 py-3.5 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(99,102,241,0.25)]"
                >
                  <Zap className="w-4 h-4" />
                  Pokreni AI Optimizaciju → Otvori PR
                </button>
              )}
            </Card>

            {/* ── PDF Export ── */}
            <div className="flex justify-end">
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-100 dark:bg-[#1c1528] hover:bg-indigo-50 dark:hover:bg-indigo-500/10 border border-slate-200 dark:border-purple-900/40 hover:border-indigo-200 dark:hover:border-indigo-500/30 rounded-full px-4 py-2 transition-all"
              >
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
