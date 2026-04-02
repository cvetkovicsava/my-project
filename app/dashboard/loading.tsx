'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { WovenCanvas } from '@/components/ui/woven-canvas';

function Skeleton({ w = '100%', h = 20, radius = 8 }: { w?: string | number; h?: number; radius?: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: radius,
        background: isDark
          ? 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)'
          : 'linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.09) 50%, rgba(0,0,0,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.6s infinite',
      }}
    />
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.65)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        backdropFilter: 'blur(14px)',
      }}
    >
      {children}
    </div>
  );
}

export default function DashboardLoading() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="relative min-h-screen" style={{ background: isDark ? '#07010f' : '#f3f0ff' }}>
      <WovenCanvas position="fixed" />

      {/* Navbar skeleton */}
      <div
        className="sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 py-4"
        style={{
          background: isDark ? 'rgba(7,1,15,0.8)' : 'rgba(243,240,255,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
        }}
      >
        <div className="flex items-center gap-3">
          <Skeleton w={28} h={28} radius={8} />
          <Skeleton w={120} h={14} radius={6} />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton w={60} h={22} radius={20} />
          <Skeleton w={60} h={22} radius={20} />
          <Skeleton w={28} h={28} radius={8} />
          <Skeleton w={28} h={28} radius={8} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Hero score rings skeleton */}
        <GlassCard>
          <div className="flex items-center justify-center gap-8 py-4">
            <div className="flex flex-col items-center gap-3">
              <Skeleton w={140} h={140} radius={70} />
              <Skeleton w={60} h={12} radius={6} />
            </div>
            <Skeleton w={32} h={20} radius={6} />
            <div className="flex flex-col items-center gap-3">
              <Skeleton w={140} h={140} radius={70} />
              <Skeleton w={60} h={12} radius={6} />
            </div>
          </div>
        </GlassCard>

        {/* Chart skeleton */}
        <GlassCard>
          <Skeleton w={100} h={10} radius={5} />
          <div className="mt-4">
            <Skeleton w="100%" h={80} radius={10} />
          </div>
        </GlassCard>

        {/* Meta grid skeleton */}
        <GlassCard>
          <Skeleton w={80} h={10} radius={5} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-xl p-3 space-y-2"
                style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                <Skeleton w={28} h={28} radius={8} />
                <Skeleton w="70%" h={10} radius={5} />
                <Skeleton w="50%" h={8} radius={4} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Step cards skeleton */}
        {[1, 2, 3].map(n => (
          <GlassCard key={n}>
            <div className="flex items-center gap-3 mb-4">
              <Skeleton w={28} h={28} radius={14} />
              <div className="space-y-2 flex-1">
                <Skeleton w="40%" h={13} radius={6} />
                <Skeleton w="65%" h={10} radius={5} />
              </div>
            </div>
            <Skeleton w="100%" h={44} radius={12} />
          </GlassCard>
        ))}
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
