'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft, CheckCircle2, AlertTriangle, AlertCircle,
  Info, ExternalLink, GitBranch, Globe, Bot, Search, Clock
} from 'lucide-react';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/components/providers/theme-provider';

// ─── Types ────────────────────────────────────────────────────────────────────

type Issue = { type: string; severity: string; message: string; recommendation: string };
type GeoResult = { model: string; mentioned: boolean; context: string | null };

type AuditDetail = {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  seoScore: number | null;
  geoScore: number | null;
  issues: Issue[];
  rawData: {
    seo?: {
      score: number; url: string; issues: Issue[];
      meta: { title: string | null; description: string | null; hasH1: boolean; hasCanonical: boolean; hasRobots: boolean; hasSitemap: boolean; hasSchemaMarkup: boolean; hasOgTags: boolean };
    };
    geo?: {
      score: number; totalModels: number; mentionedIn: number;
      results: GeoResult[];
      recommendations: string[];
    };
    url?: string;
  } | null;
  prUrl: string | null;
  prFiles: string[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreColor(s: number) { return s >= 80 ? '#4ade80' : s >= 50 ? '#facc15' : '#f87171'; }
function scoreBg(s: number)    { return s >= 80 ? 'rgba(74,222,128,0.1)' : s >= 50 ? 'rgba(250,204,21,0.1)' : 'rgba(248,113,113,0.1)'; }
function scoreBorder(s: number){ return s >= 80 ? 'rgba(74,222,128,0.25)' : s >= 50 ? 'rgba(250,204,21,0.25)' : 'rgba(248,113,113,0.25)'; }
function scoreLabel(s: number) { return s >= 80 ? 'Odličan' : s >= 50 ? 'Osrednji' : 'Loš'; }

const severityConfig: Record<string, { color: string; bg: string; border: string; icon: React.ReactNode; label: string }> = {
  critical: { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)', icon: <AlertCircle size={14} />, label: 'Kritično' },
  warning:  { color: '#facc15', bg: 'rgba(250,204,21,0.08)',  border: 'rgba(250,204,21,0.2)',  icon: <AlertTriangle size={14} />, label: 'Upozorenje' },
  info:     { color: '#60a5fa', bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.2)',  icon: <Info size={14} />,          label: 'Info' },
  success:  { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  icon: <CheckCircle2 size={14} />,  label: 'OK' },
};

function modelIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('claude'))     return { emoji: '🟣', color: '#a855f7' };
  if (n.includes('gpt') || n.includes('openai')) return { emoji: '🟢', color: '#22c55e' };
  if (n.includes('gemini'))     return { emoji: '🔵', color: '#3b82f6' };
  if (n.includes('perplexity')) return { emoji: '🩵', color: '#06b6d4' };
  return { emoji: '🤖', color: '#818cf8' };
}

// ─── Glass card ───────────────────────────────────────────────────────────────

function Card({ children, className = '', glow }: { children: React.ReactNode; className?: string; glow?: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className={`rounded-2xl p-5 ${className}`} style={{
      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: glow ? `0 0 32px ${glow}, 0 4px 24px rgba(0,0,0,0.15)` : '0 4px 20px rgba(0,0,0,0.10)',
    }}>
      {children}
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, label }: { score: number; label: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const r = 52; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div className="absolute inset-0 rounded-full" style={{ background: `radial-gradient(circle at center, ${color}18 0%, transparent 70%)` }} />
        <svg width={120} height={120} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={60} cy={60} r={r} fill="none" stroke={isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} strokeWidth={7} />
          <circle cx={60} cy={60} r={r} fill="none" stroke={color} strokeWidth={7}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 1s cubic-bezier(0.16,1,0.3,1)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-light" style={{ color }}>{score}</span>
          <span className="text-[9px] uppercase tracking-widest mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)' }}>{scoreLabel(score)}</span>
        </div>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>{label}</span>
    </div>
  );
}

// ─── Meta check row ───────────────────────────────────────────────────────────

