import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { ClipboardList, PenLine, FileBadge, TrendingUp, BookOpen, Globe } from 'lucide-react';

const features = [
    {
        icon: ClipboardList,
        title: 'Exam Creation',
        desc: 'Create and schedule exams for any grading system — NPSE, BECE, WASSCE, or your school\'s internal assessments — with flexible mark structures.',
    },
    {
        icon: PenLine,
        title: 'Mark Entry',
        desc: 'Enter and validate marks subject-by-subject with built-in range checks, bulk import from Excel, and real-time class averages.',
    },
    {
        icon: FileBadge,
        title: 'Report Cards',
        desc: 'Auto-generate professional report cards with grades, teacher remarks, attendance summaries, and customizable school templates.',
    },
    {
        icon: TrendingUp,
        title: 'Grade Analysis',
        desc: 'Visualise grade distributions, pass rates, and improvement trends per class, per subject, and per student over time.',
    },
    {
        icon: BookOpen,
        title: 'Subject Performance',
        desc: 'Compare average scores across subjects to identify curriculum strengths and areas that need additional attention.',
    },
    {
        icon: Globe,
        title: 'District Comparisons',
        desc: 'Benchmark your school\'s results against district and national averages to understand where you stand.',
    },
];

export default function PlatformExams() {
    return (
        <div className="landing">
            <Head title="Examination & Results — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Platform</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Marks, entered once
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            Create exams, record marks, and let report cards, ratings and district summaries
                            come out of the same numbers — no retyping for the exam office.
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
