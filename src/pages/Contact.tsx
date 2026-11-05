import { useState, type FormEvent } from 'react';
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { SocialIcons } from '../components/SocialIcons';
import { Button, ButtonAnchor } from '../components/ui/Button';
import { Alert, Card, CardBody } from '../components/ui/Card';
import { Field, Input, Textarea } from '../components/ui/Form';
import { Container, PageHeader } from '../components/ui/Section';
import { useConfig } from '../context/ConfigContext';
import { telLink, whatsappLink } from '../lib/utils';
import { buildMailtoUrl } from '../quote/quoteDocument';

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function Contact() {
  const { config } = useConfig();
  const c = config.company;
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [opened, setOpened] = useState(false);

  const set = (k: keyof FormState) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (form.name.trim().length < 2) errs.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errs.email = 'Please enter a valid email address.';
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) errs.phone = 'Please enter a valid phone number.';
    if (form.message.trim().length < 5) errs.message = 'Please enter a message.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const body = [
      form.message.trim(),
      '',
      '—',
      `Name: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      form.phone && `Phone: ${form.phone.trim()}`,
    ]
      .filter((l) => l !== '')
      .join('\n');
    window.location.href = buildMailtoUrl(c.email, form.subject.trim() || `Website enquiry – ${form.name.trim()}`, body);
    setOpened(true);
  };

  const items = [
    { icon: Phone, label: 'Phone', value: c.phone, href: telLink(c.phone) },
    { icon: Mail, label: 'Email', value: c.email, href: `mailto:${c.email}` },
    { icon: MessageCircle, label: 'WhatsApp', value: 'Chat with us on WhatsApp', href: whatsappLink(c.whatsapp, `Hello ${c.name}, I'd like to enquire about solar installation.`) },
    { icon: MapPin, label: 'Office', value: c.address },
    { icon: Clock, label: 'Business hours', value: c.businessHours },
  ];

  return (
    <>
      <PageHeader eyebrow="Contact us" title="Let’s talk about your energy needs" description="Reach out for a consultation, site survey or formal quotation. We usually respond within one business day." />
      <Container className="grid grid-cols-1 gap-8 py-12 sm:py-16 lg:grid-cols-[1fr_1.3fr]">
        <div className="space-y-4">
          {items.map(({ icon: Icon, label, value, href }) => {
            const inner = (
              <>
                <div className="rounded-xl bg-primary-100 p-3 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
                  <p className="mt-0.5 font-semibold break-words text-secondary-950">{value}</p>
                </div>
              </>
            );
            return href ? (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4 transition hover:border-primary-300 hover:shadow-sm">
                {inner}
              </a>
            ) : (
              <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
                {inner}
              </div>
            );
          })}
          <div className="rounded-2xl bg-secondary-950 p-5">
            <p className="text-sm font-semibold text-white">Follow us</p>
            <SocialIcons social={c.social} className="mt-3" />
          </div>
        </div>

        <Card>
          <CardBody className="sm:p-8">
            <h2 className="text-2xl font-extrabold">Send us a message</h2>
            <p className="mt-1 text-sm text-slate-500">This form opens your email app with your message ready to send to {c.email}.</p>
            <form onSubmit={submit} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required error={errors.name}>
                {(id, d) => <Input id={id} aria-describedby={d} value={form.name} onChange={set('name')} invalid={!!errors.name} autoComplete="name" maxLength={100} />}
              </Field>
              <Field label="Email" required error={errors.email}>
                {(id, d) => <Input id={id} aria-describedby={d} type="email" value={form.email} onChange={set('email')} invalid={!!errors.email} autoComplete="email" maxLength={120} />}
              </Field>
              <Field label="Phone" error={errors.phone}>
                {(id, d) => <Input id={id} aria-describedby={d} type="tel" value={form.phone} onChange={set('phone')} invalid={!!errors.phone} autoComplete="tel" maxLength={20} />}
              </Field>
              <Field label="Subject">
                {(id) => <Input id={id} value={form.subject} onChange={set('subject')} maxLength={120} />}
              </Field>
              <Field label="Message" required error={errors.message} className="sm:col-span-2">
                {(id, d) => <Textarea id={id} aria-describedby={d} rows={5} value={form.message} onChange={set('message')} invalid={!!errors.message} maxLength={2000} />}
              </Field>
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row">
                <Button type="submit" size="lg" icon={<Send className="h-4 w-4" />}>
                  Open email to send
                </Button>
                <ButtonAnchor href={whatsappLink(c.whatsapp)} target="_blank" rel="noopener noreferrer" variant="outline" size="lg" icon={<MessageCircle className="h-4 w-4" />}>
                  WhatsApp instead
                </ButtonAnchor>
              </div>
              {opened && (
                <Alert tone="info" title="Check your email app" className="sm:col-span-2">
                  Your email app should now be open with the message filled in. Please review it and press <strong>Send</strong> – your message is not sent until you do. If nothing opened, email us directly at{' '}
                  <a className="font-semibold underline" href={`mailto:${c.email}`}>
                    {c.email}
                  </a>
                  .
                </Alert>
              )}
            </form>
          </CardBody>
        </Card>
      </Container>
    </>
  );
}
