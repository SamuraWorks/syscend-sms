import { Head, useForm, usePage, router } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import { Mail, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

export default function Contact() {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const form = useForm({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/contact', {
            preserveScroll: true,
            onSuccess: () => form.reset(),
            onError: (errors) => {
                console.error('Contact form errors:', errors);
            },
        });
    }

    return (
        <div className="landing">
            <Head title="Contact Us — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Get in Touch</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Contact us
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                        Have a question, want a demo, or need support? We&apos;d love to hear from you.
                    </p>

                    <div className="mt-12 grid gap-8 sm:grid-cols-3">
                        {[
                            { icon: Mail, label: 'Email', value: 'syscend@gmail.com', href: 'mailto:syscend@gmail.com' },
                            { icon: Phone, label: 'Phone / WhatsApp', value: '+232 79 630 777', href: 'tel:+23279630777' },
                            { icon: MapPin, label: 'Location', value: 'Freetown, Sierra Leone', href: '#' },
                        ].map((item) => (
                            <div key={item.label} className="rounded-md border border-border bg-card p-6">
                                <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </span>
                                <h3 className="mt-4 text-sm font-medium">{item.label}</h3>
                                <a href={item.href} className="mt-1 block text-sm text-muted-foreground hover:text-primary transition-colors">
                                    {item.value}
                                </a>
                            </div>
                        ))}
                    </div>

                    <section className="mt-16">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Send us a message</h2>
                        <p className="mt-3 text-muted-foreground">
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>

                        {flash?.success && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 dark:bg-green-950/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-lg px-4 py-2">
                                <CheckCircle className="w-4 h-4 shrink-0" /> {flash.success}
                            </div>
                        )}
                        {flash?.error && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {flash.error}
                            </div>
                        )}
                        {Object.keys(form.errors).length > 0 && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> Please fix the errors below.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
                                    <input id="name" type="text" placeholder="Your name"
                                        value={form.data.name}
                                        onChange={e => form.setData('name', e.target.value)}
                                        className="h-10 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                                    {form.errors.name && <p className="text-xs text-red-500">{form.errors.name}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                                    <input id="email" type="email" placeholder="you@example.com"
                                        value={form.data.email}
                                        onChange={e => form.setData('email', e.target.value)}
                                        className="h-10 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                                    {form.errors.email && <p className="text-xs text-red-500">{form.errors.email}</p>}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="subject" className="text-sm font-medium text-foreground">Subject</label>
                                <input id="subject" type="text" placeholder="How can we help?"
                                    value={form.data.subject}
                                    onChange={e => form.setData('subject', e.target.value)}
                                    className="h-10 w-full rounded-sm border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30" />
                                {form.errors.subject && <p className="text-xs text-red-500">{form.errors.subject}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="message" className="text-sm font-medium text-foreground">Message</label>
                                <textarea id="message" rows={5} placeholder="Tell us more..."
                                    value={form.data.message}
                                    onChange={e => form.setData('message', e.target.value)}
                                    className="w-full rounded-sm border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                                {form.errors.message && <p className="text-xs text-red-500">{form.errors.message}</p>}
                            </div>
                            <button type="submit"
                                disabled={form.processing}
                                className="inline-flex h-10 items-center justify-center rounded-sm bg-primary px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                                {form.processing ? 'Sending...' : 'Send message'}
                            </button>
                        </form>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
