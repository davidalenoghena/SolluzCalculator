import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../config';
import type { Requirements, SelectedAppliance } from '../types';
import { designBatteryBank, requiredBatteryWh } from './batterySizing';
import {
  applianceDailyWh,
  backupEnergyWh,
  estimateSimultaneousLoadW,
  estimateSurgeLoadW,
  totalConnectedLoadW,
  totalDailyEnergyWh,
  validateApplianceLine,
} from './energyCalculations';
import { EMPTY_SELECTION, designSystem, selectedEquipment } from './equipmentRecommendations';
import { requiredInverterCapacity } from './inverterSizing';
import { panelCount, requiredPvCapacityW } from './panelSizing';
import { sizeSystem } from './systemSizing';

let uid = 0;
const app = (name: string, wattage: number, quantity: number, hours: number, surgeFactor = 1): SelectedAppliance => ({
  uid: String(uid++),
  applianceId: null,
  name,
  wattage,
  quantity,
  hours,
  surgeFactor,
  isCustom: false,
});

const req = (over: Partial<Requirements> = {}): Requirements => ({
  state: 'Lagos',
  city: 'Ikeja',
  systemType: 'hybrid',
  backupHours: 8,
  allSimultaneous: true,
  comments: '',
  ...over,
});

const cfg = getDefaultConfig();
const settings = cfg.calculator;

describe('energy calculations', () => {
  it('computes a single appliance', () => {
    const tv = app('TV', 100, 1, 5);
    expect(applianceDailyWh(tv)).toBe(500);
    expect(totalConnectedLoadW([tv])).toBe(100);
    expect(totalDailyEnergyWh([tv])).toBe(500);
  });

  it('computes multiple appliances with quantities', () => {
    const list = [app('Bulb', 10, 6, 6), app('Fan', 75, 2, 8), app('Fridge', 200, 1, 10)];
    expect(totalConnectedLoadW(list)).toBe(60 + 150 + 200);
    expect(totalDailyEnergyWh(list)).toBe(360 + 1200 + 2000);
  });

  it('reflects updated quantity, wattage and hours', () => {
    const a = app('Fan', 75, 1, 8);
    expect(applianceDailyWh(a)).toBe(600);
    expect(applianceDailyWh({ ...a, quantity: 3 })).toBe(1800);
    expect(applianceDailyWh({ ...a, wattage: 50 })).toBe(400);
    expect(applianceDailyWh({ ...a, hours: 12 })).toBe(900);
  });

  it('handles removing appliances (empty list)', () => {
    expect(totalConnectedLoadW([])).toBe(0);
    expect(totalDailyEnergyWh([])).toBe(0);
    expect(estimateSimultaneousLoadW([], false, 0.7)).toBe(0);
  });

  it('treats invalid numbers as zero and caps hours at 24', () => {
    const bad = app('Bad', NaN, -2, 30);
    expect(applianceDailyWh(bad)).toBe(0);
    expect(applianceDailyWh(app('X', 100, 1, 30))).toBe(2400);
  });

  it('validates appliance input', () => {
    expect(validateApplianceLine(app('TV', 100, 1, 5))).toEqual([]);
    expect(validateApplianceLine(app('', 0, 0, 25)).length).toBe(4);
    expect(validateApplianceLine(app('TV', 100, 1.5, 5))).toContain('Quantity must be a whole number of at least 1.');
  });

  it('applies diversity when not all appliances run simultaneously', () => {
    const list = [app('AC', 1500, 1, 6), app('Bulbs', 10, 10, 6), app('Fridge', 200, 1, 10)];
    expect(estimateSimultaneousLoadW(list, true, 0.7)).toBe(1800);
    // largest (1500) + 0.7 × remaining (300)
    expect(estimateSimultaneousLoadW(list, false, 0.7)).toBeCloseTo(1710);
  });

  it('adds the worst single start-up surge', () => {
    const list = [app('Fridge', 200, 1, 10, 3), app('Pump', 750, 1, 1, 3)];
    expect(estimateSurgeLoadW(list, 950)).toBe(950 + 1500);
  });

  it('caps backup energy by each appliance usage hours', () => {
    const list = [app('Router', 15, 1, 24), app('Iron', 1000, 1, 0.5)];
    expect(backupEnergyWh(list, 8)).toBe(15 * 8 + 500);
  });
});

