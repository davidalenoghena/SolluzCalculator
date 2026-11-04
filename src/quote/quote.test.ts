import { describe, expect, it } from 'vitest';
import { getDefaultConfig } from '../config';
import { EMPTY_SELECTION, designSystem } from '../calculator/equipmentRecommendations';
import { sizeSystem } from '../calculator/systemSizing';
import { priceDesign } from '../pricing/pricingEngine';
import type { Requirements, SelectedAppliance } from '../types';
import { MAILTO_SAFE_LENGTH, buildMailtoUrl, buildQuoteEmail, buildQuoteText, validateCustomer, type CustomerDetails } from './quoteDocument';

const cfg = getDefaultConfig();
const mk = (name: string, wattage: number, quantity: number, hours: number): SelectedAppliance => ({
  uid: name,
  applianceId: null,
  name,
  wattage,
  quantity,
  hours,
  surgeFactor: 1,
  isCustom: false,
});
const requirements: Requirements = { state: 'Lagos', city: 'Lekki', systemType: 'hybrid', backupHours: 8, allSimultaneous: false, comments: 'Roof faces south' };
const customer: CustomerDetails = { fullName: 'Ada Obi', email: 'ada@example.com', phone: '+234 803 123 4567', location: 'Lekki, Lagos', comments: 'Call after 5pm & weekends' };

function ctxFor(appliances: SelectedAppliance[]) {
  const sizing = sizeSystem(appliances, requirements, cfg.calculator);
  const design = designSystem(sizing, EMPTY_SELECTION, cfg);
  const breakdown = priceDesign(design, cfg.pricing, ['maintenance-1yr']);
  return { appliances, requirements, sizing, design, breakdown, config: cfg, generatedAt: new Date('2026-11-04T10:00:00Z') };
}

describe('quote email', () => {
  const appliances = [mk('Refrigerator', 200, 1, 10), mk('Television', 100, 2, 5)];
  const ctx = ctxFor(appliances);

  it('validates customer details', () => {
    expect(validateCustomer(customer)).toEqual({});
    const e = validateCustomer({ fullName: '', email: 'bad', phone: '12', location: '', comments: '' });
    expect(Object.keys(e).sort()).toEqual(['email', 'fullName', 'location', 'phone']);
  });

  it('generates the subject and addresses the company email', () => {
    const email = buildQuoteEmail(ctx, customer);
    expect(email.subject).toBe('Solar Installation Quotation Request – Ada Obi');
    expect(email.to).toBe(cfg.company.email);
    expect(email.mailtoUrl.startsWith(`mailto:${cfg.company.email}?subject=`)).toBe(true);
  });

  it('includes customer details, appliances, recommendations and the full price breakdown', () => {
    const body = buildQuoteText(ctx, customer);
    for (const s of ['Ada Obi', 'ada@example.com', '+234 803 123 4567', 'Lekki, Lagos']) expect(body).toContain(s);
    expect(body).toContain('Refrigerator – 200 W x 1, 10 h/day = 2 kWh/day');
    expect(body).toContain('Television – 100 W x 2, 5 h/day = 1 kWh/day');
    expect(body).toContain('Daily energy consumption: 3 kWh');
    expect(body).toContain('Estimated peak (simultaneous) load');
    expect(body).toContain('Requested backup duration: 8 h');
    expect(body).toContain(`Inverter: 1 x ${ctx.design.inverter.selected!.product.name}`);
    for (const l of ctx.breakdown.equipmentLines) expect(body).toContain(l.label);
    expect(body).toContain('1-year maintenance plan');
    expect(body).toMatch(/ESTIMATED TOTAL: NGN [\d,]+/);
    expect(body).toContain('Roof faces south');
    expect(body).toContain('Call after 5pm & weekends');
  });

  it('percent-encodes the mailto URL with CRLF line breaks', () => {
    const url = buildMailtoUrl('info@solluz.example', 'A & B?', 'line1\nline2 = 50%');
    expect(url).toBe('mailto:info@solluz.example?subject=A%20%26%20B%3F&body=line1%0D%0Aline2%20%3D%2050%25');
    const email = buildQuoteEmail(ctx, customer);
    const body = decodeURIComponent(email.mailtoUrl.split('&body=')[1]);
    expect(body.replace(/\r\n/g, '\n')).toBe(email.mailtoBody);
    expect(email.mailtoUrl).not.toMatch(/\s/); // no raw whitespace/newlines survive encoding
    expect(email.mailtoUrl.match(/&/g)?.length).toBe(1); // only the subject/body separator
  });

  it('shortens the mailto body for very long requests but keeps the full text', () => {
    const many = Array.from({ length: 80 }, (_, i) => mk(`Custom appliance number ${i}`, 100 + i, 1, 4));
    const email = buildQuoteEmail(ctxFor(many), customer);
    expect(email.shortened).toBe(true);
    expect(email.fullBody.length).toBeGreaterThan(email.mailtoBody.length);
    expect(email.mailtoBody).toContain('ESTIMATED TOTAL');
    expect(email.fullBody).toContain('Custom appliance number 79');
    expect(MAILTO_SAFE_LENGTH).toBeGreaterThan(0);
  });

  it('builds a downloadable summary without customer details', () => {
    const summary = buildQuoteText(ctx, null);
    expect(summary).toContain('SOLAR ESTIMATE SUMMARY');
    expect(summary).not.toContain('CUSTOMER DETAILS');
    expect(summary).toContain('preliminary');
  });
});
