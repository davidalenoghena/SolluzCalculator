import { CONFIG_SCHEMA_VERSION } from '../config';
import type { AppConfig, ProductCategory } from '../types';

export type ValidationResult =
  | { ok: true; config: AppConfig; warnings: string[] }
  | { ok: false; errors: string[]; warnings: string[] };

const PRODUCT_CATEGORIES: ProductCategory[] = [
  'solar-panel', 'inverter', 'battery', 'charge-controller', 'mounting', 'cabling', 'protection', 'accessory',
];
const SYSTEM_TYPES = ['hybrid', 'off-grid', 'grid-tied'];
const CHEMISTRIES = ['lithium', 'lead-acid', 'gel'];
const BASES = ['fixed', 'per-panel', 'per-battery', 'per-inverter', 'per-kwp'];
const MAX_ERRORS = 50;

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

class Collector {
  errors: string[] = [];
  warnings: string[] = [];
  err(msg: string) {
    if (this.errors.length < MAX_ERRORS) this.errors.push(msg);
  }
  str(obj: Record<string, unknown>, key: string, path: string, { required = true, nonEmpty = false } = {}) {
    const v = obj[key];
    if (v === undefined && !required) return;
    if (!isStr(v)) return this.err(`${path}.${key} must be text.`);
    if (nonEmpty && !v.trim()) this.err(`${path}.${key} must not be empty.`);
  }
  num(obj: Record<string, unknown>, key: string, path: string, { min = -Infinity, max = Infinity, required = true } = {}) {
    const v = obj[key];
    if (v === undefined && !required) return;
    if (!isNum(v)) return this.err(`${path}.${key} must be a number.`);
    if (v < min || v > max) this.err(`${path}.${key} must be between ${min} and ${max === Infinity ? '∞' : max} (got ${v}).`);
  }
  bool(obj: Record<string, unknown>, key: string, path: string, { required = true } = {}) {
    const v = obj[key];
    if (v === undefined && !required) return;
    if (!isBool(v)) this.err(`${path}.${key} must be true or false.`);
  }
  obj(parent: Record<string, unknown>, key: string, path: string): Record<string, unknown> | null {
    const v = parent[key];
    if (!isObj(v)) {
      this.err(`${path}.${key} is missing or is not an object.`);
      return null;
    }
    return v;
  }
  arr(parent: Record<string, unknown>, key: string, path: string): unknown[] | null {
    const v = parent[key];
    if (!Array.isArray(v)) {
      this.err(`${path}.${key} is missing or is not a list.`);
      return null;
    }
    return v;
  }
  uniqueIds(items: unknown[], path: string) {
    const seen = new Set<string>();
    items.forEach((it, i) => {
      if (!isObj(it)) return;
      const id = it.id;
      if (!isStr(id) || !id.trim()) {
        this.err(`${path}[${i}].id is required.`);
        return;
      }
      if (!/^[A-Za-z0-9._-]+$/.test(id)) this.err(`${path}[${i}].id "${id}" may only contain letters, numbers, dots, dashes and underscores.`);
      if (seen.has(id)) this.err(`${path} contains a duplicate id "${id}".`);
      seen.add(id);
    });
  }
}

/**
 * Validates an unknown value (parsed JSON or LocalStorage contents) against the
 * AppConfig structure. Never throws.
 */
