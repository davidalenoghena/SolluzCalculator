import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'light';
export type ButtonSize = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap';
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm shadow-primary-500/30 hover:bg-primary-500 hover:shadow-md hover:shadow-primary-500/30 active:scale-[0.98]',
  secondary: 'bg-secondary-900 text-white hover:bg-secondary-800 active:scale-[0.98]',
  outline: 'border border-slate-300 bg-white text-secondary-900 hover:border-secondary-400 hover:bg-secondary-50',
  ghost: 'text-secondary-800 hover:bg-secondary-50',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  light: 'border border-white/30 bg-white/10 text-white backdrop-blur hover:bg-white/20',
};
const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-13 px-7 text-base py-3.5',
};

export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, icon, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonLink({ variant = 'primary', size = 'md', className, icon, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

interface ButtonAnchorProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

export function ButtonAnchor({ variant = 'primary', size = 'md', className, icon, children, ...rest }: ButtonAnchorProps) {
  return (
    <a className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </a>
  );
}
