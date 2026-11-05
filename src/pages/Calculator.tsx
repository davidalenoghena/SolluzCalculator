import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Download, FileText, Mail, Pencil, Printer, RotateCcw, Wrench } from 'lucide-react';
import { ApplianceSelector } from '../components/ApplianceSelector';
import { CalculatorProgress, CALCULATOR_STEPS } from '../components/CalculatorProgress';
import { EquipmentSelector, OptionRow } from '../components/EquipmentSelector';
import { Logo } from '../components/Logo';
import { PriceBreakdownTable } from '../components/PriceBreakdown';
import { QuoteRequestModal } from '../components/QuoteRequestModal';
import { RequirementsForm, validateRequirements } from '../components/RequirementsForm';
import { SizingSummary } from '../components/SizingSummary';
import { Button } from '../components/ui/Button';
import { Alert, Card, CardBody, CardHeader } from '../components/ui/Card';
import { Checkbox } from '../components/ui/Form';
import { ConfirmDialog } from '../components/ui/Modal';
import { Container } from '../components/ui/Section';
import { applianceDailyWh, totalDailyEnergyWh, validateApplianceLine } from '../calculator/energyCalculations';
import { designSystem } from '../calculator/equipmentRecommendations';
import { defaultRequirements, defaultSelection, isApplianceList, isRequirements, isSelection } from '../calculator/session';
import { sizeSystem } from '../calculator/systemSizing';
import { SYSTEM_TYPES } from '../config';
import { useConfig } from '../context/ConfigContext';
import { CALC_SESSION_KEYS, useSessionState } from '../lib/useSessionState';
import { cn, telLink } from '../lib/utils';
import { formatHours, formatKwh, formatKwp, formatNaira, formatVA, formatWatts } from '../pricing/currencyFormatter';
import { customerUnitPrice, priceDesign } from '../pricing/pricingEngine';
import { buildQuoteText, DISCLAIMER } from '../quote/quoteDocument';
import { downloadTextFile } from '../storage/localStorage';
import type { EquipmentSelection, Product, SelectedAppliance } from '../types';

type SingleKey = 'inverterId' | 'batteryId' | 'panelId' | 'chargeControllerId' | 'mountingId' | 'cablingId' | 'protectionId';

