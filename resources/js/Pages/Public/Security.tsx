import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import { Lock, Shield, Database, FileSearch, KeyRound, CheckCircle } from 'lucide-react';

const features = [
    {
        icon: Lock,
        title: 'Encryption at Rest & Transit',
        desc: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Your information is protected at every stage.',
    },
    {
        icon: Shield,
        title: 'Role-Based Access Control',
        desc: 'Granular permissions ensure staff only see what they need. Admins, teachers, and parents each have appropriate access levels.',
    },
    {
        icon: Database,
        title: 'Regular Backups',
        desc: 'Automated daily backups with encrypted off-site storage. Your data can be restored quickly in any scenario.',
    },
    {
        icon: FileSearch,
        title: 'Audit Logging',
        desc: 'Every action is logged with who did it, when, and from where. Full traceability for accountability and compliance.',
    },
    {
        icon: KeyRound,
        title: '2FA Support',
        desc: 'Two-factor authentication adds an extra layer of security for admin and sensitive accounts across the platform.',
    },
    {
        icon: CheckCircle,
        title: 'GDPR-Ready',
        desc: 'Built with data protection in mind. Consent management, data export, and deletion capabilities are built into the platform.',
    },
];

export default function Security() {
    return (
        <div className="landing">
            <Head title="Security — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Security</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Security &amp; Data Protection
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Your data security is our priority. Syscend Campus implements industry-leading
                            security measures to protect student and school information.
                        </p>
                    </div>

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div
                                key={f.title}
                                className="rounded-md border border-border bg-card p-6 transition-colors hover:border-primary/20"
                            >
                                <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                    <f.icon className="size-5" />
                                </span>
                                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <section className="mt-16 rounded-md border border-border bg-card p-8">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sierra Leone Data Protection</h2>
                        <p className="mt-4 leading-relaxed text-muted-foreground">
                            Syscend Campus is committed to complying with the Sierra Leone Data Protection Act
                            and all applicable local regulations governing the collection, processing, and
                            storage of personal data. We work closely with schools to ensure that student
                            records, staff information, and administrative data are handled in full accordance
                            with national standards for privacy and data protection.
                        </p>
                    </section>

                    <section className="mt-8 rounded-md border border-accent/20 bg-accent/[0.06] p-8 text-center">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Questions about security?</h2>
                        <p className="mt-3 text-muted-foreground">
                            Contact us at{' '}
                            <a href="mailto:syscend@gmail.com" className="text-primary underline underline-offset-2">
                                syscend@gmail.com
                            </a>{' '}
                            and we&apos;ll be happy to discuss how we protect your data.
                        </p>
                        <a
                            href="mailto:syscend@gmail.com"
                            className="mt-6 inline-flex items-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                        >
                            Contact Us
                        </a>
                    </section>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
