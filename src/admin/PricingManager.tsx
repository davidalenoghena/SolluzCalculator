import { useState } from 'react';
import { Search } from 'lucide-react';
import { Field, Input, NumberInput, Select, Switch, Textarea } from '../components/ui/Form';
import { categoryPlural, PRODUCT_CATEGORIES } from '../config';
import { uniqueId } from '../lib/utils';
import { formatNaira } from '../pricing/currencyFormatter';
import { customerUnitPrice } from '../pricing/pricingEngine';
import { AdminCard, AdminPageTitle, ListEditor, move, type ManagerProps } from './shared';

export function PricingManager({ draft, update }: ManagerProps) {
  const p = draft.pricing;
  const [query, setQuery] = useState('');

  return (
    <>
      <AdminPageTitle
        title="Pricing"
        description="All customer-facing prices come from here and the product catalogue. Amounts are in Nigerian Naira (₦). Save to apply them to the calculator in this browser."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title="Markup & tax">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Equipment markup / margin" hint="Added to every product’s base unit price. Use 0 if base prices already include margin.">
              {(id) => <NumberInput id={id} step="any" min={-100} value={p.markupPercent} onValueChange={(v) => update((d) => void (d.pricing.markupPercent = v))} suffix="%" />}
            </Field>
            <div />
            <Field label="Tax label">{(id) => <Input id={id} value={p.tax.label} maxLength={30} onChange={(e) => update((d) => void (d.pricing.tax.label = e.target.value))} />}</Field>
            <Field label="Tax rate">
              {(id) => <NumberInput id={id} step="any" min={0} max={100} value={p.tax.ratePercent} onValueChange={(v) => update((d) => void (d.pricing.tax.ratePercent = v))} suffix="%" />}
            </Field>
            <Switch checked={p.tax.isActive} onChange={(v) => update((d) => void (d.pricing.tax.isActive = v))} label="Apply tax to estimates" />
          </div>
        </AdminCard>

        <AdminCard title="Installation & delivery">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Installation label" className="sm:col-span-2">
              {(id) => <Input id={id} value={p.installation.label} maxLength={60} onChange={(e) => update((d) => void (d.pricing.installation.label = e.target.value))} />}
            </Field>
            <Field label="Base installation fee">
              {(id) => <NumberInput id={id} min={0} value={p.installation.baseFee} onValueChange={(v) => update((d) => void (d.pricing.installation.baseFee = v))} suffix="₦" />}
            </Field>
            <Field label="Fee per kWp of solar">
              {(id) => <NumberInput id={id} min={0} value={p.installation.perKwpFee} onValueChange={(v) => update((d) => void (d.pricing.installation.perKwpFee = v))} suffix="₦" />}
            </Field>
            <Switch checked={p.installation.isActive} onChange={(v) => update((d) => void (d.pricing.installation.isActive = v))} label="Charge installation" />
            <div />
            <Field label="Delivery label">{(id) => <Input id={id} value={p.delivery.label} maxLength={60} onChange={(e) => update((d) => void (d.pricing.delivery.label = e.target.value))} />}</Field>
            <Field label="Delivery fee">
              {(id) => <NumberInput id={id} min={0} value={p.delivery.fee} onValueChange={(v) => update((d) => void (d.pricing.delivery.fee = v))} suffix="₦" />}
            </Field>
            <Switch checked={p.delivery.isActive} onChange={(v) => update((d) => void (d.pricing.delivery.isActive = v))} label="Charge delivery" />
          </div>
        </AdminCard>

        <AdminCard
          title="Product prices"
          description="Base unit prices. The customer price includes the markup above."
          action={
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input type="search" className="pl-9" placeholder="Filter products…" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Filter products" />
            </div>
          }
        >
          <div className="max-h-[36rem] space-y-5 overflow-y-auto pr-1">
            {PRODUCT_CATEGORIES.map((c) => {
              const items = draft.products.filter((x) => x.category === c.id && x.name.toLowerCase().includes(query.trim().toLowerCase()));
              if (!items.length) return null;
              return (
                <div key={c.id}>
                  <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">{categoryPlural(c.id)}</p>
                  <ul className="space-y-2">
                    {items.map((prod) => (
                      <li key={prod.id} className="grid grid-cols-[1fr_9rem] items-center gap-3">
                        <span className="min-w-0">
                          <span className={`block truncate text-sm font-medium ${prod.isActive ? '' : 'text-slate-400 line-through'}`}>{prod.name}</span>
                          <span className="text-xs text-slate-500">Customer price: {formatNaira(customerUnitPrice({ unitPrice: prod.unitPrice || 0 }, p))}</span>
                        </span>
                        <NumberInput
                          aria-label={`Price of ${prod.name}`}
                          min={0}
                          value={prod.unitPrice}
                          invalid={!(prod.unitPrice >= 0)}
                          onValueChange={(v) =>
                            update((d) => {
                              const x = d.products.find((y) => y.id === prod.id);
                              if (x) x.unitPrice = v;
                            })
                          }
                          suffix="₦"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Additional charges" description="Always added to every estimate (e.g. site survey, commissioning).">
            <ListEditor
              items={p.additionalCharges}
              itemLabel={(x) => x.name}
              addLabel="Add charge"
              onAdd={() =>
                update((d) =>
                  void d.pricing.additionalCharges.push({ id: uniqueId('charge', d.pricing.additionalCharges.map((x) => x.id)), name: 'New charge', type: 'fixed', amount: 0, isActive: true }),
                )
              }
              onRemove={(i) => update((d) => void d.pricing.additionalCharges.splice(i, 1))}
              onMove={(a, b) => update((d) => move(d.pricing.additionalCharges, a, b))}
              render={(x, i) => (
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <Input aria-label="Charge name" value={x.name} maxLength={80} onChange={(e) => update((d) => void (d.pricing.additionalCharges[i].name = e.target.value))} />
                  <Select aria-label="Charge type" value={x.type} onChange={(e) => update((d) => void (d.pricing.additionalCharges[i].type = e.target.value as 'fixed' | 'percent'))}>
                    <option value="fixed">Fixed ₦</option>
                    <option value="percent">% of equipment</option>
                  </Select>
                  <NumberInput aria-label="Amount" min={0} step="any" value={x.amount} onValueChange={(v) => update((d) => void (d.pricing.additionalCharges[i].amount = v))} suffix={x.type === 'fixed' ? '₦' : '%'} />
                  <Switch checked={x.isActive} onChange={(v) => update((d) => void (d.pricing.additionalCharges[i].isActive = v))} label="Active" />
                </div>
              )}
            />
          </AdminCard>

          <AdminCard title="Optional services" description="Customers can tick these in the calculator.">
            <ListEditor
              items={p.optionalServices}
              itemLabel={(x) => x.name}
              addLabel="Add optional service"
              onAdd={() =>
                update((d) =>
                  void d.pricing.optionalServices.push({ id: uniqueId('service', d.pricing.optionalServices.map((x) => x.id)), name: 'New service', description: '', price: 0, isActive: true }),
                )
              }
              onRemove={(i) => update((d) => void d.pricing.optionalServices.splice(i, 1))}
              onMove={(a, b) => update((d) => move(d.pricing.optionalServices, a, b))}
              render={(x, i) => (
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
                  <Input aria-label="Service name" value={x.name} maxLength={80} onChange={(e) => update((d) => void (d.pricing.optionalServices[i].name = e.target.value))} />
                  <NumberInput aria-label="Price" min={0} value={x.price} onValueChange={(v) => update((d) => void (d.pricing.optionalServices[i].price = v))} suffix="₦" />
                  <Textarea aria-label="Description" rows={2} className="sm:col-span-2" maxLength={300} value={x.description} onChange={(e) => update((d) => void (d.pricing.optionalServices[i].description = e.target.value))} />
                  <Switch checked={x.isActive} onChange={(v) => update((d) => void (d.pricing.optionalServices[i].isActive = v))} label="Offered" />
                </div>
              )}
            />
          </AdminCard>

          <AdminCard title="Discounts" description="Applied to the subtotal before tax. A minimum subtotal can restrict a discount to larger orders.">
            <ListEditor
              items={p.discounts}
              itemLabel={(x) => x.label}
              addLabel="Add discount"
              onAdd={() =>
                update((d) =>
                  void d.pricing.discounts.push({ id: uniqueId('discount', d.pricing.discounts.map((x) => x.id)), label: 'New discount', type: 'percent', value: 0, minSubtotal: 0, isActive: false }),
                )
              }
              onRemove={(i) => update((d) => void d.pricing.discounts.splice(i, 1))}
              render={(x, i) => (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input aria-label="Discount label" className="sm:col-span-2" maxLength={80} value={x.label} onChange={(e) => update((d) => void (d.pricing.discounts[i].label = e.target.value))} />
                  <Select aria-label="Discount type" value={x.type} onChange={(e) => update((d) => void (d.pricing.discounts[i].type = e.target.value as 'fixed' | 'percent'))}>
                    <option value="percent">Percentage</option>
                    <option value="fixed">Fixed ₦ amount</option>
                  </Select>
                  <NumberInput aria-label="Value" min={0} step="any" value={x.value} onValueChange={(v) => update((d) => void (d.pricing.discounts[i].value = v))} suffix={x.type === 'fixed' ? '₦' : '%'} />
                  <Field label="Minimum subtotal" hint="0 = always applies">
                    {(id) => <NumberInput id={id} min={0} value={x.minSubtotal} onValueChange={(v) => update((d) => void (d.pricing.discounts[i].minSubtotal = v))} suffix="₦" />}
                  </Field>
                  <div className="flex items-end pb-2">
                    <Switch checked={x.isActive} onChange={(v) => update((d) => void (d.pricing.discounts[i].isActive = v))} label="Active" />
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
