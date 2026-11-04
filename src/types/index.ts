// ─────────────────────────────────────────────────────────────────────────────
// Shared domain types for Solluz Synergy.
// The whole application is driven by a single `AppConfig` object which is
// loaded from src/config/defaultConfig.json and optionally overridden by an
// administrator-saved copy in browser LocalStorage.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductCategory =
  | 'solar-panel'
  | 'inverter'
  | 'battery'
  | 'charge-controller'
  | 'mounting'
  | 'cabling'
  | 'protection'
  | 'accessory';

export type SystemType = 'hybrid' | 'off-grid' | 'grid-tied';
export type SystemTypePreference = SystemType | 'recommend';
export type BatteryChemistry = 'lithium' | 'lead-acid' | 'gel';

/** How the quantity of a balance-of-system item (mounting, cabling, protection, accessories) is derived. */
export type QuantityBasis = 'fixed' | 'per-panel' | 'per-battery' | 'per-inverter' | 'per-kwp';

// ── Catalogue ────────────────────────────────────────────────────────────────

export interface Appliance {
  id: string;
  name: string;
  category: string;
  /** Typical running power in watts. */
  defaultWattage: number;
  /** Suggested hours of use per day. */
  defaultHours: number;
  /** Start-up surge multiplier (e.g. 3 = draws 3× running watts briefly at start). 1 = no surge. */
  surgeFactor: number;
  isActive: boolean;
}

export interface ProductSpec {
  label: string;
  value: string;
}

/**
 * A single catalogue product. Fields after `specifications` are category-specific:
 *  - solar-panel:        capacity = watts (Wp)
 *  - inverter:           capacity = VA rating, supportedSystemTypes, systemVoltage, surgeRatio, hasBuiltInMppt, maxPvInputW, parallelCapable
 *  - battery:            capacity = Wh (nominal), chemistry, systemVoltage
 *  - charge-controller:  capacity = amps, supportedVoltages
 *  - mounting/cabling/protection/accessory: quantityBasis, quantityPerBasis, isOptional, defaultSelected
 */
export interface Product {
  id: string;
  category: ProductCategory;
  name: string;
  brand: string;
  model: string;
  /** Base unit price in NGN (before any configured markup). */
  unitPrice: number;
  isActive: boolean;
  description: string;
  specifications: ProductSpec[];

  capacity?: number;
  supportedSystemTypes?: SystemType[];
  systemVoltage?: number;
  surgeRatio?: number;
  hasBuiltInMppt?: boolean;
  maxPvInputW?: number;
  parallelCapable?: boolean;
  chemistry?: BatteryChemistry;
  supportedVoltages?: number[];
  quantityBasis?: QuantityBasis;
  quantityPerBasis?: number;
  isOptional?: boolean;
  defaultSelected?: boolean;
}

// ── Pricing ──────────────────────────────────────────────────────────────────

export interface AdditionalCharge {
  id: string;
  name: string;
  /** fixed = NGN amount; percent = % of the equipment subtotal. */
  type: 'fixed' | 'percent';
  amount: number;
  isActive: boolean;
}

export interface OptionalService {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive: boolean;
}

export interface Discount {
  id: string;
  label: string;
  type: 'fixed' | 'percent';
  value: number;
  /** Only applies when the pre-discount subtotal is at least this amount. */
  minSubtotal: number;
  isActive: boolean;
}

export interface PricingConfig {
  /** Markup/profit margin in % applied to every equipment unit price. */
  markupPercent: number;
  installation: { label: string; baseFee: number; perKwpFee: number; isActive: boolean };
  delivery: { label: string; fee: number; isActive: boolean };
  additionalCharges: AdditionalCharge[];
  optionalServices: OptionalService[];
  discounts: Discount[];
  tax: { label: string; ratePercent: number; isActive: boolean };
}

// ── Calculator assumptions ──────────────────────────────────────────────────