describe('component sizing', () => {
  it('sizes inverter with margin, power factor and surge', () => {
    const r = requiredInverterCapacity(1000, 1000, { inverterSafetyMargin: 0.25, powerFactor: 0.8, defaultInverterSurgeRatio: 2 });
    expect(r.continuousVA).toBeCloseTo(1562.5);
    expect(r.requiredVA).toBeCloseTo(1562.5);
    const surgey = requiredInverterCapacity(1000, 5000, { inverterSafetyMargin: 0.25, powerFactor: 0.8, defaultInverterSurgeRatio: 2 });
    expect(surgey.requiredVA).toBeCloseTo(5000 / 0.8 / 2);
  });

  it('sizes battery using DoD and efficiencies', () => {
    const s = { depthOfDischarge: { lithium: 0.9, 'lead-acid': 0.5, gel: 0.6 }, inverterEfficiency: 0.9, batteryEfficiency: 0.95 };
    expect(requiredBatteryWh(3000, 'lithium', s)).toBeCloseTo(3000 / (0.9 * 0.9 * 0.95));
    expect(requiredBatteryWh(3000, 'lead-acid', s)).toBeGreaterThan(requiredBatteryWh(3000, 'lithium', s));
    expect(requiredBatteryWh(0, 'lithium', s)).toBe(0);
  });

  it('designs battery banks with series strings matching the inverter voltage', () => {
    const b12 = cfg.products.find((p) => p.id === 'bat-12v-200ah-tubular')!;
    const bank = designBatteryBank(b12, 5000, 24)!;
    expect(bank.seriesCount).toBe(2);
    expect(bank.parallelStrings).toBe(2);
    expect(bank.quantity).toBe(4);
    expect(bank.bankWh).toBe(9600);
    const b48 = cfg.products.find((p) => p.id === 'bat-48v-5kwh-lfp')!;
    expect(designBatteryBank(b48, 5000, 24)).toBeNull(); // 48V battery cannot run a 24V inverter
  });

  it('sizes PV array from energy, sun hours, derating and battery losses', () => {
    const s = { inverterEfficiency: 0.9, batteryEfficiency: 0.95, peakSunHours: 4.5, systemDeratingFactor: 0.75, solarCoverage: 1 };
    const noBattery = requiredPvCapacityW(4500, 0, s);
    expect(noBattery).toBeCloseTo(4500 / 0.9 / (4.5 * 0.75));
    expect(requiredPvCapacityW(4500, 2000, s)).toBeGreaterThan(noBattery);
    expect(panelCount(2050, 500)).toBe(5);
    expect(panelCount(2000, 500)).toBe(4);
  });
});

