import { SYSTEM_TYPES } from '../config';
import { applianceDailyWh } from '../calculator/energyCalculations';
import type { SystemDesign } from '../calculator/equipmentRecommendations';
import type { SizingResult } from '../calculator/systemSizing';
import { formatNairaPlain, formatNumber, formatVA } from '../pricing/currencyFormatter';
import type { PriceBreakdown } from '../pricing/pricingEngine';
import type { AppConfig, Requirements, SelectedAppliance } from '../types';

export interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  comments: string;
}

export interface QuoteContext {
  appliances: SelectedAppliance[];
  requirements: Requirements;
  sizing: SizingResult;
  design: SystemDesign;
  breakdown: PriceBreakdown;
  config: AppConfig;
  generatedAt?: Date;
}

/**
 * Upper bound for the mailto URL before falling back to a compact body. Modern handlers (Gmail web,
 * new Outlook, Apple Mail, Thunderbird) accept long URLs; some legacy desktop clients truncate around
 * 2,000 characters, which is why the UI always offers "Copy full text" and "Download summary" too.
 */
export const MAILTO_SAFE_LENGTH = 8000;

export const DISCLAIMER =
  'This is a preliminary, automatically generated estimate – not a certified engineering design or a binding quotation. ' +
  'Final equipment selection and pricing are subject to a professional site assessment and confirmation by Solluz Synergy.';

// ── Validation ──────────────────────────────────────────────────────────────

export type CustomerErrors = Partial<Record<keyof CustomerDetails, string>>;

export function validateCustomer(c: CustomerDetails): CustomerErrors {
  const e: CustomerErrors = {};
  if (c.fullName.trim().length < 2) e.fullName = 'Please enter your full name.';
  else if (c.fullName.length > 100) e.fullName = 'Name is too long.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = 'Please enter a valid email address.';
  const digits = c.phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15 || !/^[+\d\s()-]+$/.test(c.phone.trim())) e.phone = 'Please enter a valid phone number, e.g. +234 803 000 0000.';
  if (c.location.trim().length < 2) e.location = 'Please enter the installation location.';
  if (c.comments.length > 1500) e.comments = 'Comments must be 1,500 characters or less.';
  return e;
}

// ── Text builders ───────────────────────────────────────────────────────────

const kwh = (wh: number) => `${formatNumber(wh / 1000, 2)} kWh`;
const w = (n: number) => `${formatNumber(n)} W`;
const systemLabel = (t: string) => SYSTEM_TYPES.find((s) => s.id === t)?.label ?? t;
const sanitize = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

function systemLines(ctx: QuoteContext, compact: boolean): string[] {
  const { design, sizing } = ctx;
  const out: string[] = [];
  out.push(`System type: ${systemLabel(sizing.systemType)}${sizing.systemTypeAutoSelected ? ' (recommended)' : ''}`);
  const inv = design.inverter.selected;
  if (inv) out.push(`Inverter: ${inv.quantity} x ${inv.product.name} (total ${formatVA(design.summary.inverterTotalVA)})`);
  out.push(`Required inverter capacity: ${formatVA(sizing.inverter.requiredVA)}`);
  if (design.battery.required) {
    const b = design.battery.selected;
    out.push(`Required battery capacity: ${kwh(design.summary.batteryRequiredWh || sizing.batteryWhByChemistry.lithium)}`);
    if (b) out.push(`Batteries: ${b.quantity} x ${b.product.name} (${kwh(design.summary.batteryBankWh)} bank at ${design.summary.systemVoltage}V)`);
  }
  out.push(`Required solar capacity: ${formatNumber(sizing.requiredPvW / 1000, 2)} kWp`);
  const p = design.panel.selected;
  if (p) out.push(`Solar panels: ${p.quantity} x ${p.product.name} (${formatNumber(design.summary.arrayW / 1000, 2)} kWp)`);
  const cc = design.chargeController.selected;
  if (design.chargeController.required && cc) out.push(`Charge controller: ${cc.quantity} x ${cc.product.name}`);
  if (!compact) for (const wn of design.warnings) out.push(`Note: ${wn}`);
  return out;
}

function priceLines(b: PriceBreakdown, compact: boolean): string[] {
  const out: string[] = [];
  const line = (label: string, q: number, unit: number, sub: number) =>
    compact
      ? `- ${label}: ${q} x ${formatNumber(unit)} = ${formatNumber(sub)}`
      : `- ${label}: ${q} x ${formatNairaPlain(unit)} = ${formatNairaPlain(sub)}`;
  for (const l of b.equipmentLines) out.push(line(l.label, l.quantity, l.unitPrice, l.subtotal));
  out.push(`Equipment subtotal: ${formatNairaPlain(b.equipmentSubtotal)}`);
  for (const l of b.serviceLines) out.push(line(l.label, l.quantity, l.unitPrice, l.subtotal));
  out.push(`Installation & services subtotal: ${formatNairaPlain(b.servicesSubtotal)}`);
  for (const d of b.discountLines) out.push(`Discount – ${d.label}: -${formatNairaPlain(d.amount)}`);
  if (b.taxLine) out.push(`${b.taxLine.label}: ${formatNairaPlain(b.taxLine.amount)}`);
  out.push(`ESTIMATED TOTAL: ${formatNairaPlain(b.total)}`);
  return out;
}