export interface CalculatorSettings {
  /** 0–1 */
  inverterEfficiency: number;
  /** 0–1 round-trip efficiency */
  batteryEfficiency: number;
  /** 0–1 usable fraction per chemistry */
  depthOfDischarge: Record<BatteryChemistry, number>;
  /** Average daily peak sun hours at the installation site. */
  peakSunHours: number;
  /** 0–1 overall PV derating (temperature, dust, wiring, mismatch losses). */
  systemDeratingFactor: number;
  /** 0–1 extra headroom applied to continuous inverter load (0.25 = 25%). */
  inverterSafetyMargin: number;
  /** 0–1 power factor used to convert W to VA. */
  powerFactor: number;
  /** Fallback surge multiple an inverter can deliver briefly when a product does not specify one. */
  defaultInverterSurgeRatio: number;
  /** 0–1 share of non-largest loads assumed running together when not all appliances run simultaneously. */
  diversityFactor: number;
  /** 0–1 share of daily energy that the PV array should supply. */
  solarCoverage: number;
  /** Multiplier applied to charge controller current (e.g. 1.25). */
  chargeControllerSafetyFactor: number;
  /** Default battery bank voltage when an inverter does not specify one. */
  defaultSystemVoltage: number;
  defaultBackupHours: number;
  maxBackupHours: number;
  /** System type suggested when the customer chooses "Not sure". */
  recommendedSystemType: SystemType;
  /** Maximum number of identical inverters that may be paralleled for large loads. */
  maxParallelInverters: number;
  /** Battery chemistry ranked first when recommending batteries. */
  preferredBatteryChemistry: BatteryChemistry;
}

// ── Website content ──────────────────────────────────────────────────────────

export interface CompanyInfo {
  name: string;
  tagline: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  businessHours: string;
  social: { facebook: string; instagram: string; x: string; linkedin: string };
}

export interface ServiceItem {
  id: string;
  title: string;
  icon: string;
  summary: string;
  features: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  images: string[];
  completionDate: string;
  systemSize: string;
}

export interface Testimonial {
  id: string;
  name: string;
  location: string;
  quote: string;
}

export interface TitledText {
  title: string;
  description: string;
}

export interface SiteContent {
  hero: { headline: string; subheadline: string; badge: string };
  intro: { title: string; body: string };
  about: { overview: string; mission: string; vision: string; values: TitledText[]; capabilities: string[] };
  whyChooseUs: TitledText[];
  services: ServiceItem[];
  projects: Project[];
  testimonials: Testimonial[];
}

// ── Root configuration ───────────────────────────────────────────────────────

export interface ConfigMeta {
  /** Schema version – bump when the structure changes incompatibly. */
  version: number;
  /** Free-form content revision label (e.g. a date), useful to track published defaults. */
  revision: string;
  label: string;
  exportedAt?: string;
}

export interface AppConfig {
  meta: ConfigMeta;
  currency: 'NGN';
  company: CompanyInfo;
  content: SiteContent;
  applianceCategories: string[];
  appliances: Appliance[];
  products: Product[];
  pricing: PricingConfig;
  calculator: CalculatorSettings;
}

// ── Calculator session ───────────────────────────────────────────────────────

export interface SelectedAppliance {
  uid: string;
  /** Catalogue id, or null for custom appliances. */
  applianceId: string | null;
  name: string;
  wattage: number;
  quantity: number;
  hours: number;
  surgeFactor: number;
  isCustom: boolean;
}

export interface Requirements {
  state: string;
  city: string;
  systemType: SystemTypePreference;
  backupHours: number;
  allSimultaneous: boolean;
  comments: string;
}

/** Customer overrides for equipment. `null` means "use the recommendation". */
export interface EquipmentSelection {
  inverterId: string | null;
  batteryId: string | null;
  panelId: string | null;
  chargeControllerId: string | null;
  mountingId: string | null;
  cablingId: string | null;
  protectionId: string | null;
  /** null = use products flagged `defaultSelected`. */
  accessoryIds: string[] | null;
  optionalServiceIds: string[];
}
