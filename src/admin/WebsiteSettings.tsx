import { Building, Globe, Home, Info } from 'lucide-react';
import { Field, Input, Textarea } from '../components/ui/Form';
import type { CompanyInfo } from '../types';
import { AdminCard, AdminPageTitle, linesToList, ListEditor, move, type ManagerProps } from './shared';

export function WebsiteSettings({ draft, update }: ManagerProps) {
  const c = draft.company;
  const { hero, intro, about } = draft.content;
  const setCompany = (k: Exclude<keyof CompanyInfo, 'social'>, v: string) => update((d) => void (d.company[k] = v));
  const setSocial = (k: keyof CompanyInfo['social'], v: string) => update((d) => void (d.company.social[k] = v));
  const emailInvalid = !!c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email);

  return (
    <>
      <AdminPageTitle title="Website settings" description="Company details and contact information used across the website, footer and quotation emails." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title="Company & contact" icon={<Building className="h-5 w-5" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name">{(id) => <Input id={id} value={c.name} maxLength={80} onChange={(e) => setCompany('name', e.target.value)} />}</Field>
            <Field label="Company email" hint="Quotation requests are addressed here." error={emailInvalid ? 'Enter a valid email address.' : undefined}>
              {(id, d) => <Input id={id} aria-describedby={d} type="email" value={c.email} invalid={emailInvalid} onChange={(e) => setCompany('email', e.target.value)} />}
            </Field>
            <Field label="Phone number">{(id) => <Input id={id} type="tel" value={c.phone} onChange={(e) => setCompany('phone', e.target.value)} />}</Field>
            <Field label="WhatsApp number" hint="International format without +, e.g. 2348031234567">
              {(id) => <Input id={id} value={c.whatsapp} onChange={(e) => setCompany('whatsapp', e.target.value)} />}
            </Field>
            <Field label="Office address" className="sm:col-span-2">
              {(id) => <Textarea id={id} rows={2} value={c.address} onChange={(e) => setCompany('address', e.target.value)} />}
            </Field>
            <Field label="Business hours" className="sm:col-span-2">
              {(id) => <Input id={id} value={c.businessHours} onChange={(e) => setCompany('businessHours', e.target.value)} />}
            </Field>
            <Field label="Tagline" className="sm:col-span-2">
              {(id) => <Input id={id} value={c.tagline} maxLength={160} onChange={(e) => setCompany('tagline', e.target.value)} />}
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Social media links" description="Leave blank to hide an icon." icon={<Globe className="h-5 w-5" />}>
          <div className="grid gap-4">
            {(['facebook', 'instagram', 'x', 'linkedin'] as const).map((k) => (
              <Field key={k} label={k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}>
                {(id) => <Input id={id} type="url" placeholder="https://" value={c.social[k]} onChange={(e) => setSocial(k, e.target.value)} />}
              </Field>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="Homepage hero" icon={<Home className="h-5 w-5" />}>
          <div className="grid gap-4">
            <Field label="Badge text">{(id) => <Input id={id} value={hero.badge} maxLength={80} onChange={(e) => update((d) => void (d.content.hero.badge = e.target.value))} />}</Field>
            <Field label="Headline">{(id) => <Input id={id} value={hero.headline} maxLength={100} onChange={(e) => update((d) => void (d.content.hero.headline = e.target.value))} />}</Field>
            <Field label="Supporting text">
              {(id) => <Textarea id={id} rows={3} value={hero.subheadline} maxLength={400} onChange={(e) => update((d) => void (d.content.hero.subheadline = e.target.value))} />}
            </Field>
            <Field label="Introduction title">{(id) => <Input id={id} value={intro.title} maxLength={100} onChange={(e) => update((d) => void (d.content.intro.title = e.target.value))} />}</Field>
            <Field label="Introduction text">
              {(id) => <Textarea id={id} rows={4} value={intro.body} onChange={(e) => update((d) => void (d.content.intro.body = e.target.value))} />}
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="About page" icon={<Info className="h-5 w-5" />}>
          <div className="grid gap-4">
            <Field label="Company overview">
              {(id) => <Textarea id={id} rows={4} value={about.overview} onChange={(e) => update((d) => void (d.content.about.overview = e.target.value))} />}
            </Field>
            <Field label="Mission">{(id) => <Textarea id={id} rows={2} value={about.mission} onChange={(e) => update((d) => void (d.content.about.mission = e.target.value))} />}</Field>
            <Field label="Vision">{(id) => <Textarea id={id} rows={2} value={about.vision} onChange={(e) => update((d) => void (d.content.about.vision = e.target.value))} />}</Field>
            <Field label="Capabilities" hint="One per line.">
              {(id) => (
                <Textarea id={id} key={about.capabilities.join('|')} rows={5} defaultValue={about.capabilities.join('\n')} onBlur={(e) => update((d) => void (d.content.about.capabilities = linesToList(e.target.value)))} />
              )}
            </Field>
          </div>
        </AdminCard>

        <AdminCard title="Core values">
          <ListEditor
            items={about.values}
            itemLabel={(v) => v.title}
            addLabel="Add value"
            onAdd={() => update((d) => void d.content.about.values.push({ title: 'New value', description: '' }))}
            onRemove={(i) => update((d) => void d.content.about.values.splice(i, 1))}
            onMove={(a, b) => update((d) => move(d.content.about.values, a, b))}
            render={(v, i) => (
              <div className="grid gap-2">
                <Input aria-label="Title" value={v.title} onChange={(e) => update((d) => void (d.content.about.values[i].title = e.target.value))} />
                <Textarea aria-label="Description" rows={2} value={v.description} onChange={(e) => update((d) => void (d.content.about.values[i].description = e.target.value))} />
              </div>
            )}
          />
        </AdminCard>

        <AdminCard title="Why choose us">
          <ListEditor
            items={draft.content.whyChooseUs}
            itemLabel={(v) => v.title}
            addLabel="Add reason"
            onAdd={() => update((d) => void d.content.whyChooseUs.push({ title: 'New reason', description: '' }))}
            onRemove={(i) => update((d) => void d.content.whyChooseUs.splice(i, 1))}
            onMove={(a, b) => update((d) => move(d.content.whyChooseUs, a, b))}
            render={(v, i) => (
              <div className="grid gap-2">
                <Input aria-label="Title" value={v.title} onChange={(e) => update((d) => void (d.content.whyChooseUs[i].title = e.target.value))} />
                <Textarea aria-label="Description" rows={2} value={v.description} onChange={(e) => update((d) => void (d.content.whyChooseUs[i].description = e.target.value))} />
              </div>
            )}
          />
        </AdminCard>
      </div>
    </>
  );
}
