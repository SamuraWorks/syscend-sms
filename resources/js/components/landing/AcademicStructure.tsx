import { Check } from 'lucide-react';

const LEVELS = [
    { stage: 'Nursery', classes: ['Nursery 1', 'Nursery 2', 'Nursery 3'] },
    { stage: 'Primary', classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6'] },
    { stage: 'Junior Secondary', classes: ['JSS 1', 'JSS 2', 'JSS 3'] },
    { stage: 'Senior Secondary', classes: ['SSS 1', 'SSS 2', 'SSS 3'] },
];

const POINTS = [
    'Grades split into multiple sections (A, B, C or 1, 2, 3)',
    'Each section has a Form Master, students, timetable, attendance and results',
    'Configurable SSS departments: Science, Arts, Commercial, Technical',
    'Roles that match reality — Principal, Form Master, Subject Teacher, Accountant',
];

export default function AcademicStructure() {
    return (
        <section id="academic" className="scroll-mt-20 bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                            Made for Sierra Leone
                        </p>
                        <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Structured the way your schools actually work
                        </h2>
                        <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                            Rather than a generic system, Syscend Campus reflects local class structures, teacher
                            roles and national examinations — from Nursery all the way to Senior Secondary.
                        </p>

                        <ul className="mt-8 space-y-4">
                            {POINTS.map((point) => (
                                <li key={point} className="flex items-start gap-3">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-md bg-[#1f66f5] text-white">
                                        <Check className="size-3" aria-hidden="true" />
                                    </span>
                                    <span className="text-sm leading-relaxed text-slate-700">{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="relative">
                        <img
                            src="/images/classroom.jpeg"
                            alt="Students in a Sierra Leone classroom engaged in learning"
                            className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm"
                        />
                    </div>
                </div>

                <div className="reveal-grid mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {LEVELS.map((level) => (
                        <div key={level.stage} className="rounded-xl border border-slate-200 bg-white p-5">
                            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                                {level.stage}
                            </h3>
                            <ul className="mt-3 flex flex-wrap gap-2">
                                {level.classes.map((c) => (
                                    <li
                                        key={c}
                                        className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                                    >
                                        {c}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}