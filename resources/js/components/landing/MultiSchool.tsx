import { Building2, Palette, CalendarRange, Lock } from 'lucide-react';

const FEATURES = [
    {
        icon: Building2,
        title: 'Many schools, one system',
        desc: 'A single installation supports multiple schools, each with its own students, teachers and data.',
    },
    {
        icon: Palette,
        title: 'Own branding',
        desc: 'Every school keeps its own identity, academic calendar, fee structure and reports.',
    },
    {
        icon: Lock,
        title: 'Complete isolation',
        desc: "Schools can never access one another's information — data stays private and secure.",
    },
    {
        icon: CalendarRange,
        title: 'Independent calendars',
        desc: 'Terms, sessions and events are managed per school, on its own timeline.',
    },
];

export default function MultiSchool() {
    return (
        <section id="multi-school" className="scroll-mt-20 bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                            Multi-school management
                        </p>
                        <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            One campus, a school group, or a diocese with forty schools
                        </h2>
                        <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                            Every school inherits the platform but runs its own terms, fees and reports.
                            Nothing leaks between them. Manage a single campus or an entire network from one place.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {FEATURES.map((f) => (
                            <div
                                key={f.title}
                                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-[#1f66f5]/40"
                            >
                                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1f66f5]/10 text-[#1f66f5]">
                                    <f.icon className="size-5" aria-hidden="true" />
                                </span>
                                <div>
                                    <h3 className="text-base font-semibold text-slate-900">{f.title}</h3>
                                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}