import { useEffect, useState, type FormEvent } from 'react';
import { Copy, Download, ExternalLink, Mail, Send } from 'lucide-react';
import { downloadTextFile } from '../storage/localStorage';
import { buildQuoteEmail, validateCustomer, type CustomerDetails, type CustomerErrors, type QuoteContext, type QuoteEmail } from '../quote/quoteDocument';
import { Button, ButtonAnchor } from './ui/Button';
import { Alert } from './ui/Card';
import { Field, Input, Textarea } from './ui/Form';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

interface Props {
  open: boolean;
  onClose: () => void;
  context: QuoteContext;
  defaultLocation: string;
}

export function QuoteRequestModal({ open, onClose, context, defaultLocation }: Props) {
  const toast = useToast();
  // Customer details live only in component state – never persisted to storage.
  const [form, setForm] = useState<CustomerDetails>({ fullName: '', email: '', phone: '', location: defaultLocation, comments: '' });
  const [errors, setErrors] = useState<CustomerErrors>({});
  const [email, setEmail] = useState<QuoteEmail | null>(null);

  useEffect(() => {
    if (open) {
      setEmail(null);
      setForm((f) => ({ ...f, location: f.location || defaultLocation }));
    }
  }, [open, defaultLocation]);

  const set = (k: keyof CustomerDetails) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateCustomer(form);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const built = buildQuoteEmail({ ...context, generatedAt: new Date() }, form);
    setEmail(built);
    window.location.href = built.mailtoUrl;
  };

  const copy = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(`To: ${email.to}\nSubject: ${email.subject}\n\n${email.fullBody}`);
      toast('Email text copied to clipboard.');
    } catch {
      toast('Could not copy automatically – please use the download option instead.', 'error');
    }
  };

  const download = () => {
    if (!email) return;
    const safe = form.fullName.trim().replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'customer';
    downloadTextFile(`solluz-quote-request-${safe}.txt`, `To: ${email.to}\nSubject: ${email.subject}\n\n${email.fullBody}`, 'text/plain');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={email ? 'Review and send your email' : 'Request a formal quote'}
      description={email ? undefined : 'We will prepare an email to our team containing your full estimate.'}
      size="lg"
    >
      {!email ? (
        <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required error={errors.fullName}>
            {(id, d) => <Input id={id} aria-describedby={d} autoComplete="name" maxLength={100} value={form.fullName} onChange={set('fullName')} invalid={!!errors.fullName} />}
          </Field>
          <Field label="Email address" required error={errors.email}>
            {(id, d) => <Input id={id} aria-describedby={d} type="email" autoComplete="email" maxLength={120} value={form.email} onChange={set('email')} invalid={!!errors.email} />}
          </Field>
          <Field label="Phone number" required error={errors.phone}>
            {(id, d) => <Input id={id} aria-describedby={d} type="tel" autoComplete="tel" maxLength={20} value={form.phone} onChange={set('phone')} invalid={!!errors.phone} placeholder="+234…" />}
          </Field>
          <Field label="Installation location" required error={errors.location}>
            {(id, d) => <Input id={id} aria-describedby={d} maxLength={120} value={form.location} onChange={set('location')} invalid={!!errors.location} />}
          </Field>
          <Field label="Additional comments" className="sm:col-span-2" error={errors.comments}>
            {(id, d) => <Textarea id={id} aria-describedby={d} rows={3} maxLength={1500} value={form.comments} onChange={set('comments')} placeholder="Best time to call, site access, etc." />}
          </Field>
          <Alert tone="info" className="sm:col-span-2">
            Clicking the button below opens <strong>your own email app</strong> with a pre-filled message to {context.config.company.email}. Nothing is sent until you press Send in your email app. Your details are not stored on this website.
          </Alert>
          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={<Mail className="h-4 w-4" />}>
              Generate email
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <Alert tone="warning" title="Your quote request has NOT been sent yet">
            Your email app should have opened with the message ready. Please <strong>review it and press Send</strong>. We only receive your request once you send the email.
          </Alert>
          {email.shortened && (
            <Alert tone="info">
              Your estimate is long, so a shorter version was placed in the email. For the full details, use <strong>Copy full text</strong> and paste it into the email, or attach the downloaded summary.
            </Alert>
          )}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <p>
              <span className="text-slate-500">To:</span> <strong>{email.to}</strong>
            </p>
            <p className="mt-1">
              <span className="text-slate-500">Subject:</span> <strong>{email.subject}</strong>
            </p>
            <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-white p-3 font-sans text-xs leading-relaxed whitespace-pre-wrap text-slate-700">{email.fullBody}</pre>
          </div>
          <p className="text-sm text-slate-600">Email app didn’t open, or the message looks cut off (some older email apps truncate long messages)? Copy the full text into a new email to {email.to}, or download the summary.</p>
          <div className="flex flex-wrap gap-2">
            <ButtonAnchor href={email.mailtoUrl} icon={<ExternalLink className="h-4 w-4" />}>
              Open email app again
            </ButtonAnchor>
            <Button variant="outline" onClick={copy} icon={<Copy className="h-4 w-4" />}>
              Copy full text
            </Button>
            <Button variant="outline" onClick={download} icon={<Download className="h-4 w-4" />}>
              Download summary
            </Button>
            <Button variant="ghost" onClick={() => setEmail(null)} icon={<Send className="h-4 w-4" />}>
              Edit details
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
