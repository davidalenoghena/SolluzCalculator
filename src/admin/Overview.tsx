import { Link } from 'react-router-dom';
import { Boxes, Calculator, Database, Plug, Tags } from 'lucide-react';
import { Alert, Stat } from '../components/ui/Card';
import { getDefaultConfig, PRODUCT_CATEGORIES, SYSTEM_TYPES } from '../config';
import { formatPercent } from '../pricing/currencyFormatter';
import type { ConfigSource } from '../storage/localStorage';
import type { AppConfig } from '../types';
import { AdminCard, AdminPageTitle } from './shared';

export function countActivePricingOptions(c: AppConfig): number {
  const p = c.pricing;
  return (
    Number(p.installation.isActive) +
    Number(p.delivery.isActive) +
    Number(p.tax.isActive) +
    Number(p.markupPercent !== 0) +
    p.additionalCharges.filter((x) => x.isActive).length +
    p.optionalServices.filter((x) => x.isActive).length +
    p.discounts.filter((x) => x.isActive).length
  );
}

export function Overview({ draft, source }: { draft: AppConfig; source: ConfigSource }) {
  const s = draft.calculator;
  const activeProducts = draft.products.filter((p) => p.isActive);
  const categoriesInUse = PRODUCT_CATEGORIES.filter((c) => activeProducts.some((p) => p.category === c.id));
  const defaults = getDefaultConfig();

  const assumptions: [string, string][] = [
    ['Inverter efficiency', formatPercent(s.inverterEfficiency)],
    ['Battery efficiency', formatPercent(s.batteryEfficiency)],
    ['Depth of discharge – lithium', formatPercent(s.depthOfDischarge.lithium)],
    ['Depth of discharge – lead-acid', formatPercent(s.depthOfDischarge['lead-acid'])],
    ['Depth of discharge – gel', formatPercent(s.depthOfDischarge.gel)],
    ['Peak sun hours', `${s.peakSunHours} h/day`],
    ['System derating factor', formatPercent(s.systemDeratingFactor)],
    ['Inverter safety margin', formatPercent(s.inverterSafetyMargin)],
    ['Power factor', String(s.powerFactor)],
    ['Diversity factor', formatPercent(s.diversityFactor)],
    ['Default inverter surge ratio', `${s.defaultInverterSurgeRatio}×`],
    ['Recommended system type', SYSTEM_TYPES.find((t) => t.id === s.recommendedSystemType)?.label ?? s.recommendedSystemType],
  ];

  return (
    <>
      <AdminPageTitle title="Dashboard" description="Overview of the configuration currently being edited." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Plug className="h-3.5 w-3.5" />} label="Appliances" value={draft.appliances.length} hint={`${draft.appliances.filter((a) => a.isActive).length} active`} />
        <Stat icon={<Boxes className="h-3.5 w-3.5" />} label="Products" value={activeProducts.length} hint={`${draft.products.length} total (${draft.products.length - activeProducts.length} inactive)`} />
        <Stat icon={<Tags className="h-3.5 w-3.5" />} label="Equipment categories" value={`${categoriesInUse.length} / ${PRODUCT_CATEGORIES.length}`} hint="with active products" />
        <Stat icon={<Calculator className="h-3.5 w-3.5" />} label="Active pricing options" value={countActivePricingOptions(draft)} hint="charges, services, discounts, tax" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AdminCard
          title="Current calculator assumptions"
          action={
            <Link to="/admin/calculator" className="text-sm font-semibold text-sun-700 hover:underline">
              Edit
            </Link>
          }
        >
          <dl className="divide-y divide-slate-100 text-sm">
            {assumptions.map(([k, v]) => (
              <div key={k} className="flex justify-between py-2">
                <dt className="text-slate-600">{k}</dt>
                <dd className="font-semibold text-navy-950">{v}</dd>
              </div>
            ))}
          </dl>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Configuration status" icon={<Database className="h-5 w-5" />}>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Active source</dt>
                <dd className="font-semibold">{source === 'saved' ? 'Saved in this browser' : 'Website default'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Draft revision</dt>
                <dd className="font-semibold">{draft.meta.revision}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-600">Published default revision</dt>
                <dd className="font-semibold">{defaults.meta.revision}</dd>
              </div>
            </dl>
            {source === 'saved' && draft.meta.revision !== defaults.meta.revision && (
              <Alert tone="info" className="mt-4">
                This browser uses a saved configuration with a different revision than the website’s published default. Visitors see the published default.
              </Alert>
            )}
          </AdminCard>
          <Alert tone="warning" title="Changes are saved in this browser only">
            Saving stores the configuration in this browser’s LocalStorage. Other visitors and devices will <strong>not</strong> see your changes until the exported configuration is published into the website’s default file and redeployed.{' '}
            <Link to="/admin/configuration" className="font-semibold underline">
              Learn how
            </Link>
            .
          </Alert>
        </div>
      </div>
    </>
  );
}
