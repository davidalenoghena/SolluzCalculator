import { useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/Modal';
import type { AppConfig } from '../types';

/** Mutating updater applied to a deep clone of the draft config. */
export type DraftUpdater = (fn: (draft: AppConfig) => void) => void;

export interface ManagerProps {
  draft: AppConfig;
  update: DraftUpdater;
}

export function AdminPageTitle({ title, description, action }: { title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        {description && <p className="mt-1 max-w-3xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function AdminCard({ title, description, children, action, icon }: { title: ReactNode; description?: ReactNode; children: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <Card>
      <CardHeader title={title} description={description} action={action} icon={icon} />
      <CardBody>{children}</CardBody>
    </Card>
  );
}

export function move<T>(list: T[], from: number, to: number): void {
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}

interface ListEditorProps<T> {
  items: T[];
  render: (item: T, index: number) => ReactNode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove?: (from: number, to: number) => void;
  addLabel: string;
  itemLabel: (item: T) => string;
  empty?: string;
}

/** Generic editable list with add / remove (with confirmation) / reorder. */
export function ListEditor<T>({ items, render, onAdd, onRemove, onMove, addLabel, itemLabel, empty = 'Nothing here yet.' }: ListEditorProps<T>) {
  const [pending, setPending] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">{empty}</p>}
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-bold text-secondary-950">{itemLabel(item) || `Item ${i + 1}`}</span>
            <span className="flex shrink-0 gap-1">
              {onMove && (
                <>
                  <Button variant="ghost" size="sm" aria-label="Move up" disabled={i === 0} onClick={() => onMove(i, i - 1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Move down" disabled={i === items.length - 1} onClick={() => onMove(i, i + 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" aria-label="Remove" className="text-red-600 hover:bg-red-50" onClick={() => setPending(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </span>
          </div>
          {render(item, i)}
        </div>
      ))}
      <Button variant="outline" onClick={onAdd} icon={<Plus className="h-4 w-4" />}>
        {addLabel}
      </Button>
      <ConfirmDialog
        open={pending !== null}
        title="Remove item?"
        message={pending !== null && items[pending] ? `“${itemLabel(items[pending]) || 'This item'}” will be removed from the draft. You can discard unsaved changes to undo.` : ''}
        confirmLabel="Remove"
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (pending !== null) onRemove(pending);
          setPending(null);
        }}
      />
    </div>
  );
}

/** Text area editing a string[] as one entry per line. */
export function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}
