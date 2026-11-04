import { useMemo, type ReactNode } from 'react';
import { FlaskConical } from 'lucide-react';
import { Stat } from '../components/ui/Card';
import { Field, NumberInput, PercentInput, Select } from '../components/ui/Form';
import { designSystem, EMPTY_SELECTION } from '../calculator/equipmentRecommendations';
import { sizeSystem } from '../calculator/systemSizing';
import { BATTERY_CHEMISTRIES, SYSTEM_TYPES } from '../config';
import { formatKwh, formatKwp, formatNaira, formatVA, formatWatts } from '../pricing/currencyFormatter';
import { priceDesign } from '../pricing/pricingEngine';
import type { BatteryChemistry, CalculatorSettings as Settings, SelectedAppliance, SystemType } from '../types';
import { AdminCard, AdminPageTitle, type ManagerProps } from './shared';

const SAMPLE: SelectedAppliance[] = [
  { uid: '1', applianceId: null, name: 'LED bulbs', wattage: 10, quantity: 10, hours: 6, surgeFactor: 1, isCustom: false },
  { uid: '2', applianceId: null, name: 'Ceiling fans', wattage: 75, quantity: 3, hours: 8, surgeFactor: 1.5, isCustom: false },
  { uid: '3', applianceId: null, name: 'Television', wattage: 100, quantity: 1, hours: 5, surgeFactor: 1, isCustom: false },
  { uid: '4', applianceId: null, name: 'Refrigerator', wattage: 200, quantity: 1, hours: 10, surgeFactor: 3, isCustom: false },
  { uid: '5', applianceId: null, name: 'Wi-Fi router', wattage: 15, quantity: 1, hours: 24, surgeFactor: 1, isCustom: false },
];

