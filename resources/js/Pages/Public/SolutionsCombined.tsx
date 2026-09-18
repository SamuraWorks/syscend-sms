import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { LayoutDashboard, BarChart3, Share2, Wallet, FolderSync, PieChart } from 'lucide-react';

const features = [
    {
        icon: LayoutDashboard,
        title: 'Unified Dashboard',
        desc: 'One view across all divisions — ECE, primary, and secondary. See enrolment, attendance, and performance at a glance.',
    },
    {
        icon: BarChart3,
        title: 'Cross-Division Reports',
        desc: 'Generate reports that span multiple levels. Compare performance and resource usage across your entire institution.',
    },
    {
        icon: Share2,
        title: 'Shared Resources',
        desc: 'Share teachers, facilities, and materials across divisions without duplication. Reduce costs and improve efficiency.',
    },
    {
        icon: Wallet,
        title: 'Single Fee System',
        desc: 'One integrated fee management system across all levels. Unified invoicing with division-specific fee structures.',
    },
    {
        icon: FolderSync,
        title: 'Consistent Records',
        desc: 'Students progressing from primary to secondary retain their full record. No data loss during transitions between levels.',
    },
    {
        icon: PieChart,
        title: 'Division Analytics',
        desc: 'Drill into each division independently or compare side by side. Make data-driven decisions across your whole school.',
    },
];

export default function SolutionsCombined() {
    return (
        <div className="landing">
            <Head title="Combined School Management — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Solutions</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Combined School Management
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            One platform for schools that span multiple levels. Unified reporting across ECE,
                            primary, and secondary divisions with a single dashboard.
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
                    <ContactCTA />
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
