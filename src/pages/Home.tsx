import { ArrowRight, BadgeCheck, Calculator, ClipboardList, Mail, MapPin, MessageCircle, Phone, Quote, Settings2, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { ServiceIcon } from '../components/icons';
import { ProjectCard } from '../components/ProjectCard';
import { ButtonAnchor, ButtonLink } from '../components/ui/Button';
import { Section, SectionHeading } from '../components/ui/Section';
import { useConfig } from '../context/ConfigContext';
import { telLink, whatsappLink } from '../lib/utils';

const steps = [
  { icon: ClipboardList, title: 'Select your appliances', text: 'Choose from common appliances or add your own, with quantities and daily hours of use.' },
  { icon: Settings2, title: 'Tell us your requirements', text: 'Pick your preferred system type and how many hours of backup you need.' },
  { icon: Sun, title: 'Get a recommended system', text: 'We size your inverter, batteries and solar panels and show compatible equipment options.' },
  { icon: Mail, title: 'Request a formal quote', text: 'See an itemised Naira estimate and send it to our team for a professional assessment.' },
];

export default function Home() {
  const { config } = useConfig();
  const { content, company } = config;

  return (
    <>
      <Hero />

      {/* Intro */}
      <Section>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow={`About ${company.name}`} title={content.intro.title} description={content.intro.body} />
            <ButtonLink to="/about" variant="outline" className="mt-8">
              Learn more about us <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {content.about.values.slice(0, 4).map((v, i) => (
              <div key={v.title} className={`rounded-2xl p-6 ${i % 3 === 0 ? 'bg-secondary-950 text-white' : 'bg-primary-50'}`}>
                <BadgeCheck className={`h-7 w-7 ${i % 3 === 0 ? 'text-primary-400' : 'text-primary-600'}`} />
                <h3 className={`mt-4 font-bold ${i % 3 === 0 ? 'text-white' : ''}`}>{v.title}</h3>
                <p className={`mt-1.5 text-sm leading-relaxed ${i % 3 === 0 ? 'text-secondary-200' : 'text-slate-600'}`}>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Services */}
      <Section tone="muted">
        <SectionHeading eyebrow="Solutions" title="Solar solutions for every need" description="From a single apartment to a full factory floor, we design systems around how you use power." />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {content.services.map((s) => (
            <Link
              key={s.id}
              to={`/services#${s.id}`}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg"
            >
              <div className="inline-flex rounded-xl bg-secondary-950 p-3 text-primary-400 transition group-hover:bg-primary-600 group-hover:text-white">
                <ServiceIcon name={s.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.summary}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary-700">
                Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {/* How the calculator works */}
      <Section tone="dark" id="how-it-works">
        <SectionHeading dark eyebrow="Solar calculator" title="Know what you need in four simple steps" description="Our free calculator gives you an instant, itemised estimate in Naira – no sign-up needed." />
        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="absolute top-5 right-5 text-4xl font-extrabold text-white/10">{String(i + 1).padStart(2, '0')}</span>
              <s.icon className="h-8 w-8 text-primary-400" />
              <h3 className="mt-5 font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-200">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <ButtonLink to="/calculator" size="lg" icon={<Calculator className="h-5 w-5" />}>
            Calculate Your Solar Needs
          </ButtonLink>
        </div>
      </Section>

      {/* Why choose us */}
      <Section>
        <SectionHeading eyebrow="Why Solluz Synergy" title="Built on trust, engineered for reliability" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.whyChooseUs.map((w) => (
            <div key={w.title} className="rounded-2xl border border-slate-200 p-6">
              <div className="h-1 w-10 rounded-full bg-primary-500" />
              <h3 className="mt-5 font-bold">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.description}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Projects */}
      {content.projects.length > 0 && (
        <Section tone="muted">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading align="left" eyebrow="Our work" title="Featured installations" />
            <ButtonLink to="/projects" variant="outline">
              View all projects <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {content.projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </Section>
      )}

      {/* Testimonials */}
      {content.testimonials.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Testimonials" title="What our customers say" />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {content.testimonials.map((t) => (
              <figure key={t.id} className="flex flex-col rounded-2xl bg-slate-50 p-6">
                <Quote className="h-8 w-8 text-primary-500" />
                <blockquote className="mt-4 flex-1 leading-relaxed text-slate-700">“{t.quote}”</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-bold text-secondary-950">{t.name}</span>
                  <span className="text-slate-500"> · {t.location}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      {/* CTA */}
      <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/20 blur-2xl" />
          <h2 className="relative text-3xl font-extrabold text-secondary-950 sm:text-4xl">Ready to stop paying for fuel?</h2>
          <p className="relative mx-auto mt-4 max-w-2xl text-lg text-secondary-900/80">
            Find out the right system size and an estimated cost for your home or business in minutes.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/calculator" variant="secondary" size="lg" icon={<Calculator className="h-5 w-5" />}>
              Calculate Your Solar Needs
            </ButtonLink>
            <ButtonLink to="/contact" variant="outline" size="lg" className="border-secondary-950/20 bg-white/80">
              Contact Us
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Contact strip */}
      <Section tone="muted" className="!py-14">
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: Phone, label: 'Call us', value: company.phone, href: telLink(company.phone) },
            { icon: Mail, label: 'Email', value: company.email, href: `mailto:${company.email}` },
            { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with our team', href: whatsappLink(company.whatsapp) },
            { icon: MapPin, label: 'Visit', value: company.address, href: undefined },
          ].map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <Icon className="h-6 w-6 shrink-0 text-primary-600" />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
                  <span className="block font-semibold break-words text-secondary-950">{value}</span>
                </span>
              </>
            );
            return href ? (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex gap-3 rounded-2xl bg-white p-5 shadow-sm hover:shadow-md">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex gap-3 rounded-2xl bg-white p-5 shadow-sm">
                {inner}
              </div>
            );
          })}
        </div>
        <div className="mt-6 text-center md:hidden">
          <ButtonAnchor href={whatsappLink(company.whatsapp)} target="_blank" rel="noopener noreferrer" variant="secondary">
            <MessageCircle className="h-4 w-4" /> WhatsApp us
          </ButtonAnchor>
        </div>
      </Section>
    </>
  );
}
