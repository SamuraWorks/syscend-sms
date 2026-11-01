import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import { LifeBuoy, Mail, MessageSquare, BookOpen } from 'lucide-react';

export default function Support() {
    return (
        <div className="landing">
            <Head title="Support — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-4xl px-6 lg:px-10">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Help Center</p>
                    <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                        Support
                    </h1>
                    <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                        We&apos;re here to help you get the most out of Syscend Campus.
                    </p>

                    <div className="mt-12 grid gap-6 sm:grid-cols-2">
                        {[
                            { icon: LifeBuoy, title: 'Technical Support', desc: 'Report bugs, request features, or get help with technical issues.', action: 'syscend@gmail.com' },
                            { icon: Mail, title: 'Email Support', desc: 'Reach our team directly for any questions about your account or subscription.', action: 'syscend@gmail.com' },
                            { icon: MessageSquare, title: 'WhatsApp', desc: 'Message us on WhatsApp for quick support during business hours (Mon–Fri, 9am–5pm WAT).', action: '+232 79 630 777' },
                            { icon: BookOpen, title: 'Documentation', desc: 'Browse guides, tutorials, and FAQs to learn how to use every feature.', action: 'Coming soon' },
                        ].map((item) => (
                            <div key={item.title} className="rounded-md border border-border bg-card p-6 transition-colors hover:border-primary/20">
                                <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                    <item.icon className="size-5" />
                                </span>
                                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{item.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                                <p className="mt-3 text-sm font-medium text-primary">{item.action}</p>
                            </div>
                        ))}
                    </div>

                    <section className="mt-16 rounded-md border border-accent/20 bg-accent/[0.06] p-8">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
                        <div className="mt-6 space-y-4">
                            {[
                                { q: 'How do I reset my password?', a: 'Contact your school administrator to reset your password, or use the "Forgot password" link on the login page.' },
                                { q: 'How do I add new students?', a: 'Navigate to Students > Add Student from your dashboard. You can also import students in bulk from the settings.' },
                                { q: 'Can I access Syscend Campus on mobile?', a: 'Yes. Syscend Campus is a responsive web application that works on any device with a modern browser.' },
                            ].map((faq) => (
                                <div key={faq.q}>
                                    <h3 className="text-sm font-medium text-foreground">{faq.q}</h3>
                                    <p className="mt-1 text-sm text-muted-foreground">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