export function CalculatorSettings({ draft, update }: ManagerProps) {
  const s = draft.calculator;
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => update((d) => void (d.calculator[k] = v));
  const setDod = (c: BatteryChemistry, v: number) => update((d) => void (d.calculator.depthOfDischarge[c] = v));

  const preview = useMemo(() => {
    try {
      const sizing = sizeSystem(SAMPLE, { state: 'Lagos', city: '', systemType: 'hybrid', backupHours: 8, allSimultaneous: false, comments: '' }, s);
      const design = designSystem(sizing, EMPTY_SELECTION, draft);
      const price = priceDesign(design, draft.pricing, []);
      const ok = [sizing.inverter.requiredVA, sizing.requiredPvW, price.total].every(Number.isFinite);
      return ok ? { sizing, design, price } : null;
    } catch {
      return null;
    }
  }, [s, draft]);

  const pct = (k: keyof Settings, label: string, hint: ReactNode) => (
    <Field label={label} hint={hint}>
      {(id) => <PercentInput id={id} value={s[k] as number} onValueChange={(v) => set(k, v as never)} />}
    </Field>
  );

  return (
    <>
      <AdminPageTitle
        title="Calculator settings"
        description="Engineering assumptions used for every estimate. These are preliminary sizing rules – they do not replace a professional design."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <AdminCard title="Efficiency & losses">
            <div className="grid gap-4 sm:grid-cols-2">
              {pct('inverterEfficiency', 'Inverter efficiency', 'Typical 88–95%.')}
              {pct('batteryEfficiency', 'Battery round-trip efficiency', 'Lithium ~95%, lead-acid ~80–85%.')}
              {pct('systemDeratingFactor', 'Solar system derating factor', 'Accounts for heat, dust, wiring & mismatch losses. Typical 70–80%.')}
              <Field label="Peak sun hours" hint="Average daily equivalent full-sun hours. Nigeria ≈ 4–6.">
                {(id) => <NumberInput id={id} min={1} max={12} step="any" value={s.peakSunHours} onValueChange={(v) => set('peakSunHours', v)} suffix="h" />}
              </Field>
              {pct('solarCoverage', 'Solar coverage target', 'Share of daily energy the panels should supply (100% = full solar).')}
            </div>
          </AdminCard>

          <AdminCard title="Batteries">
            <div className="grid gap-4 sm:grid-cols-3">
              {BATTERY_CHEMISTRIES.map((c) => (
                <Field key={c.id} label={`Depth of discharge – ${c.label}`}>
                  {(id) => <PercentInput id={id} value={s.depthOfDischarge[c.id]} onValueChange={(v) => setDod(c.id, v)} />}
                </Field>
              ))}
              <Field label="Preferred chemistry" hint="Ranked first in recommendations.">
                {(id) => (
                  <Select id={id} value={s.preferredBatteryChemistry} onChange={(e) => set('preferredBatteryChemistry', e.target.value as BatteryChemistry)}>
                    {BATTERY_CHEMISTRIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <Field label="Default backup hours" hint="Pre-filled in step 2.">
                {(id) => <NumberInput id={id} min={0} step="any" value={s.defaultBackupHours} onValueChange={(v) => set('defaultBackupHours', v)} suffix="h" />}
              </Field>
              <Field label="Maximum backup hours" hint="Upper limit customers may request.">
                {(id) => <NumberInput id={id} min={1} max={168} value={s.maxBackupHours} onValueChange={(v) => set('maxBackupHours', v)} suffix="h" />}
              </Field>
              <Field label="Default system voltage" hint="Used when an inverter doesn’t specify one.">
                {(id) => (
                  <Select id={id} value={s.defaultSystemVoltage} onChange={(e) => set('defaultSystemVoltage', Number(e.target.value))}>
                    {[12, 24, 48].map((v) => (
                      <option key={v} value={v}>
                        {v} V
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Inverter & load">
            <div className="grid gap-4 sm:grid-cols-2">
              {pct('inverterSafetyMargin', 'Inverter safety margin', 'Extra headroom over the peak running load. Typical 20–30%.')}
              <Field label="Power factor" hint="Converts watts to VA (VA = W ÷ PF). Typical 0.8.">
                {(id) => <NumberInput id={id} min={0.5} max={1} step={0.01} value={s.powerFactor} onValueChange={(v) => set('powerFactor', v)} />}
              </Field>
              <Field label="Default inverter surge ratio" hint="Used when a product doesn’t specify its surge capability.">
                {(id) => <NumberInput id={id} min={1} max={10} step="any" value={s.defaultInverterSurgeRatio} onValueChange={(v) => set('defaultInverterSurgeRatio', v)} suffix="×" />}
              </Field>
              {pct('diversityFactor', 'Diversity factor', 'When not all appliances run together: share of the non-largest loads assumed on at the same time.')}
              <Field label="Max parallel inverters" hint="For large loads using parallel-capable inverters.">
                {(id) => <NumberInput id={id} min={1} max={20} step={1} value={s.maxParallelInverters} onValueChange={(v) => set('maxParallelInverters', v)} />}
              </Field>
              <Field label="Charge controller safety factor" hint="Multiplier on controller current. Typical 1.25.">
                {(id) => <NumberInput id={id} min={1} max={3} step="any" value={s.chargeControllerSafetyFactor} onValueChange={(v) => set('chargeControllerSafetyFactor', v)} suffix="×" />}
              </Field>
              <Field label="Recommended system type" hint="Suggested when customers choose “Not sure”.">
                {(id) => (
                  <Select id={id} value={s.recommendedSystemType} onChange={(e) => set('recommendedSystemType', e.target.value as SystemType)}>
                    {SYSTEM_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </div>
          </AdminCard>

          <AdminCard title="Appliance start-up surge factors" description="How much extra power each appliance draws when starting. Also editable in the Appliances section.">
            <ul className="grid gap-2 sm:grid-cols-2">
              {draft.appliances.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2">
                  <span className="truncate text-sm font-medium">{a.name}</span>
                  <NumberInput
                    aria-label={`Surge factor for ${a.name}`}
                    className="w-24"
                    min={1}
                    max={10}
                    step="any"
                    value={a.surgeFactor}
                    invalid={!(a.surgeFactor >= 1 && a.surgeFactor <= 10)}
                    onValueChange={(v) =>
                      update((d) => {
                        const x = d.appliances.find((y) => y.id === a.id);
                        if (x) x.surgeFactor = v;
                      })
                    }
                    suffix="×"
                  />
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <AdminCard title="Live preview" description="Sample home: 10 bulbs, 3 fans, TV, fridge, router · hybrid · 8 h backup" icon={<FlaskConical className="h-5 w-5" />}>
            {preview ? (
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Daily energy" value={formatKwh(preview.sizing.dailyEnergyWh)} />
                <Stat label="Peak load" value={formatWatts(preview.sizing.simultaneousLoadW)} />
                <Stat label="Inverter" value={formatVA(preview.sizing.inverter.requiredVA)} />
                <Stat label="Battery" value={formatKwh(preview.design.summary.batteryRequiredWh)} />
                <Stat label="Solar" value={formatKwp(preview.sizing.requiredPvW)} />
                <Stat label="Panels" value={preview.design.summary.panelCount} />
                <Stat label="Estimated total" value={formatNaira(preview.price.total)} className="col-span-2 bg-sun-50" />
              </div>
            ) : (
              <p className="text-sm text-red-600">Enter valid values to see a preview.</p>
            )}
          </AdminCard>
        </aside>
      </div>
    </>
  );
}
