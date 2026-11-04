import { cn } from '../lib/utils';

/** Placeholder wordmark – replace with the official Solluz Synergy logo when available. */
export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden>
        <defs>
          <linearGradient id="logo-sun" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffcb4a" />
            <stop offset="1" stopColor="#f99307" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={dark ? '#ffffff14' : '#13243f'} />
        <circle cx="20" cy="17" r="6.5" fill="url(#logo-sun)" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="19" y="5.5" width="2" height="3.5" rx="1" fill="#ffcb4a" transform={`rotate(${a} 20 17)`} />
        ))}
        <path d="M8 33 L13 26 H27 L32 33 Z" fill="#3d68a3" />
        <path d="M13 26 L11.5 33 M20 26 V33 M27 26 L28.5 33 M10.5 29.5 H29.5" stroke="#c3d4ea" strokeWidth="0.9" />
      </svg>
      <span className="leading-none">
        <span className={cn('block text-lg font-extrabold tracking-tight', dark ? 'text-white' : 'text-navy-950')}>
          Solluz<span className="text-sun-500"> Synergy</span>
        </span>
        <span className={cn('mt-0.5 block text-[10px] font-semibold tracking-[0.2em] uppercase', dark ? 'text-navy-300' : 'text-slate-500')}>
          Solar Solutions
        </span>
      </span>
    </span>
  );
}
