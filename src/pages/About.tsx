import { Calculator, CheckCircle2, Eye, Target } from 'lucide-react';
import { ButtonLink } from '../components/ui/Button';
import { PageHeader, Section, SectionHeading } from '../components/ui/Section';
import { useConfig } from '../context/ConfigContext';

export default function About() {
  const { config } = useConfig();
  const { about, whyChooseUs } = config.content;

  return (
    <>
      <PageHeader eyebrow="About us" title={`Powering progress with ${config.company.name}`} description={config.company.tagline} />

      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <SectionHeading align="left" eyebrow="Company overview" title="Who we are" />
            <p className="mt-6 text-lg leading-relaxed whitespace-pre-line text-slate-600">{about.overview}</p>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl bg-secondary-950 p-7 text-white">
              <Target className="h-8 w-8 text-primary-400" />
              <h3 className="mt-4 text-xl font-bold text-white">Our mission</h3>
              <p className="mt-2 leading-relaxed text-secondary-200">{about.mission}</p>
            </div>
            <div className="rounded-2xl bg-primary-50 p-7">
              <Eye className="h-8 w-8 text-primary-600" />
              <h3 className="mt-4 text-xl font-bold">Our vision</h3>
              <p className="mt-2 leading-relaxed text-slate-700">{about.vision}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section tone="muted">
        <SectionHeading eyebrow="Core values" title="What guides our work" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {about.values.map((v, i) => (
            <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="text-3xl font-extrabold text-primary-500">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-lg font-bold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.description}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <SectionHeading align="left" eyebrow="Expertise" title="Capabilities you can rely on" />
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {about.capabilities.map((c) => (
                <li key={c} className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading align="left" eyebrow="Why work with us" title="The Solluz Synergy difference" />
            <div className="mt-8 space-y-4">
              {whyChooseUs.map((w) => (
                <div key={w.title} className="border-l-4 border-primary-500 pl-4">
                  <h3 className="font-bold">{w.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{w.description}</p>
                </div>
              ))}
            </div>
            <ButtonLink to="/calculator" className="mt-8" icon={<Calculator className="h-4 w-4" />}>
              Calculate Your Solar Needs
            </ButtonLink>
          </div>
        </div>
      </Section>
    </>
  );
}
