import { useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Card';
import { Input, NumberInput, Select, Switch } from '../components/ui/Form';
import { ConfirmDialog } from '../components/ui/Modal';
import { uniqueId } from '../lib/utils';
import type { Appliance } from '../types';
import { AdminCard, AdminPageTitle, type ManagerProps } from './shared';

export function ApplianceManager({ draft, update }: ManagerProps) {
  const [query, setQuery] = useState('');
  const [newCat, setNewCat] = useState('');
  const [catError, setCatError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Appliance | null>(null);

  const list = draft.appliances.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()));
  const usage = (cat: string) => draft.appliances.filter((a) => a.category === cat).length;

  const patch = (id: string, p: Partial<Appliance>) =>
    update((d) => {
      const a = d.appliances.find((x) => x.id === id);
      if (a) Object.assign(a, p);
    });

  const add = () =>
    update((d) => {
      d.appliances.unshift({
        id: uniqueId('new-appliance', d.appliances.map((a) => a.id)),
        name: 'New appliance',
        category: d.applianceCategories[0] ?? 'Other',
        defaultWattage: 100,
        defaultHours: 4,
        surgeFactor: 1,
        isActive: true,
      });
    });

  const addCategory = () => {
    const name = newCat.trim();
    if (!name) return;
    if (draft.applianceCategories.some((c) => c.toLowerCase() === name.toLowerCase())) {
      setCatError('That category already exists.');
      return;
    }
    update((d) => void d.applianceCategories.push(name));
    setNewCat('');
    setCatError('');
  };

  return (
    <>
      <AdminPageTitle
        title="Appliances"
        description="Manage the appliance catalogue shown in the calculator. Wattages and hours are defaults that customers can adjust."
        action={
          <Button onClick={add} icon={<Plus className="h-4 w-4" />}>
            Add appliance
          </Button>
        }
      />

      <div className="space-y-6">
        <AdminCard title="Appliance categories" description="Categories are used to filter the calculator catalogue.">
          <div className="flex flex-wrap gap-2">
            {draft.applianceCategories.map((c) => {
              const n = usage(c);
              return (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pr-1.5 pl-3 text-sm font-medium">
                  {c} <span className="text-xs text-slate-500">({n})</span>
                  <button
                    type="button"
                    disabled={n > 0}
                    title={n > 0 ? 'Reassign its appliances before removing' : 'Remove category'}
                    onClick={() => update((d) => void (d.applianceCategories = d.applianceCategories.filter((x) => x !== c)))}
                    className="rounded-full p-0.5 text-slate-500 hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Remove ${c}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-4 flex max-w-md gap-2">
            <Input value={newCat} maxLength={40} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addCategory()} placeholder="New category name" aria-label="New category name" />
            <Button variant="secondary" onClick={addCategory}>
              Add
            </Button>
          </div>
          {catError && <p className="mt-1 text-xs text-red-600">{catError}</p>}
        </AdminCard>

        <AdminCard
          title={`Catalogue (${draft.appliances.length})`}
          action={
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="search" className="pl-9" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search appliances" />
            </div>
          }
        >
          <div className="hidden grid-cols-[2fr_1.3fr_1fr_1fr_1fr_auto_auto] gap-3 px-3 pb-2 text-xs font-bold tracking-wide text-slate-500 uppercase lg:grid">
            <span>Name</span>
            <span>Category</span>
            <span>Wattage</span>
            <span>Default hrs/day</span>
            <span>Surge factor</span>
            <span>Active</span>
            <span />
          </div>
          <ul className="space-y-2">
            {list.map((a) => (
              <li key={a.id} className={`grid grid-cols-2 gap-3 rounded-xl border p-3 lg:grid-cols-[2fr_1.3fr_1fr_1fr_1fr_auto_auto] lg:items-center ${a.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 bg-slate-50'}`}>
                <label className="col-span-2 text-xs font-medium text-slate-500 lg:col-span-1">
                  <span className="lg:sr-only">Name</span>
                  <Input value={a.name} maxLength={60} onChange={(e) => patch(a.id, { name: e.target.value })} invalid={!a.name.trim()} className="mt-1 lg:mt-0" />
                </label>
                <label className="col-span-2 text-xs font-medium text-slate-500 sm:col-span-1">
                  <span className="lg:sr-only">Category</span>
                  <Select value={a.category} onChange={(e) => patch(a.id, { category: e.target.value })} className="mt-1 lg:mt-0">
                    {!draft.applianceCategories.includes(a.category) && <option value={a.category}>{a.category} (missing)</option>}
                    {draft.applianceCategories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </label>
                <label className="text-xs font-medium text-slate-500">
                  <span className="lg:sr-only">Wattage</span>
                  <NumberInput className="mt-1 lg:mt-0" min={0} value={a.defaultWattage} onValueChange={(v) => patch(a.id, { defaultWattage: v })} suffix="W" invalid={!(a.defaultWattage >= 0)} />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  <span className="lg:sr-only">Default hours/day</span>
                  <NumberInput className="mt-1 lg:mt-0" min={0} max={24} step="any" value={a.defaultHours} onValueChange={(v) => patch(a.id, { defaultHours: v })} suffix="h" invalid={!(a.defaultHours >= 0 && a.defaultHours <= 24)} />
                </label>
                <label className="text-xs font-medium text-slate-500">
                  <span className="lg:sr-only">Surge factor</span>
                  <NumberInput className="mt-1 lg:mt-0" min={1} max={10} step="any" value={a.surgeFactor} onValueChange={(v) => patch(a.id, { surgeFactor: v })} suffix="×" invalid={!(a.surgeFactor >= 1 && a.surgeFactor <= 10)} />
                </label>
                <div className="flex items-end lg:items-center">
                  <Switch checked={a.isActive} onChange={(v) => patch(a.id, { isActive: v })} label={<span className="lg:sr-only">{a.isActive ? 'Active' : 'Inactive'}</span>} />
                </div>
                <div className="col-span-2 flex items-center justify-between gap-2 lg:col-span-1">
                  <Badge className="lg:hidden">{a.id}</Badge>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setPendingDelete(a)} aria-label={`Delete ${a.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
            {list.length === 0 && <li className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No appliances found.</li>}
          </ul>
          <p className="mt-4 text-xs text-slate-500">Surge factor: how many times its running wattage an appliance draws briefly when starting (e.g. 3× for fridges, pumps and ACs; 1× for lights and electronics).</p>
        </AdminCard>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete appliance?"
        message={`“${pendingDelete?.name}” will be removed from the catalogue. Tip: deactivate it instead if you may need it again.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const id = pendingDelete?.id;
          update((d) => void (d.appliances = d.appliances.filter((a) => a.id !== id)));
          setPendingDelete(null);
        }}
      />
    </>
  );
}
