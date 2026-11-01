import { Head } from '@inertiajs/react';
import SiteHeader from '@/components/landing/SiteHeader';
import SiteFooter from '@/components/landing/SiteFooter';
import ContactCTA from '@/components/landing/ContactCTA';
import { Users, CalendarCheck, BarChart3, UsersRound, FolderOpen, LayoutGrid } from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Student Profiles',
        desc: 'Maintain comprehensive digital records for every student — personal details, guardians, medical info, and enrollment history.',
    },
    {
        icon: CalendarCheck,
        title: 'Attendance Tracking',
        desc: 'Record daily attendance in seconds with class-by-class roll calls, absence alerts, and historical attendance reports.',
    },
    {
        icon: BarChart3,
        title: 'Performance Analytics',
        desc: 'Track grades across terms and subjects with visual analytics that highlight trends, strengths, and areas for improvement.',
    },
    {
        icon: UsersRound,
        title: 'Parent Portal',
        desc: 'Give parents secure access to their child\'s attendance, grades, and school announcements through a dedicated portal.',
    },
    {
        icon: FolderOpen,
        title: 'Document Management',
        desc: 'Store and manage student documents — birth certificates, transfer letters, medical records — all in one secure location.',
    },
    {
        icon: LayoutGrid,
        title: 'Class Assignments',
        desc: 'Assign students to classes, sections, and houses with drag-and-drop simplicity and automatic capacity balancing.',
    },
];

export default function PlatformStudents() {
    return (
        <div className="landing">
            <Head title="Student Information System — Syscend Campus" />
            <SiteHeader />
            <main className="bg-background pt-24 pb-20">
                <div className="mx-auto max-w-6xl px-6 lg:px-10">
                    {/* Hero */}
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">Platform</p>
                        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                            Complete Student Information System
                        </h1>
                        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                            One record per child, from the day they enrol to the day they sit WASSCE —
                            guardians, medical notes, attendance and marks all in a single file.
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
