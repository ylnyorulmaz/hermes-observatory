import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export type BadgeVariant = 'busy' | 'idle' | 'offline' | 'neutral' | 'accent';

const VARIANTS: Record<BadgeVariant, string> = {
  busy: 'text-[#1a1a1a] bg-[#4ade80]',
  idle: 'text-[#1a1a1a] bg-[#fbbf24]',
  offline: 'text-[#e5e5e5] bg-[#3a3a3a]',
  neutral: 'text-[#e5e5e5] bg-[#1f1f22]',
  accent: 'text-[#1a1a1a] bg-[#38d9d9]',
};

export function Badge({
  variant = 'neutral',
  className,
  children,
  ...props
}: { variant?: BadgeVariant } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'pixel-badge inline-flex items-center gap-1 px-2 py-0.5 font-pixel text-[10px] leading-none uppercase',
        VARIANTS[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export type { ReactNode };
