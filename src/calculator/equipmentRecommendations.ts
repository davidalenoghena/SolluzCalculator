import type { AppConfig, BatteryChemistry, EquipmentSelection, Product, ProductCategory } from '../types';
import { designBatteryBank, type BatteryBank } from './batterySizing';
import { inverterSupportsSystem, inverterUnitsNeeded } from './inverterSizing';
import { estimatedDailyProductionWh, panelCount } from './panelSizing';
import type { SizingResult } from './systemSizing';

// ─────────────────────────────────────────────────────────────────────────────
// Turns a technical SizingResult into concrete, compatible equipment options
// from the active catalogue. Only products that satisfy the technical
// requirements are offered. Catalogue base prices are used ONLY to rank
// otherwise-equivalent options; customer pricing lives in src/pricing.
// ─────────────────────────────────────────────────────────────────────────────

export interface EquipmentOption {
  product: Product;
  quantity: number;
  /** quantity × catalogue base price – used for ranking only. */
  rawCost: number;
  notes: string[];
  bank?: BatteryBank;
}

export interface CategoryDesign {
  category: ProductCategory;
  /** Whether this category is part of the system at all. */
  required: boolean;
  options: EquipmentOption[];
  recommended: EquipmentOption | null;
  selected: EquipmentOption | null;
  /** Explains why the category is empty / not required. */
  message?: string;
}

export interface AccessoryDesign {
  options: EquipmentOption[];
  selectedIds: string[];
}

export interface DesignSummary {
  systemVoltage: number;
  inverterUnits: number;
  inverterTotalVA: number;
  batteryChemistry: BatteryChemistry | null;
  batteryRequiredWh: number;
  batteryBankWh: number;
  batteryUsableWh: number;
  batteryCount: number;
  panelCount: number;
  arrayW: number;
  estimatedDailyProductionWh: number;
  chargeControllerRequiredA: number;
}

export interface SystemDesign {
  inverter: CategoryDesign;
  battery: CategoryDesign;
  panel: CategoryDesign;
  chargeController: CategoryDesign;
  mounting: CategoryDesign;
  cabling: CategoryDesign;
  protection: CategoryDesign;
  accessories: AccessoryDesign;
  summary: DesignSummary;
  warnings: string[];
}

export const EMPTY_SELECTION: EquipmentSelection = {
  inverterId: null,
  batteryId: null,
  panelId: null,
  chargeControllerId: null,
  mountingId: null,
  cablingId: null,
  protectionId: null,
  accessoryIds: null,
  optionalServiceIds: [],
};

const MAX_PRACTICAL_BATTERIES = 24;

const active = (products: Product[], cat: ProductCategory) => products.filter((p) => p.isActive && p.category === cat);

function pick(options: EquipmentOption[], selectedId: string | null): { recommended: EquipmentOption | null; selected: EquipmentOption | null } {
  const recommended = options[0] ?? null;
  const selected = (selectedId && options.find((o) => o.product.id === selectedId)) || recommended;
  return { recommended, selected };
}

function category(
  cat: ProductCategory,
  required: boolean,
  options: EquipmentOption[],
  selectedId: string | null,
  emptyMessage: string,
): CategoryDesign {
  if (!required) return { category: cat, required, options: [], recommended: null, selected: null };
  const { recommended, selected } = pick(options, selectedId);
  return { category: cat, required, options, recommended, selected, message: options.length ? undefined : emptyMessage };
}

export interface QuantityContext {
  panels: number;
  batteries: number;
  inverters: number;
  kwp: number;
}

/** Quantity of a balance-of-system item based on its configured quantity basis. */
export function bosQuantity(p: Product, ctx: QuantityContext): number {
  const per = p.quantityPerBasis ?? 1;
  let base: number;
  switch (p.quantityBasis ?? 'fixed') {
    case 'per-panel':
      base = ctx.panels;
      break;
    case 'per-battery':
      base = ctx.batteries;
      break;
    case 'per-inverter':
      base = ctx.inverters;
      break;
    case 'per-kwp':
      base = ctx.kwp;
      break;
    default:
      base = 1;
  }
  const q = base * per;
  return q <= 0 ? 0 : Math.ceil(q - 1e-9);
}

