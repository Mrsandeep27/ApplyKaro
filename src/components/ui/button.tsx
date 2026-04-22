import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'ghost' | 'outline' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

export function Button({ variant = 'primary', full, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        'btn',
        variant === 'primary' && 'bg-brand-600 text-white hover:bg-brand-700',
        variant === 'ghost' && 'bg-transparent hover:bg-ink-100 dark:hover:bg-ink-800 text-ink-800 dark:text-ink-100',
        variant === 'outline' && 'border border-ink-200 dark:border-ink-700 hover:bg-ink-100 dark:hover:bg-ink-800',
        variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-700',
        full && 'w-full',
        className,
      )}
    />
  );
}
