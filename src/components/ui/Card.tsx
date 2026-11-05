import type { HTMLAttributes, ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...rest} />;
}

export function CardHeader({ title, description, action, icon }: { title: ReactNode; description?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
      <div className="flex min-w-0 items-start gap-3">
        {icon && <div className="mt-0.5 rounded-lg bg-primary-100 p-2 text-primary-700">{icon}</div>}
        <div className="min-w-0">
          <h3 className="text-base font-bold sm:text-lg">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-5 sm:px-6', className)} {...rest} />;
}

type Tone = 'neutral' | 'primary' | 'secondary' | 'green' | 'red';
const badgeTones: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  primary: 'bg-primary-100 text-primary-800',
  secondary: 'bg-secondary-100 text-secondary-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-red-100 text-red-700',
};

export function Badge({ tone = 'neutral', className, children }: { tone?: Tone; className?: string; children: ReactNode }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeTones[tone], className)}>{children}</span>;
}

type AlertTone = 'info' | 'warning' | 'success' | 'error';
const alertStyles: Record<AlertTone, { cls: string; Icon: typeof Info }> = {
  info: { cls: 'border-secondary-200 bg-secondary-50 text-secondary-900', Icon: Info },
  warning: { cls: 'border-amber-300 bg-amber-50 text-amber-900', Icon: AlertTriangle },
  success: { cls: 'border-emerald-300 bg-emerald-50 text-emerald-900', Icon: CheckCircle2 },
  error: { cls: 'border-red-300 bg-red-50 text-red-900', Icon: XCircle },
};

export function Alert({ tone = 'info', title, children, className, action }: { tone?: AlertTone; title?: ReactNode; children?: ReactNode; className?: string; action?: ReactNode }) {
  const { cls, Icon } = alertStyles[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border p-4 text-sm', cls, className)}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn(title ? 'mt-1' : '', 'leading-relaxed opacity-90')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint, icon, className }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4', className)}>
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-xl font-bold text-secondary-950 tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