export function designSystem(sizing: SizingResult, selection: EquipmentSelection, config: AppConfig): SystemDesign {
  const s = config.calculator;
  const products = config.products;
  const warnings: string[] = [];

  // ── 1. Inverter ──
  const inverterOptions: EquipmentOption[] = active(products, 'inverter')
    .filter((p) => inverterSupportsSystem(p, sizing.systemType))
    .flatMap((p) => {
      const units = inverterUnitsNeeded(p, sizing.inverter, s.defaultInverterSurgeRatio, s.maxParallelInverters);
      if (units === null) return [];
      const notes: string[] = [];
      if (units > 1) notes.push(`${units} units in parallel – parallel systems require engineering review.`);
      if (p.hasBuiltInMppt === false && sizing.systemType !== 'grid-tied') notes.push('Requires a separate solar charge controller.');
      return [{ product: p, quantity: units, rawCost: units * p.unitPrice, notes }];
    })
    .sort(
      (a, b) =>
        a.quantity - b.quantity ||
        a.quantity * (a.product.capacity ?? 0) - b.quantity * (b.product.capacity ?? 0) ||
        a.rawCost - b.rawCost,
    );
  const inverter = category(
    'inverter',
    true,
    inverterOptions,
    selection.inverterId,
    `No inverter in the current catalogue can handle about ${Math.ceil(sizing.inverter.requiredVA)} VA for a ${sizing.systemType} system. Please request a custom quote.`,
  );
  const inv = inverter.selected;
  const inverterUnits = inv?.quantity ?? 0;
  const systemVoltage = inv?.product.systemVoltage || s.defaultSystemVoltage;

  // ── 2. Battery ──
  const batteryRequired = sizing.needsBattery;
  const preferred = s.preferredBatteryChemistry;
  const batteryOptions: EquipmentOption[] = batteryRequired
    ? active(products, 'battery')
        .flatMap((p) => {
          const chem = p.chemistry ?? 'lithium';
          const req = sizing.batteryWhByChemistry[chem];
          const bank = designBatteryBank(p, req, systemVoltage);
          if (!bank) return [];
          const notes = [
            `${bank.seriesCount > 1 ? `${bank.seriesCount} in series × ` : ''}${bank.parallelStrings} string${bank.parallelStrings > 1 ? 's' : ''} at ${bank.bankVoltage}V`,
            `${Math.round((s.depthOfDischarge[chem] ?? 1) * 100)}% usable depth of discharge`,
          ];
          if (bank.quantity > MAX_PRACTICAL_BATTERIES) return [];
          return [{ product: p, quantity: bank.quantity, rawCost: bank.quantity * p.unitPrice, notes, bank }];
        })
        .sort(
          (a, b) =>
            Number(b.product.chemistry === preferred) - Number(a.product.chemistry === preferred) ||
            a.rawCost - b.rawCost ||
            a.quantity - b.quantity,
        )
    : [];
  const battery = category(
    'battery',
    batteryRequired,
    batteryOptions,
    selection.batteryId,
    `No battery in the catalogue is compatible with a ${systemVoltage}V system for this capacity.`,
  );
  const bat = battery.selected;
  const batteryChem = bat?.product.chemistry ?? null;
  const batteryRequiredWh = batteryChem ? sizing.batteryWhByChemistry[batteryChem] : 0;
  const batteryBankWh = bat?.bank?.bankWh ?? 0;
  const batteryUsableWh = batteryChem ? batteryBankWh * (s.depthOfDischarge[batteryChem] ?? 1) : 0;

  // ── 3. Solar panels ──
  const panelOptions: EquipmentOption[] = active(products, 'solar-panel')
    .filter((p) => (p.capacity ?? 0) > 0)
    .map((p) => {
      const q = panelCount(sizing.requiredPvW, p.capacity!);
      return { product: p, quantity: q, rawCost: q * p.unitPrice, notes: [`${((q * p.capacity!) / 1000).toFixed(2)} kWp array`] };
    })
    .filter((o) => o.quantity > 0)
    .sort((a, b) => a.rawCost - b.rawCost || a.quantity - b.quantity);
  const panel = category('solar-panel', sizing.requiredPvW > 0, panelOptions, selection.panelId, 'No active solar panels in the catalogue.');
  const panels = panel.selected?.quantity ?? 0;
  const arrayW = panels * (panel.selected?.product.capacity ?? 0);

  // ── 4. Charge controller (only when the inverter cannot take all the PV itself) ──
  let ccRequiredA = 0;
  let ccRequired = false;
  if (inv && arrayW > 0) {
    const mpptW = inv.product.hasBuiltInMppt ? (inv.product.maxPvInputW ?? 0) * inverterUnits : 0;
    const excessW = Math.max(0, arrayW - mpptW);
    if (excessW > 0) {
      if (sizing.systemType === 'grid-tied') {
        warnings.push(
          `The solar array (${(arrayW / 1000).toFixed(2)} kWp) exceeds the selected inverter's PV input (${(mpptW / 1000).toFixed(2)} kWp). Choose a larger inverter.`,
        );
      } else {
        ccRequired = true;
        ccRequiredA = (excessW / systemVoltage) * s.chargeControllerSafetyFactor;
      }
    }
  }
  const ccOptions: EquipmentOption[] = ccRequired
    ? active(products, 'charge-controller')
        .filter((p) => (p.supportedVoltages ?? []).includes(systemVoltage) && (p.capacity ?? 0) > 0)
        .map((p) => {
          const q = Math.max(1, Math.ceil(ccRequiredA / p.capacity! - 1e-9));
          return { product: p, quantity: q, rawCost: q * p.unitPrice, notes: [`${q} × ${p.capacity}A at ${systemVoltage}V`] };
        })
        .sort((a, b) => a.rawCost - b.rawCost)
    : [];
  const chargeController = category(
    'charge-controller',
    ccRequired,
    ccOptions,
    selection.chargeControllerId,
    `A ${Math.ceil(ccRequiredA)}A charge controller for ${systemVoltage}V is needed but none is available in the catalogue.`,
  );

  // ── 5. Balance of system ──
  const ctx: QuantityContext = {
    panels,
    batteries: bat?.quantity ?? 0,
    inverters: inverterUnits,
    kwp: arrayW / 1000,
  };
  const bos = (cat: ProductCategory, selectedId: string | null) => {
    const opts = active(products, cat)
      .filter((p) => !p.isOptional)
      .map((p) => {
        const q = bosQuantity(p, ctx);
        return { product: p, quantity: q, rawCost: q * p.unitPrice, notes: [] as string[] };
      })
      .filter((o) => o.quantity > 0)
      .sort((a, b) => a.rawCost - b.rawCost);
    return category(cat, opts.length > 0, opts, selectedId, '');
  };
  const mounting = bos('mounting', selection.mountingId);
  const cabling = bos('cabling', selection.cablingId);
  const protection = bos('protection', selection.protectionId);

  // Optional accessories (any category flagged optional, plus all "accessory" items).
  const accessoryOptions: EquipmentOption[] = products
    .filter((p) => p.isActive && (p.category === 'accessory' || (p.isOptional && ['mounting', 'cabling', 'protection'].includes(p.category))))
    .map((p) => {
      const q = bosQuantity(p, ctx);
      return { product: p, quantity: q, rawCost: q * p.unitPrice, notes: [] as string[] };
    })
    .filter((o) => o.quantity > 0);
  const availableIds = new Set(accessoryOptions.map((o) => o.product.id));
  const selectedIds = (selection.accessoryIds ?? accessoryOptions.filter((o) => o.product.defaultSelected).map((o) => o.product.id)).filter((id) =>
    availableIds.has(id),
  );

  if (!inverter.selected) warnings.push(inverter.message!);
  if (battery.required && !battery.selected) warnings.push(battery.message!);
  if (panel.required && !panel.selected) warnings.push(panel.message!);
  if (chargeController.required && !chargeController.selected) warnings.push(chargeController.message!);

  return {
    inverter,
    battery,
    panel,
    chargeController,
    mounting,
    cabling,
    protection,
    accessories: { options: accessoryOptions, selectedIds },
    summary: {
      systemVoltage,
      inverterUnits,
      inverterTotalVA: inverterUnits * (inv?.product.capacity ?? 0),
      batteryChemistry: batteryChem,
      batteryRequiredWh,
      batteryBankWh,
      batteryUsableWh,
      batteryCount: bat?.quantity ?? 0,
      panelCount: panels,
      arrayW,
      estimatedDailyProductionWh: estimatedDailyProductionWh(arrayW, s),
      chargeControllerRequiredA: ccRequiredA,
    },
    warnings,
  };
}

/** All selected equipment lines in display order. */
export function selectedEquipment(design: SystemDesign): EquipmentOption[] {
  const lines: EquipmentOption[] = [];
  for (const c of [design.panel, design.inverter, design.battery, design.chargeController, design.mounting, design.cabling, design.protection]) {
    if (c.required && c.selected && c.selected.quantity > 0) lines.push(c.selected);
  }
  for (const o of design.accessories.options) {
    if (design.accessories.selectedIds.includes(o.product.id)) lines.push(o);
  }
  return lines;
}
