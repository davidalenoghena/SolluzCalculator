import { Activity, Battery, Clock, Gauge, Info, LayoutGrid, Plug, Sun, Zap } from 'lucide-react';
import { SYSTEM_TYPES } from '../config';
import type { SystemDesign } from '../calculator/equipmentRecommendations';
import type { SizingResult } from '../calculator/systemSizing';
import { formatHours, formatKwh, formatKwp, formatVA, formatWatts } from '../pricing/currencyFormatter';
import { Badge, Stat } from './ui/Card';

export function SizingSummary({ sizing, design }: { sizing: SizingResult; design: SystemDesign }) {
  const systemLabel = SYSTEM_TYPES.find((t) => t.id === sizing.systemType)?.label ?? sizing.systemType;
  const d = design.summary;
  const ic = 'h-3.5 w-3.5';
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="navy">{systemLabel} system</Badge>
        {sizing.systemTypeAutoSelected && <Badge tone="sun">Recommended for you</Badge>}
        {d.systemVoltage > 0 && sizing.systemType !== 'grid-tied' && <Badge>{d.systemVoltage}V battery system</Badge>}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={<Plug className={ic} />} label="Connected load" value={formatWatts(sizing.connectedLoadW)} hint="All appliances together" />
        <Stat icon={<Activity className={ic} />} label="Peak load" value={formatWatts(sizing.simultaneousLoadW)} hint={`${formatWatts(sizing.surgeLoadW)} incl. start-up surge`} />
        <Stat icon={<Gauge className={ic} />} label="Daily energy" value={formatKwh(sizing.dailyEnergyWh)} hint="Per day" />
        <Stat
          icon={<Clock className={ic} />}
          label="Backup duration"
          value={sizing.needsBattery ? formatHours(sizing.backupHours) : 'None'}
          hint={sizing.backupHours !== sizing.requestedBackupHours ? `You asked for ${formatHours(sizing.requestedBackupHours)}` : sizing.needsBattery ? `${formatKwh(sizing.backupEnergyWh)} from batteries` : 'Grid-tied – no batteries'}
        />
        <Stat
          icon={<Zap className={ic} />}
          label="Inverter capacity"
          value={formatVA(sizing.inverter.requiredVA)}
          hint={d.inverterUnits ? `Selected: ${d.inverterUnits > 1 ? `${d.inverterUnits} × ` : ''}${formatVA(d.inverterTotalVA / d.inverterUnits)}` : 'Required (minimum)'}
          className="border-sun-200 bg-sun-50/60"
        />
        <Stat
          icon={<Battery className={ic} />}
          label="Battery capacity"
          value={sizing.needsBattery ? formatKwh(d.batteryRequiredWh || sizing.batteryWhByChemistry.lithium) : '—'}
          hint={d.batteryBankWh ? `Selected bank: ${formatKwh(d.batteryBankWh)}` : sizing.needsBattery ? 'Required (nominal)' : 'Not required'}
          className="border-sun-200 bg-sun-50/60"
        />
        <Stat
          icon={<Sun className={ic} />}
          label="Solar capacity"
          value={formatKwp(sizing.requiredPvW)}
          hint={d.arrayW ? `Selected array: ${formatKwp(d.arrayW)}` : 'Required'}
          className="border-sun-200 bg-sun-50/60"
        />
        <Stat
          icon={<LayoutGrid className={ic} />}
          label="Solar panels"
          value={d.panelCount ? `${d.panelCount} panels` : '—'}
          hint={design.panel.selected ? `${design.panel.selected.product.capacity} W each · ~${formatKwh(d.estimatedDailyProductionWh)}/day` : undefined}
          className="border-sun-200 bg-sun-50/60"
        />
      </div>
      {sizing.notes.length > 0 && (
        <ul className="space-y-1.5 rounded-xl bg-navy-50 p-4 text-sm text-navy-900">
          {sizing.notes.map((n) => (
            <li key={n} className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" />
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
