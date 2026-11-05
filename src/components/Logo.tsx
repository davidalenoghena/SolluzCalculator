import { cn } from '../lib/utils';

const iconSrc = `${import.meta.env.BASE_URL}logo-icon.png`;

/** Solluz Synergy logo: the green hexagon mark plus the company name as text, so it works on light and dark backgrounds. */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img src={iconSrc} alt="" aria-hidden className="h-10 w-10 shrink-0" width={40} height={40} />
      <span className="leading-none">
        <span className={cn('block text-base font-extrabold tracking-tight uppercase', dark ? 'text-white' : 'text-slate-900')}>
          Solluz <span className={dark ? 'text-primary-400' : 'text-primary-600'}>Synergy</span>
        </span>
        <span className={cn('mt-1 block text-[10px] font-semibold tracking-[0.2em] uppercase', dark ? 'text-secondary-200' : 'text-secondary-800')}>
          Services Limited
        </span>
      </span>
    </span>
  );
}
