import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { ShieldCheck, GitCompareArrows, Users, Layers, Activity, Palette } from 'lucide-react';

const features = [
    {
        icon: ShieldCheck,
        title: 'Centralized Control',
        desc: 'Manage all campuses from a single admin panel. Set policies, manage staff, and control access across your entire group.',
    },
    {
        icon: GitCompareArrows,
        title: 'Campus Comparison',
        desc: 'Compare enrolment, fees, exam results, and attendance across branches. Identify top performers and areas to improve.',
    },
    {
        icon: Users,
        title: 'Shared Staff',
        desc: 'Share teachers and administrators across campuses. Manage assignments, transfers, and schedules from one place.',
    },
    {
        icon: Layers,
        title: 'Resource Allocation',
        desc: 'Allocate budgets, materials, and human resources across campuses based on real data and needs assessments.',
    },
    {
        icon: Activity,
        title: 'Group Analytics',
        desc: 'Consolidated analytics across all branches. Track KPIs, generate group-wide reports, and make strategic decisions.',
    },
    {
        icon: Palette,
        title: 'Unified Branding',
        desc: 'Maintain consistent branding across all campuses while allowing each school to manage its own content and communications.',
    },
];

export default function SolutionsMultiSchool() {
    return (
        <div className="landing">
            <Head title="Multi-School Group Management — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Solutions</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Multi-School Group Management
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Manage campuses and branches from one place. Compare performance, share resources,
                            and maintain centralized control with school-level autonomy.
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
