import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export const CALCULATOR_STEPS = ['Appliances', 'Requirements', 'System & equipment', 'Estimate'] as const;

export function CalculatorProgress({ step, maxReached, onStep }: { step: number; maxReached: number; onStep: (i: number) => void }) {
  return (
    <nav aria-label="Calculator progress" className="print:hidden">
      <ol className="flex items-center gap-2 sm:gap-3">
        {CALCULATOR_STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          const reachable = i <= maxReached;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 sm:gap-3">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => onStep(i)}
                aria-current={current ? 'step' : undefined}
                className="group flex min-w-0 items-center gap-2 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
                    current && 'bg-primary-600 text-white ring-4 ring-primary-500/20',
                    done && 'bg-secondary-900 text-white',
                    !current && !done && (reachable ? 'bg-secondary-100 text-secondary-800' : 'bg-slate-100 text-slate-400'),
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span className={cn('hidden truncate text-sm font-semibold md:block', current ? 'text-secondary-950' : 'text-slate-500')}>{label}</span>
              </button>
              {i < CALCULATOR_STEPS.length - 1 && <span className={cn('h-0.5 flex-1 rounded', i < step ? 'bg-secondary-900' : 'bg-slate-200')} />}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-sm font-semibold text-secondary-900 md:hidden">
        Step {step + 1} of {CALCULATOR_STEPS.length}: {CALCULATOR_STEPS[step]}
      </p>
    </nav>
  );
}
