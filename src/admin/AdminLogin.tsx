import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Logo } from '../components/Logo';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Card';
import { Field, Input } from '../components/ui/Form';
import { verifyPin } from '../storage/adminAuth';

export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    // Small delay to discourage rapid guessing (cosmetic – this is not real security).
    await new Promise((r) => setTimeout(r, Math.min(2000, 300 * attempts)));
    const ok = await verifyPin(pin);
    setBusy(false);
    if (ok) onSuccess();
    else {
      setAttempts((a) => a + 1);
      setError('Incorrect PIN.');
      setPin('');
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-secondary-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Link to="/">
            <Logo dark />
          </Link>
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary-100 p-2.5 text-primary-700">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Admin access</h1>
              <p className="text-sm text-slate-500">Enter the admin PIN to manage the website.</p>
            </div>
          </div>
          <Field label="PIN" error={error} className="mt-6">
            {(id, d) => (
              <Input id={id} aria-describedby={d} type="password" autoComplete="current-password" autoFocus value={pin} onChange={(e) => setPin(e.target.value)} invalid={!!error} />
            )}
          </Field>
          <Button type="submit" className="mt-4 w-full" size="lg" disabled={!pin || busy}>
            {busy ? 'Checking…' : 'Enter admin panel'}
          </Button>
          <Alert tone="warning" className="mt-6" title="Basic access barrier only">
            This PIN only discourages casual visitors. Because the site runs entirely in the browser, it is not strong security – anyone with technical knowledge can bypass it. Never store sensitive information in the configuration.
          </Alert>
        </form>
        <p className="mt-6 text-center text-sm text-secondary-300">
          <Link to="/" className="hover:text-white">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
