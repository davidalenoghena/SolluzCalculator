import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>;
}

export function Section({ id, className, children, tone = 'white' }: { id?: string; className?: string; children: ReactNode; tone?: 'white' | 'muted' | 'dark' }) {
  return (
    <section
      id={id}
      className={cn(
        'py-16 sm:py-24',
        tone === 'muted' && 'bg-slate-50',
        tone === 'dark' && 'bg-secondary-950 text-white',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  dark,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'center' | 'left';
  dark?: boolean;
}) {
  return (
    <div className={cn('max-w-3xl', align === 'center' && 'mx-auto text-center')}>
      {eyebrow && <p className={cn('text-sm font-bold tracking-widest uppercase', dark ? 'text-primary-400' : 'text-primary-600')}>{eyebrow}</p>}
      <h2 className={cn('mt-2 text-3xl font-extrabold sm:text-4xl', dark && 'text-white')}>{title}</h2>
      {description && <p className={cn('mt-4 text-base leading-relaxed sm:text-lg', dark ? 'text-secondary-200' : 'text-slate-600')}>{description}</p>}
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, children }: { eyebrow?: string; title: ReactNode; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="relative overflow-hidden bg-secondary-950 pt-28 pb-16 text-white sm:pt-36 sm:pb-20">
      <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-secondary-500/30 blur-3xl" />
      <Container className="relative">
        {eyebrow && <p className="text-sm font-bold tracking-widest text-primary-400 uppercase">{eyebrow}</p>}
        <h1 className="mt-2 max-w-3xl text-4xl font-extrabold text-white sm:text-5xl">{title}</h1>
        {description && <p className="mt-4 max-w-2xl text-lg leading-relaxed text-secondary-200">{description}</p>}
        {children}
      </Container>
    </div>
  );
}
