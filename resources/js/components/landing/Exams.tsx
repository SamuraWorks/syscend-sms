import { GraduationCap } from 'lucide-react';

const EXAMS = [
    {
        code: 'NPSE',
        name: 'National Primary School Examination',
        desc: 'Primary 6 candidates, tracked from continuous assessment to readiness.',
    },
    {
        code: 'BECE',
        name: 'Basic Education Certificate Examination',
        desc: 'JSS 3 subject registration and results, aligned to national standards.',
    },
    {
        code: 'WASSCE',
        name: 'West African Senior School Certificate',
        desc: 'SSS 3 candidates across Science, Arts, Commercial and Technical.',
    },
];

export default function Exams() {
    return (
        <section id="exams" className="scroll-mt-20 bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        National examinations
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        The exam journey, year by year
                    </h2>
                    <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                        From a pupil&apos;s first national exam to the WASSCE certificate, candidate data carried
                        forward instead of being re-registered from scratch each year.
                    </p>
                </div>

                <div className="mt-12 space-y-4">
                    {EXAMS.map((exam, i) => (
                        <div
                            key={exam.code}
                            className="grid gap-4 rounded-2xl border border-slate-200 bg-[#f4f7fb] p-6 transition-colors hover:border-[#1f66f5]/40 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-7"
                        >
                            <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                                Stage 0{i + 1}
                            </span>
                            <div>
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#1f66f5] text-white">
                                        <GraduationCap className="size-5" aria-hidden="true" />
                                    </span>
                                    <span className="text-2xl font-extrabold tracking-tight text-slate-900">
                                        {exam.code}
                                    </span>
                                </div>
                                <h3 className="mt-3 text-sm font-semibold text-slate-800">
                                    {exam.name}
                                </h3>
                                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">
                                    {exam.desc}
                                </p>
                            </div>
                            <span className="rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600 sm:justify-self-end">
                                {['Primary 6', 'JSS 3', 'SSS 3'][i] ?? ''}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}