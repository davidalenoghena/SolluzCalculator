// Centralised number/currency formatting. All customer-facing prices are Naira (₦).

const nairaFormatter = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0, minimumFractionDigits: 0 });

/** Formats a value as Nigerian Naira, e.g. 1250000 → "₦1,250,000". */
export function formatNaira(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  const abs = nairaFormatter.format(Math.abs(n));
  return n < 0 ? `-₦${abs}` : `₦${abs}`;
}

/** Plain-text variant for email bodies (uses "NGN" prefix to avoid encoding issues in some mail clients). */
export function formatNairaPlain(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `${n < 0 ? '-' : ''}NGN ${nairaFormatter.format(Math.abs(n))}`;
}

const num = (v: number, digits = 0) =>
  new Intl.NumberFormat('en-NG', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0);

export const formatNumber = num;
export const formatWatts = (w: number) => (w >= 10_000 ? `${num(w / 1000, 1)} kW` : `${num(w)} W`);
export const formatKw = (w: number) => `${num(w / 1000, 2)} kW`;
export const formatKwp = (w: number) => `${num(w / 1000, 2)} kWp`;
export const formatKwh = (wh: number) => `${num(wh / 1000, 2)} kWh`;
export const formatVA = (va: number) => (va >= 1000 ? `${num(va / 1000, 1)} kVA` : `${num(va)} VA`);
export const formatHours = (h: number) => `${num(h, 2)} h`;
export const formatPercent = (fraction: number, digits = 0) => `${num(fraction * 100, digits)}%`;
