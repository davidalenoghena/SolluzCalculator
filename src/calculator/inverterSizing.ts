import type { CalculatorSettings, Product, SystemType } from '../types';

export interface InverterRequirement {
  /** Continuous VA = simultaneous load × (1 + safety margin) ÷ power factor. */
  continuousVA: number;
  /** Surge VA = peak surge load ÷ power factor (must be met by inverter capacity × surge ratio). */
  surgeVA: number;
  /** Headline recommended rating using the default surge ratio. */
  requiredVA: number;
}

export function requiredInverterCapacity(
  simultaneousLoadW: number,
  surgeLoadW: number,
  s: Pick<CalculatorSettings, 'inverterSafetyMargin' | 'powerFactor' | 'defaultInverterSurgeRatio'>,
): InverterRequirement {
  const pf = s.powerFactor > 0 ? s.powerFactor : 1;
  const continuousVA = (simultaneousLoadW * (1 + Math.max(0, s.inverterSafetyMargin))) / pf;
  const surgeVA = surgeLoadW / pf;
  const requiredVA = Math.max(continuousVA, surgeVA / Math.max(1, s.defaultInverterSurgeRatio));
  return { continuousVA, surgeVA, requiredVA };
}

export function inverterSupportsSystem(p: Product, systemType: SystemType): boolean {
  return (p.supportedSystemTypes ?? []).includes(systemType);
}

/**
 * Number of identical inverter units needed (1 if a single unit is sufficient).
 * Returns null when the requirement cannot be met within `maxUnits`.
 */
export function inverterUnitsNeeded(
  p: Product,
  req: InverterRequirement,
  defaultSurgeRatio: number,
  maxUnits: number,
): number | null {
  const cap = p.capacity ?? 0;
  if (cap <= 0) return null;
  const ratio = p.surgeRatio && p.surgeRatio >= 1 ? p.surgeRatio : defaultSurgeRatio;
  const units = Math.max(1, Math.ceil(req.continuousVA / cap - 1e-9), Math.ceil(req.surgeVA / (cap * ratio) - 1e-9));
  if (units === 1) return 1;
  if (!p.parallelCapable) return null;
  return units <= maxUnits ? units : null;
}
