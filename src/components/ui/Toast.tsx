import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastTone = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  tone: ToastTone;
  message: ReactNode;
}

const ToastContext = createContext<(message: ReactNode, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((message: ReactNode, tone: ToastTone = 'success') => {
    const id = Date.now() + Math.random();
    setItems((xs) => [...xs, { id, tone, message }]);
    setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== id)), tone === 'error' ? 7000 : 4000);
  }, []);
  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  return (
    <ToastContext.Provider value={push}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex flex-col items-center gap-2 px-4 print:hidden">
        {items.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex max-w-md items-start gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg animate-fade-up',
                t.tone === 'success' && 'bg-emerald-600',
                t.tone === 'error' && 'bg-red-600',
                t.tone === 'info' && 'bg-secondary-800',
              )}
            >
              <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <div>{t.message}</div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
