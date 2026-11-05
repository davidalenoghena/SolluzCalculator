import { Link } from 'react-router-dom';
import { Clock, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { telLink, whatsappLink } from '../lib/utils';
import { Container } from './ui/Section';
import { Logo } from './Logo';
import { SocialIcons } from './SocialIcons';

export function Footer() {
  const { config } = useConfig();
  const c = config.company;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-secondary-950 text-secondary-200 print:hidden">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo dark />
          <p className="text-sm leading-relaxed">{c.tagline}</p>
          <SocialIcons social={c.social} />
        </div>

        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">Explore</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {[
              ['/about', 'About Us'],
              ['/services', 'Services & Solutions'],
              ['/projects', 'Projects'],
              ['/calculator', 'Solar Calculator'],
              ['/contact', 'Contact'],
            ].map(([to, label]) => (
              <li key={to}>
                <Link to={to} className="hover:text-primary-400">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">Solutions</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {config.content.services.slice(0, 6).map((s) => (
              <li key={s.id}>
                <Link to={`/services#${s.id}`} className="hover:text-primary-400">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold tracking-wider text-white uppercase">Get in touch</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              {c.address}
            </li>
            <li>
              <a href={telLink(c.phone)} className="flex gap-2.5 hover:text-primary-400">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                {c.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${c.email}`} className="flex gap-2.5 break-all hover:text-primary-400">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                {c.email}
              </a>
            </li>
            <li>
              <a href={whatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer" className="flex gap-2.5 hover:text-primary-400">
                <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
                Chat on WhatsApp
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-400" />
              {c.businessHours}
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-secondary-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {c.name}. All rights reserved.
          </p>
          <p>Calculator estimates are preliminary and subject to professional site assessment.</p>
        </Container>
      </div>
    </footer>
  );
}
