import type { HTMLAttributes, ReactElement } from 'react';
import { cn } from '../../lib/cn';

export function Separator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('h-[2px] w-full bg-[#26262a]', className)} {...props} />;
}
