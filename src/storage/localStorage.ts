import { CONFIG_STORAGE_KEY, getDefaultConfig } from '../config';
import type { AppConfig } from '../types';
import { validateConfig } from './configValidation';

export type ConfigSource = 'default' | 'saved';

export interface LoadedConfig {
  config: AppConfig;
  source: ConfigSource;
  /** Present when a saved configuration exists but could not be used. */
  error?: { message: string; details: string[]; raw: string };
}

function storage(): Storage | null {
  try {
    return typeof globalThis.localStorage !== 'undefined' ? globalThis.localStorage : null;
  } catch {
    // Access can throw in some privacy modes.
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const s = storage();
  if (!s) return false;
  try {
    const k = '__solluz_probe__';
    s.setItem(k, '1');
    s.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

/**
 * Startup loading sequence:
 *  1. load default config
 *  2. look for an admin-saved config in LocalStorage
 *  3. use it when valid
 *  4. otherwise fall back to defaults (and report why, without deleting the saved data)
 */
export function loadConfig(): LoadedConfig {
  const defaults = getDefaultConfig();
  const s = storage();
  if (!s) return { config: defaults, source: 'default' };

  let raw: string | null = null;
  try {
    raw = s.getItem(CONFIG_STORAGE_KEY);
  } catch {
    return { config: defaults, source: 'default' };
  }
  if (raw === null) return { config: defaults, source: 'default' };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      config: defaults,
      source: 'default',
      error: { message: 'The saved configuration in this browser is corrupted (not valid JSON).', details: [], raw },
    };
  }
  const result = validateConfig(parsed);
  if (!result.ok) {
    return {
      config: defaults,
      source: 'default',
      error: { message: 'The saved configuration in this browser failed validation.', details: result.errors, raw },
    };
  }
  return { config: result.config, source: 'saved' };
}

/** Validates then writes the configuration. Throws with a readable message on failure. */
export function saveConfigToStorage(config: AppConfig): void {
  const result = validateConfig(config);
  if (!result.ok) throw new Error(`Configuration is invalid:\n• ${result.errors.join('\n• ')}`);
  const s = storage();
  if (!s) throw new Error('LocalStorage is not available in this browser, so changes cannot be saved.');
  const clean: AppConfig = { ...config, meta: { ...config.meta } };
  delete clean.meta.exportedAt;
  try {
    s.setItem(CONFIG_STORAGE_KEY, JSON.stringify(clean));
  } catch (e) {
    throw new Error(`Could not save to LocalStorage: ${(e as Error).message}`);
  }
}

export function clearSavedConfig(): void {
  try {
    storage()?.removeItem(CONFIG_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasSavedConfig(): boolean {
  try {
    return storage()?.getItem(CONFIG_STORAGE_KEY) != null;
  } catch {
    return false;
  }
}

/** Serialises a configuration for export. Contains no PINs or secrets – those are never part of AppConfig. */
export function serializeConfigForExport(config: AppConfig, now = new Date()): string {
  const out: AppConfig = { ...config, meta: { ...config.meta, exportedAt: now.toISOString() } };
  return JSON.stringify(out, null, 2);
}

/** Triggers a browser download of a text file. */
export function downloadTextFile(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
