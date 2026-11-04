import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Download, FileJson, KeyRound, RotateCcw, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Alert, Badge, Stat } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Form';
import { ConfirmDialog, Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { CONFIG_EXPORT_FILENAME, CONFIG_SCHEMA_VERSION, CONFIG_STORAGE_KEY, getDefaultConfig } from '../config';
import { useConfig } from '../context/ConfigContext';
import { changePin, DEFAULT_ADMIN_PIN, hasCustomPin, resetPinToDefault } from '../storage/adminAuth';
import { parseAndValidateConfig } from '../storage/configValidation';
import { downloadTextFile, isStorageAvailable, serializeConfigForExport } from '../storage/localStorage';
import type { AppConfig } from '../types';
import { AdminCard, AdminPageTitle, type ManagerProps } from './shared';

interface Props extends ManagerProps {
  dirty: boolean;
  onReplaced: (c: AppConfig) => void;
}

const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

function summarize(c: AppConfig) {
  return {
    appliances: c.appliances.length,
    products: c.products.length,
    activeProducts: c.products.filter((p) => p.isActive).length,
    services: c.pricing.optionalServices.length,
    projects: c.content.projects.length,
  };
}

function countPriceChanges(from: AppConfig, to: AppConfig): number {
  const prices = new Map(from.products.map((p) => [p.id, p.unitPrice]));
  return to.products.filter((p) => prices.has(p.id) && prices.get(p.id) !== p.unitPrice).length;
}

function PinSettings() {
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [custom, setCustom] = useState(hasCustomPin());

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return setError('PIN must be at least 4 characters.');
    if (pin !== confirm) return setError('PINs do not match.');
    await changePin(pin);
    setPin('');
    setConfirm('');
    setError('');
    setCustom(true);
    toast('Admin PIN changed for this browser.');
  };

  return (
    <AdminCard title="Admin PIN" icon={<KeyRound className="h-5 w-5" />}>
      <Alert tone="warning" className="mb-4">
        The PIN is a basic barrier, <strong>not real security</strong>. A changed PIN is stored (hashed) only in this browser and is never included in exported configuration files. The build-time default PIN is set with <code>VITE_ADMIN_PIN</code>.
      </Alert>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <Field label="New PIN">{(id) => <Input id={id} type="password" autoComplete="new-password" value={pin} onChange={(e) => setPin(e.target.value)} />}</Field>
        <Field label="Confirm new PIN" error={error}>
          {(id, d) => <Input id={id} aria-describedby={d} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />}
        </Field>
        <div className="flex flex-wrap gap-2 sm:col-span-2">
          <Button type="submit" variant="secondary">
            Change PIN
          </Button>
          {custom && (
            <Button
              variant="ghost"
              onClick={() => {
                resetPinToDefault();
                setCustom(false);
                toast('PIN reset to the build-time default for this browser.', 'info');
              }}
            >
              Reset to default PIN
            </Button>
          )}
        </div>
      </form>
      {!custom && DEFAULT_ADMIN_PIN === 'solluz2026' && (
        <p className="mt-3 text-xs text-amber-700">You are using the out-of-the-box default PIN. Set VITE_ADMIN_PIN before deploying.</p>
      )}
    </AdminCard>
  );
}

