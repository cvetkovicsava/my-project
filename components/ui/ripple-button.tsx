'use client';

import { useRef, MouseEvent, ReactNode } from 'react';

interface RippleButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'primary' | 'ghost';
}

export function RippleButton({ children, onClick, className = '', style, variant = 'ghost' }: RippleButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    const btn = btnRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const size = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement('span');
    ripple.style.cssText = `
      position: absolute;
      left: ${x - size / 2}px;
      top: ${y - size / 2}px;
      width: ${size}px;
      height: ${size}px;
      border-radius: 50%;
      background: rgba(255,255,255,0.18);
      transform: scale(0);
      animation: ripple-expand 0.55s ease-out forwards;
      pointer-events: none;
    `;

    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    onClick?.();
  };

  return (
    <>
      <style>{`
        @keyframes ripple-expand {
          to { transform: scale(1); opacity: 0; }
        }
      `}</style>
      <button
        ref={btnRef}
        onClick={handleClick}
        className={`relative overflow-hidden cursor-pointer ${className}`}
        style={style}
      >
        {children}
      </button>
    </>
  );
}
