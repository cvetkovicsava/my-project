'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  User, Mail, Github, LogOut, Trash2, Shield, Bell,
  CheckCircle2, AlertTriangle, ChevronLeft, ExternalLink,
  Key, Clock, Activity
} from 'lucide-react';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useTheme } from '@/components/providers/theme-provider';

// ─── Card ────────────────────────────────────────────────────────────────────

function Card({
  children,
  className = '',
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.75)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: glow
          ? `0 0 32px ${glow}, 0 4px 24px rgba(0,0,0,0.18)`
          : '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {children}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center gap-2 mb-4">
      <span style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)' }}>{icon}</span>
      <span
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="flex items-center justify-between py-3"
      style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
      <span className="text-sm" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
        {label}
      </span>
      <span
        className={`text-sm font-medium ${mono ? 'font-mono' : ''}`}
        style={{ color: isDark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)' }}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className="relative inline-flex items-center h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: enabled ? '#818cf8' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="inline-block w-3.5 h-3.5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ transform: enabled ? 'translateX(18px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [stats, setStats] = useState<{ totalAudits: number; lastAudit: string | null } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch audit history to compute stats
  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/history')
      .then(r => r.json())
      .then((data: { id: string; createdAt: string }[]) => {
        setStats({
          totalAudits: data.length,
          lastAudit: data[0]?.createdAt ?? null,
        });
      })
      .catch(() => setStats({ totalAudits: 0, lastAudit: null }))
      .finally(() => setLoadingStats(false));
  }, [status]);

  if (status === 'loading') return null;

  const user = session?.user;
  const joinedDate = new Date().toLocaleDateString('sr-Latn', { year: 'numeric', month: 'long', day: 'numeric' });

  const text = (opacity: number) =>
    isDark ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`;

  return (
    <div
      className="relative min-h-screen w-full"
      style={{ background: isDark ? '#07010f' : '#f3f0ff' }}
    >
      <WovenCanvas position="fixed" />

      {/* Top bar */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-6 py-4"
        style={{
          background: isDark ? 'rgba(7,1,15,0.75)' : 'rgba(243,240,255,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
          style={{ color: text(0.6) }}
        >
          <ChevronLeft size={16} />
          Dashboard
        </button>

        <span className="font-semibold text-sm" style={{ color: text(0.85) }}>
          Podešavanja
        </span>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
            style={{
              color: '#f87171',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.2)',
            }}
          >
            <LogOut size={14} />
            Odjavi se
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-10 space-y-6">

        {/* Profile card */}
        <Card>
          <SectionTitle icon={<User size={14} />} label="Profil" />

          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-6">
            {user?.image ? (
              <img
                src={user.image}
                alt="avatar"
                className="w-16 h-16 rounded-full ring-2"
                style={{ ringColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, #818cf8, #a855f7)' }}
              >
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg" style={{ color: text(0.9) }}>
                {user?.name ?? 'Nepoznato'}
              </p>
              <p className="text-sm" style={{ color: text(0.45) }}>
                GitHub korisnik
              </p>
            </div>
          </div>

          <InfoRow label="Email" value={user?.email ?? '—'} />
          <InfoRow label="GitHub korisnik" value={`@${(session as any)?.githubId ?? '—'}`} mono />
          <InfoRow label="Plan" value={
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
              Free
            </span>
          } />
          <InfoRow label="Član od" value={joinedDate} />
        </Card>

        {/* Stats card */}
        <Card>
          <SectionTitle icon={<Activity size={14} />} label="Statistike" />
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Ukupno audita',
                value: loadingStats ? '…' : String(stats?.totalAudits ?? 0),
                color: '#818cf8',
              },
              {
                label: 'Zadnji audit',
                value: loadingStats
                  ? '…'
                  : stats?.lastAudit
                    ? new Date(stats.lastAudit).toLocaleDateString('sr-Latn', { day: 'numeric', month: 'short' })
                    : 'Nikad',
                color: '#22d3ee',
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="rounded-xl p-4 text-center"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'}`,
                }}
              >
                <p className="text-2xl font-light mb-1" style={{ color }}>{value}</p>
                <p className="text-xs" style={{ color: text(0.4) }}>{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <SectionTitle icon={<Bell size={14} />} label="Notifikacije" />
          <div className="space-y-1">
            <div className="flex items-center justify-between py-3"
              style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
              <div>
                <p className="text-sm font-medium" style={{ color: text(0.85) }}>Email notifikacije</p>
                <p className="text-xs mt-0.5" style={{ color: text(0.4) }}>Primaj obavještenja o završenim auditima</p>
              </div>
              <Toggle enabled={emailNotifs} onChange={setEmailNotifs} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium" style={{ color: text(0.85) }}>Sedmični izvještaj</p>
                <p className="text-xs mt-0.5" style={{ color: text(0.4) }}>Automatski audit svaki ponedjeljak u 9h</p>
              </div>
              <Toggle enabled={weeklyReport} onChange={setWeeklyReport} />
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <SectionTitle icon={<Shield size={14} />} label="Sigurnost" />
          <div
            className="flex items-center gap-3 p-4 rounded-xl"
            style={{
              background: isDark ? 'rgba(74,222,128,0.05)' : 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.15)',
            }}
          >
            <CheckCircle2 size={18} color="#4ade80" />
            <div>
              <p className="text-sm font-medium" style={{ color: '#4ade80' }}>GitHub OAuth aktivan</p>
              <p className="text-xs mt-0.5" style={{ color: text(0.45) }}>
                Prijavljen putem GitHub OAuth 2.0 — sigurna autentifikacija
              </p>
            </div>
          </div>

          <a
            href="https://github.com/settings/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between mt-4 py-3 transition-opacity hover:opacity-70"
            style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}
          >
            <div className="flex items-center gap-2">
              <Github size={16} style={{ color: text(0.5) }} />
              <span className="text-sm" style={{ color: text(0.7) }}>Upravljaj GitHub dozvolama</span>
            </div>
            <ExternalLink size={14} style={{ color: text(0.35) }} />
          </a>
        </Card>

        {/* Danger zone */}
        <Card>
          <SectionTitle icon={<AlertTriangle size={14} />} label="Opasna zona" />

          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
              style={{
                color: '#f87171',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <Trash2 size={14} />
              Obriši nalog
            </button>
          ) : (
            <div
              className="p-4 rounded-xl"
              style={{
                background: 'rgba(248,113,113,0.06)',
                border: '1px solid rgba(248,113,113,0.2)',
              }}
            >
              <p className="text-sm font-medium mb-1" style={{ color: '#f87171' }}>
                Da li si siguran?
              </p>
              <p className="text-xs mb-4" style={{ color: text(0.5) }}>
                Ovo će trajno obrisati tvoj nalog, sve auditе i podatke. Ova akcija se ne može poništiti.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="text-sm px-4 py-2 rounded-lg transition-all hover:opacity-80"
                  style={{
                    color: text(0.7),
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  }}
                >
                  Otkaži
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-sm px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                  style={{ background: 'rgba(248,113,113,0.8)', color: 'white' }}
                >
                  Odjavi se (brisanje uskoro)
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Version footer */}
        <p className="text-center text-xs pb-4" style={{ color: text(0.25) }}>
          SEO GEO Platform · v1.0 · 2025
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>
    </div>
  );
}
