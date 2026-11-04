import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CONFIG_STORAGE_KEY, getDefaultConfig } from '../config';
import { clearSavedConfig, loadConfig, saveConfigToStorage, type ConfigSource, type LoadedConfig } from '../storage/localStorage';
import type { AppConfig } from '../types';

interface ConfigContextValue {
  /** The active configuration used everywhere in the app. */
  config: AppConfig;
  source: ConfigSource;
  loadError: LoadedConfig['error'];
  /** Validates and persists to LocalStorage, then activates immediately. Throws on invalid config. */
  saveConfig: (next: AppConfig) => void;
  /** Removes the saved configuration and reverts to the bundled defaults. */
  restoreDefaults: () => void;
  dismissLoadError: () => void;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LoadedConfig>(() => loadConfig());

  // Keep other open tabs of the same browser in sync with admin saves.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CONFIG_STORAGE_KEY || e.key === null) setState(loadConfig());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const saveConfig = useCallback((next: AppConfig) => {
    saveConfigToStorage(next);
    setState({ config: structuredClone(next), source: 'saved' });
  }, []);

  const restoreDefaults = useCallback(() => {
    clearSavedConfig();
    setState({ config: getDefaultConfig(), source: 'default' });
  }, []);

  const dismissLoadError = useCallback(() => setState((s) => ({ ...s, error: undefined })), []);

  const value = useMemo<ConfigContextValue>(
    () => ({ config: state.config, source: state.source, loadError: state.error, saveConfig, restoreDefaults, dismissLoadError }),
    [state, saveConfig, restoreDefaults, dismissLoadError],
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig(): ConfigContextValue {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used inside <ConfigProvider>');
  return ctx;
}
