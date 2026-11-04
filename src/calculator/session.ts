import { randomUid } from '../lib/utils';
import type { Appliance, CalculatorSettings, EquipmentSelection, Requirements, SelectedAppliance } from '../types';
import { EMPTY_SELECTION } from './equipmentRecommendations';

export function fromCatalogue(a: Appliance, quantity = 1): SelectedAppliance {
  return {
    uid: randomUid(),
    applianceId: a.id,
    name: a.name,
    wattage: a.defaultWattage,
    quantity,
    hours: a.defaultHours,
    surgeFactor: a.surgeFactor,
    isCustom: false,
  };
}

export function customAppliance(name: string, wattage: number, quantity: number, hours: number): SelectedAppliance {
  return { uid: randomUid(), applianceId: null, name: name.trim(), wattage, quantity, hours, surgeFactor: 1, isCustom: true };
}

export function defaultRequirements(s: CalculatorSettings): Requirements {
  return { state: '', city: '', systemType: 'recommend', backupHours: s.defaultBackupHours, allSimultaneous: false, comments: '' };
}

export const defaultSelection = (): EquipmentSelection => ({ ...EMPTY_SELECTION, optionalServiceIds: [] });

// Runtime guards for session data (it could be stale from an older build).
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isApplianceList(v: unknown): v is SelectedAppliance[] {
  return (
    Array.isArray(v) &&
    v.every((a) => isObj(a) && typeof a.uid === 'string' && typeof a.name === 'string' && typeof a.wattage === 'number' && typeof a.quantity === 'number')
  );
}

export function isRequirements(v: unknown): v is Requirements {
  return isObj(v) && typeof v.systemType === 'string' && typeof v.backupHours === 'number' && typeof v.allSimultaneous === 'boolean';
}

export function isSelection(v: unknown): v is EquipmentSelection {
  return isObj(v) && Array.isArray(v.optionalServiceIds) && 'inverterId' in v;
}
