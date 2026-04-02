'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Check, X, Zap } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { WovenCanvas } from '@/components/ui/woven-canvas';
import { RippleButton } from '@/components/ui/ripple-button';
import { useTheme } from '@/components/providers/theme-provider';

const TIERS = [
  {
    name: 'Free',
    price: '€0',
    period: '/zauvijek',
    badge: null,
    description: 'Savršeno za isprobavanje platforme',
    cta: 'Počni besplatno',
    ctaAction: 'signin',
    features: [
      { label: '3 audita mjesečno',   ok: true  },
      { label: 'SEO + GEO analiza',   ok: true  },
      { label: '4 AI modela',         ok: true  },
      { label: 'Historija (7 dana)',  ok: true  },
      { label: 'Automatski PR',       ok: false },
      { label: 'Zakazani auditi',     ok: false },
      { label: 'PDF izvještaji',      ok: false },
      { label: 'Prioritetna podrška', ok: false },
    ],
  },
  {
    name: 'Pro',
    price: '€19',
    period: '/mjesec',
    badge: 'Najpopularniji',
    description: 'Za ozbiljne projekte i male timove',
    cta: 'Počni Pro trial',
    ctaAction: 'signin',
    features: [
      { label: 'Neograničeni auditi',         ok: true },
      { label: 'SEO + GEO analiza',           ok: true },
      { label: '4 AI modela',                 ok: true },
      { label: 'Historija (neograničena)',     ok: true },
      { label: 'Automatski PR na GitHub',     ok: true },
      { label: 'Zakazani auditi (sedmično)',  ok: true },
      { label: 'PDF izvještaji',              ok: true },
      { label: 'Email obavještenja',          ok: true },
    ],
  },
  {
    name: 'Team',
    price: '€49',
    period: '/mjesec',
    badge: null,
    description: 'Za agencije i veće timove',
    cta: 'Kontaktiraj nas',
    ctaAction: 'contact',
    features: [
      { label: 'Sve iz Pro plana',             ok: true },
      { label: 'Do 10 korisnika',              ok: true },
      { label: 'Zajednički workspace',         ok: true },
      { label: 'API pristup',                  ok: true },
      { label: 'Bijeli label izvještaji',      ok: true },
      { label: 'Integracija sa Slack/Teams',   ok: true },
      { label: 'Dnevni zakazani auditi',       ok: true },
      { label: 'Dedicated support (SLA)',      ok: true },
    ],
  },
] as const;

const FAQ = [
  {
    q: 'Mogu li otkazati pretplatu u bilo kom trenutku?',
    a: 'Da, pretplatu možeš otkazati kad god želiš. Nastavit ćeš imati pristup do kraja obračunskog perioda.',
  },
  {
    q: 'Koji AI modeli se koriste za GEO audit?',
    a: 'Koristimo Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google) i Perplexity AI — sve 4 vodeće AI tražilice.',
  },
  {
    q: 'Kako funkcioniše automatski Pull Request?',
    a: 'Claude AI analizira tvoj sajt, generiše konkretne izmjene (llms.txt, README, Schema.org markup) i automatski otvara PR na tvom GitHub repozitorijumu.',
  },
  {
    q: 'Šta su zakazani auditi?',
    a: 'Svake sedmice automatski pokrenemo audit tvog sajta i šaljemo ti izvještaj — bez da ti moraš ništa ručno pokretati.',
  },
  {
    q: 'Da li nude besplatni trial za Pro?',
    a: 'Da! Pro plan dolazi sa 14-dnevnim besplatnim trialom. Kreditna kartica nije potrebna.',
  },
];

