import { useState, useRef, type ReactElement, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

// Lightweight pixel-styled HoverCard (shadcn/8bitcn-compatible API surface).
// Opens on hover/focus, closes on leave/blur, positioned absolutely.
export function HoverCard({
  trigger,
  children,
  className,
  side = 'top',
}: {
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}): ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const sideClass = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  }[side];

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {trigger}
      {open ? (
        <div
          className={cn(
            'pixel-panel absolute z-50 min-w-[260px] p-3 text-left shadow-[4px_4px_0_#000]',
            sideClass,
            className,
          )}
          role="tooltip"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
