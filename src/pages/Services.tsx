import { Calculator, CheckCircle2, MessageCircle } from 'lucide-react';
import { ServiceIcon } from '../components/icons';
import { ButtonAnchor, ButtonLink } from '../components/ui/Button';
import { Container, PageHeader } from '../components/ui/Section';
import { useConfig } from '../context/ConfigContext';
import { cn, whatsappLink } from '../lib/utils';

export default function Services() {
  const { config } = useConfig();
  const { services } = config.content;

  return (
    <>
      <PageHeader eyebrow="Services & solutions" title="Complete solar solutions, end to end" description="Consultation, design, supply, installation and ongoing support – handled by one experienced team.">
        <nav className="mt-8 flex flex-wrap gap-2" aria-label="Services">
          {services.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-white/20 px-3.5 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10">
              {s.title}
            </a>
          ))}
        </nav>
      </PageHeader>

      <div className="py-12 sm:py-20">
        <Container className="space-y-8">
          {services.map((s, i) => (
            <article
              key={s.id}
              id={s.id}
              className={cn('grid scroll-mt-24 items-center gap-8 rounded-3xl p-6 sm:p-10 lg:grid-cols-[auto_1fr_1fr]', i % 2 ? 'bg-slate-50' : 'border border-slate-200 bg-white')}
            >
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary-950 text-primary-400">
                <ServiceIcon name={s.icon} className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-slate-600">{s.summary}</p>
              </div>
              <ul className="space-y-2.5">
                {s.features.map((f) => (
                  <li key={f} className="flex gap-2.5 text-sm font-medium text-slate-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Container>
      </div>

      <section className="bg-secondary-950 py-16 text-center text-white">
        <Container>
          <h2 className="text-3xl font-extrabold text-white">Not sure which solution is right for you?</h2>
          <p className="mx-auto mt-3 max-w-xl text-secondary-200">Use our calculator for an instant estimate, or speak to our team directly.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/calculator" size="lg" icon={<Calculator className="h-5 w-5" />}>
              Calculate Your Solar Needs
            </ButtonLink>
            <ButtonAnchor href={whatsappLink(config.company.whatsapp)} target="_blank" rel="noopener noreferrer" variant="light" size="lg" icon={<MessageCircle className="h-5 w-5" />}>
              Chat on WhatsApp
            </ButtonAnchor>
          </div>
        </Container>
      </section>
    </>
  );
}
