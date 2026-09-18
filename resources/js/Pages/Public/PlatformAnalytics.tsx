import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { LayoutDashboard, TrendingUp, DollarSign, Users, FileSearch, Download } from 'lucide-react';

const features = [
    {
        icon: LayoutDashboard,
        title: 'Real-time Dashboards',
        desc: 'See your school\'s key metrics at a glance — enrollment numbers, attendance rates, fee collections, and exam averages — all updated live.',
    },
    {
        icon: TrendingUp,
        title: 'Enrollment Trends',
        desc: 'Track enrollment growth, gender ratios, and class capacity over terms and years to plan for the future.',
    },
    {
        icon: DollarSign,
        title: 'Financial Reports',
        desc: 'Drill into revenue streams, outstanding balances, and collection rates with interactive charts and detailed breakdowns.',
    },
    {
        icon: Users,
        title: 'Staff Analytics',
        desc: 'Monitor teacher workload, qualification distribution, and staff-to-student ratios to optimise resource allocation.',
    },
    {
        icon: FileSearch,
        title: 'Custom Reports',
        desc: 'Build your own reports by selecting metrics, filters, and date ranges — then save and share them with stakeholders.',
    },
    {
        icon: Download,
        title: 'Export & Share',
        desc: 'Export any report as PDF, Excel, or CSV and share via email or WhatsApp directly from the platform.',
    },
];

export default function PlatformAnalytics() {
    return (
        <div className="landing">
            <Head title="Analytics & Reports — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Platform</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Numbers a school already trusts
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Dashboards and reports built from the marks, fees and attendance the school
                            already enters — for the head office and for the Ministry.
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
