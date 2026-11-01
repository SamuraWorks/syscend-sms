import { Link } from '@inertiajs/react';

const STEPS = [
    {
        step: '1',
        title: 'Start your free trial',
        desc: 'Register your school, enter its class groups, and add your staff accounts.',
    },
    {
        step: '2',
        title: 'Configure your school',
        desc: 'Set terms, fee structures and staff roles. Restore existing records with a guided import.',
    },
    {
        step: '3',
        title: 'Run daily operations',
        desc: 'Attendance, fees and marks go in once — reports, exams and Ministry data come out.',
    },
];

export default function Steps() {
    return (
        <section id="steps" className="bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        Getting started
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Up and running in three steps
                    </h2>
                </div>

                <div className="reveal-grid mt-14 grid gap-6 md:grid-cols-3">
                    {STEPS.map((s) => (
                        <div key={s.step} className="relative rounded-2xl border border-slate-200 bg-white p-7">
                            <span className="grid size-11 place-items-center rounded-xl bg-[#1f66f5] text-lg font-extrabold text-white">
                                {s.step}
                            </span>
                            <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900">{s.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.desc}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <Link
                        href="/start-trial"
                        className="inline-flex h-12 items-center justify-center rounded-[8px] bg-[#1f66f5] px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(31,102,245,0.6)] transition-colors hover:bg-[#174ed7]"
                    >
                        Start free trial
                    </Link>
                </div>
            </div>
        </section>
    );
}