function applianceLines(list: SelectedAppliance[], compact: boolean): string[] {
  return list.map((a, i) =>
    compact
      ? `${i + 1}. ${sanitize(a.name)} ${a.wattage}W x${a.quantity} ${a.hours}h`
      : `${i + 1}. ${sanitize(a.name)}${a.isCustom ? ' (custom)' : ''} – ${w(a.wattage)} x ${a.quantity}, ${a.hours} h/day = ${kwh(applianceDailyWh(a))}/day`,
  );
}

/** Builds the plain-text quotation body. `customer` is optional for the downloadable summary. */
export function buildQuoteText(ctx: QuoteContext, customer: CustomerDetails | null, { compact = false } = {}): string {
  const { sizing, requirements, config } = ctx;
  const date = (ctx.generatedAt ?? new Date()).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
  const sections: string[][] = [];

  sections.push([
    customer ? 'SOLAR INSTALLATION QUOTATION REQUEST' : `${config.company.name.toUpperCase()} – SOLAR ESTIMATE SUMMARY`,
    `Generated: ${date}`,
  ]);

  if (customer) {
    sections.push([
      'CUSTOMER DETAILS',
      `Name: ${sanitize(customer.fullName)}`,
      `Email: ${sanitize(customer.email)}`,
      `Phone: ${sanitize(customer.phone)}`,
      `Installation location: ${sanitize(customer.location)}`,
    ]);
  } else {
    const loc = [requirements.city, requirements.state].map(sanitize).filter(Boolean).join(', ');
    if (loc) sections.push(['LOCATION', loc]);
  }

  sections.push(['SELECTED APPLIANCES', ...applianceLines(ctx.appliances, compact)]);

  sections.push([
    'ENERGY & LOAD',
    `Daily energy consumption: ${kwh(sizing.dailyEnergyWh)}`,
    `Total connected load: ${w(sizing.connectedLoadW)}`,
    `Estimated peak (simultaneous) load: ${w(sizing.simultaneousLoadW)}`,
    `Peak incl. start-up surge: ${w(sizing.surgeLoadW)}`,
    `All appliances at once: ${requirements.allSimultaneous ? 'Yes' : 'No'}`,
    `Requested backup duration: ${formatNumber(sizing.requestedBackupHours, 1)} h${
      sizing.backupHours !== sizing.requestedBackupHours ? ` (sized for ${formatNumber(sizing.backupHours, 1)} h)` : ''
    }`,
  ]);

  sections.push(['RECOMMENDED SYSTEM CONFIGURATION', ...systemLines(ctx, compact)]);
  sections.push([compact ? 'ITEMISED ESTIMATE (NGN)' : 'ITEMISED ESTIMATE', ...priceLines(ctx.breakdown, compact)]);

  const reqNotes = sanitize(requirements.comments || '');
  const custNotes = sanitize(customer?.comments || '');
  const commentLines = [
    reqNotes && `Requirements: ${reqNotes}`,
    custNotes && custNotes !== reqNotes && `Comments: ${custNotes}`,
  ].filter(Boolean) as string[];
  if (commentLines.length) sections.push(['ADDITIONAL COMMENTS', ...commentLines]);

  sections.push([compact ? 'Preliminary estimate only – subject to site assessment.' : DISCLAIMER]);
  return sections.map((s) => s.join('\n')).join('\n\n');
}

export function buildQuoteSubject(customerName: string): string {
  return `Solar Installation Quotation Request – ${sanitize(customerName)}`;
}

/** RFC 6068 mailto URL. Line breaks are normalised to CRLF and every component is percent-encoded. */
export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));
  const addr = encodeURIComponent(to.trim()).replace(/%40/g, '@');
  return `mailto:${addr}?subject=${enc(subject)}&body=${enc(body)}`;
}

export interface QuoteEmail {
  to: string;
  subject: string;
  /** Full plain-text body (use for copy-to-clipboard and downloads). */
  fullBody: string;
  /** Body actually placed in the mailto URL. */
  mailtoBody: string;
  mailtoUrl: string;
  /** True when the mailto body had to be shortened to fit URL limits. */
  shortened: boolean;
}

export function buildQuoteEmail(ctx: QuoteContext, customer: CustomerDetails): QuoteEmail {
  const to = ctx.config.company.email;
  const subject = buildQuoteSubject(customer.fullName);
  const fullBody = buildQuoteText(ctx, customer);
  let mailtoBody = fullBody;
  let url = buildMailtoUrl(to, subject, mailtoBody);
  let shortened = false;
  if (url.length > MAILTO_SAFE_LENGTH) {
    mailtoBody = buildQuoteText(ctx, customer, { compact: true });
    url = buildMailtoUrl(to, subject, mailtoBody);
    shortened = true;
  }
  return { to, subject, fullBody, mailtoBody, mailtoUrl: url, shortened };
}
