'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="w-8 h-8 flex items-center justify-center rounded-full transition-all
        bg-slate-100 hover:bg-slate-200 text-slate-600
        dark:bg-[#2a1f3d] dark:hover:bg-purple-900/60 dark:text-gray-400 dark:hover:text-gray-200"
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4" />
        : <Moon className="w-4 h-4" />
      }
    </button>
  );
}
