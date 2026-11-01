import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { CreditCard, Receipt, Wallet, PieChart, FileText, Bell } from 'lucide-react';

const features = [
    {
        icon: CreditCard,
        title: 'Automated Billing',
        desc: 'Generate fee invoices automatically based on class, grade level, and custom fee structures — no manual entry required.',
    },
    {
        icon: Receipt,
        title: 'Payment Tracking',
        desc: 'Monitor every payment in real time with clear ledgers showing paid, pending, and overdue balances for each student.',
    },
    {
        icon: Wallet,
        title: 'Multiple Payment Methods',
        desc: 'Accept cash, bank transfers, mobile money (Orange Money, Africell), and online payments with instant reconciliation.',
    },
    {
        icon: PieChart,
        title: 'Financial Reports',
        desc: 'Generate revenue summaries, outstanding balance reports, and income-vs-expense breakdowns at the click of a button.',
    },
    {
        icon: FileText,
        title: 'Invoice Generation',
        desc: 'Create professional, printable invoices with school branding, itemised fee breakdowns, and due dates.',
    },
    {
        icon: Bell,
        title: 'Reminder System',
        desc: 'Send automated SMS and email reminders for upcoming dues, overdue payments, and receipt confirmations.',
    },
];

export default function PlatformFees() {
    return (
        <div className="landing">
            <Head title="Fee Management — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Platform</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Fees that account for themselves
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Set a fee structure, record payments — cash, mobile money, bank — and the
                            receipts and balance reports follow. No shoebox of paper slips.
                        </p>
                    </div>

                    {/* Feature cards */}
                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {features.map((f) => (
                            <div key={f.title} className="rounded-md border border-border bg-card p-6 transition-colors hover:border-primary/20">
                                <span className="grid size-10 place-items-center rounded-sm bg-primary/10 text-primary">
                                    <f.icon className="size-5" />
                                </span>
                                <h3 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </div>
                        ))}
                    </div>

                    <ContactCTA />
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