describe('system sizing & recommendations', () => {
  const home = [
    app('LED Bulb', 10, 10, 6),
    app('Ceiling Fan', 75, 3, 8, 1.5),
    app('Television', 100, 1, 5),
    app('Refrigerator', 200, 1, 10, 3),
    app('Wi-Fi Router', 15, 1, 24),
  ];

  it('generates a complete hybrid recommendation', () => {
    const sizing = sizeSystem(home, req(), settings);
    expect(sizing.systemType).toBe('hybrid');
    expect(sizing.needsBattery).toBe(true);
    const design = designSystem(sizing, EMPTY_SELECTION, cfg);
    expect(design.inverter.selected).not.toBeNull();
    const inv = design.inverter.selected!;
    expect((inv.product.capacity ?? 0) * inv.quantity).toBeGreaterThanOrEqual(sizing.inverter.continuousVA);
    expect(design.battery.selected).not.toBeNull();
    expect(design.summary.batteryBankWh).toBeGreaterThanOrEqual(design.summary.batteryRequiredWh);
    expect(design.panel.selected).not.toBeNull();
    expect(design.summary.arrayW).toBeGreaterThanOrEqual(sizing.requiredPvW);
    expect(design.warnings).toEqual([]);
    // every offered inverter is technically compatible
    for (const o of design.inverter.options) {
      expect(o.product.supportedSystemTypes).toContain('hybrid');
      expect((o.product.capacity ?? 0) * o.quantity).toBeGreaterThanOrEqual(sizing.inverter.continuousVA);
    }
    // every battery option matches the inverter voltage
    for (const o of design.battery.options) expect(design.summary.systemVoltage % (o.product.systemVoltage ?? 1)).toBe(0);
  });

  it('respects customer overrides and ignores incompatible ones', () => {
    const sizing = sizeSystem(home, req(), settings);
    const base = designSystem(sizing, EMPTY_SELECTION, cfg);
    const alt = base.panel.options[base.panel.options.length - 1];
    const chosen = designSystem(sizing, { ...EMPTY_SELECTION, panelId: alt.product.id }, cfg);
    expect(chosen.panel.selected?.product.id).toBe(alt.product.id);
    const bogus = designSystem(sizing, { ...EMPTY_SELECTION, inverterId: 'inv-5kw-gridtie' }, cfg);
    expect(bogus.inverter.selected?.product.id).toBe(base.inverter.recommended?.product.id);
  });

  it('uses grid-tied inverters and no battery for grid-tied systems', () => {
    const sizing = sizeSystem(home, req({ systemType: 'grid-tied' }), settings);
    expect(sizing.needsBattery).toBe(false);
    const design = designSystem(sizing, EMPTY_SELECTION, cfg);
    expect(design.battery.required).toBe(false);
    expect(design.inverter.selected?.product.supportedSystemTypes).toContain('grid-tied');
  });

  it('enforces minimum backup for off-grid systems', () => {
    const sizing = sizeSystem(home, req({ systemType: 'off-grid', backupHours: 2 }), settings);
    expect(sizing.backupHours).toBe(12);
  });

  it('resolves "recommend" to the configured system type', () => {
    const sizing = sizeSystem(home, req({ systemType: 'recommend' }), settings);
    expect(sizing.systemType).toBe(settings.recommendedSystemType);
    expect(sizing.systemTypeAutoSelected).toBe(true);
  });

  it('adds a charge controller when the inverter has no MPPT', () => {
    const sizing = sizeSystem(home, req({ systemType: 'off-grid' }), settings);
    const design = designSystem(sizing, { ...EMPTY_SELECTION, inverterId: 'inv-3kva-offgrid-24v' }, cfg);
    expect(design.inverter.selected?.product.id).toBe('inv-3kva-offgrid-24v');
    expect(design.chargeController.required).toBe(true);
    expect(design.chargeController.selected).not.toBeNull();
    expect(selectedEquipment(design).some((l) => l.product.category === 'charge-controller')).toBe(true);
  });

  it('parallels inverters for very large loads', () => {
    const big = [app('AC', 1500, 10, 8, 3)];
    const sizing = sizeSystem(big, req(), settings);
    const design = designSystem(sizing, EMPTY_SELECTION, cfg);
    expect(design.inverter.selected!.quantity).toBeGreaterThan(1);
    expect(design.inverter.selected!.product.parallelCapable).toBe(true);
  });

  it('warns when nothing in the catalogue is compatible', () => {
    const noInv = { ...cfg, products: cfg.products.filter((p) => p.category !== 'inverter') };
    const design = designSystem(sizeSystem(home, req(), settings), EMPTY_SELECTION, noInv);
    expect(design.inverter.selected).toBeNull();
    expect(design.warnings.length).toBeGreaterThan(0);
  });

  it('respects calculator setting changes', () => {
    const s1 = sizeSystem(home, req(), settings);
    const s2 = sizeSystem(home, req(), { ...settings, peakSunHours: 6 });
    expect(s2.requiredPvW).toBeLessThan(s1.requiredPvW);
    const s3 = sizeSystem(home, req(), { ...settings, inverterSafetyMargin: 0.5 });
    expect(s3.inverter.continuousVA).toBeGreaterThan(s1.inverter.continuousVA);
  });
});
