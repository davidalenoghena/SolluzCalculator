import { BatteryCharging, HelpCircle, MapPin, Users, Zap } from 'lucide-react';
import { NIGERIAN_STATES, SYSTEM_TYPES } from '../config';
import { cn } from '../lib/utils';
import type { CalculatorSettings, Requirements, SystemTypePreference } from '../types';
import { Card, CardBody, CardHeader } from './ui/Card';
import { Field, Input, NumberInput, Select, Textarea } from './ui/Form';

export type RequirementErrors = Partial<Record<keyof Requirements, string>>;

export function validateRequirements(r: Requirements, s: CalculatorSettings): RequirementErrors {
  const e: RequirementErrors = {};
  if (!r.state) e.state = 'Please select your state.';
  if (r.city.length > 80) e.city = 'City name is too long.';
  if (!Number.isFinite(r.backupHours) || r.backupHours < 0) e.backupHours = 'Enter backup hours (0 or more).';
  else if (r.backupHours > s.maxBackupHours) e.backupHours = `Maximum backup supported by the calculator is ${s.maxBackupHours} hours.`;
  if (r.comments.length > 1000) e.comments = 'Please keep comments under 1,000 characters.';
  return e;
}

const BACKUP_PRESETS = [4, 8, 12, 24];

interface Props {
  value: Requirements;
  onChange: (r: Requirements) => void;
  settings: CalculatorSettings;
  errors: RequirementErrors;
}

export function RequirementsForm({ value, onChange, settings, errors }: Props) {
  const set = <K extends keyof Requirements>(k: K, v: Requirements[K]) => onChange({ ...value, [k]: v });
  const recommended = SYSTEM_TYPES.find((t) => t.id === settings.recommendedSystemType)?.label ?? 'Hybrid';
  const typeOptions: { id: SystemTypePreference; label: string; description: string }[] = [
    ...SYSTEM_TYPES,
    { id: 'recommend', label: 'Not sure – recommend one', description: `We'll suggest the best fit. For most Nigerian homes and businesses this is a ${recommended} system.` },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader title="Installation location" description="Helps us plan logistics and local sun conditions." icon={<MapPin className="h-5 w-5" />} />
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <Field label="State" required error={errors.state}>
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={value.state} onChange={(e) => set('state', e.target.value)} invalid={!!errors.state}>
                <option value="">Select state…</option>
                {NIGERIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="City / Area" error={errors.city}>
            {(id, d) => <Input id={id} aria-describedby={d} value={value.city} maxLength={80} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Ikeja" />}
          </Field>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Backup duration" description="How many hours should batteries power your appliances when there is no grid or sun?" icon={<BatteryCharging className="h-5 w-5" />} />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {BACKUP_PRESETS.filter((h) => h <= settings.maxBackupHours).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => set('backupHours', h)}
                className={cn('rounded-full px-4 py-2 text-sm font-semibold transition', value.backupHours === h ? 'bg-secondary-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
              >
                {h} hours
              </button>
            ))}
          </div>
          <Field label="Custom backup hours" error={errors.backupHours} hint="Typical: 4–8 h covers evening outages, 12 h covers the whole night.">
            {(id, d) => (
              <NumberInput id={id} aria-describedby={d} min={0} max={settings.maxBackupHours} step="any" value={value.backupHours} onValueChange={(v) => set('backupHours', v)} suffix="hours" invalid={!!errors.backupHours} />
            )}
          </Field>
        </CardBody>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader title="Preferred system type" description="Not sure? Choose “recommend one” and we will pick for you." icon={<Zap className="h-5 w-5" />} />
        <CardBody>
          <div role="radiogroup" aria-label="System type" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {typeOptions.map((t) => {
              const on = value.systemType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set('systemType', t.id)}
                  className={cn('rounded-xl border-2 p-4 text-left transition', on ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-secondary-300')}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn('h-4 w-4 rounded-full border-2', on ? 'border-primary-500 bg-primary-500 ring-2 ring-white ring-inset' : 'border-slate-300')} />
                    <span className="font-bold text-secondary-950">{t.label}</span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-600">{t.description}</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Do all appliances run at the same time?" description="This affects the inverter size you need." icon={<Users className="h-5 w-5" />} />
        <CardBody>
          <div role="radiogroup" aria-label="Simultaneous use" className="grid gap-3">
            {[
              { v: false, label: 'No – some run at different times', hint: 'Most homes. We estimate a realistic peak load, so you don’t pay for an oversized inverter.' },
              { v: true, label: 'Yes – everything may run at once', hint: 'Safest choice for businesses or heavy use. The inverter is sized for the full connected load.' },
            ].map((o) => {
              const on = value.allSimultaneous === o.v;
              return (
                <button
                  key={String(o.v)}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set('allSimultaneous', o.v)}
                  className={cn('rounded-xl border-2 p-4 text-left transition', on ? 'border-primary-500 bg-primary-50' : 'border-slate-200 hover:border-secondary-300')}
                >
                  <span className="font-semibold text-secondary-950">{o.label}</span>
                  <span className="mt-1 block text-xs text-slate-600">{o.hint}</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Anything else we should know?" description="Optional – e.g. roof type, generator, future expansion." icon={<HelpCircle className="h-5 w-5" />} />
        <CardBody>
          <Field label="Additional requirements or comments" error={errors.comments}>
            {(id, d) => (
              <Textarea id={id} aria-describedby={d} rows={5} maxLength={1000} value={value.comments} onChange={(e) => set('comments', e.target.value)} placeholder="e.g. Flat concrete roof, we have a 7.5 kVA generator…" />
            )}
          </Field>
        </CardBody>
      </Card>
    </div>
  );
}
