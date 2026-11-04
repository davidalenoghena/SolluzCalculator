import rawDefaultConfig from './defaultConfig.json';
import type { AppConfig, BatteryChemistry, ProductCategory, QuantityBasis, SystemType } from '../types';

/** Current configuration schema version understood by this build. */
export const CONFIG_SCHEMA_VERSION = 1;

/** LocalStorage key for the administrator-saved configuration. */
export const CONFIG_STORAGE_KEY = 'solluz_synergy_config';

/** Default export filename. */
export const CONFIG_EXPORT_FILENAME = 'solluz-synergy-config.json';

/**
 * Returns a fresh deep copy of the bundled default configuration so callers
 * can never mutate the shared module-level object by accident.
 */
export function getDefaultConfig(): AppConfig {
  return structuredClone(rawDefaultConfig) as unknown as AppConfig;
}

export const PRODUCT_CATEGORIES: { id: ProductCategory; label: string; plural: string }[] = [
  { id: 'solar-panel', label: 'Solar Panel', plural: 'Solar Panels' },
  { id: 'inverter', label: 'Inverter', plural: 'Inverters' },
  { id: 'battery', label: 'Battery', plural: 'Batteries' },
  { id: 'charge-controller', label: 'Charge Controller', plural: 'Charge Controllers' },
  { id: 'mounting', label: 'Mounting Structure', plural: 'Mounting Structures' },
  { id: 'cabling', label: 'Cables & Wiring', plural: 'Cables & Wiring' },
  { id: 'protection', label: 'Protection Equipment', plural: 'Protection Equipment' },
  { id: 'accessory', label: 'Accessory', plural: 'Other Accessories' },
];

export const categoryLabel = (c: ProductCategory) => PRODUCT_CATEGORIES.find((x) => x.id === c)?.label ?? c;
export const categoryPlural = (c: ProductCategory) => PRODUCT_CATEGORIES.find((x) => x.id === c)?.plural ?? c;

export const SYSTEM_TYPES: { id: SystemType; label: string; description: string }[] = [
  {
    id: 'hybrid',
    label: 'Hybrid',
    description:
      'Works with solar, batteries AND grid/generator. Batteries keep you powered during outages; solar and grid recharge them. Best for most Nigerian homes and businesses.',
  },
  {
    id: 'off-grid',
    label: 'Off-grid',
    description:
      'Fully independent of the grid. Solar panels and batteries supply all your power. Ideal where there is no grid connection or supply is very poor.',
  },
  {
    id: 'grid-tied',
    label: 'Grid-tied',
    description:
      'Solar panels reduce what you draw from the grid during the day, but there are no batteries – so no backup during outages.',
  },
];

export const BATTERY_CHEMISTRIES: { id: BatteryChemistry; label: string }[] = [
  { id: 'lithium', label: 'Lithium (LiFePO4)' },
  { id: 'lead-acid', label: 'Lead-acid / Tubular' },
  { id: 'gel', label: 'Gel' },
];

export const QUANTITY_BASES: { id: QuantityBasis; label: string }[] = [
  { id: 'fixed', label: 'Fixed quantity per system' },
  { id: 'per-panel', label: 'Per solar panel' },
  { id: 'per-battery', label: 'Per battery' },
  { id: 'per-inverter', label: 'Per inverter' },
  { id: 'per-kwp', label: 'Per kWp of solar' },
];

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno', 'Cross River', 'Delta',
  'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT – Abuja', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers',
  'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];
