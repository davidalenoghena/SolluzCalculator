import { useMemo, useState } from 'react';
import { Calendar, MapPin, Zap } from 'lucide-react';
import { ProjectCard } from '../components/ProjectCard';
import { Modal } from '../components/ui/Modal';
import { Container, PageHeader } from '../components/ui/Section';
import { useConfig } from '../context/ConfigContext';
import { assetUrl, cn, formatDate } from '../lib/utils';
import type { Project } from '../types';

export default function Projects() {
  const { config } = useConfig();
  const projects = config.content.projects;
  const categories = useMemo(() => ['All', ...Array.from(new Set(projects.map((p) => p.category)))], [projects]);
  const [filter, setFilter] = useState('All');
  const [open, setOpen] = useState<Project | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const shown = filter === 'All' ? projects : projects.filter((p) => p.category === filter);

  return (
    <>
      <PageHeader eyebrow="Projects" title="Completed installations" description="A selection of solar systems we have designed and installed for homes, businesses and industry." />

      <Container className="py-12 sm:py-16">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter projects">
          {categories.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={filter === c}
              onClick={() => setFilter(c)}
              className={cn(
                'rounded-full px-4 py-2 text-sm font-semibold transition',
                filter === c ? 'bg-secondary-950 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {shown.length ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => {
                  setOpen(p);
                  setImgIdx(0);
                }}
              />
            ))}
          </div>
        ) : (
          <p className="mt-10 text-center text-slate-500">No projects to show yet.</p>
        )}
      </Container>

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ''} size="lg">
        {open && (
          <div>
            {open.images.length > 0 && (
              <>
                <img src={assetUrl(open.images[imgIdx] ?? open.images[0])} alt={open.title} className="aspect-[16/10] w-full rounded-xl object-cover" />
                {open.images.length > 1 && (
                  <div className="mt-3 flex gap-2 overflow-x-auto">
                    {open.images.map((src, i) => (
                      <button key={src + i} onClick={() => setImgIdx(i)} className={cn('h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2', i === imgIdx ? 'border-primary-500' : 'border-transparent')}>
                        <img src={assetUrl(src)} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary-600" />
                {open.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary-600" />
                Completed {formatDate(open.completionDate)}
              </span>
              {open.systemSize && (
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary-600" />
                  {open.systemSize}
                </span>
              )}
            </div>
            <p className="mt-4 leading-relaxed text-slate-700">{open.description}</p>
          </div>
        )}
      </Modal>
    </>
  );
}
