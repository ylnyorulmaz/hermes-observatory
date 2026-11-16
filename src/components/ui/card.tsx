import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../lib/cn';

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div className={cn('pixel-panel relative', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('flex items-center justify-between px-3 pt-3 pb-1', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>): ReactElement {
  return <h3 className={cn('font-pixel text-sm text-[#f2f2f2]', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('px-3 pb-3', className)} {...props} />;
}
