import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../config';
import type { PricingConfig, Product } from '../types';
import { formatNaira, formatNairaPlain } from './currencyFormatter';
import { calculatePrice, customerUnitPrice } from './pricingEngine';

const cfg = getDefaultConfig();
const panel = cfg.products.find((p) => p.id === 'panel-500w-mono')!;
const inverter = cfg.products.find((p) => p.id === 'inv-5kva-48v')!;

const basePricing = (over: Partial<PricingConfig> = {}): PricingConfig => ({
  markupPercent: 0,
  installation: { label: 'Installation', baseFee: 0, perKwpFee: 0, isActive: false },
  delivery: { label: 'Delivery', fee: 0, isActive: false },
  additionalCharges: [],
  optionalServices: [],
  discounts: [],
  tax: { label: 'VAT', ratePercent: 0, isActive: false },
  ...over,
});

const items = (list: [Product, number][]) => list.map(([product, quantity]) => ({ product, quantity }));

describe('currency formatting', () => {
  it('formats Naira consistently', () => {
    expect(formatNaira(135000)).toBe('₦135,000');
    expect(formatNaira(1250000)).toBe('₦1,250,000');
    expect(formatNaira(4380000.4)).toBe('₦4,380,000');
    expect(formatNaira(-5000)).toBe('-₦5,000');
    expect(formatNaira(NaN)).toBe('₦0');
    expect(formatNairaPlain(1250000)).toBe('NGN 1,250,000');
  });
});

describe('pricing engine', () => {
  it('loads default prices from the configuration', () => {
    const b = calculatePrice({ items: items([[panel, 8]]), pvKwp: 4, optionalServiceIds: [] }, basePricing());
    expect(b.equipmentLines[0].unitPrice).toBe(135000);
    expect(b.equipmentSubtotal).toBe(1_080_000);
    expect(b.total).toBe(1_080_000);
  });

  it('uses updated equipment prices', () => {
    const updated = { ...panel, unitPrice: 150000 };
    const b = calculatePrice({ items: items([[updated, 8]]), pvKwp: 4, optionalServiceIds: [] }, basePricing());
    expect(b.equipmentSubtotal).toBe(1_200_000);
  });

  it('updates totals when the equipment selection changes', () => {
    const a = calculatePrice({ items: items([[panel, 8], [inverter, 1]]), pvKwp: 4, optionalServiceIds: [] }, basePricing());
    const b = calculatePrice({ items: items([[panel, 10], [inverter, 1]]), pvKwp: 5, optionalServiceIds: [] }, basePricing());
    expect(b.total - a.total).toBe(2 * 135000);
  });

  it('applies markup to unit prices', () => {
    expect(customerUnitPrice(panel, { markupPercent: 10 })).toBe(148500);
  });

  it('applies installation, delivery and additional charges', () => {
    const p = basePricing({
      installation: { label: 'Installation', baseFee: 100000, perKwpFee: 20000, isActive: true },
      delivery: { label: 'Delivery', fee: 50000, isActive: true },
      additionalCharges: [
        { id: 'survey', name: 'Survey', type: 'fixed', amount: 25000, isActive: true },
        { id: 'pct', name: 'Handling', type: 'percent', amount: 2, isActive: true },
        { id: 'off', name: 'Disabled', type: 'fixed', amount: 999999, isActive: false },
      ],
    });
    const b = calculatePrice({ items: items([[panel, 8]]), pvKwp: 4, optionalServiceIds: [] }, p);
    expect(b.serviceLines.map((l) => l.subtotal)).toEqual([180000, 50000, 25000, 21600]);
    expect(b.total).toBe(1_080_000 + 180000 + 50000 + 25000 + 21600);
  });

  it('applies optional services only when selected', () => {
    const p = basePricing({ optionalServices: [{ id: 'm', name: 'Maintenance', description: '', price: 120000, isActive: true }] });
    expect(calculatePrice({ items: items([[panel, 1]]), pvKwp: 0.5, optionalServiceIds: [] }, p).total).toBe(135000);
    expect(calculatePrice({ items: items([[panel, 1]]), pvKwp: 0.5, optionalServiceIds: ['m'] }, p).total).toBe(255000);
  });

  it('applies discounts (respecting minimum subtotal) and then tax', () => {
    const p = basePricing({
      discounts: [
        { id: 'pct', label: '10% off', type: 'percent', value: 10, minSubtotal: 0, isActive: true },
        { id: 'fixed', label: '₦5,000 off', type: 'fixed', value: 5000, minSubtotal: 0, isActive: true },
        { id: 'big', label: 'Big orders', type: 'percent', value: 50, minSubtotal: 10_000_000, isActive: true },
      ],
      tax: { label: 'VAT', ratePercent: 7.5, isActive: true },
    });
    const b = calculatePrice({ items: items([[panel, 8]]), pvKwp: 4, optionalServiceIds: [] }, p);
    expect(b.discountLines.map((d) => d.amount)).toEqual([108000, 5000]);
    expect(b.discountTotal).toBe(113000);
    expect(b.taxLine?.amount).toBe(Math.round((1_080_000 - 113000) * 0.075));
    expect(b.total).toBe(1_080_000 - 113000 + b.taxLine!.amount);
  });

  it('never discounts below zero', () => {
    const p = basePricing({ discounts: [{ id: 'x', label: 'Huge', type: 'fixed', value: 99_999_999, minSubtotal: 0, isActive: true }] });
    expect(calculatePrice({ items: items([[panel, 1]]), pvKwp: 0.5, optionalServiceIds: [] }, p).total).toBe(0);
  });

  it('does not charge installation when there is no equipment', () => {
    const b = calculatePrice({ items: [], pvKwp: 0, optionalServiceIds: [] }, cfg.pricing);
    expect(b.total).toBe(25000 * (1 + cfg.pricing.tax.ratePercent / 100)); // only the always-on survey charge + VAT
  });
});
