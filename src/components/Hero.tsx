import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, Minus, Phone, Plus, ShieldCheck, Sun, Zap } from 'lucide-react';
import { totalConnectedLoadW, totalDailyEnergyWh } from '../calculator/energyCalculations';
import { fromCatalogue } from '../calculator/session';
import { useConfig } from '../context/ConfigContext';
import { CALC_SESSION_KEYS } from '../lib/useSessionState';
import { cn } from '../lib/utils';
import { formatKwh, formatWatts } from '../pricing/currencyFormatter';
import { Button, ButtonLink } from './ui/Button';
import { Container } from './ui/Section';

const QUICK_IDS = ['led-bulb', 'ceiling-fan', 'television', 'refrigerator', 'deep-freezer', 'laptop', 'wifi-router', 'air-conditioner'];

/** Mini appliance picker that hands off to the full calculator. */
function QuickEstimate() {
  const { config } = useConfig();
  const navigate = useNavigate();
  const active = config.appliances.filter((a) => a.isActive);
  const quick = useMemo(() => {
    const picked = QUICK_IDS.map((id) => active.find((a) => a.id === id)).filter(Boolean) as typeof active;
    return picked.length >= 4 ? picked : active.slice(0, 8);
  }, [active]);
  const [qty, setQty] = useState<Record<string, number>>({ 'led-bulb': 6, 'ceiling-fan': 2, television: 1, refrigerator: 1 });

  const selected = quick.filter((a) => (qty[a.id] ?? 0) > 0).map((a) => fromCatalogue(a, qty[a.id]));
  const load = totalConnectedLoadW(selected);
  const energy = totalDailyEnergyWh(selected);

  const go = () => {
    sessionStorage.setItem(CALC_SESSION_KEYS.appliances, JSON.stringify(selected));
    sessionStorage.setItem(CALC_SESSION_KEYS.step, '0');
    navigate('/calculator');
  };

  const change = (id: string, d: number) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(99, (q[id] ?? 0) + d)) }));

  return (
    <div className="rounded-3xl border border-white/15 bg-white/95 p-5 text-slate-800 shadow-2xl shadow-navy-950/40 backdrop-blur sm:p-6">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-sun-100 p-2.5 text-sun-700">
          <Calculator className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-navy-950">Quick solar estimate</p>
          <p className="text-xs text-slate-500">Pick your appliances to get started</p>
        </div>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {quick.map((a) => {
          const q = qty[a.id] ?? 0;
          return (
            <li key={a.id} className={cn('flex items-center justify-between rounded-xl border px-3 py-2 transition', q ? 'border-sun-300 bg-sun-50' : 'border-slate-200')}>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{a.name}</span>
                <span className="text-xs text-slate-500">{a.defaultWattage} W</span>
              </span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`Fewer ${a.name}`} onClick={() => change(a.id, -1)} className="rounded-md p-1 text-slate-500 hover:bg-white disabled:opacity-30" disabled={!q}>
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-5 text-center text-sm font-bold tabular-nums">{q}</span>
                <button type="button" aria-label={`More ${a.name}`} onClick={() => change(a.id, 1)} className="rounded-md p-1 text-navy-700 hover:bg-white">
                  <Plus className="h-4 w-4" />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-navy-950 p-4 text-white">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Connected load</p>
          <p className="text-xl font-bold tabular-nums">{formatWatts(load)}</p>
        </div>
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-navy-300 uppercase">Daily energy</p>
          <p className="text-xl font-bold text-sun-400 tabular-nums">{formatKwh(energy)}</p>
        </div>
      </div>
      <Button onClick={go} className="mt-4 w-full" size="lg" disabled={!selected.length}>
        Continue to full calculator <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function Hero() {
  const { config } = useConfig();
  const { hero } = config.content;
  return (
    <section className="relative overflow-hidden bg-navy-950 pt-28 pb-20 text-white sm:pt-36 lg:pb-28">
      {/* decorative background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-0 h-[32rem] w-[32rem] rounded-full bg-sun-500/25 blur-3xl" />
        <div className="absolute bottom-0 -left-40 h-[28rem] w-[28rem] rounded-full bg-navy-500/30 blur-3xl" />
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <Container className="relative grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-sun-400/30 bg-sun-400/10 px-3 py-1 text-xs font-semibold text-sun-300">
            <Sun className="h-3.5 w-3.5" />
            {hero.badge}
          </span>
          <h1 className="mt-5 text-4xl leading-[1.08] font-extrabold text-white sm:text-5xl lg:text-6xl">{hero.headline}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-200">{hero.subheadline}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/calculator" size="lg" icon={<Calculator className="h-5 w-5" />}>
              Calculate Your Solar Needs
            </ButtonLink>
            <ButtonLink to="/contact" variant="light" size="lg" icon={<Phone className="h-5 w-5" />}>
              Contact Us
            </ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {[
              { icon: Zap, label: 'Hybrid, off-grid & grid-tied' },
              { icon: ShieldCheck, label: 'Quality components' },
              { icon: Sun, label: 'Sized for Nigerian sun' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col gap-2 text-sm text-navy-200">
                <Icon className="h-5 w-5 text-sun-400" />
                {label}
              </div>
            ))}
          </dl>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <QuickEstimate />
        </div>
      </Container>
    </section>
  );
}
