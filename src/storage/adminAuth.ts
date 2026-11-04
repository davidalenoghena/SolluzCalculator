// ─────────────────────────────────────────────────────────────────────────────
// Basic admin PIN gate.
//
// IMPORTANT: This is NOT real authentication. Everything runs in the visitor's
// browser – anyone can read the JavaScript bundle, edit LocalStorage or bypass
// this screen with developer tools. It only stops casual visitors from
// stumbling into the admin panel. Never put secrets in the configuration.
//
// The PIN is never stored in the exported configuration. A PIN changed in the
// admin panel is stored as a hash under its own LocalStorage key.
// ─────────────────────────────────────────────────────────────────────────────

const PIN_HASH_KEY = 'solluz_synergy_admin_pin_hash';
const SESSION_KEY = 'solluz_synergy_admin_session';

/** Build-time default PIN. Override with VITE_ADMIN_PIN in a .env file. */
export const DEFAULT_ADMIN_PIN: string = import.meta.env.VITE_ADMIN_PIN || 'solluz2026';

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`solluz::${pin}`);
  if (globalThis.crypto?.subtle) {
    const buf = await globalThis.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for insecure contexts (plain http) where SubtleCrypto is unavailable.
  let h = 5381;
  for (const b of data) h = ((h << 5) + h + b) >>> 0;
  return `djb2-${h.toString(16)}`;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_HASH_KEY);
  if (stored) return (await hashPin(pin)) === stored;
  return pin === DEFAULT_ADMIN_PIN;
}

export async function changePin(newPin: string): Promise<void> {
  if (newPin.length < 4) throw new Error('PIN must be at least 4 characters.');
  localStorage.setItem(PIN_HASH_KEY, await hashPin(newPin));
}

export function resetPinToDefault() {
  localStorage.removeItem(PIN_HASH_KEY);
}

export function hasCustomPin() {
  return localStorage.getItem(PIN_HASH_KEY) !== null;
}

export function isAdminSessionActive(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1';
}

export function startAdminSession() {
  sessionStorage.setItem(SESSION_KEY, '1');
}

export function endAdminSession() {
  sessionStorage.removeItem(SESSION_KEY);
}
