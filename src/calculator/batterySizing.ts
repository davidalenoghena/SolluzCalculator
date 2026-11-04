import type { BatteryChemistry, CalculatorSettings, Product } from '../types';

/**
 * Nominal battery capacity (Wh) needed to deliver `backupEnergyWh` to the loads:
 *   required = backup energy ÷ (depth of discharge × inverter efficiency × battery efficiency)
 */
export function requiredBatteryWh(
  backupEnergyWh: number,
  chemistry: BatteryChemistry,
  s: Pick<CalculatorSettings, 'depthOfDischarge' | 'inverterEfficiency' | 'batteryEfficiency'>,
): number {
  if (backupEnergyWh <= 0) return 0;
  const dod = s.depthOfDischarge[chemistry] || 1;
  const divisor = dod * (s.inverterEfficiency || 1) * (s.batteryEfficiency || 1);
  return backupEnergyWh / divisor;
}

export function requiredBatteryWhByChemistry(
  backupEnergyWh: number,
  s: Pick<CalculatorSettings, 'depthOfDischarge' | 'inverterEfficiency' | 'batteryEfficiency'>,
): Record<BatteryChemistry, number> {
  return {
    lithium: requiredBatteryWh(backupEnergyWh, 'lithium', s),
    'lead-acid': requiredBatteryWh(backupEnergyWh, 'lead-acid', s),
    gel: requiredBatteryWh(backupEnergyWh, 'gel', s),
  };
}

export interface BatteryBank {
  /** Batteries wired in series per string to reach the inverter's DC voltage. */
  seriesCount: number;
  /** Parallel strings needed to reach the required capacity. */
  parallelStrings: number;
  quantity: number;
  bankWh: number;
  bankVoltage: number;
}

/**
 * Designs a battery bank from a given battery product for an inverter DC bus voltage.
 * Returns null when the battery voltage cannot be combined to match the system voltage.
 */
export function designBatteryBank(battery: Product, requiredWh: number, systemVoltage: number): BatteryBank | null {
  const v = battery.systemVoltage ?? 0;
  const wh = battery.capacity ?? 0;
  if (v <= 0 || wh <= 0 || systemVoltage <= 0) return null;
  const ratio = systemVoltage / v;
  // Allow small rounding differences (e.g. 51.2V lithium on a 48V bus is configured as 48).
  if (ratio < 1 - 1e-9 || Math.abs(ratio - Math.round(ratio)) > 1e-9) return null;
  const seriesCount = Math.round(ratio);
  const stringWh = wh * seriesCount;
  const parallelStrings = Math.max(1, Math.ceil(requiredWh / stringWh - 1e-9));
  return {
    seriesCount,
    parallelStrings,
    quantity: seriesCount * parallelStrings,
    bankWh: stringWh * parallelStrings,
    bankVoltage: systemVoltage,
  };
}
