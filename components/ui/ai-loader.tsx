'use client';

import * as React from 'react';

interface LoaderProps {
  size?: number;
  text?: string;
}

export const AiLoader: React.FC<LoaderProps> = ({ size = 180, text = 'Analiziram' }) => {
  const letters = text.split('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-100 via-white to-slate-200 dark:from-[#1a3379] dark:via-[#0f172a] dark:to-black">
      <div
        className="relative flex items-center justify-center select-none"
        style={{ width: size, height: size }}
      >
        {letters.map((letter, index) => (
          <span
            key={index}
            className="inline-block text-slate-700 dark:text-white opacity-40 loader-letter"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            {letter === ' ' ? '\u00A0' : letter}
          </span>
        ))}
        <div className="absolute inset-0 rounded-full loader-circle" />
      </div>
    </div>
  );
};
