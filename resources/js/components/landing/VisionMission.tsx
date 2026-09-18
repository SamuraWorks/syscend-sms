import { Target, Compass } from 'lucide-react';

export default function VisionMission() {
    return (
        <section className="bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="grid lg:grid-cols-2">
                        <div className="border-b border-slate-200 p-8 sm:p-10 lg:border-b-0 lg:border-r">
                            <span className="grid size-10 place-items-center rounded-lg bg-[#1f66f5]/10 text-[#1f66f5]">
                                <Compass className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">The vision</h3>
                            <p className="mt-3 text-pretty leading-relaxed text-slate-600">
                                Every school in Sierra Leone runs its records, fees and results digitally — not
                                because a vendor promised modernisation, but because the head teacher&apos;s office
                                genuinely became easier to run.
                            </p>
                        </div>

                        <div className="bg-[#ff5b3a]/[0.04] p-8 sm:p-10">
                            <span className="grid size-10 place-items-center rounded-lg bg-[#ff5b3a]/10 text-[#ff5b3a]">
                                <Target className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-900">The approach</h3>
                            <p className="mt-3 text-pretty leading-relaxed text-slate-600">
                                Build the platform around how schools here already work — their class groups, their
                                national exams, their way of collecting fees — so adoption is a matter of days, not
                                semesters.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}