import { Landmark } from 'lucide-react';

export default function MinistryPortal() {
    return (
        <section id="ministry" className="scroll-mt-20 bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                            National Oversight
                        </p>
                        <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Ministry of Education Portal
                        </h2>
                        <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                            When a district officer needs enrollment figures, they shouldn&apos;t wait for a school
                            to retype them. Data registered in Syscend Campus flows toward the national
                            oversight platform — so reporting matches what the school actually recorded.
                        </p>

                        <ul className="mt-6 space-y-3">
                            {[
                                'Enrollment figures district officers can actually trust',
                                'National exam data sync (NPSE, BECE, WASSCE)',
                                'Accreditation and inspection readiness',
                                'Regulatory submissions without re-entering figures',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#1f66f5]/10 text-[#1f66f5]">
                                        <Landmark className="size-3" aria-hidden="true" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="flex items-center justify-center">
                        <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-[#f4f7fb] p-10 text-center shadow-sm">
                            <span className="grid mx-auto size-16 place-items-center rounded-xl bg-[#1f66f5]/10 text-[#1f66f5]">
                                <Landmark className="size-8" aria-hidden="true" />
                            </span>
                            <h3 className="mt-6 text-xl font-bold tracking-tight text-slate-900">Ministry of Education</h3>
                            <p className="mt-2 text-sm text-slate-500">Sierra Leone</p>
                            <div className="mt-6 space-y-1.5">
                                <p className="text-xs text-slate-500">
                                    National Oversight & Policy Analytics
                                </p>
                            </div>
                            <div className="mt-6 h-px bg-slate-200" />
                            <p className="mt-4 text-xs leading-relaxed text-slate-500">
                                Integrated with Syscend Campus for government reporting and compliance.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}