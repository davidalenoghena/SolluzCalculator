import { useMemo, useState, type FormEvent } from 'react';
import { Check, PackagePlus, Plus, Search, Trash2, Zap } from 'lucide-react';
import { applianceDailyWh, applianceLoadW, totalConnectedLoadW, totalDailyEnergyWh, validateApplianceLine } from '../calculator/energyCalculations';
import { customAppliance, fromCatalogue } from '../calculator/session';
import { cn } from '../lib/utils';
import { formatKwh, formatWatts } from '../pricing/currencyFormatter';
import type { Appliance, SelectedAppliance } from '../types';
import { Button } from './ui/Button';
import { Alert, Badge, Card, CardBody, CardHeader } from './ui/Card';
import { Field, Input, NumberInput } from './ui/Form';

interface Props {
  catalogue: Appliance[];
  categories: string[];
  selected: SelectedAppliance[];
  onChange: (next: SelectedAppliance[]) => void;
  showErrors: boolean;
}

export function ApplianceSelector({ catalogue, categories, selected, onChange, showErrors }: Props) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('All');
  const [custom, setCustom] = useState({ name: '', wattage: NaN, quantity: 1, hours: 4 });
  const [customErrors, setCustomErrors] = useState<string[]>([]);

  const active = catalogue.filter((a) => a.isActive);
  const usedCategories = useMemo(() => ['All', ...categories.filter((c) => active.some((a) => a.category === c))], [categories, active]);
  const filtered = active.filter(
    (a) => (cat === 'All' || a.category === cat) && a.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const countFor = (id: string) => selected.filter((s) => s.applianceId === id).reduce((n, s) => n + (s.quantity || 0), 0);

  const addFromCatalogue = (a: Appliance) => {
    const existing = selected.find((s) => s.applianceId === a.id);
    if (existing) {
      onChange(selected.map((s) => (s.uid === existing.uid ? { ...s, quantity: (Number.isFinite(s.quantity) ? s.quantity : 0) + 1 } : s)));
    } else {
      onChange([...selected, fromCatalogue(a)]);
    }
  };

  const update = (uid: string, patch: Partial<SelectedAppliance>) => onChange(selected.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));
  const remove = (uid: string) => onChange(selected.filter((s) => s.uid !== uid));

  const addCustom = (e: FormEvent) => {
    e.preventDefault();
    const line = customAppliance(custom.name, custom.wattage, custom.quantity, custom.hours);
    const errs = validateApplianceLine(line);
    setCustomErrors(errs);
    if (errs.length) return;
    onChange([...selected, line]);
    setCustom({ name: '', wattage: NaN, quantity: 1, hours: 4 });
  };

  const load = totalConnectedLoadW(selected);
  const energy = totalDailyEnergyWh(selected);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1.15fr]">
      {/* Catalogue */}
      <Card>
        <CardHeader title="Appliance catalogue" description="Tap an appliance to add it. Tap again to increase quantity." icon={<Zap className="h-5 w-5" />} />
        <CardBody className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search appliances, e.g. fridge"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search appliances"
            />
          </div>
          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {usedCategories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  cat === c ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {c}
              </button>
            ))}
          </div>
          {filtered.length ? (
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {filtered.map((a) => {
                const n = countFor(a.id);
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => addFromCatalogue(a)}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition',
                        n ? 'border-sun-400 bg-sun-50' : 'border-slate-200 hover:border-navy-300 hover:bg-navy-50/50',
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy-950">{a.name}</span>
                        <span className="text-xs text-slate-500">
                          {a.defaultWattage} W · {a.category}
                        </span>
                      </span>
                      {n ? (
                        <Badge tone="sun">
                          <Check className="h-3 w-3" />×{n}
                        </Badge>
                      ) : (
                        <Plus className="h-5 w-5 shrink-0 text-navy-600" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500">No appliances match “{query}”. Add it as a custom appliance below.</p>
          )}

          {/* Custom appliance */}
          <form onSubmit={addCustom} className="rounded-xl border border-dashed border-slate-300 p-4" noValidate>
            <p className="flex items-center gap-2 text-sm font-bold text-navy-950">
              <PackagePlus className="h-4 w-4 text-sun-600" /> Add a custom appliance
            </p>
            <p className="mt-1 text-xs text-slate-500">Check the label on your appliance for its wattage (W).</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Name" className="col-span-2">
                {(id) => <Input id={id} value={custom.name} maxLength={60} onChange={(e) => setCustom((c) => ({ ...c, name: e.target.value }))} placeholder="e.g. Blender" />}
              </Field>
              <Field label="Watts">
                {(id) => <NumberInput id={id} min={1} value={custom.wattage} onValueChange={(v) => setCustom((c) => ({ ...c, wattage: v }))} suffix="W" />}
              </Field>
              <Field label="Qty">
                {(id) => <NumberInput id={id} min={1} step={1} value={custom.quantity} onValueChange={(v) => setCustom((c) => ({ ...c, quantity: v }))} />}
              </Field>
              <Field label="Hours / day" className="col-span-2 sm:col-span-1">
                {(id) => <NumberInput id={id} min={0} max={24} step="any" value={custom.hours} onValueChange={(v) => setCustom((c) => ({ ...c, hours: v }))} suffix="h" />}
              </Field>
              <div className="col-span-2 flex items-end sm:col-span-3">
                <Button type="submit" variant="secondary" className="w-full sm:w-auto" icon={<Plus className="h-4 w-4" />}>
                  Add appliance
                </Button>
              </div>
            </div>
            {customErrors.length > 0 && (
              <ul className="mt-3 list-inside list-disc text-xs font-medium text-red-600">
                {customErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </form>
        </CardBody>
      </Card>

      {/* Selected */}
      <Card className="xl:sticky xl:top-24 xl:self-start">
        <CardHeader
          title="Your appliances"
          description="Adjust wattage, quantity and how many hours per day each is used."
          action={
            selected.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => onChange([])} className="text-red-600 hover:bg-red-50">
                Clear all
              </Button>
            )
          }
        />
        <CardBody className="space-y-3">
          {selected.length === 0 ? (
            <div className="rounded-xl bg-slate-50 p-8 text-center">
              <Zap className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-2 font-semibold text-slate-700">No appliances yet</p>
              <p className="text-sm text-slate-500">Add appliances from the catalogue or create a custom one.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {selected.map((a) => {
                const errs = showErrors ? validateApplianceLine(a) : [];
                return (
                  <li key={a.uid} className={cn('rounded-xl border p-3', errs.length ? 'border-red-300 bg-red-50/40' : 'border-slate-200')}>
                    <div className="flex items-center gap-2">
                      <Input
                        value={a.name}
                        onChange={(e) => update(a.uid, { name: e.target.value })}
                        aria-label="Appliance name"
                        maxLength={60}
                        className="border-transparent bg-transparent px-1 font-semibold shadow-none hover:border-slate-200"
                      />
                      {a.isCustom && <Badge tone="navy">Custom</Badge>}
                      <Button variant="ghost" size="sm" onClick={() => remove(a.uid)} aria-label={`Remove ${a.name}`} className="shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <label className="text-xs font-medium text-slate-500">
                        Power
                        <NumberInput className="mt-1" min={1} value={a.wattage} onValueChange={(v) => update(a.uid, { wattage: v })} suffix="W" invalid={showErrors && !(a.wattage > 0)} />
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Quantity
                        <NumberInput className="mt-1" min={1} step={1} value={a.quantity} onValueChange={(v) => update(a.uid, { quantity: v })} invalid={showErrors && !(Number.isInteger(a.quantity) && a.quantity >= 1)} />
                      </label>
                      <label className="text-xs font-medium text-slate-500">
                        Hours/day
                        <NumberInput className="mt-1" min={0} max={24} step="any" value={a.hours} onValueChange={(v) => update(a.uid, { hours: v })} suffix="h" invalid={showErrors && !(a.hours >= 0 && a.hours <= 24)} />
                      </label>
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                      <span>Load: {formatWatts(applianceLoadW(a))}</span>
                      <span className="font-semibold text-navy-800">{formatKwh(applianceDailyWh(a))} / day</span>
                    </div>
                    {errs.length > 0 && <p className="mt-1.5 text-xs font-medium text-red-600">{errs.join(' ')}</p>}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="grid grid-cols-2 gap-3 rounded-xl bg-navy-950 p-4 text-white">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Total connected load</p>
              <p className="text-lg font-bold tabular-nums">{formatWatts(load)}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Daily energy use</p>
              <p className="text-lg font-bold text-sun-400 tabular-nums" aria-live="polite">
                {formatKwh(energy)}
              </p>
            </div>
          </div>
          {showErrors && selected.length === 0 && <Alert tone="error">Add at least one appliance to continue.</Alert>}
        </CardBody>
      </Card>
    </div>
  );
}
