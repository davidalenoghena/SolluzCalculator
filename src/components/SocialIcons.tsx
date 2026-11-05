import type { CompanyInfo } from '../types';
import { cn } from '../lib/utils';

// Simple brand glyphs (lucide no longer ships brand icons).
const paths: Record<keyof CompanyInfo['social'], { label: string; d: string }> = {
  facebook: {
    label: 'Facebook',
    d: 'M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z',
  },
  instagram: {
    label: 'Instagram',
    d: 'M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 4c2.2 0 2.4 0 3.3.1 2.2.1 3.2 1.1 3.3 3.3.1.9.1 1.1.1 3.3v2.6c0 2.2 0 2.4-.1 3.3-.1 2.2-1.1 3.2-3.3 3.3-.9.1-1.1.1-3.3.1s-2.4 0-3.3-.1c-2.2-.1-3.2-1.1-3.3-3.3C5.3 15.7 5.3 15.5 5.3 13.3v-2.6c0-2.2 0-2.4.1-3.3.1-2.2 1.1-3.2 3.3-3.3C9.6 4 9.8 4 12 4z',
  },
  x: { label: 'X (Twitter)', d: 'M17.5 4h2.9l-6.4 7.3L21.5 20h-5.9l-4.6-6-5.3 6H2.8l6.8-7.8L2.5 4h6l4.2 5.5L17.5 4zm-1 14.3h1.6L7.6 5.6H5.9l10.6 12.7z' },
  linkedin: {
    label: 'LinkedIn',
    d: 'M6.9 8.8H3.8V20h3.1V8.8zM5.3 3.8a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6zM20.2 13.6c0-3-1.6-4.9-4.3-4.9-1.4 0-2.4.8-2.8 1.5V8.8H10V20h3.1v-5.8c0-1.5.5-2.6 1.9-2.6s1.9 1.1 1.9 2.6V20h3.2v-6.4z',
  },
};

export function SocialIcons({ social, className, iconClass }: { social: CompanyInfo['social']; className?: string; iconClass?: string }) {
  const entries = (Object.keys(paths) as (keyof CompanyInfo['social'])[]).filter((k) => social[k]?.trim());
  if (!entries.length) return null;
  return (
    <div className={cn('flex gap-2', className)}>
      {entries.map((k) => (
        <a
          key={k}
          href={social[k]}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={paths[k].label}
          className={cn('rounded-lg p-2 transition-colors', iconClass ?? 'bg-white/10 text-white hover:bg-primary-600 hover:text-white')}
        >
          <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="currentColor" aria-hidden>
            <path d={paths[k].d} />
          </svg>
        </a>
      ))}
    </div>
  );
}
