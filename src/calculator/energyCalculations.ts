import type { SelectedAppliance } from '../types';

/** Coerces a possibly-invalid number into a safe, non-negative finite value. */
export function safeNumber(value: unknown, max = Number.MAX_SAFE_INTEGER): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}

const watts = (a: SelectedAppliance) => safeNumber(a.wattage, 1_000_000);
const qty = (a: SelectedAppliance) => Math.floor(safeNumber(a.quantity, 10_000));
const hours = (a: SelectedAppliance) => safeNumber(a.hours, 24);
const surge = (a: SelectedAppliance) => Math.max(1, safeNumber(a.surgeFactor, 10) || 1);

/** Running load of one appliance line in watts: wattage × quantity. */
export function applianceLoadW(a: SelectedAppliance): number {
  return watts(a) * qty(a);
}

/** Daily energy of one appliance line in Wh: wattage × quantity × daily hours. */
export function applianceDailyWh(a: SelectedAppliance): number {
  return watts(a) * qty(a) * hours(a);
}

/** Total connected load (W) = Σ wattage × quantity. */
export function totalConnectedLoadW(list: SelectedAppliance[]): number {
  return list.reduce((sum, a) => sum + applianceLoadW(a), 0);
}

/** Daily energy (Wh) = Σ wattage × quantity × hours. */
export function totalDailyEnergyWh(list: SelectedAppliance[]): number {
  return list.reduce((sum, a) => sum + applianceDailyWh(a), 0);
}

export const whToKwh = (wh: number) => wh / 1000;

/**
 * Estimated simultaneous (peak running) load in W.
 *
 * - If all appliances run together, this is the connected load.
 * - Otherwise a diversity method is used: the single largest appliance line is
 *   assumed to run at full load, and the remaining load is multiplied by the
 *   configured diversity factor (e.g. 0.7 = 70% of the remaining load runs
 *   at the same time).
 */
export function estimateSimultaneousLoadW(list: SelectedAppliance[], allSimultaneous: boolean, diversityFactor: number): number {
  const connected = totalConnectedLoadW(list);
  if (allSimultaneous || list.length <= 1) return connected;
  const largest = Math.max(0, ...list.map(applianceLoadW));
  const factor = Math.min(1, Math.max(0, diversityFactor));
  return largest + (connected - largest) * factor;
}

/**
 * Additional instantaneous power needed when a motor-driven appliance starts.
 * Assumes only one appliance starts at a time (the worst one), which is the
 * usual design assumption for residential/commercial inverters.
 */
export function largestSurgeExtraW(list: SelectedAppliance[]): number {
  return Math.max(0, ...list.filter((a) => qty(a) > 0).map((a) => watts(a) * (surge(a) - 1)));
}

/** Peak instantaneous demand (W) = simultaneous load + worst single start-up surge. */
export function estimateSurgeLoadW(list: SelectedAppliance[], simultaneousLoadW: number): number {
  return simultaneousLoadW + largestSurgeExtraW(list);
}

/**
 * Energy (Wh) the battery must deliver during a backup period of `backupHours`.
 * Each appliance contributes at most its own daily usage hours, capped at the
 * backup duration (an appliance used 2 h/day does not need 8 h of backup).
 */
export function backupEnergyWh(list: SelectedAppliance[], backupHours: number): number {
  const h = safeNumber(backupHours, 168);
  return list.reduce((sum, a) => sum + watts(a) * qty(a) * Math.min(hours(a), h), 0);
}

/** Validates a single appliance line; returns human-readable errors (empty = valid). */
export function validateApplianceLine(a: SelectedAppliance): string[] {
  const errors: string[] = [];
  if (!a.name || !a.name.trim()) errors.push('Enter an appliance name.');
  if (!Number.isFinite(a.wattage) || a.wattage <= 0) errors.push('Wattage must be greater than 0.');
  else if (a.wattage > 100_000) errors.push('Wattage looks too high (max 100,000 W per appliance).');
  if (!Number.isInteger(a.quantity) || a.quantity < 1) errors.push('Quantity must be a whole number of at least 1.');
  else if (a.quantity > 1000) errors.push('Quantity must be 1,000 or less.');
  if (!Number.isFinite(a.hours) || a.hours < 0 || a.hours > 24) errors.push('Daily hours must be between 0 and 24.');
  return errors;
}
