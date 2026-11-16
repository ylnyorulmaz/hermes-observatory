import type { ReactElement, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Empty({
  title,
  description,
  className,
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}): ReactElement {
  return (
    <div className={cn('pixel-panel flex flex-col items-center justify-center gap-2 px-6 py-10 text-center', className)}>
      <div className="font-pixel text-2xl text-[#3a3a3a]">[ ]</div>
      {title ? <p className="font-pixel text-sm text-[#a1a1aa]">{title}</p> : null}
      {description ? <p className="max-w-sm text-xs text-[#71717a]">{description}</p> : null}
      {children}
    </div>
  );
}
