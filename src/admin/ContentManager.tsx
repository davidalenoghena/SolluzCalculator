import { Field, Input, Select, Textarea } from '../components/ui/Form';
import { SERVICE_ICONS } from '../components/icons';
import { assetUrl, uniqueId } from '../lib/utils';
import { AdminCard, AdminPageTitle, linesToList, ListEditor, move, type ManagerProps } from './shared';

export function ContentManager({ draft, update }: ManagerProps) {
  const { services, projects, testimonials } = draft.content;

  return (
    <>
      <AdminPageTitle
        title="Services, projects & testimonials"
        description="Content shown on the homepage, Services and Projects pages. Images can be URLs or paths to files placed in the website’s public/images folder."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title={`Services (${services.length})`}>
          <ListEditor
            items={services}
            itemLabel={(s) => s.title}
            addLabel="Add service"
            onAdd={() =>
              update((d) => void d.content.services.push({ id: uniqueId('service', d.content.services.map((s) => s.id)), title: 'New service', icon: 'sun', summary: '', features: [] }))
            }
            onRemove={(i) => update((d) => void d.content.services.splice(i, 1))}
            onMove={(a, b) => update((d) => move(d.content.services, a, b))}
            render={(s, i) => (
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem]">
                <Input aria-label="Title" value={s.title} onChange={(e) => update((d) => void (d.content.services[i].title = e.target.value))} />
                <Select aria-label="Icon" value={s.icon} onChange={(e) => update((d) => void (d.content.services[i].icon = e.target.value))}>
                  {Object.keys(SERVICE_ICONS).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </Select>
                <Textarea aria-label="Summary" rows={2} className="sm:col-span-2" value={s.summary} onChange={(e) => update((d) => void (d.content.services[i].summary = e.target.value))} />
                <Field label="Features (one per line)" className="sm:col-span-2">
                  {(id) => (
                    <Textarea
                      id={id}
                      key={`${s.id}-${s.features.join('|')}`}
                      rows={3}
                      defaultValue={s.features.join('\n')}
                      onBlur={(e) => update((d) => void (d.content.services[i].features = linesToList(e.target.value)))}
                    />
                  )}
                </Field>
              </div>
            )}
          />
        </AdminCard>

        <AdminCard title={`Testimonials (${testimonials.length})`}>
          <ListEditor
            items={testimonials}
            itemLabel={(t) => t.name}
            addLabel="Add testimonial"
            onAdd={() =>
              update((d) => void d.content.testimonials.push({ id: uniqueId('testimonial', d.content.testimonials.map((t) => t.id)), name: 'Customer name', location: '', quote: '' }))
            }
            onRemove={(i) => update((d) => void d.content.testimonials.splice(i, 1))}
            onMove={(a, b) => update((d) => move(d.content.testimonials, a, b))}
            render={(t, i) => (
              <div className="grid gap-3 sm:grid-cols-2">
                <Input aria-label="Name" value={t.name} onChange={(e) => update((d) => void (d.content.testimonials[i].name = e.target.value))} />
                <Input aria-label="Location" placeholder="Location" value={t.location} onChange={(e) => update((d) => void (d.content.testimonials[i].location = e.target.value))} />
                <Textarea aria-label="Quote" rows={3} className="sm:col-span-2" value={t.quote} onChange={(e) => update((d) => void (d.content.testimonials[i].quote = e.target.value))} />
              </div>
            )}
          />
        </AdminCard>

        <div className="xl:col-span-2">
          <AdminCard title={`Projects (${projects.length})`}>
            <ListEditor
              items={projects}
              itemLabel={(p) => p.title}
              addLabel="Add project"
              onAdd={() =>
                update((d) =>
                  void d.content.projects.unshift({
                    id: uniqueId('project', d.content.projects.map((p) => p.id)),
                    title: 'New project',
                    description: '',
                    location: '',
                    category: 'Residential',
                    images: ['/images/projects/residential.svg'],
                    completionDate: new Date().toISOString().slice(0, 10),
                    systemSize: '',
                  }),
                )
              }
              onRemove={(i) => update((d) => void d.content.projects.splice(i, 1))}
              onMove={(a, b) => update((d) => move(d.content.projects, a, b))}
              render={(p, i) => (
                <div className="grid gap-3 md:grid-cols-[1fr_1fr_12rem]">
                  <Field label="Title" className="md:col-span-2">
                    {(id) => <Input id={id} value={p.title} onChange={(e) => update((d) => void (d.content.projects[i].title = e.target.value))} />}
                  </Field>
                  <Field label="Completion date">
                    {(id) => <Input id={id} type="date" value={p.completionDate} onChange={(e) => update((d) => void (d.content.projects[i].completionDate = e.target.value))} />}
                  </Field>
                  <Field label="Location">{(id) => <Input id={id} value={p.location} onChange={(e) => update((d) => void (d.content.projects[i].location = e.target.value))} />}</Field>
                  <Field label="Category" hint="e.g. Residential, Commercial, Industrial">
                    {(id) => <Input id={id} value={p.category} onChange={(e) => update((d) => void (d.content.projects[i].category = e.target.value))} />}
                  </Field>
                  <Field label="System size">{(id) => <Input id={id} value={p.systemSize} onChange={(e) => update((d) => void (d.content.projects[i].systemSize = e.target.value))} />}</Field>
                  <Field label="Description" className="md:col-span-3">
                    {(id) => <Textarea id={id} rows={2} value={p.description} onChange={(e) => update((d) => void (d.content.projects[i].description = e.target.value))} />}
                  </Field>
                  <Field label="Images (one URL or /images/… path per line)" className="md:col-span-2">
                    {(id) => (
                      <Textarea
                        id={id}
                        key={`${p.id}-${p.images.join('|')}`}
                        rows={2}
                        defaultValue={p.images.join('\n')}
                        onBlur={(e) => update((d) => void (d.content.projects[i].images = linesToList(e.target.value)))}
                      />
                    )}
                  </Field>
                  <div className="flex gap-2 overflow-x-auto">
                    {p.images.slice(0, 3).map((src) => (
                      <img key={src} src={assetUrl(src)} alt="" className="h-16 w-24 shrink-0 rounded-lg bg-slate-100 object-cover" />
                    ))}
                  </div>
                </div>
              )}
            />
          </AdminCard>
        </div>
      </div>
    </>
  );
}
