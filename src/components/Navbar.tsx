import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Calculator, Menu, Phone, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { cn, telLink } from '../lib/utils';
import { ButtonLink } from './ui/Button';
import { Logo } from './Logo';

const links = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/projects', label: 'Projects' },
  { to: '/calculator', label: 'Solar Calculator' },
  { to: '/contact', label: 'Contact' },
];

export function Navbar() {
  const { config } = useConfig();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pages with a dark hero use a transparent header until scrolled.
  const solid = scrolled || open || pathname.startsWith('/calculator');

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300 print:hidden',
        solid ? 'border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Link to="/" aria-label={`${config.company.name} home`}>
          <Logo dark={!solid} />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
                    solid
                      ? isActive
                        ? 'text-sun-600'
                        : 'text-slate-700 hover:text-navy-950'
                      : isActive
                        ? 'text-sun-400'
                        : 'text-white/85 hover:text-white',
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <a href={telLink(config.company.phone)} className={cn('flex items-center gap-1.5 text-sm font-semibold', solid ? 'text-navy-800' : 'text-white')}>
            <Phone className="h-4 w-4" />
            {config.company.phone}
          </a>
          <ButtonLink to="/calculator" size="sm" icon={<Calculator className="h-4 w-4" />}>
            Get Estimate
          </ButtonLink>
        </div>

        <button
          type="button"
          className={cn('rounded-lg p-2 lg:hidden', solid ? 'text-navy-900' : 'text-white')}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-menu" className="border-t border-slate-200 bg-white px-4 pt-2 pb-6 shadow-lg lg:hidden">
          <ul className="space-y-1">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) =>
                    cn('block rounded-lg px-3 py-3 text-base font-semibold', isActive ? 'bg-sun-50 text-sun-700' : 'text-slate-700 hover:bg-slate-50')
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <ButtonLink to="/calculator" className="mt-4 w-full" icon={<Calculator className="h-4 w-4" />}>
            Calculate Your Solar Needs
          </ButtonLink>
        </div>
      )}
    </header>
  );
}