export function ConfigurationManager({ draft, update, dirty, onReplaced }: Props) {
  const { config, source, saveConfig, restoreDefaults } = useConfig();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importErrors, setImportErrors] = useState<string[] | null>(null);
  const [preview, setPreview] = useState<{ config: AppConfig; fileName: string; warnings: string[] } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const storageOk = isStorageAvailable();
  const defaults = getDefaultConfig();
  const sizeKb = (new Blob([JSON.stringify(config)]).size / 1024).toFixed(1);

  const exportConfig = () => {
    downloadTextFile(CONFIG_EXPORT_FILENAME, serializeConfigForExport(config));
    toast(`Exported ${CONFIG_EXPORT_FILENAME}`);
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportErrors(null);
    if (file.size > MAX_IMPORT_BYTES) {
      setImportErrors([`The file is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Configuration files should be well under 2 MB.`]);
      return;
    }
    const text = await file.text();
    const result = parseAndValidateConfig(text);
    if (!result.ok) {
      setImportErrors(result.errors);
      return;
    }
    setPreview({ config: result.config, fileName: file.name, warnings: result.warnings });
  };

  const confirmImport = () => {
    if (!preview) return;
    try {
      saveConfig(preview.config);
      onReplaced(preview.config);
      toast('Configuration imported and saved to this browser.');
    } catch (err) {
      setImportErrors([(err as Error).message]);
    }
    setPreview(null);
  };

  const doReset = () => {
    restoreDefaults();
    onReplaced(getDefaultConfig());
    setConfirmReset(false);
    toast('Default configuration restored.', 'info');
  };

  const current = summarize(config);
  const incoming = preview ? summarize(preview.config) : null;

  return (
    <>
      <AdminPageTitle title="Configuration management" description="Back up, transfer and restore the website configuration. There is no database – the configuration lives in a JSON file and in this browser’s LocalStorage." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminCard title="Status" icon={<FileJson className="h-5 w-5" />}>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Active source" value={source === 'saved' ? 'Browser (saved)' : 'Website default'} />
            <Stat label="Schema version" value={`v${config.meta.version}`} hint={`App supports v${CONFIG_SCHEMA_VERSION}`} />
            <Stat label="Revision" value={config.meta.revision} hint={`Published default: ${defaults.meta.revision}`} />
            <Stat label="Size" value={`${sizeKb} KB`} hint={storageOk ? 'LocalStorage available' : 'LocalStorage unavailable!'} />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Revision label" hint="Saved with your next Save. Use a date, e.g. 2026-12-01.">
              {(id) => <Input id={id} value={draft.meta.revision} maxLength={40} onChange={(e) => update((d) => void (d.meta.revision = e.target.value))} />}
            </Field>
            <Field label="Description">{(id) => <Input id={id} value={draft.meta.label} maxLength={200} onChange={(e) => update((d) => void (d.meta.label = e.target.value))} />}</Field>
          </div>
          {!storageOk && (
            <Alert tone="error" className="mt-4">
              This browser is blocking LocalStorage (e.g. private mode). Changes cannot be saved – use Export to keep your work.
            </Alert>
          )}
        </AdminCard>

        <AdminCard title="Export, import & restore">
          <div className="space-y-5">
            <div>
              <Button onClick={exportConfig} icon={<Download className="h-4 w-4" />}>
                Export Configuration
              </Button>
              <p className="mt-2 text-xs text-slate-500">
                Downloads the <strong>saved/active</strong> configuration as <code>{CONFIG_EXPORT_FILENAME}</code>. Contains appliances, equipment, prices, pricing rules, calculator and website settings – never PINs or secrets.
              </p>
              {dirty && (
                <Alert tone="warning" className="mt-3">
                  You have unsaved changes. Save them first if you want them included in the export.
                </Alert>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} icon={<Upload className="h-4 w-4" />}>
                Import Configuration
              </Button>
              <p className="mt-2 text-xs text-slate-500">Upload a previously exported file. It is validated and previewed before anything is replaced.</p>
              {importErrors && (
                <Alert tone="error" className="mt-3" title="Import failed – your current configuration was not changed">
                  <ul className="mt-1 max-h-48 list-inside list-disc overflow-y-auto">
                    {importErrors.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </div>
            <div className="border-t border-slate-100 pt-5">
              <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50" onClick={() => setConfirmReset(true)} icon={<RotateCcw className="h-4 w-4" />}>
                Restore Default Configuration
              </Button>
              <p className="mt-2 text-xs text-slate-500">Removes the configuration saved in this browser and returns to the website’s published default. Export first if you want a backup.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => downloadTextFile('solluz-synergy-default-config.json', serializeConfigForExport(defaults))} icon={<Download className="h-4 w-4" />}>
                Download published default
              </Button>
            </div>
          </div>
        </AdminCard>

        <div className="xl:col-span-2">
          <AdminCard title="Publishing configuration updates for all visitors">
            <Alert tone="warning" className="mb-4" title="Saving and importing only affect THIS browser">
              LocalStorage is private to each browser and device. Visitors will keep seeing the published default configuration until it is updated in the website’s source code and the site is redeployed.
            </Alert>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
              <li>Make and <strong>Save</strong> your changes in this admin panel, then test them in the calculator.</li>
              <li>
                Click <strong>Export Configuration</strong> to download <code>{CONFIG_EXPORT_FILENAME}</code>.
              </li>
              <li>
                Give the file to your developer (or do it yourself): replace the contents of <code>src/config/defaultConfig.json</code> with the exported file. Optionally update <code>meta.revision</code>.
              </li>
              <li>
                Run <code>npm test</code> and <code>npm run build</code>, then redeploy the site (Vercel / Netlify / Cloudflare Pages / GitHub Pages).
              </li>
              <li>After deployment every new visitor sees the new defaults. Browsers that have their own saved copy (such as yours) keep using it until you click Restore Default Configuration.</li>
            </ol>
            <p className="mt-4 text-xs text-slate-500">
              Storage key: <code>{CONFIG_STORAGE_KEY}</code>. See <code>docs/CONFIGURATION.md</code> in the source code for full details.
            </p>
          </AdminCard>
        </div>

        <div className="xl:col-span-2">
          <PinSettings />
        </div>
      </div>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="Review configuration import"
        description={preview?.fileName}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setPreview(null)}>
              Cancel
            </Button>
            <Button onClick={confirmImport}>Replace current configuration</Button>
          </>
        }
      >
        {preview && incoming && (
          <div className="space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge tone="green">Valid</Badge>
              <Badge>Schema v{preview.config.meta.version}</Badge>
              <Badge>Revision {preview.config.meta.revision}</Badge>
              {preview.config.meta.exportedAt && <Badge>Exported {new Date(preview.config.meta.exportedAt).toLocaleString('en-NG')}</Badge>}
            </div>
            <p className="text-slate-600">{preview.config.meta.label}</p>
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-xs text-slate-500 uppercase">
                  <th className="pb-2" />
                  <th className="pb-2 text-right">Current</th>
                  <th className="pb-2 text-right">Imported</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ['Appliances', current.appliances, incoming.appliances],
                    ['Products', current.products, incoming.products],
                    ['Active products', current.activeProducts, incoming.activeProducts],
                    ['Optional services', current.services, incoming.services],
                    ['Projects', current.projects, incoming.projects],
                    ['Company email', config.company.email, preview.config.company.email],
                    ['Peak sun hours', config.calculator.peakSunHours, preview.config.calculator.peakSunHours],
                    ['VAT rate', `${config.pricing.tax.ratePercent}%`, `${preview.config.pricing.tax.ratePercent}%`],
                  ] as [string, string | number, string | number][]
                ).map(([k, a, b]) => (
                  <tr key={k} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-600">{k}</td>
                    <td className="py-1.5 text-right">{a}</td>
                    <td className={`py-1.5 text-right font-semibold ${a !== b ? 'text-sun-700' : ''}`}>{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <strong>{countPriceChanges(config, preview.config)}</strong> product price(s) differ from the current configuration.
            </p>
            {preview.warnings.length > 0 && (
              <Alert tone="warning" title="Warnings">
                <ul className="list-inside list-disc">
                  {preview.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {dirty && <Alert tone="warning">Your unsaved admin changes will be discarded.</Alert>}
            <Alert tone="info">Importing replaces the configuration saved in this browser only.</Alert>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmReset}
        title="Restore default configuration?"
        message="This removes all changes saved in this browser (appliances, equipment, prices, settings and content) and returns to the website’s published defaults. This cannot be undone unless you have exported a backup."
        confirmLabel="Restore defaults"
        onConfirm={doReset}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
