import { formatNaira } from '../pricing/currencyFormatter';
import type { PriceBreakdown as Breakdown, PriceLine } from '../pricing/pricingEngine';

function Rows({ lines }: { lines: PriceLine[] }) {
  return (
    <>
      {lines.map((l) => (
        <tr key={l.id} className="border-b border-slate-100 align-top">
          <td className="py-3 pr-3">
            <span className="block font-medium text-secondary-950">{l.label}</span>
            {l.detail && <span className="block text-xs text-slate-500">{l.detail}</span>}
            <span className="mt-0.5 block text-xs text-slate-500 tabular-nums sm:hidden">
              {l.quantity} × {formatNaira(l.unitPrice)}
            </span>
          </td>
          <td className="hidden py-3 pr-3 text-right tabular-nums sm:table-cell">{l.quantity}</td>
          <td className="hidden py-3 pr-3 text-right tabular-nums sm:table-cell">{formatNaira(l.unitPrice)}</td>
          <td className="py-3 text-right font-semibold tabular-nums">{formatNaira(l.subtotal)}</td>
        </tr>
      ))}
    </>
  );
}

function SubRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'green' }) {
  return (
    <tr>
      <td colSpan={3} className={`hidden py-2 pr-3 text-right sm:table-cell ${strong ? 'font-bold text-secondary-950' : 'text-slate-600'}`}>
        {label}
      </td>
      <td className={`py-2 pr-3 sm:hidden ${strong ? 'font-bold text-secondary-950' : 'text-slate-600'}`}>{label}</td>
      <td className={`py-2 text-right tabular-nums ${strong ? 'font-bold text-secondary-950' : ''} ${tone === 'green' ? 'text-emerald-700' : ''}`}>{value}</td>
    </tr>
  );
}

export function PriceBreakdownTable({ breakdown }: { breakdown: Breakdown }) {
  const b = breakdown;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-secondary-900 text-left text-xs font-bold tracking-wide text-slate-500 uppercase">
            <th className="pb-2">Item</th>
            <th className="hidden pb-2 text-right sm:table-cell">Qty</th>
            <th className="hidden pb-2 text-right sm:table-cell">Unit price</th>
            <th className="pb-2 text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <Rows lines={b.equipmentLines} />
          <SubRow label="Equipment subtotal" value={formatNaira(b.equipmentSubtotal)} strong />
          {b.serviceLines.length > 0 && (
            <>
              <tr>
                <td colSpan={4} className="pt-4 pb-1 text-xs font-bold tracking-wide text-slate-500 uppercase">
                  Installation & services
                </td>
              </tr>
              <Rows lines={b.serviceLines} />
              <SubRow label="Installation & services subtotal" value={formatNaira(b.servicesSubtotal)} strong />
            </>
          )}
          {b.discountLines.map((d) => (
            <SubRow key={d.id} label={d.label} value={`−${formatNaira(d.amount)}`} tone="green" />
          ))}
          {b.taxLine && <SubRow label={b.taxLine.label} value={formatNaira(b.taxLine.amount)} />}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-secondary-900">
            <td colSpan={3} className="hidden pt-3 text-right text-base font-extrabold text-secondary-950 sm:table-cell">
              Estimated total
            </td>
            <td className="pt-3 text-base font-extrabold text-secondary-950 sm:hidden">Estimated total</td>
            <td className="pt-3 text-right text-xl font-extrabold text-secondary-950 tabular-nums">{formatNaira(b.total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
