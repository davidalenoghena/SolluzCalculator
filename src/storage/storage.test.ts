import { beforeEach, describe, expect, it } from 'vitest';
import { CONFIG_SCHEMA_VERSION, CONFIG_STORAGE_KEY, getDefaultConfig } from '../config';
import { parseAndValidateConfig, validateConfig } from './configValidation';
import { clearSavedConfig, hasSavedConfig, loadConfig, saveConfigToStorage, serializeConfigForExport } from './localStorage';

class MemoryStorage implements Storage {
  private m = new Map<string, string>();
  get length() {
    return this.m.size;
  }
  clear() {
    this.m.clear();
  }
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v));
  }
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage = new MemoryStorage();
});

describe('config validation', () => {
  it('accepts the bundled default configuration', () => {
    const r = validateConfig(getDefaultConfig());
    expect(r.ok ? [] : r.errors).toEqual([]);
  });

  it('rejects invalid JSON', () => {
    const r = parseAndValidateConfig('{ not json');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/not valid JSON/);
  });

  it('rejects incompatible (newer) versions', () => {
    const c = getDefaultConfig();
    c.meta.version = CONFIG_SCHEMA_VERSION + 1;
    const r = validateConfig(c);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors[0]).toMatch(/only supports version/);
  });

  it('rejects files that are not Solluz configurations', () => {
    expect(validateConfig({ hello: 'world' }).ok).toBe(false);
    expect(validateConfig([]).ok).toBe(false);
  });

  it('detects duplicate product ids and bad fields', () => {
    const c = getDefaultConfig();
    c.products.push({ ...c.products[0] });
    (c.appliances[0] as unknown as Record<string, unknown>).defaultWattage = 'ten';
    const r = validateConfig(c);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.includes('duplicate id'))).toBe(true);
      expect(r.errors.some((e) => e.includes('defaultWattage'))).toBe(true);
    }
  });
});

describe('LocalStorage persistence', () => {
  it('uses defaults when nothing is saved', () => {
    const r = loadConfig();
    expect(r.source).toBe('default');
    expect(r.error).toBeUndefined();
  });

  it('saves and reloads a configuration (survives a "refresh")', () => {
    const c = getDefaultConfig();
    c.appliances[0].defaultWattage = 12;
    c.products[0].unitPrice = 999;
    c.calculator.peakSunHours = 5.2;
    saveConfigToStorage(c);
    expect(hasSavedConfig()).toBe(true);
    const r = loadConfig();
    expect(r.source).toBe('saved');
    expect(r.config.appliances[0].defaultWattage).toBe(12);
    expect(r.config.products[0].unitPrice).toBe(999);
    expect(r.config.calculator.peakSunHours).toBe(5.2);
  });

  it('refuses to save an invalid configuration and keeps the previous one', () => {
    const good = getDefaultConfig();
    good.products[0].unitPrice = 111;
    saveConfigToStorage(good);
    const bad = getDefaultConfig();
    bad.products[0].unitPrice = -5;
    expect(() => saveConfigToStorage(bad)).toThrow();
    expect(loadConfig().config.products[0].unitPrice).toBe(111);
  });

  it('falls back to defaults on corrupted data without deleting it', () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, '{broken');
    const r = loadConfig();
    expect(r.source).toBe('default');
    expect(r.error?.raw).toBe('{broken');
    expect(localStorage.getItem(CONFIG_STORAGE_KEY)).toBe('{broken');
  });

  it('falls back to defaults on structurally invalid data', () => {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ meta: { version: 1 } }));
    const r = loadConfig();
    expect(r.source).toBe('default');
    expect(r.error?.details.length).toBeGreaterThan(0);
  });

  it('restores defaults', () => {
    saveConfigToStorage(getDefaultConfig());
    clearSavedConfig();
    expect(hasSavedConfig()).toBe(false);
    expect(loadConfig().source).toBe('default');
  });
});

describe('export / import', () => {
  it('exports valid JSON that round-trips through import validation', () => {
    const c = getDefaultConfig();
    c.products[0].unitPrice = 123456;
    const text = serializeConfigForExport(c, new Date('2026-11-04T10:00:00Z'));
    const parsed = JSON.parse(text);
    expect(parsed.meta.exportedAt).toBe('2026-11-04T10:00:00.000Z');
    const r = parseAndValidateConfig(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.config.products[0].unitPrice).toBe(123456);
  });

  it('never contains PIN or secret fields', () => {
    const text = serializeConfigForExport(getDefaultConfig()).toLowerCase();
    expect(text).not.toMatch(/"(pin|password|secret|pinhash)"/);
  });

  it('preserves the current configuration when an import fails', () => {
    const current = getDefaultConfig();
    current.products[0].unitPrice = 777;
    saveConfigToStorage(current);
    const r = parseAndValidateConfig('{"meta":{"version":99}}');
    expect(r.ok).toBe(false);
    // caller only saves on success – stored config is unchanged
    expect(loadConfig().config.products[0].unitPrice).toBe(777);
  });
});