export default function Calculator() {
  const { config } = useConfig();
  const [step, setStep] = useSessionState<number>(CALC_SESSION_KEYS.step, 0, (v): v is number => typeof v === 'number' && v >= 0 && v < CALCULATOR_STEPS.length);
  const [appliances, setAppliances] = useSessionState<SelectedAppliance[]>(CALC_SESSION_KEYS.appliances, [], isApplianceList);
  const [requirements, setRequirements] = useSessionState(CALC_SESSION_KEYS.requirements, () => defaultRequirements(config.calculator), isRequirements);
  const [selection, setSelection] = useSessionState<EquipmentSelection>(CALC_SESSION_KEYS.selection, defaultSelection, isSelection);
  const [maxReached, setMaxReached] = useState(step);
  const [showErrors, setShowErrors] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  // ── Derived calculations (always from the active configuration) ──
  const sizing = useMemo(() => sizeSystem(appliances, requirements, config.calculator), [appliances, requirements, config.calculator]);
  const design = useMemo(() => designSystem(sizing, selection, config), [sizing, selection, config]);
  const activeServiceIds = useMemo(
    () => selection.optionalServiceIds.filter((id) => config.pricing.optionalServices.some((s) => s.id === id && s.isActive)),
    [selection.optionalServiceIds, config.pricing.optionalServices],
  );
  const breakdown = useMemo(() => priceDesign(design, config.pricing, activeServiceIds), [design, config.pricing, activeServiceIds]);

  const totalWith = (patch: Partial<EquipmentSelection>) =>
    priceDesign(designSystem(sizing, { ...selection, ...patch }, config), config.pricing, patch.optionalServiceIds ?? activeServiceIds).total;
  const deltaFor = (key: SingleKey) => (id: string) => totalWith({ [key]: id }) - breakdown.total;
  const unitPrice = (p: Product) => customerUnitPrice(p, config.pricing);

  // ── Step validation ──
  const applianceErrors = appliances.some((a) => validateApplianceLine(a).length > 0);
  const energyOk = totalDailyEnergyWh(appliances) > 0;
  const step0Valid = appliances.length > 0 && !applianceErrors && energyOk;
  const reqErrors = validateRequirements(requirements, config.calculator);
  const step1Valid = Object.keys(reqErrors).length === 0;

  useEffect(() => setMaxReached((m) => Math.max(m, step)), [step]);
  // If earlier steps become invalid, don't let users jump past them.
  const reachable = !step0Valid ? 0 : !step1Valid ? 1 : Math.max(maxReached, step);
  // Restored session state (or a config change) may leave us past a now-invalid step.
  useEffect(() => {
    if (step > reachable) setStep(reachable);
  }, [step, reachable, setStep]);

  const goTo = (i: number) => {
    setShowErrors(false);
    setStep(i);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const next = () => {
    if ((step === 0 && !step0Valid) || (step === 1 && !step1Valid)) {
      setShowErrors(true);
      return;
    }
    goTo(Math.min(step + 1, CALCULATOR_STEPS.length - 1));
  };
  const back = () => goTo(Math.max(0, step - 1));

  const startOver = () => {
    setAppliances([]);
    setRequirements(defaultRequirements(config.calculator));
    setSelection(defaultSelection());
    setMaxReached(0);
    setConfirmReset(false);
    goTo(0);
  };

  const quoteContext = { appliances, requirements, sizing, design, breakdown, config };
  const location = [requirements.city, requirements.state].filter(Boolean).join(', ');

  const downloadSummary = () => {
    downloadTextFile(`solluz-solar-estimate-${new Date().toISOString().slice(0, 10)}.txt`, buildQuoteText({ ...quoteContext, generatedAt: new Date() }, null), 'text/plain');
  };

  const accessoryIds = design.accessories.selectedIds;
  const toggleAccessory = (id: string) =>
    setSelection((s) => ({ ...s, accessoryIds: accessoryIds.includes(id) ? accessoryIds.filter((x) => x !== id) : [...accessoryIds, id] }));
  const toggleService = (id: string) =>
    setSelection((s) => ({
      ...s,
      optionalServiceIds: s.optionalServiceIds.includes(id) ? s.optionalServiceIds.filter((x) => x !== id) : [...s.optionalServiceIds, id],
    }));

  const optionalServices = config.pricing.optionalServices.filter((s) => s.isActive);
  const systemLabel = SYSTEM_TYPES.find((t) => t.id === sizing.systemType)?.label ?? sizing.systemType;

  return (
    <div className="bg-slate-50 pt-18 pb-32 print:bg-white print:p-0">
      <div ref={topRef} className="scroll-mt-18" />
      <div className="border-b border-slate-200 bg-white print:hidden">
        <Container className="py-6 sm:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Solar Calculator</h1>
              <p className="mt-1 text-sm text-slate-500">Estimate your solar system size and cost in Naira. Takes about 3 minutes.</p>
            </div>
            {(appliances.length > 0 || step > 0) && (
              <Button variant="ghost" size="sm" onClick={() => setConfirmReset(true)} icon={<RotateCcw className="h-4 w-4" />}>
                Start over
              </Button>
            )}
          </div>
          <div className="mt-6">
            <CalculatorProgress step={step} maxReached={reachable} onStep={goTo} />
          </div>
        </Container>
      </div>

      <Container className="py-6 sm:py-8 print:py-0">
        {step === 0 && (
          <div className="space-y-4">
            <ApplianceSelector catalogue={config.appliances} categories={config.applianceCategories} selected={appliances} onChange={setAppliances} showErrors={showErrors} />
            {showErrors && appliances.length > 0 && !energyOk && !applianceErrors && (
              <Alert tone="error">Set the daily usage hours for at least one appliance so we can estimate your energy use.</Alert>
            )}
            {showErrors && applianceErrors && <Alert tone="error">Please fix the highlighted appliance values before continuing.</Alert>}
          </div>
        )}

        {step === 1 && <RequirementsForm value={requirements} onChange={setRequirements} settings={config.calculator} errors={showErrors ? reqErrors : {}} />}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-6">
              <Card>
                <CardHeader title="Your estimated solar requirements" description="Calculated from your appliances and requirements using our current sizing assumptions." />
                <CardBody>
                  <SizingSummary sizing={sizing} design={design} />
                </CardBody>
              </Card>

              {design.warnings.length > 0 && (
                <Alert tone="warning" title="Some requirements need attention">
                  <ul className="list-inside list-disc">
                    {design.warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              <Card>
                <CardHeader
                  title="Recommended equipment"
                  description="We’ve pre-selected the best-value compatible option in each category. Choose an alternative to see how it changes your total."
                  icon={<Wrench className="h-5 w-5" />}
                />
                <CardBody className="space-y-8">
                  <EquipmentSelector
                    design={design.inverter}
                    title="Inverter"
                    description={`Needs at least ${formatVA(sizing.inverter.continuousVA)} continuous and ${formatVA(sizing.inverter.surgeVA)} surge capacity for a ${systemLabel.toLowerCase()} system.`}
                    unitPrice={unitPrice}
                    deltaFor={deltaFor('inverterId')}
                    onSelect={(id) => setSelection((s) => ({ ...s, inverterId: id }))}
                  />
                  <EquipmentSelector
                    design={design.battery}
                    title="Batteries"
                    description={`Sized for ${formatHours(sizing.backupHours)} backup (${formatKwh(sizing.backupEnergyWh)} delivered to your appliances).`}
                    unitPrice={unitPrice}
                    deltaFor={deltaFor('batteryId')}
                    onSelect={(id) => setSelection((s) => ({ ...s, batteryId: id }))}
                  />
                  <EquipmentSelector
                    design={design.panel}
                    title="Solar panels"
                    description={`At least ${formatKwp(sizing.requiredPvW)} of panels, based on ${config.calculator.peakSunHours} peak sun hours.`}
                    unitPrice={unitPrice}
                    deltaFor={deltaFor('panelId')}
                    onSelect={(id) => setSelection((s) => ({ ...s, panelId: id }))}
                  />
                  <EquipmentSelector
                    design={design.chargeController}
                    title="Charge controller"
                    description={`Your inverter can’t take all the solar power directly, so a ${Math.ceil(design.summary.chargeControllerRequiredA)}A controller is required.`}
                    unitPrice={unitPrice}
                    deltaFor={deltaFor('chargeControllerId')}
                    onSelect={(id) => setSelection((s) => ({ ...s, chargeControllerId: id }))}
                  />
                  <EquipmentSelector design={design.mounting} unitPrice={unitPrice} deltaFor={deltaFor('mountingId')} onSelect={(id) => setSelection((s) => ({ ...s, mountingId: id }))} />
                  <EquipmentSelector design={design.cabling} unitPrice={unitPrice} deltaFor={deltaFor('cablingId')} onSelect={(id) => setSelection((s) => ({ ...s, cablingId: id }))} />
                  <EquipmentSelector design={design.protection} unitPrice={unitPrice} deltaFor={deltaFor('protectionId')} onSelect={(id) => setSelection((s) => ({ ...s, protectionId: id }))} />

                  {design.accessories.options.length > 0 && (
                    <section className="space-y-3">
                      <div>
                        <h3 className="text-base font-bold">Other accessories</h3>
                        <p className="text-sm text-slate-500">Optional extras – tick any you would like included.</p>
                      </div>
                      <ul className="space-y-2.5">
                        {design.accessories.options.map((o) => {
                          const on = accessoryIds.includes(o.product.id);
                          const nextIds = on ? accessoryIds.filter((x) => x !== o.product.id) : [...accessoryIds, o.product.id];
                          return (
                            <OptionRow
                              key={o.product.id}
                              multi
                              name="accessory"
                              option={o}
                              unitPrice={unitPrice(o.product)}
                              selected={on}
                              recommended={false}
                              delta={totalWith({ accessoryIds: nextIds }) - breakdown.total}
                              onSelect={() => toggleAccessory(o.product.id)}
                            />
                          );
                        })}
                      </ul>
                    </section>
                  )}
                </CardBody>
              </Card>

              {optionalServices.length > 0 && (
                <Card>
                  <CardHeader title="Optional services" description="Add-on services from our team." />
                  <CardBody className="space-y-3">
                    {optionalServices.map((s) => (
                      <div key={s.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 p-3.5">
                        <Checkbox checked={activeServiceIds.includes(s.id)} onChange={() => toggleService(s.id)} label={s.name} description={s.description} />
                        <span className="shrink-0 text-sm font-bold tabular-nums">{formatNaira(s.price)}</span>
                      </div>
                    ))}
                  </CardBody>
                </Card>
              )}
            </div>

            {/* Running estimate */}
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <Card>
                <CardHeader title="Running estimate" />
                <CardBody className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Equipment</span>
                    <span className="font-semibold tabular-nums">{formatNaira(breakdown.equipmentSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Installation & services</span>
                    <span className="font-semibold tabular-nums">{formatNaira(breakdown.servicesSubtotal)}</span>
                  </div>
                  {breakdown.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discounts</span>
                      <span className="font-semibold tabular-nums">−{formatNaira(breakdown.discountTotal)}</span>
                    </div>
                  )}
                  {breakdown.taxLine && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">{breakdown.taxLine.label}</span>
                      <span className="font-semibold tabular-nums">{formatNaira(breakdown.taxLine.amount)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
                    <span className="font-bold">Estimated total</span>
                    <span className="text-xl font-extrabold text-secondary-950 tabular-nums">{formatNaira(breakdown.total)}</span>
                  </div>
                  <p className="pt-1 text-xs text-slate-500">Preliminary estimate. Final price subject to site assessment.</p>
                  <Button className="mt-2 w-full" onClick={next} icon={<FileText className="h-4 w-4" />}>
                    View full estimate
                  </Button>
                </CardBody>
              </Card>
            </aside>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            {/* Print-only header */}
            <div className="hidden items-center justify-between border-b border-slate-300 pb-4 print:flex">
              <Logo />
              <div className="text-right text-xs text-slate-600">
                <p>{config.company.email}</p>
                <p>{config.company.phone}</p>
                <p>Generated {new Date().toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold">Your solar estimate</h2>
                <p className="text-sm text-slate-500">
                  {systemLabel} system{location ? ` · ${location}` : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer className="h-4 w-4" />}>
                  Print / Save PDF
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSummary} icon={<Download className="h-4 w-4" />}>
                  Download summary
                </Button>
              </div>
            </div>

            {design.warnings.length > 0 && (
              <Alert tone="warning" title="This estimate is incomplete">
                {design.warnings.join(' ')} Please request a formal quote so our engineers can design a suitable system.
              </Alert>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] print:block">
              <Card className="print:border-0 print:shadow-none">
                <CardHeader title="Equipment cost breakdown" description="All prices in Nigerian Naira (₦)." />
                <CardBody>
                  <PriceBreakdownTable breakdown={breakdown} />
                </CardBody>
              </Card>

              <div className="space-y-6 print:mt-6">
                <Card className="print:border-0 print:shadow-none">
                  <CardHeader title="Solar requirements summary" />
                  <CardBody>
                    <dl className="divide-y divide-slate-100 text-sm">
                      {[
                        ['Total connected load', formatWatts(sizing.connectedLoadW)],
                        ['Estimated simultaneous load', formatWatts(sizing.simultaneousLoadW)],
                        ['Daily energy consumption', formatKwh(sizing.dailyEnergyWh)],
                        ['Required backup duration', sizing.needsBattery ? formatHours(sizing.backupHours) : 'None (grid-tied)'],
                        ['Recommended inverter capacity', `${formatVA(sizing.inverter.requiredVA)}${design.inverter.selected ? ` → ${design.summary.inverterUnits > 1 ? `${design.summary.inverterUnits} × ` : ''}${formatVA(design.inverter.selected.product.capacity ?? 0)}` : ''}`],
                        ['Recommended battery capacity', sizing.needsBattery ? `${formatKwh(design.summary.batteryRequiredWh || sizing.batteryWhByChemistry.lithium)}${design.summary.batteryBankWh ? ` → ${formatKwh(design.summary.batteryBankWh)} bank` : ''}` : '—'],
                        ['Recommended solar capacity', `${formatKwp(sizing.requiredPvW)}${design.summary.arrayW ? ` → ${formatKwp(design.summary.arrayW)}` : ''}`],
                        ['Number of recommended panels', design.summary.panelCount ? `${design.summary.panelCount} × ${design.panel.selected?.product.capacity} W` : '—'],
                      ].map(([k, v]) => (
                        <div key={k} className="flex justify-between gap-3 py-2.5">
                          <dt className="text-slate-600">{k}</dt>
                          <dd className="text-right font-semibold text-secondary-950 tabular-nums">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardBody>
                </Card>

                <Card className="print:hidden">
                  <CardBody className="space-y-3">
                    <Button size="lg" className="w-full" onClick={() => setQuoteOpen(true)} icon={<Mail className="h-5 w-5" />}>
                      Request a Formal Quote
                    </Button>
                    <Button variant="outline" size="lg" className="w-full" onClick={() => goTo(0)} icon={<Pencil className="h-4 w-4" />}>
                      Modify My Configuration
                    </Button>
                    <p className="text-center text-xs text-slate-500">
                      Prefer to talk?{' '}
                      <a href={telLink(config.company.phone)} className="font-semibold text-secondary-800 underline">
                        Call {config.company.phone}
                      </a>
                    </p>
                  </CardBody>
                </Card>
              </div>
            </div>

            <Card className="print:border-0 print:shadow-none">
              <CardHeader title="Your appliances" />
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
                        <th className="pb-2">Appliance</th>
                        <th className="pb-2 text-right">Power</th>
                        <th className="pb-2 text-right">Qty</th>
                        <th className="pb-2 text-right">Hours/day</th>
                        <th className="pb-2 text-right">Energy/day</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appliances.map((a) => (
                        <tr key={a.uid} className="border-b border-slate-100">
                          <td className="py-2 font-medium">{a.name}</td>
                          <td className="py-2 text-right tabular-nums">{formatWatts(a.wattage)}</td>
                          <td className="py-2 text-right tabular-nums">{a.quantity}</td>
                          <td className="py-2 text-right tabular-nums">{a.hours}</td>
                          <td className="py-2 text-right tabular-nums">{formatKwh(applianceDailyWh(a))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>

            <Alert tone="info" title="Important – preliminary estimate">
              {DISCLAIMER} Prices shown are estimates based on our current price list and may change. They are not tamper-proof and require verification by Solluz Synergy.
            </Alert>
          </div>
        )}
      </Container>

      {/* Sticky footer navigation */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] backdrop-blur print:hidden">
        <Container className="flex items-center justify-between gap-3 py-3">
          <Button variant="outline" onClick={back} disabled={step === 0} icon={<ArrowLeft className="h-4 w-4" />} className={cn(step === 0 && 'invisible')}>
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0 text-center">
            {step < 2 ? (
              <>
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Daily energy</p>
                <p className="text-lg font-extrabold text-secondary-950 tabular-nums">
                  {formatKwh(sizing.dailyEnergyWh)} <span className="text-sm font-medium text-slate-500">· {appliances.length} items</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Estimated total</p>
                <p className="text-lg font-extrabold text-secondary-950 tabular-nums">{formatNaira(breakdown.total)}</p>
              </>
            )}
          </div>
          {step < 3 ? (
            <Button onClick={next}>
              <span>{step === 2 ? 'See estimate' : 'Continue'}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setQuoteOpen(true)} icon={<Mail className="h-4 w-4" />}>
              <span className="hidden sm:inline">Request a Formal Quote</span>
              <span className="sm:hidden">Get quote</span>
            </Button>
          )}
        </Container>
      </div>

      <QuoteRequestModal open={quoteOpen} onClose={() => setQuoteOpen(false)} context={quoteContext} defaultLocation={location} />
      <ConfirmDialog
        open={confirmReset}
        title="Start over?"
        message="This clears your appliances, requirements and equipment choices."
        confirmLabel="Start over"
        onConfirm={startOver}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
