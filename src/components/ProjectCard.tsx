import { Calendar, MapPin } from 'lucide-react';
import { assetUrl, formatDate } from '../lib/utils';
import type { Project } from '../types';
import { Badge } from './ui/Card';

export function ProjectCard({ project, onOpen }: { project: Project; onOpen?: () => void }) {
  const img = project.images[0];
  const Wrapper = onOpen ? 'button' : 'div';
  return (
    <Wrapper
      {...(onOpen ? { type: 'button' as const, onClick: onOpen } : {})}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary-100">
        {img ? (
          <img src={assetUrl(img)} alt={project.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">No image</div>
        )}
        <Badge tone="primary" className="absolute top-3 left-3 shadow">
          {project.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold">{project.title}</h3>
        {project.systemSize && <p className="mt-1 text-sm font-semibold text-primary-700">{project.systemSize}</p>}
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{project.description}</p>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {project.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(project.completionDate)}
          </span>
        </div>
      </div>
    </Wrapper>
  );
}
