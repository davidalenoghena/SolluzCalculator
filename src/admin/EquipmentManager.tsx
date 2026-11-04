import { useState } from 'react';
import { Copy, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Card';
import { Checkbox, Field, Input, NumberInput, Select, Switch, Textarea } from '../components/ui/Form';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { BATTERY_CHEMISTRIES, categoryLabel, PRODUCT_CATEGORIES, QUANTITY_BASES, SYSTEM_TYPES } from '../config';
import { cn, uniqueId } from '../lib/utils';
import { formatNaira } from '../pricing/currencyFormatter';
import type { Product, ProductCategory, SystemType } from '../types';
import { AdminPageTitle, type ManagerProps } from './shared';

const CORE: ProductCategory[] = ['solar-panel', 'inverter', 'battery', 'charge-controller'];
const BOS: ProductCategory[] = ['mounting', 'cabling', 'protection', 'accessory'];

const capacityMeta: Partial<Record<ProductCategory, { label: string; suffix: string }>> = {
  'solar-panel': { label: 'Wattage (Wp)', suffix: 'W' },
  inverter: { label: 'Capacity (VA)', suffix: 'VA' },
  battery: { label: 'Nominal energy (Wh)', suffix: 'Wh' },
  'charge-controller': { label: 'Current rating (A)', suffix: 'A' },
};

export function blankProduct(category: ProductCategory): Product {
  const base: Product = { id: '', category, name: '', brand: '', model: '', unitPrice: 0, isActive: true, description: '', specifications: [] };
  switch (category) {
    case 'solar-panel':
      return { ...base, capacity: 550 };
    case 'inverter':
      return { ...base, capacity: 5000, supportedSystemTypes: ['hybrid', 'off-grid'], systemVoltage: 48, surgeRatio: 2, hasBuiltInMppt: true, maxPvInputW: 6000, parallelCapable: false };
    case 'battery':
      return { ...base, capacity: 5120, chemistry: 'lithium', systemVoltage: 48 };
    case 'charge-controller':
      return { ...base, capacity: 60, supportedVoltages: [12, 24, 48] };
    default:
      return { ...base, quantityBasis: 'fixed', quantityPerBasis: 1, isOptional: category === 'accessory', defaultSelected: false };
  }
}

function productErrors(p: Product): string[] {
  const e: string[] = [];
  if (!p.name.trim()) e.push('Name is required.');
  if (!(p.unitPrice >= 0)) e.push('Unit price must be 0 or more.');
  if (CORE.includes(p.category) && !(Number(p.capacity) > 0)) e.push(`${capacityMeta[p.category]?.label} must be greater than 0.`);
  if (p.category === 'inverter' && !p.supportedSystemTypes?.length) e.push('Select at least one supported system type.');
  if (p.category === 'battery' && !(Number(p.systemVoltage) > 0)) e.push('Battery voltage is required.');
  if (p.category === 'charge-controller' && !p.supportedVoltages?.length) e.push('Enter at least one supported battery voltage.');
  if (BOS.includes(p.category) && !(Number(p.quantityPerBasis) >= 0)) e.push('Quantity per basis must be 0 or more.');
  if (p.specifications.some((s) => !s.label.trim())) e.push('Every specification needs a label.');
  return e;
}

function ProductForm({ initial, onSave, onCancel }: { initial: Product; onSave: (p: Product) => void; onCancel: () => void }) {
  const [p, setP] = useState<Product>(initial);
  const [errors, setErrors] = useState<string[]>([]);
  const [voltText, setVoltText] = useState((initial.supportedVoltages ?? []).join(', '));
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));
  const cap = capacityMeta[p.category];

  const submit = () => {
    const finalP = { ...p, name: p.name.trim() };
    const errs = productErrors(finalP);
    setErrors(errs);
    if (!errs.length) onSave(finalP);
  };

  const toggleType = (t: SystemType) => {
    const cur = p.supportedSystemTypes ?? [];
    set('supportedSystemTypes', cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]);
  };

  return (
    <Modal
      open
      onClose={onCancel}
      size="lg"
      title={initial.id ? `Edit ${categoryLabel(p.category).toLowerCase()}` : `Add ${categoryLabel(p.category).toLowerCase()}`}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={submit}>Apply to draft</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name" required className="sm:col-span-2">
          {(id) => <Input id={id} value={p.name} maxLength={100} onChange={(e) => set('name', e.target.value)} />}
        </Field>
        <Field label="Brand">{(id) => <Input id={id} value={p.brand} maxLength={60} onChange={(e) => set('brand', e.target.value)} />}</Field>
        <Field label="Model">{(id) => <Input id={id} value={p.model} maxLength={60} onChange={(e) => set('model', e.target.value)} />}</Field>
        <Field label="Unit price (₦, before markup)" required>
          {(id) => <NumberInput id={id} min={0} value={p.unitPrice} onValueChange={(v) => set('unitPrice', v)} suffix="₦" />}
        </Field>
        {cap && (
          <Field label={cap.label} required>
            {(id) => <NumberInput id={id} min={0} step="any" value={p.capacity ?? NaN} onValueChange={(v) => set('capacity', v)} suffix={cap.suffix} />}
          </Field>
        )}

        {p.category === 'inverter' && (
          <>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-slate-700">Supported system types (inverter type)</legend>
              <div className="mt-2 flex flex-wrap gap-4">
                {SYSTEM_TYPES.map((t) => (
                  <Checkbox key={t.id} checked={(p.supportedSystemTypes ?? []).includes(t.id)} onChange={() => toggleType(t.id)} label={t.label} />
                ))}
              </div>
            </fieldset>
            <Field label="DC system / battery voltage" hint="0 for grid-tied inverters without batteries">
              {(id) => <NumberInput id={id} min={0} value={p.systemVoltage ?? 0} onValueChange={(v) => set('systemVoltage', v)} suffix="V" />}
            </Field>
            <Field label="Surge ratio" hint="Peak power as a multiple of rated capacity">
              {(id) => <NumberInput id={id} min={1} max={10} step="any" value={p.surgeRatio ?? 2} onValueChange={(v) => set('surgeRatio', v)} suffix="×" />}
            </Field>
            <Field label="Max PV input (W)" hint="Built-in MPPT solar input limit">
              {(id) => <NumberInput id={id} min={0} value={p.maxPvInputW ?? 0} onValueChange={(v) => set('maxPvInputW', v)} suffix="W" />}
            </Field>
            <div className="flex flex-col gap-3 pt-6">
              <Switch checked={!!p.hasBuiltInMppt} onChange={(v) => set('hasBuiltInMppt', v)} label="Built-in MPPT solar charger" />
              <Switch checked={!!p.parallelCapable} onChange={(v) => set('parallelCapable', v)} label="Can run in parallel" />
            </div>
          </>
        )}

        {p.category === 'battery' && (
          <>
            <Field label="Chemistry" required>
              {(id) => (
                <Select id={id} value={p.chemistry} onChange={(e) => set('chemistry', e.target.value as Product['chemistry'])}>
                  {BATTERY_CHEMISTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Nominal voltage (system V)" required hint="Use 12, 24 or 48 (e.g. 51.2V lithium → 48)">
              {(id) => <NumberInput id={id} min={1} value={p.systemVoltage ?? NaN} onValueChange={(v) => set('systemVoltage', v)} suffix="V" />}
            </Field>
          </>
        )}

        {p.category === 'charge-controller' && (
          <Field label="Supported battery voltages" required hint="Comma-separated, e.g. 12, 24, 48">
            {(id) => (
              <Input
                id={id}
                value={voltText}
                onChange={(e) => {
                  setVoltText(e.target.value);
                  set(
                    'supportedVoltages',
                    e.target.value
                      .split(',')
                      .map((x) => Number(x.trim()))
                      .filter((n) => Number.isFinite(n) && n > 0),
                  );
                }}
              />
            )}
          </Field>
        )}

        {BOS.includes(p.category) && (
          <>
            <Field label="Quantity basis" hint="How quantity is calculated for each system">
              {(id) => (
                <Select id={id} value={p.quantityBasis} onChange={(e) => set('quantityBasis', e.target.value as Product['quantityBasis'])}>
                  {QUANTITY_BASES.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Quantity per basis" hint="e.g. 1 per panel, 0.25 per battery (1 rack per 4)">
              {(id) => <NumberInput id={id} min={0} step="any" value={p.quantityPerBasis ?? 1} onValueChange={(v) => set('quantityPerBasis', v)} />}
            </Field>
            <div className="flex flex-col gap-3 sm:col-span-2">
              <Switch checked={!!p.isOptional} onChange={(v) => set('isOptional', v)} label="Optional extra" description="Shown as a tick-box under “Other accessories” instead of a required choice." />
              {p.isOptional && <Switch checked={!!p.defaultSelected} onChange={(v) => set('defaultSelected', v)} label="Pre-selected by default" />}
            </div>
          </>
        )}

        <Field label="Description" className="sm:col-span-2">
          {(id) => <Textarea id={id} rows={2} maxLength={500} value={p.description} onChange={(e) => set('description', e.target.value)} />}
        </Field>

        <div className="sm:col-span-2">
          <p className="text-sm font-medium text-slate-700">Specifications</p>
          <div className="mt-2 space-y-2">
            {p.specifications.map((s, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Label"
                  aria-label="Specification label"
                  value={s.label}
                  onChange={(e) => set('specifications', p.specifications.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                />
                <Input
                  placeholder="Value"
                  aria-label="Specification value"
                  value={s.value}
                  onChange={(e) => set('specifications', p.specifications.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                />
                <Button variant="ghost" size="sm" aria-label="Remove specification" onClick={() => set('specifications', p.specifications.filter((_, j) => j !== i))}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => set('specifications', [...p.specifications, { label: '', value: '' }])}>
              Add specification
            </Button>
          </div>
        </div>

        <div className="sm:col-span-2">
          <Switch checked={p.isActive} onChange={(v) => set('isActive', v)} label="Available (active)" description="Inactive products are hidden from the calculator." />
        </div>

        {errors.length > 0 && (
          <ul className="list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function keySpec(p: Product): string {
  switch (p.category) {
    case 'solar-panel':
      return `${p.capacity} W`;
    case 'inverter':
      return `${((p.capacity ?? 0) / 1000).toFixed(1)} kVA · ${p.systemVoltage ? `${p.systemVoltage}V · ` : ''}${(p.supportedSystemTypes ?? []).join('/')}`;
    case 'battery':
      return `${((p.capacity ?? 0) / 1000).toFixed(2)} kWh · ${p.systemVoltage}V · ${p.chemistry}`;
    case 'charge-controller':
      return `${p.capacity} A · ${(p.supportedVoltages ?? []).join('/')}V`;
    default:
      return `${QUANTITY_BASES.find((b) => b.id === p.quantityBasis)?.label ?? ''}${p.quantityPerBasis !== 1 ? ` × ${p.quantityPerBasis}` : ''}${p.isOptional ? ' · optional' : ''}`;
  }
}

export function EquipmentManager({ draft, update }: ManagerProps) {
  const [cat, setCat] = useState<ProductCategory>('solar-panel');
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const products = draft.products.filter((p) => p.category === cat);

  const save = (p: Product) => {
    update((d) => {
      if (p.id) {
        const i = d.products.findIndex((x) => x.id === p.id);
        if (i >= 0) d.products[i] = p;
      } else {
        d.products.push({ ...p, id: uniqueId(`${p.category}-${p.name}`, d.products.map((x) => x.id)) });
      }
    });
    setEditing(null);
  };

  const duplicate = (p: Product) =>
    update((d) => {
      const i = d.products.findIndex((x) => x.id === p.id);
      d.products.splice(i + 1, 0, { ...structuredClone(p), id: uniqueId(`${p.id}-copy`, d.products.map((x) => x.id)), name: `${p.name} (copy)` });
    });

  const toggle = (id: string, v: boolean) =>
    update((d) => {
      const x = d.products.find((p) => p.id === id);
      if (x) x.isActive = v;
    });

  return (
    <>
      <AdminPageTitle
        title="Equipment"
        description="Manage the products the calculator can recommend. Only active products that meet the technical requirements are offered to customers."
        action={
          <Button onClick={() => setEditing(blankProduct(cat))} icon={<Plus className="h-4 w-4" />}>
            Add {categoryLabel(cat).toLowerCase()}
          </Button>
        }
      />
      <div className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {PRODUCT_CATEGORIES.map((c) => {
          const n = draft.products.filter((p) => p.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={cn('shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition', cat === c.id ? 'bg-navy-900 text-white' : 'bg-white text-slate-700 shadow-xs ring-1 ring-slate-200 hover:bg-slate-50')}
            >
              {c.plural} <span className="opacity-60">({n})</span>
            </button>
          );
        })}
      </div>

      <ul className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {products.map((p) => (
          <li key={p.id} className={cn('rounded-2xl border bg-white p-4 shadow-xs', p.isActive ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-75')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-navy-950">{p.name}</p>
                <p className="text-xs text-slate-500">
                  {[p.brand, p.model].filter(Boolean).join(' · ')} <span className="text-slate-400">· id: {p.id}</span>
                </p>
                <p className="mt-1.5 text-sm text-slate-700">{keySpec(p)}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-extrabold tabular-nums">{formatNaira(p.unitPrice)}</p>
                {!p.isActive && <Badge tone="red">Inactive</Badge>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
              <Switch checked={p.isActive} onChange={(v) => toggle(p.id, v)} label={<span className="text-xs">{p.isActive ? 'Available' : 'Unavailable'}</span>} />
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(structuredClone(p))} icon={<Pencil className="h-4 w-4" />}>
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setPendingDelete(p)} aria-label={`Delete ${p.name}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
        {products.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-sm text-slate-500 ring-1 ring-slate-200 xl:col-span-2">No products in this category yet.</li>}
      </ul>

      {editing && <ProductForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />}
      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete product?"
        message={`“${pendingDelete?.name}” will be permanently removed from the draft. Tip: mark it unavailable instead if it may return.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          const id = pendingDelete?.id;
          update((d) => void (d.products = d.products.filter((p) => p.id !== id)));
          setPendingDelete(null);
        }}
      />
    </>
  );
}
