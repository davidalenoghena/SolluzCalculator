import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Boxes, Calculator, ExternalLink, FileJson, Globe, LayoutDashboard, LogOut, Newspaper, Plug, Save, Undo2, Wallet } from 'lucide-react';
import { AdminLogin } from '../admin/AdminLogin';
import { ApplianceManager } from '../admin/ApplianceManager';
import { CalculatorSettings } from '../admin/CalculatorSettings';
import { ConfigurationManager } from '../admin/ConfigurationManager';
import { ContentManager } from '../admin/ContentManager';
import { EquipmentManager } from '../admin/EquipmentManager';
import { Overview } from '../admin/Overview';
import { PricingManager } from '../admin/PricingManager';
import type { DraftUpdater } from '../admin/shared';
import { WebsiteSettings } from '../admin/WebsiteSettings';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Alert, Badge } from '../components/ui/Card';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { getDefaultConfig } from '../config';
import { useConfig } from '../context/ConfigContext';
import { cn } from '../lib/utils';
import { endAdminSession, isAdminSessionActive, startAdminSession } from '../storage/adminAuth';
import { downloadTextFile } from '../storage/localStorage';
import { validateConfig } from '../storage/configValidation';
import type { AppConfig } from '../types';

const NAV = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard },
  { to: 'appliances', label: 'Appliances', icon: Plug },
  { to: 'equipment', label: 'Equipment', icon: Boxes },
  { to: 'pricing', label: 'Pricing', icon: Wallet },
  { to: 'calculator', label: 'Calculator settings', icon: Calculator },
  { to: 'website', label: 'Website settings', icon: Globe },
  { to: 'content', label: 'Content', icon: Newspaper },
  { to: 'configuration', label: 'Configuration', icon: FileJson },
];

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const { config, source, saveConfig, loadError, restoreDefaults, dismissLoadError } = useConfig();
  const toast = useToast();
  const [draft, setDraft] = useState<AppConfig>(() => structuredClone(config));
  const [saveErrors, setSaveErrors] = useState<string[] | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(config), [draft, config]);

  // Pick up external changes (another tab) when there is nothing unsaved here.
  useEffect(() => {
    if (!dirty) setDraft(structuredClone(config));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  const update: DraftUpdater = useCallback((fn) => {
    setDraft((d) => {
      const next = structuredClone(d);
      fn(next);
      return next;
    });
  }, []);

  const save = () => {
    const result = validateConfig(draft);
    if (!result.ok) {
      setSaveErrors(result.errors);
      return;
    }
    try {
      saveConfig(draft);
      toast(
        <>
          Changes saved. The calculator in <strong>this browser</strong> now uses the updated configuration.
        </>,
      );
      if (result.warnings.length) toast(result.warnings[0], 'info');
    } catch (e) {
      setSaveErrors([(e as Error).message]);
    }
  };

  const props = { draft, update };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <Link to="/admin">
              <Logo />
            </Link>
            <Badge tone="navy" className="hidden sm:inline-flex">
              Admin
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <>
                <span className="hidden text-xs font-semibold text-amber-700 md:inline">Unsaved changes</span>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDiscard(true)} icon={<Undo2 className="h-4 w-4" />}>
                  <span className="hidden sm:inline">Discard</span>
                </Button>
              </>
            )}
            <Button size="sm" onClick={save} disabled={!dirty} icon={<Save className="h-4 w-4" />}>
              Save<span className="hidden sm:inline"> changes</span>
            </Button>
            <a href={import.meta.env.BASE_URL} target="_blank" rel="noopener noreferrer" className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block" title="View website">
              <ExternalLink className="h-5 w-5" />
            </a>
            <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Log out" title="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-2 py-2 lg:hidden" aria-label="Admin sections">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to ? `/admin/${n.to}` : '/admin'}
              end={!n.to}
              className={({ isActive }) => cn('shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold', isActive ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="flex">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 border-r border-slate-200 bg-white p-3 lg:block">
          <nav className="space-y-1" aria-label="Admin sections">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to ? `/admin/${n.to}` : '/admin'}
                end={!n.to}
                className={({ isActive }) =>
                  cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition', isActive ? 'bg-navy-900 text-white' : 'text-slate-600 hover:bg-slate-100')
                }
              >
                <n.icon className="h-4.5 w-4.5" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <p className="absolute right-3 bottom-4 left-3 rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
            Changes are stored in <strong>this browser only</strong>. Export & publish to update the live site.
          </p>
        </aside>

        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          {loadError && (
            <Alert
              tone="error"
              className="mb-6"
              title={loadError.message}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      restoreDefaults();
                      setDraft(getDefaultConfig());
                      toast('Default configuration restored.', 'info');
                    }}
                  >
                    Restore defaults
                  </Button>
                  <Link to="/admin/configuration" className="inline-flex h-9 items-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">
                    Import a valid configuration
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => downloadTextFile('solluz-invalid-config-backup.json', loadError.raw)}>
                    Download the invalid data
                  </Button>
                  <Button size="sm" variant="ghost" onClick={dismissLoadError}>
                    Dismiss
                  </Button>
                </div>
              }
            >
              The website is currently using its default configuration instead.
              {loadError.details.length > 0 && (
                <ul className="mt-2 max-h-32 list-inside list-disc overflow-y-auto text-xs">
                  {loadError.details.slice(0, 10).map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}

          <Routes>
            <Route index element={<Overview draft={draft} source={source} />} />
            <Route path="appliances" element={<ApplianceManager {...props} />} />
            <Route path="equipment" element={<EquipmentManager {...props} />} />
            <Route path="pricing" element={<PricingManager {...props} />} />
            <Route path="calculator" element={<CalculatorSettings {...props} />} />
            <Route path="website" element={<WebsiteSettings {...props} />} />
            <Route path="content" element={<ContentManager {...props} />} />
            <Route path="configuration" element={<ConfigurationManager {...props} dirty={dirty} onReplaced={(c) => setDraft(structuredClone(c))} />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>

      <Modal open={!!saveErrors} onClose={() => setSaveErrors(null)} title="Cannot save – please fix these issues" size="lg" footer={<Button onClick={() => setSaveErrors(null)}>OK</Button>}>
        <p className="mb-3 text-sm text-slate-600">Nothing was saved. Your previously saved configuration is unchanged.</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
          {saveErrors?.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      </Modal>

      <ConfirmDialog
        open={confirmDiscard}
        title="Discard unsaved changes?"
        message="All edits since your last save will be lost."
        confirmLabel="Discard"
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setDraft(structuredClone(config));
          setConfirmDiscard(false);
        }}
      />
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminSessionActive);
  if (!authed)
    return (
      <AdminLogin
        onSuccess={() => {
          startAdminSession();
          setAuthed(true);
        }}
      />
    );
  return (
    <Dashboard
      onLogout={() => {
        endAdminSession();
        setAuthed(false);
      }}
    />
  );
}
