import type { CalculatorSettings } from '../types';

/**
 * Required PV array size (W).
 *
 * Energy that must be harvested each day:
 *   - loads served directly during the day:   (daily − battery share) ÷ inverter efficiency
 *   - loads served from the battery:          battery share ÷ (inverter efficiency × battery efficiency)
 * scaled by the solar coverage target, then divided by peak sun hours × system derating.
 */
export function requiredPvCapacityW(
  dailyEnergyWh: number,
  batteryShareWh: number,
  s: Pick<CalculatorSettings, 'inverterEfficiency' | 'batteryEfficiency' | 'peakSunHours' | 'systemDeratingFactor' | 'solarCoverage'>,
): number {
  if (dailyEnergyWh <= 0) return 0;
  const inv = s.inverterEfficiency || 1;
  const bat = s.batteryEfficiency || 1;
  const viaBattery = Math.min(Math.max(0, batteryShareWh), dailyEnergyWh);
  const direct = dailyEnergyWh - viaBattery;
  const harvestWh = (direct / inv + viaBattery / (inv * bat)) * (s.solarCoverage || 1);
  const denom = (s.peakSunHours || 1) * (s.systemDeratingFactor || 1);
  return harvestWh / denom;
}

/** Number of panels of `panelWatts` needed for a required array size (at least 1). */
export function panelCount(requiredPvW: number, panelWatts: number): number {
  if (panelWatts <= 0) return 0;
  if (requiredPvW <= 0) return 0;
  return Math.max(1, Math.ceil(requiredPvW / panelWatts - 1e-9));
}

/** Expected average daily PV production (Wh) for an array. */
export function estimatedDailyProductionWh(arrayW: number, s: Pick<CalculatorSettings, 'peakSunHours' | 'systemDeratingFactor'>) {
  return arrayW * s.peakSunHours * s.systemDeratingFactor;
}
