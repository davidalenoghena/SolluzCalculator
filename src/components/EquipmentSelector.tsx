import { useState } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { categoryPlural } from '../config';
import type { CategoryDesign, EquipmentOption } from '../calculator/equipmentRecommendations';
import { cn } from '../lib/utils';
import { formatNaira } from '../pricing/currencyFormatter';
import type { Product } from '../types';
import { Alert, Badge } from './ui/Card';

function Delta({ amount }: { amount: number }) {
  if (amount === 0) return null;
  return (
    <span className={cn('text-xs font-semibold tabular-nums', amount > 0 ? 'text-red-600' : 'text-emerald-600')}>
      {amount > 0 ? '+' : '−'}
      {formatNaira(Math.abs(amount))} total
    </span>
  );
}

function Specs({ product }: { product: Product }) {
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs">
      {product.description && <p className="leading-relaxed text-slate-600">{product.description}</p>}
      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
        {product.brand && (
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Brand / model</dt>
            <dd className="text-right font-medium text-slate-800">
              {product.brand} {product.model}
            </dd>
          </div>
        )}
        {product.specifications.map((s) => (
          <div key={s.label} className="flex justify-between gap-2">
            <dt className="text-slate-500">{s.label}</dt>
            <dd className="text-right font-medium text-slate-800">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface OptionRowProps {
  option: EquipmentOption;
  unitPrice: number;
  selected: boolean;
  recommended: boolean;
  delta: number;
  onSelect: () => void;
  multi?: boolean;
  name: string;
}

export function OptionRow({ option, unitPrice, selected, recommended, delta, onSelect, multi, name }: OptionRowProps) {
  const [open, setOpen] = useState(false);
  const p = option.product;
  return (
    <li className={cn('rounded-xl border-2 p-3.5 transition sm:p-4', selected ? 'border-primary-500 bg-primary-50/60' : 'border-slate-200 hover:border-secondary-200')}>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type={multi ? 'checkbox' : 'radio'}
          name={name}
          checked={selected}
          onChange={onSelect}
          className="mt-1 h-4.5 w-4.5 shrink-0 accent-primary-500"
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-secondary-950">{p.name}</span>
            {recommended && (
              <Badge tone="green">
                <Star className="h-3 w-3" /> Recommended
              </Badge>
            )}
          </span>
          <span className="mt-0.5 block text-xs text-slate-500">
            {[p.brand, p.model].filter(Boolean).join(' · ')}
            {option.notes.length > 0 && ` — ${option.notes.join(' · ')}`}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-sm font-bold text-secondary-950 tabular-nums">{formatNaira(unitPrice * option.quantity)}</span>
          <span className="block text-xs text-slate-500 tabular-nums">
            {option.quantity} × {formatNaira(unitPrice)}
          </span>
          {!selected && <Delta amount={delta} />}
        </span>
      </label>
      <button type="button" onClick={() => setOpen((o) => !o)} className="mt-2 ml-7.5 inline-flex items-center gap-1 text-xs font-semibold text-secondary-600 hover:text-secondary-900" aria-expanded={open}>
        {open ? 'Hide' : 'View'} specifications <ChevronDown className={cn('h-3.5 w-3.5 transition', open && 'rotate-180')} />
      </button>
      {open && <Specs product={p} />}
    </li>
  );
}

interface Props {
  design: CategoryDesign;
  unitPrice: (p: Product) => number;
  deltaFor: (productId: string) => number;
  onSelect: (productId: string) => void;
  title?: string;
  description?: string;
}

/** Single-choice equipment category with compatible alternatives. */
export function EquipmentSelector({ design, unitPrice, deltaFor, onSelect, title, description }: Props) {
  if (!design.required) return null;
  return (
    <section aria-labelledby={`cat-${design.category}`} className="space-y-3">
      <div>
        <h3 id={`cat-${design.category}`} className="text-base font-bold">
          {title ?? categoryPlural(design.category)}
        </h3>
        {description && <p className="text-sm text-slate-500">{description}</p>}
      </div>
      {design.options.length === 0 ? (
        <Alert tone="warning">{design.message || 'No compatible products available.'}</Alert>
      ) : (
        <ul className="space-y-2.5">
          {design.options.map((o) => (
            <OptionRow
              key={o.product.id}
              name={design.category}
              option={o}
              unitPrice={unitPrice(o.product)}
              selected={design.selected?.product.id === o.product.id}
              recommended={design.recommended?.product.id === o.product.id}
              delta={deltaFor(o.product.id)}
              onSelect={() => onSelect(o.product.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
