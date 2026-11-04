import { categoryLabel } from '../config';
import type { SystemDesign } from '../calculator/equipmentRecommendations';
import { selectedEquipment } from '../calculator/equipmentRecommendations';
import type { PricingConfig, Product, ProductCategory } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic pricing engine. Reads every price from the active PricingConfig and
// product catalogue – nothing is hard-coded in components.
//
//   Equipment subtotal   = Σ quantity × customer unit price (base × (1 + markup))
//   Services subtotal    = installation + delivery + additional charges + optional services
//   Subtotal             = equipment + services
//   Discounts            = active discounts whose minimum subtotal is met (capped at subtotal)
//   Tax                  = (subtotal − discounts) × tax rate
//   Total                = subtotal − discounts + tax
// ─────────────────────────────────────────────────────────────────────────────

export interface PriceLine {
  id: string;
  label: string;
  detail?: string;
  category: ProductCategory | 'service';
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AdjustmentLine {
  id: string;
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  equipmentLines: PriceLine[];
  serviceLines: PriceLine[];
  equipmentSubtotal: number;
  servicesSubtotal: number;
  subtotal: number;
  discountLines: AdjustmentLine[];
  discountTotal: number;
  taxLine: AdjustmentLine | null;
  total: number;
}

const round = (n: number) => Math.round(Number.isFinite(n) ? n : 0);

/** Customer-facing unit price after markup, rounded to the nearest Naira. */
export function customerUnitPrice(product: Pick<Product, 'unitPrice'>, pricing: Pick<PricingConfig, 'markupPercent'>): number {
  return round(Math.max(0, product.unitPrice) * (1 + (pricing.markupPercent || 0) / 100));
}

export interface PricingInput {
  /** Selected equipment lines (product + quantity). */
  items: { product: Product; quantity: number }[];
  /** Installed PV capacity in kWp (drives per-kWp installation fee). */
  pvKwp: number;
  optionalServiceIds: string[];
}

export function calculatePrice(input: PricingInput, pricing: PricingConfig): PriceBreakdown {
  const equipmentLines: PriceLine[] = input.items
    .filter((i) => i.quantity > 0)
    .map(({ product, quantity }) => {
      const unit = customerUnitPrice(product, pricing);
      return {
        id: product.id,
        label: product.name,
        detail: [categoryLabel(product.category), product.brand, product.model].filter(Boolean).join(' · '),
        category: product.category,
        quantity,
        unitPrice: unit,
        subtotal: unit * quantity,
      };
    });
  const equipmentSubtotal = equipmentLines.reduce((s, l) => s + l.subtotal, 0);

  const serviceLines: PriceLine[] = [];
  const addService = (id: string, label: string, amount: number, detail?: string) => {
    const a = round(amount);
    if (a > 0) serviceLines.push({ id, label, detail, category: 'service', quantity: 1, unitPrice: a, subtotal: a });
  };

  if (pricing.installation.isActive && equipmentLines.length) {
    const kwp = Math.max(0, input.pvKwp);
    addService(
      'installation',
      pricing.installation.label,
      pricing.installation.baseFee + pricing.installation.perKwpFee * kwp,
      pricing.installation.perKwpFee > 0 ? `Base fee + per-kWp fee for ${kwp.toFixed(2)} kWp` : undefined,
    );
  }
  if (pricing.delivery.isActive && equipmentLines.length) addService('delivery', pricing.delivery.label, pricing.delivery.fee);
  for (const ch of pricing.additionalCharges) {
    if (!ch.isActive) continue;
    const amount = ch.type === 'percent' ? (equipmentSubtotal * ch.amount) / 100 : ch.amount;
    addService(`charge-${ch.id}`, ch.name, amount, ch.type === 'percent' ? `${ch.amount}% of equipment` : undefined);
  }
  for (const svc of pricing.optionalServices) {
    if (svc.isActive && input.optionalServiceIds.includes(svc.id)) addService(`service-${svc.id}`, svc.name, svc.price, 'Optional service');
  }
  const servicesSubtotal = serviceLines.reduce((s, l) => s + l.subtotal, 0);
  const subtotal = equipmentSubtotal + servicesSubtotal;

  const discountLines: AdjustmentLine[] = [];
  let remaining = subtotal;
  for (const d of pricing.discounts) {
    if (!d.isActive || subtotal < d.minSubtotal || remaining <= 0) continue;
    const raw = d.type === 'percent' ? (subtotal * Math.min(100, d.value)) / 100 : d.value;
    const amount = Math.min(round(raw), remaining);
    if (amount > 0) {
      discountLines.push({ id: d.id, label: d.label, amount });
      remaining -= amount;
    }
  }
  const discountTotal = subtotal - remaining;

  const taxable = subtotal - discountTotal;
  const taxLine =
    pricing.tax.isActive && pricing.tax.ratePercent > 0
      ? { id: 'tax', label: `${pricing.tax.label} (${pricing.tax.ratePercent}%)`, amount: round((taxable * pricing.tax.ratePercent) / 100) }
      : null;

  return {
    equipmentLines,
    serviceLines,
    equipmentSubtotal,
    servicesSubtotal,
    subtotal,
    discountLines,
    discountTotal,
    taxLine,
    total: taxable + (taxLine?.amount ?? 0),
  };
}

/** Convenience: price a full SystemDesign. */
export function priceDesign(design: SystemDesign, pricing: PricingConfig, optionalServiceIds: string[]): PriceBreakdown {
  return calculatePrice(
    {
      items: selectedEquipment(design).map((o) => ({ product: o.product, quantity: o.quantity })),
      pvKwp: design.summary.arrayW / 1000,
      optionalServiceIds,
    },
    pricing,
  );
}
