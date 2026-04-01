'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { CheckCircle2, Zap, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const TIERS = [
  {
    name: 'Free',
    price: '€0',
    period: '/zauvijek',
    badge: null,
    description: 'Savršeno za isprobavanje platforme',
    cta: 'Počni besplatno',
    ctaAction: 'signin',
    color: 'indigo',
    features: [
      { label: '3 audita mjesečno', ok: true },
      { label: 'SEO + GEO analiza', ok: true },
      { label: '4 AI modela', ok: true },
      { label: 'Historija (7 dana)', ok: true },
      { label: 'Automatski PR', ok: false },
      { label: 'Zakazani auditi', ok: false },
      { label: 'PDF izvještaji', ok: false },
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
    color: 'purple',
    features: [
      { label: 'Neograničeni auditi', ok: true },
      { label: 'SEO + GEO analiza', ok: true },
      { label: '4 AI modela', ok: true },
      { label: 'Historija (neograničena)', ok: true },
      { label: 'Automatski PR na GitHub', ok: true },
      { label: 'Zakazani auditi (sedmično)', ok: true },
      { label: 'PDF izvještaji', ok: true },
      { label: 'Email obavještenja', ok: true },
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
    color: 'green',
    features: [
      { label: 'Sve iz Pro plana', ok: true },
      { label: 'Do 10 korisnika', ok: true },
      { label: 'Zajednički workspace', ok: true },
      { label: 'API pristup', ok: true },
      { label: 'Bijeli label izvještaji', ok: true },
      { label: 'Integracija sa Slack/Teams', ok: true },
      { label: 'Dnevni zakazani auditi', ok: true },
      { label: 'Dedicated support (SLA)', ok: true },
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
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0414] text-slate-900 dark:text-white transition-colors duration-200">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-purple-900/30 bg-white/80 dark:bg-[#0c0414]/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.4)]">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">SEO<span className="text-indigo-500">·</span>GEO</span>
          </Link>
          <Link href="/dashboard" className="text-xs text-slate-500 dark:text-gray-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => signIn('github')}
            className="text-xs font-semibold text-white bg-indigo-500 hover:bg-indigo-400 transition-all rounded-full px-4 py-1.5"
          >
            Počni besplatno
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 mb-6 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20">
            <Zap className="w-3.5 h-3.5" />
            Transparentne cijene bez iznenađenja
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
            Odaberi plan koji<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #6366f1, #a855f7)' }}>
              odgovara tebi
            </span>
          </h1>
          <p className="text-slate-500 dark:text-gray-400 max-w-md mx-auto text-base">
            Počni besplatno. Unaprijedi kad si spreman. Bez obaveza.
          </p>
        </div>

        {/* Tiers */}
        <div className="grid sm:grid-cols-3 gap-6 mb-20">
          {TIERS.map((tier) => {
            const isPro = tier.name === 'Pro';
            return (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-6 flex flex-col ${
                  isPro
                    ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-[0_8px_40px_rgba(99,102,241,0.35)]'
                    : 'bg-white dark:bg-[#1c1528] border border-slate-200 dark:border-purple-900/40'
                }`}
              >
                {/* Badge */}
                {tier.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 shadow-sm whitespace-nowrap">
                    {tier.badge}
                  </div>
                )}

                <div className="mb-5">
                  <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${isPro ? 'text-indigo-200' : 'text-slate-400 dark:text-gray-600'}`}>
                    {tier.name}
                  </p>
                  <div className="flex items-end gap-1 mb-1">
                    <span className={`text-4xl font-black ${isPro ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{tier.price}</span>
                    <span className={`text-sm mb-1 ${isPro ? 'text-indigo-200' : 'text-slate-400 dark:text-gray-500'}`}>{tier.period}</span>
                  </div>
                  <p className={`text-xs ${isPro ? 'text-indigo-200' : 'text-slate-500 dark:text-gray-500'}`}>{tier.description}</p>
                </div>

                {/* Features */}
                <div className="flex flex-col gap-2.5 mb-6 flex-1">
                  {tier.features.map((f) => (
                    <div key={f.label} className="flex items-center gap-2.5">
                      {f.ok ? (
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-indigo-200' : 'text-green-500'}`} />
                      ) : (
                        <X className={`w-4 h-4 flex-shrink-0 ${isPro ? 'text-indigo-300/50' : 'text-slate-300 dark:text-gray-700'}`} />
                      )}
                      <span className={`text-sm ${!f.ok ? (isPro ? 'text-indigo-300/50' : 'text-slate-300 dark:text-gray-700') : (isPro ? 'text-white' : 'text-slate-700 dark:text-gray-300')}`}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => tier.ctaAction === 'signin' ? signIn('github') : window.location.href = 'mailto:hello@seo-geo.app'}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    isPro
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-[0_4px_20px_rgba(0,0,0,0.15)]'
                      : 'bg-slate-100 dark:bg-[#2a1f3d] hover:bg-slate-200 dark:hover:bg-purple-900/50 text-slate-700 dark:text-white border border-slate-200 dark:border-purple-800/40'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* Compare table */}
        <div className="mb-20">
          <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-8">Detaljna poređenja</h2>
          <div className="bg-white dark:bg-[#1c1528] border border-slate-200 dark:border-purple-900/40 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-purple-900/30">
                  <th className="text-left text-xs font-bold text-slate-400 dark:text-gray-600 uppercase tracking-widest p-4">Funkcionalnost</th>
                  {TIERS.map(t => (
                    <th key={t.name} className="text-center text-xs font-bold uppercase tracking-widest p-4" style={{ color: t.name === 'Pro' ? '#818cf8' : t.name === 'Team' ? '#4ade80' : '#94a3b8' }}>
                      {t.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['SEO Audit', true, true, true],
                  ['GEO Audit (4 modela)', true, true, true],
                  ['Historija mjerenja', '7 dana', 'Neograničena', 'Neograničena'],
                  ['Automatski GitHub PR', false, true, true],
                  ['Zakazani auditi', false, 'Sedmično', 'Dnevno'],
                  ['PDF izvještaji', false, true, true],
                  ['Email obavještenja', false, true, true],
                  ['API pristup', false, false, true],
                  ['Broj korisnika', '1', '1', 'Do 10'],
                  ['Bijeli label', false, false, true],
                ].map(([label, free, pro, team], i) => (
                  <tr key={i} className={`border-b border-slate-100 dark:border-purple-900/20 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-[#150f20]/30' : ''}`}>
                    <td className="p-4 text-sm text-slate-700 dark:text-gray-300">{label}</td>
                    {[free, pro, team].map((v, j) => (
                      <td key={j} className="p-4 text-center">
                        {typeof v === 'boolean' ? (
                          v
                            ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                            : <X className="w-4 h-4 text-slate-300 dark:text-gray-700 mx-auto" />
                        ) : (
                          <span className="text-xs font-semibold text-slate-600 dark:text-gray-400">{v}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-20">
          <h2 className="text-xl font-bold text-center text-slate-800 dark:text-white mb-8">Često postavljana pitanja</h2>
          <div className="flex flex-col gap-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white dark:bg-[#1c1528] border border-slate-200 dark:border-purple-900/40 rounded-xl p-5">
                <p className="font-semibold text-sm text-slate-800 dark:text-white mb-2">{item.q}</p>
                <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-10 shadow-[0_8px_40px_rgba(99,102,241,0.25)]">
          <h2 className="text-2xl font-black text-white mb-2">Spreman/a da počneš?</h2>
          <p className="text-indigo-200 text-sm mb-6">Bez kreditne kartice. Bez obaveza. Pokreni prvi audit za 60 sekundi.</p>
          <button
            onClick={() => signIn('github')}
            className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm rounded-full px-8 py-3 hover:bg-indigo-50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.15)]"
          >
            <Zap className="w-4 h-4" />
            Počni besplatno s GitHubom
          </button>
        </div>

      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-400 dark:text-gray-600 border-t border-slate-200 dark:border-purple-900/20 mt-10">
        SEO·GEO Platform · <a href="mailto:hello@seo-geo.app" className="hover:text-indigo-500 transition-colors">hello@seo-geo.app</a>
      </footer>
    </div>
  );
}