export default function PricingPage() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: isDark ? '#07010f' : '#f3f0ff',
        color: isDark ? '#fff' : '#1e1b4b',
      }}
    >
      {/* Background canvas */}
      <WovenCanvas key={theme} isDark={isDark} position="fixed" opacity={0.55} />

      {/* Subtle overlay so text stays readable */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          background: isDark
            ? 'linear-gradient(to bottom, rgba(7,1,15,0.60) 0%, rgba(7,1,15,0.30) 40%, rgba(7,1,15,0.70) 100%)'
            : 'linear-gradient(to bottom, rgba(243,240,255,0.60) 0%, rgba(243,240,255,0.25) 40%, rgba(243,240,255,0.70) 100%)',
        }}
      />

      {/* ── Navbar ──────────────────────────────────────────── */}
      <nav className="relative z-20 flex justify-center pt-4 px-4">
        <div
          className="w-full max-w-4xl flex items-center justify-between rounded-full px-5 py-3"
          style={{
            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.60)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.18)'}`,
            boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
          }}
        >
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: '#6366f1', boxShadow: '0 0 14px rgba(99,102,241,0.55)' }}
              >
                <Zap className="w-3.5 h-3.5 text-white" />
              </div>
              <span
                className="font-bold text-sm tracking-tight"
                style={{ color: isDark ? '#fff' : '#1e1b4b' }}
              >
                SEO<span className="text-indigo-400">·</span>GEO
              </span>
            </Link>
            <Link
              href="/dashboard"
              className="text-xs hidden sm:block transition-opacity hover:opacity-70"
              style={{ color: isDark ? 'rgba(200,195,255,0.55)' : 'rgba(79,70,229,0.65)' }}
            >
              Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => signIn('github')}
              className="cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-all"
              style={{
                background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.12)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.18)' : 'rgba(99,102,241,0.25)'}`,
                color: isDark ? '#fff' : '#1e1b4b',
              }}
            >
              Prijavi se
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-xs font-semibold"
            style={{
              background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.10)',
              border: `1px solid ${isDark ? 'rgba(99,102,241,0.30)' : 'rgba(99,102,241,0.25)'}`,
              backdropFilter: 'blur(8px)',
              color: isDark ? 'rgba(200,195,255,0.85)' : 'rgba(79,70,229,0.9)',
            }}
          >
            <Zap className="w-3.5 h-3.5" />
            Transparentne cijene bez iznenađenja
          </div>

          <h1
            className="text-4xl sm:text-5xl font-black tracking-tight mb-4"
            style={{ color: isDark ? '#ffffff' : '#1e1b4b' }}
          >
            Odaberi plan koji<br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)' }}
            >
              odgovara tebi
            </span>
          </h1>
          <p style={{ color: isDark ? 'rgba(200,195,255,0.55)' : 'rgba(79,70,229,0.6)' }} className="max-w-md mx-auto text-base">
            Počni besplatno. Unaprijedi kad si spreman. Bez obaveza.
          </p>
        </div>

        {/* ── Pricing cards ──────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20 items-center">
          {TIERS.map((tier) => {
            const isPro = tier.name === 'Pro';

            return (
              <div
                key={tier.name}
                className="relative flex flex-col rounded-2xl p-7 transition-all duration-300"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.42) 100%)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: isPro
                    ? `1px solid ${isDark ? 'rgba(34,211,238,0.35)' : 'rgba(34,211,238,0.45)'}`
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.10)' : 'rgba(99,102,241,0.15)'}`,
                  boxShadow: isPro
                    ? `0 0 0 2px ${isDark ? 'rgba(34,211,238,0.18)' : 'rgba(34,211,238,0.22)'}, 0 8px 40px rgba(34,211,238,0.12)`
                    : '0 4px 24px rgba(0,0,0,0.08)',
                  transform: isPro ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {/* Popular badge */}
                {tier.badge && (
                  <div
                    className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap"
                    style={{
                      background: 'linear-gradient(90deg, #06b6d4, #818cf8)',
                      color: '#fff',
                      boxShadow: '0 0 18px rgba(34,211,238,0.45)',
                    }}
                  >
                    {tier.badge}
                  </div>
                )}

                {/* Tier name */}
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: isPro ? 'rgba(34,211,238,0.9)' : (isDark ? 'rgba(200,195,255,0.45)' : 'rgba(79,70,229,0.5)') }}
                >
                  {tier.name}
                </p>

                {/* Price */}
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className="text-5xl tracking-tight"
                    style={{
                      fontWeight: 200,
                      color: isDark ? '#ffffff' : '#1e1b4b',
                      lineHeight: 1,
                    }}
                  >
                    {tier.price}
                  </span>
                  <span
                    className="text-sm mb-1.5"
                    style={{ color: isDark ? 'rgba(200,195,255,0.40)' : 'rgba(79,70,229,0.45)' }}
                  >
                    {tier.period}
                  </span>
                </div>

                <p
                  className="text-xs mb-6"
                  style={{ color: isDark ? 'rgba(200,195,255,0.45)' : 'rgba(79,70,229,0.55)' }}
                >
                  {tier.description}
                </p>

                {/* Divider */}
                <div
                  className="w-full h-px mb-5"
                  style={{
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.12)',
                  }}
                />

                {/* Features */}
                <div className="flex flex-col gap-3 flex-1 mb-7">
                  {tier.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5">
                      {f.ok ? (
                        <Check
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: isPro ? '#22d3ee' : (isDark ? '#818cf8' : '#6366f1') }}
                        />
                      ) : (
                        <X
                          className="w-4 h-4 flex-shrink-0"
                          style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(79,70,229,0.2)' }}
                        />
                      )}
                      <span
                        className="text-sm"
                        style={{
                          color: !f.ok
                            ? (isDark ? 'rgba(255,255,255,0.22)' : 'rgba(79,70,229,0.28)')
                            : (isDark ? 'rgba(230,228,255,0.85)' : 'rgba(30,27,75,0.85)'),
                        }}
                      >
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA RippleButton */}
                <RippleButton
                  onClick={() =>
                    tier.ctaAction === 'signin'
                      ? signIn('github')
                      : (window.location.href = 'mailto:hello@seo-geo.app')
                  }
                  className="w-full py-3 rounded-xl text-sm font-semibold"
                  style={
                    isPro
                      ? {
                          background: 'linear-gradient(90deg, rgba(34,211,238,0.28), rgba(99,102,241,0.32))',
                          border: '1px solid rgba(34,211,238,0.40)',
                          color: '#fff',
                          boxShadow: '0 0 20px rgba(34,211,238,0.18)',
                        }
                      : {
                          background: isDark
                            ? 'rgba(255,255,255,0.07)'
                            : 'rgba(99,102,241,0.10)',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(99,102,241,0.20)'}`,
                          color: isDark ? 'rgba(230,228,255,0.85)' : '#1e1b4b',
                        }
                  }
                >
                  {tier.cta}
                </RippleButton>
              </div>
            );
          })}
        </div>

        {/* ── Comparison table ───────────────────────────────────── */}
        <div className="mb-20">
          <h2
            className="text-xl font-bold text-center mb-8"
            style={{ color: isDark ? '#fff' : '#1e1b4b' }}
          >
            Detaljna poređenja
          </h2>
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)'
                : 'linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.40) 100%)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.14)'}`,
            }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(99,102,241,0.10)'}` }}>
                  <th
                    className="text-left text-xs font-bold uppercase tracking-widest p-4"
                    style={{ color: isDark ? 'rgba(200,195,255,0.35)' : 'rgba(79,70,229,0.40)' }}
                  >
                    Funkcionalnost
                  </th>
                  {TIERS.map((t) => (
                    <th
                      key={t.name}
                      className="text-center text-xs font-bold uppercase tracking-widest p-4"
                      style={{
                        color:
                          t.name === 'Pro'
                            ? '#22d3ee'
                            : t.name === 'Team'
                            ? '#818cf8'
                            : isDark
                            ? 'rgba(200,195,255,0.45)'
                            : 'rgba(79,70,229,0.5)',
                      }}
                    >
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['SEO Audit',              true,       true,          true        ],
                  ['GEO Audit (4 modela)',   true,       true,          true        ],
                  ['Historija mjerenja',     '7 dana',   'Neograničena','Neograničena'],
                  ['Automatski GitHub PR',   false,      true,          true        ],
                  ['Zakazani auditi',        false,      'Sedmično',    'Dnevno'    ],
                  ['PDF izvještaji',         false,      true,          true        ],
                  ['Email obavještenja',     false,      true,          true        ],
                  ['API pristup',            false,      false,         true        ],
                  ['Broj korisnika',         '1',        '1',           'Do 10'     ],
                  ['Bijeli label',           false,      false,         true        ],
                ].map(([label, free, pro, team], i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(99,102,241,0.07)'}`,
                      background: i % 2 === 1
                        ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(99,102,241,0.03)')
                        : 'transparent',
                    }}
                  >
                    <td
                      className="p-4 text-sm"
                      style={{ color: isDark ? 'rgba(230,228,255,0.75)' : 'rgba(30,27,75,0.75)' }}
                    >
                      {label}
                    </td>
                    {[free, pro, team].map((v, j) => (
                      <td key={j} className="p-4 text-center">
                        {typeof v === 'boolean' ? (
                          v ? (
                            <Check
                              className="w-4 h-4 mx-auto"
                              style={{ color: j === 1 ? '#22d3ee' : '#818cf8' }}
                            />
                          ) : (
                            <X
                              className="w-4 h-4 mx-auto"
                              style={{ color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(79,70,229,0.18)' }}
                            />
                          )
                        ) : (
                          <span
                            className="text-xs font-semibold"
                            style={{ color: isDark ? 'rgba(200,195,255,0.65)' : 'rgba(79,70,229,0.65)' }}
                          >
                            {v}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2
            className="text-xl font-bold text-center mb-8"
            style={{ color: isDark ? '#fff' : '#1e1b4b' }}
          >
            Često postavljana pitanja
          </h2>
          <div className="flex flex-col gap-4">
            {FAQ.map((item, i) => (
              <div
                key={i}
                className="rounded-xl p-5"
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)'
                    : 'linear-gradient(135deg, rgba(255,255,255,0.70) 0%, rgba(255,255,255,0.40) 100%)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.09)' : 'rgba(99,102,241,0.14)'}`,
                }}
              >
                <p
                  className="font-semibold text-sm mb-2"
                  style={{ color: isDark ? '#fff' : '#1e1b4b' }}
                >
                  {item.q}
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: isDark ? 'rgba(200,195,255,0.55)' : 'rgba(79,70,229,0.60)' }}
                >
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA ───────────────────────────────────────────── */}
        <div
          className="text-center rounded-2xl p-10"
          style={{
            background: isDark
              ? 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(168,85,247,0.16) 100%)'
              : 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(168,85,247,0.12) 100%)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: `1px solid ${isDark ? 'rgba(99,102,241,0.30)' : 'rgba(99,102,241,0.25)'}`,
            boxShadow: '0 8px 40px rgba(99,102,241,0.18)',
          }}
        >
          <h2
            className="text-2xl font-black mb-2"
            style={{ color: isDark ? '#fff' : '#1e1b4b' }}
          >
            Spreman/a da počneš?
          </h2>
          <p
            className="text-sm mb-6"
            style={{ color: isDark ? 'rgba(200,195,255,0.60)' : 'rgba(79,70,229,0.65)' }}
          >
            Bez kreditne kartice. Bez obaveza. Pokreni prvi audit za 60 sekundi.
          </p>
          <RippleButton
            onClick={() => signIn('github')}
            className="inline-flex items-center gap-2 font-bold text-sm rounded-full px-8 py-3"
            style={{
              background: 'rgba(99,102,241,0.30)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(99,102,241,0.50)',
              boxShadow: '0 0 32px rgba(99,102,241,0.22)',
              color: isDark ? '#fff' : '#1e1b4b',
            }}
          >
            <Zap className="w-4 h-4" />
            Počni besplatno s GitHubom
          </RippleButton>
        </div>

      </main>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-8 text-xs"
        style={{
          color: isDark ? 'rgba(255,255,255,0.13)' : 'rgba(79,70,229,0.3)',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.10)'}`,
          marginTop: '2.5rem',
        }}
      >
        SEO·GEO Platform ·{' '}
        <a
          href="mailto:hello@seo-geo.app"
          className="hover:opacity-60 transition-opacity"
        >
          hello@seo-geo.app
        </a>
      </footer>
    </div>
  );
}
