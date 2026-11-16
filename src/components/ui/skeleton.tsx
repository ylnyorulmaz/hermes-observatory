import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../lib/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('pixel-skeleton h-4 w-full', className)} {...props} />;
}