function MetaRow({ label, ok, value }: { label: string; ok: boolean; value?: string | null }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
      <span className="mt-0.5 flex-shrink-0">{ok ? <CheckCircle2 size={14} color="#4ade80" /> : <AlertCircle size={14} color="#f87171" />}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)' }}>{label}</p>
        {value && <p className="text-xs mt-0.5 truncate" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}>{value}</p>}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    fetch(`/api/audit/${params.id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setAudit(data);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.id]);

  const text = (op: number) => isDark ? `rgba(255,255,255,${op})` : `rgba(0,0,0,${op})`;

  const seo = audit?.rawData?.seo;
  const geo = audit?.rawData?.geo;
  const url = audit?.rawData?.url || seo?.url || '';
  const issues: Issue[] = seo?.issues ?? (audit?.issues as Issue[]) ?? [];

  const critCount = issues.filter(i => i.severity === 'critical').length;
  const warnCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return (
    <div className="relative min-h-screen" style={{ background: isDark ? '#07010f' : '#f3f0ff' }}>
      <WovenCanvas position="fixed" />

      {/* Navbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4"
        style={{
          background: isDark ? 'rgba(7,1,15,0.8)' : 'rgba(243,240,255,0.8)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}>
        <button onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: text(0.6) }}>
          <ChevronLeft size={16} /> Dashboard
        </button>
        <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ color: text(0.4), background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
          {params?.id?.toString().slice(0, 8)}...
        </span>
        <ThemeToggle />
      </div>

      {/* Loading */}
      {loading && (
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(129,140,248,0.2)', borderTopColor: '#818cf8' }} />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="relative z-10 max-w-xl mx-auto px-4 py-16 text-center">
          <AlertCircle size={40} color="#f87171" className="mx-auto mb-4" />
          <p className="text-sm" style={{ color: text(0.6) }}>{error}</p>
          <button onClick={() => router.push('/dashboard')}
            className="mt-4 text-sm px-4 py-2 rounded-xl"
            style={{ background: 'rgba(129,140,248,0.15)', color: '#818cf8' }}>
            Nazad na Dashboard
          </button>
        </div>
      )}

      {audit && !loading && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-5"
          style={{ animation: 'fadeSlideUp 0.5s ease both' }}>

          {/* Header */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={14} style={{ color: text(0.4) }} />
                  <span className="text-xs" style={{ color: text(0.45) }}>
                    {url.replace(/https?:\/\//, '') || 'Nepoznat URL'}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>
                    {audit.type === 'seo_geo_scheduled' ? 'Automatski' : 'Ručni'} audit
                  </span>
                  <span className="flex items-center gap-1 text-xs" style={{ color: text(0.35) }}>
                    <Clock size={11} />
                    {new Date(audit.createdAt).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              {audit.prUrl && (
                <a href={audit.prUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90 flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', boxShadow: '0 4px 16px rgba(34,197,94,0.25)' }}>
                  <GitBranch size={14} />
                  Pogledaj PR
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </Card>

          {/* Score rings */}
          {(audit.seoScore !== null || audit.geoScore !== null) && (
            <Card glow="rgba(129,140,248,0.10)">
              <div className="flex items-center justify-center gap-8 sm:gap-16 py-2">
                {audit.seoScore !== null && <ScoreRing score={audit.seoScore} label="SEO Score" />}
                {audit.seoScore !== null && audit.geoScore !== null && (
                  <span className="text-2xl font-thin" style={{ color: text(0.2) }}>vs</span>
                )}
                {audit.geoScore !== null && <ScoreRing score={audit.geoScore} label="GEO Score" />}
              </div>

              {/* Issue summary bar */}
              {issues.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-4 pt-4"
                  style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
                  {critCount > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                      <AlertCircle size={11} /> {critCount} kritično
                    </span>
                  )}
                  {warnCount > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(250,204,21,0.1)', color: '#facc15', border: '1px solid rgba(250,204,21,0.2)' }}>
                      <AlertTriangle size={11} /> {warnCount} upozorenja
                    </span>
                  )}
                  {infoCount > 0 && (
                    <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.2)' }}>
                      <Info size={11} /> {infoCount} info
                    </span>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* SEO Issues */}
          {issues.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Search size={14} style={{ color: text(0.4) }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text(0.35) }}>
                  SEO Problemi ({issues.length})
                </p>
              </div>
              <div className="space-y-2">
                {issues.map((issue, i) => {
                  const cfg = severityConfig[issue.severity] ?? severityConfig.info;
                  return (
                    <div key={i} className="rounded-xl p-4"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <div className="flex items-start gap-2">
                        <span style={{ color: cfg.color, flexShrink: 0, marginTop: 1 }}>{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: `${cfg.color}20`, color: cfg.color }}>
                              {cfg.label}
                            </span>
                            <span className="text-xs font-medium" style={{ color: text(0.8) }}>{issue.message}</span>
                          </div>
                          <p className="text-xs leading-relaxed" style={{ color: text(0.5) }}>
                            💡 {issue.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Meta tags */}
          {seo?.meta && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={14} style={{ color: text(0.4) }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text(0.35) }}>Meta tagovi</p>
              </div>
              <MetaRow label="Title tag" ok={!!seo.meta.title} value={seo.meta.title} />
              <MetaRow label="Meta description" ok={!!seo.meta.description} value={seo.meta.description} />
              <MetaRow label="H1 tag" ok={seo.meta.hasH1} />
              <MetaRow label="Canonical URL" ok={seo.meta.hasCanonical} />
              <MetaRow label="Robots.txt" ok={seo.meta.hasRobots} />
              <MetaRow label="Sitemap.xml" ok={seo.meta.hasSitemap} />
              <MetaRow label="Schema markup" ok={seo.meta.hasSchemaMarkup} />
              <MetaRow label="Open Graph tagovi" ok={seo.meta.hasOgTags} />
            </Card>
          )}

          {/* GEO Results */}
          {geo && (
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Bot size={14} style={{ color: text(0.4) }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text(0.35) }}>
                  GEO — AI Modeli ({geo.mentionedIn}/{geo.totalModels} pominje)
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {geo.results.map((r, i) => {
                  const icon = modelIcon(r.model);
                  return (
                    <div key={i} className="rounded-xl p-4"
                      style={{
                        background: r.mentioned ? `${icon.color}10` : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${r.mentioned ? `${icon.color}30` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                      }}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">{icon.emoji}</span>
                        <span className="text-xs font-semibold" style={{ color: r.mentioned ? icon.color : text(0.5) }}>
                          {r.model}
                        </span>
                        <span className="ml-auto">
                          {r.mentioned
                            ? <CheckCircle2 size={13} color="#4ade80" />
                            : <AlertCircle size={13} color="#f87171" />}
                        </span>
                      </div>
                      {r.context && (
                        <p className="text-xs italic leading-relaxed" style={{ color: text(0.45) }}>
                          "{r.context.slice(0, 120)}{r.context.length > 120 ? '…' : ''}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              {geo.recommendations.length > 0 && (
                <div className="rounded-xl p-4"
                  style={{ background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.15)' }}>
                  <p className="text-xs font-bold mb-2" style={{ color: '#818cf8' }}>💡 Preporuke za GEO</p>
                  <ul className="space-y-1.5">
                    {geo.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs flex gap-2" style={{ color: text(0.55) }}>
                        <span style={{ color: '#818cf8', flexShrink: 0 }}>→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {/* PR files */}
          {audit.prFiles.length > 0 && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <GitBranch size={14} style={{ color: text(0.4) }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: text(0.35) }}>
                  Fajlovi izmijenjeni u PR-u
                </p>
              </div>
              <div className="space-y-1.5">
                {audit.prFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono py-1.5 px-3 rounded-lg"
                    style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: text(0.6) }}>
                    <span style={{ color: '#4ade80' }}>+</span>
                    {f}
                  </div>
                ))}
              </div>
              {audit.prUrl && (
                <a href={audit.prUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 mt-4 text-sm px-4 py-2.5 rounded-xl w-full justify-center font-medium transition-all hover:opacity-90"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
                  <GitBranch size={14} />
                  Otvori Pull Request na GitHubu
                  <ExternalLink size={12} />
                </a>
              )}
            </Card>
          )}

        </div>
      )}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