export function validateConfig(input: unknown): ValidationResult {
  const c = new Collector();

  if (!isObj(input)) {
    return { ok: false, errors: ['The configuration must be a JSON object.'], warnings: [] };
  }

  // ── meta / version ──
  const meta = c.obj(input, 'meta', 'config');
  if (meta) {
    const version = meta.version;
    if (!isNum(version)) {
      c.err('config.meta.version is missing – this does not look like a Solluz Synergy configuration file.');
    } else if (version > CONFIG_SCHEMA_VERSION) {
      c.err(
        `This configuration uses schema version ${version}, but this website only supports version ${CONFIG_SCHEMA_VERSION}. Update the website before importing it.`,
      );
    } else if (version < CONFIG_SCHEMA_VERSION) {
      c.err(`This configuration uses an outdated schema version (${version}). Expected version ${CONFIG_SCHEMA_VERSION}.`);
    }
    c.str(meta, 'revision', 'config.meta');
    c.str(meta, 'label', 'config.meta');
  }
  if (input.currency !== 'NGN') c.err('config.currency must be "NGN".');

  // Abort early on a wrong version – further errors would just be noise.
  if (c.errors.length) return { ok: false, errors: c.errors, warnings: c.warnings };

  // ── company ──
  const company = c.obj(input, 'company', 'config');
  if (company) {
    ['name', 'tagline', 'email', 'phone', 'whatsapp', 'address', 'businessHours'].forEach((k) => c.str(company, k, 'company'));
    if (isStr(company.email) && company.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)) {
      c.err('company.email is not a valid email address.');
    }
    const social = c.obj(company, 'social', 'company');
    if (social) ['facebook', 'instagram', 'x', 'linkedin'].forEach((k) => c.str(social, k, 'company.social'));
  }

  // ── content ──
  const content = c.obj(input, 'content', 'config');
  if (content) {
    const hero = c.obj(content, 'hero', 'content');
    if (hero) ['headline', 'subheadline', 'badge'].forEach((k) => c.str(hero, k, 'content.hero'));
    const intro = c.obj(content, 'intro', 'content');
    if (intro) ['title', 'body'].forEach((k) => c.str(intro, k, 'content.intro'));
    const about = c.obj(content, 'about', 'content');
    if (about) {
      ['overview', 'mission', 'vision'].forEach((k) => c.str(about, k, 'content.about'));
      c.arr(about, 'values', 'content.about');
      c.arr(about, 'capabilities', 'content.about');
    }
    c.arr(content, 'whyChooseUs', 'content');
    const services = c.arr(content, 'services', 'content');
    if (services) c.uniqueIds(services, 'content.services');
    const projects = c.arr(content, 'projects', 'content');
    if (projects) {
      c.uniqueIds(projects, 'content.projects');
      projects.forEach((p, i) => {
        if (!isObj(p)) return c.err(`content.projects[${i}] must be an object.`);
        ['title', 'description', 'location', 'category', 'completionDate', 'systemSize'].forEach((k) =>
          c.str(p, k, `content.projects[${i}]`),
        );
        if (!Array.isArray(p.images) || !p.images.every(isStr)) c.err(`content.projects[${i}].images must be a list of image URLs.`);
      });
    }
    const testimonials = c.arr(content, 'testimonials', 'content');
    if (testimonials) c.uniqueIds(testimonials, 'content.testimonials');
  }

  // ── appliances ──
  const categories = c.arr(input, 'applianceCategories', 'config');
  if (categories && !categories.every(isStr)) c.err('config.applianceCategories must be a list of text values.');
  const appliances = c.arr(input, 'appliances', 'config');
  if (appliances) {
    c.uniqueIds(appliances, 'appliances');
    appliances.forEach((a, i) => {
      if (!isObj(a)) return c.err(`appliances[${i}] must be an object.`);
      const p = `Appliance "${isStr(a.name) && a.name ? a.name : `#${i + 1}`}"`;
      c.str(a, 'name', p, { nonEmpty: true });
      c.str(a, 'category', p);
      c.num(a, 'defaultWattage', p, { min: 0, max: 1_000_000 });
      c.num(a, 'defaultHours', p, { min: 0, max: 24 });
      c.num(a, 'surgeFactor', p, { min: 1, max: 10 });
      c.bool(a, 'isActive', p);
      if (categories && isStr(a.category) && !categories.includes(a.category)) {
        c.warnings.push(`Appliance "${String(a.name)}" uses category "${a.category}", which is not in the category list.`);
      }
    });
  }

  // ── products ──
  const products = c.arr(input, 'products', 'config');
  if (products) {
    c.uniqueIds(products, 'products');
    products.forEach((pr, i) => {
      if (!isObj(pr)) return c.err(`products[${i}] must be an object.`);
      const p = `Product "${isStr(pr.name) && pr.name ? pr.name : `#${i + 1}`}"`;
      if (!PRODUCT_CATEGORIES.includes(pr.category as ProductCategory)) {
        return c.err(`${p}.category "${String(pr.category)}" is not a valid equipment category.`);
      }
      c.str(pr, 'name', p, { nonEmpty: true });
      c.str(pr, 'brand', p);
      c.str(pr, 'model', p);
      c.str(pr, 'description', p);
      c.num(pr, 'unitPrice', p, { min: 0 });
      c.bool(pr, 'isActive', p);
      if (!Array.isArray(pr.specifications) || !pr.specifications.every((s) => isObj(s) && isStr(s.label) && isStr(s.value))) {
        c.err(`${p}.specifications must be a list of { label, value } entries.`);
      }
      const cat = pr.category as ProductCategory;
      if (cat === 'solar-panel' || cat === 'inverter' || cat === 'battery' || cat === 'charge-controller') {
        c.num(pr, 'capacity', p, { min: 0.0001 });
      }
      if (cat === 'inverter') {
        if (!Array.isArray(pr.supportedSystemTypes) || !pr.supportedSystemTypes.length || !pr.supportedSystemTypes.every((t) => SYSTEM_TYPES.includes(t as string))) {
          c.err(`${p}.supportedSystemTypes must list at least one of: ${SYSTEM_TYPES.join(', ')}.`);
        }
        c.num(pr, 'systemVoltage', p, { min: 0, required: false });
        c.num(pr, 'surgeRatio', p, { min: 1, max: 10, required: false });
        c.bool(pr, 'hasBuiltInMppt', p, { required: false });
        c.num(pr, 'maxPvInputW', p, { min: 0, required: false });
        c.bool(pr, 'parallelCapable', p, { required: false });
      }
      if (cat === 'battery') {
        if (!CHEMISTRIES.includes(pr.chemistry as string)) c.err(`${p}.chemistry must be one of: ${CHEMISTRIES.join(', ')}.`);
        c.num(pr, 'systemVoltage', p, { min: 1 });
      }
      if (cat === 'charge-controller') {
        if (!Array.isArray(pr.supportedVoltages) || !pr.supportedVoltages.length || !pr.supportedVoltages.every((v) => isNum(v) && v > 0)) {
          c.err(`${p}.supportedVoltages must be a list of battery voltages, e.g. [12, 24, 48].`);
        }
      }
      if (cat === 'mounting' || cat === 'cabling' || cat === 'protection' || cat === 'accessory') {
        if (!BASES.includes(pr.quantityBasis as string)) c.err(`${p}.quantityBasis must be one of: ${BASES.join(', ')}.`);
        c.num(pr, 'quantityPerBasis', p, { min: 0 });
        c.bool(pr, 'isOptional', p, { required: false });
        c.bool(pr, 'defaultSelected', p, { required: false });
      }
    });
    PRODUCT_CATEGORIES.slice(0, 3).forEach((cat) => {
      if (!products.some((pr) => isObj(pr) && pr.category === cat && pr.isActive === true)) {
        c.warnings.push(`There are no active products in the "${cat}" category – the calculator cannot recommend one.`);
      }
    });
  }

  // ── pricing ──
  const pricing = c.obj(input, 'pricing', 'config');
  if (pricing) {
    c.num(pricing, 'markupPercent', 'pricing', { min: -100, max: 1000 });
    const inst = c.obj(pricing, 'installation', 'pricing');
    if (inst) {
      c.str(inst, 'label', 'pricing.installation');
      c.num(inst, 'baseFee', 'pricing.installation', { min: 0 });
      c.num(inst, 'perKwpFee', 'pricing.installation', { min: 0 });
      c.bool(inst, 'isActive', 'pricing.installation');
    }
    const del = c.obj(pricing, 'delivery', 'pricing');
    if (del) {
      c.str(del, 'label', 'pricing.delivery');
      c.num(del, 'fee', 'pricing.delivery', { min: 0 });
      c.bool(del, 'isActive', 'pricing.delivery');
    }
    const charges = c.arr(pricing, 'additionalCharges', 'pricing');
    charges?.forEach((ch, i) => {
      const p = `pricing.additionalCharges[${i}]`;
      if (!isObj(ch)) return c.err(`${p} must be an object.`);
      c.str(ch, 'name', p, { nonEmpty: true });
      if (ch.type !== 'fixed' && ch.type !== 'percent') c.err(`${p}.type must be "fixed" or "percent".`);
      c.num(ch, 'amount', p, { min: 0 });
      c.bool(ch, 'isActive', p);
    });
    if (charges) c.uniqueIds(charges, 'pricing.additionalCharges');
    const services = c.arr(pricing, 'optionalServices', 'pricing');
    services?.forEach((s, i) => {
      const p = `pricing.optionalServices[${i}]`;
      if (!isObj(s)) return c.err(`${p} must be an object.`);
      c.str(s, 'name', p, { nonEmpty: true });
      c.str(s, 'description', p);
      c.num(s, 'price', p, { min: 0 });
      c.bool(s, 'isActive', p);
    });
    if (services) c.uniqueIds(services, 'pricing.optionalServices');
    const discounts = c.arr(pricing, 'discounts', 'pricing');
    discounts?.forEach((d, i) => {
      const p = `pricing.discounts[${i}]`;
      if (!isObj(d)) return c.err(`${p} must be an object.`);
      c.str(d, 'label', p, { nonEmpty: true });
      if (d.type !== 'fixed' && d.type !== 'percent') c.err(`${p}.type must be "fixed" or "percent".`);
      c.num(d, 'value', p, { min: 0, max: d.type === 'percent' ? 100 : Infinity });
      c.num(d, 'minSubtotal', p, { min: 0 });
      c.bool(d, 'isActive', p);
    });
    if (discounts) c.uniqueIds(discounts, 'pricing.discounts');
    const tax = c.obj(pricing, 'tax', 'pricing');
    if (tax) {
      c.str(tax, 'label', 'pricing.tax');
      c.num(tax, 'ratePercent', 'pricing.tax', { min: 0, max: 100 });
      c.bool(tax, 'isActive', 'pricing.tax');
    }
  }

  // ── calculator ──
  const calc = c.obj(input, 'calculator', 'config');
  if (calc) {
    const p = 'calculator';
    c.num(calc, 'inverterEfficiency', p, { min: 0.5, max: 1 });
    c.num(calc, 'batteryEfficiency', p, { min: 0.5, max: 1 });
    const dod = c.obj(calc, 'depthOfDischarge', p);
    if (dod) CHEMISTRIES.forEach((k) => c.num(dod, k, `${p}.depthOfDischarge`, { min: 0.1, max: 1 }));
    c.num(calc, 'peakSunHours', p, { min: 1, max: 12 });
    c.num(calc, 'systemDeratingFactor', p, { min: 0.3, max: 1 });
    c.num(calc, 'inverterSafetyMargin', p, { min: 0, max: 2 });
    c.num(calc, 'powerFactor', p, { min: 0.5, max: 1 });
    c.num(calc, 'defaultInverterSurgeRatio', p, { min: 1, max: 10 });
    c.num(calc, 'diversityFactor', p, { min: 0.1, max: 1 });
    c.num(calc, 'solarCoverage', p, { min: 0.1, max: 2 });
    c.num(calc, 'chargeControllerSafetyFactor', p, { min: 1, max: 3 });
    c.num(calc, 'defaultSystemVoltage', p, { min: 12, max: 1000 });
    c.num(calc, 'defaultBackupHours', p, { min: 0, max: 168 });
    c.num(calc, 'maxBackupHours', p, { min: 1, max: 168 });
    c.num(calc, 'maxParallelInverters', p, { min: 1, max: 20 });
    if (!SYSTEM_TYPES.includes(calc.recommendedSystemType as string)) {
      c.err(`${p}.recommendedSystemType must be one of: ${SYSTEM_TYPES.join(', ')}.`);
    }
    if (!CHEMISTRIES.includes(calc.preferredBatteryChemistry as string)) {
      c.err(`${p}.preferredBatteryChemistry must be one of: ${CHEMISTRIES.join(', ')}.`);
    }
  }

  if (c.errors.length) return { ok: false, errors: c.errors, warnings: c.warnings };
  return { ok: true, config: input as unknown as AppConfig, warnings: c.warnings };
}

/** Parses JSON text and validates it. */
export function parseAndValidateConfig(text: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, errors: [`The file is not valid JSON: ${(e as Error).message}`], warnings: [] };
  }
  return validateConfig(parsed);
}
