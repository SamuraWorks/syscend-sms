import { ShieldCheck, ArrowRight, Check } from 'lucide-react';
import { Link } from '@inertiajs/react';

const CHIPS = [
    'Works offline',
    'Multi-school',
    'NPSE · BECE · WASSCE',
    'CA scores entered once',
    'Ministry reporting',
    'Free trial',
];

export default function Hero() {
    return (
        <section id="top" className="relative overflow-hidden bg-[#f4f7fb]">
            {/* Hero background image */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <img
                    src="/images/hero-bg.jpeg"
                    alt=""
                    className="h-full w-full object-cover saturate-[1.05] contrast-[1.04]"
                />
                <div
                    className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/30 to-[#f4f7fb]"
                />
            </div>

            <div className="relative mx-auto max-w-7xl px-6 pt-32 pb-20 lg:px-10 lg:pt-40 lg:pb-28">
                <div className="mx-auto max-w-3xl">
                    {/* Text on a frosted panel so the copy stays fully legible
                        while the background image stays clearly visible */}
                    <div className="rounded-3xl bg-white/80 px-6 py-10 text-center shadow-[0_24px_60px_-30px_rgba(15,23,42,0.35)] ring-1 ring-white/70 backdrop-blur-md sm:px-12 sm:py-12">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm">
                            <ShieldCheck className="size-3.5 text-[#1f66f5]" aria-hidden="true" />
                            School management made for Sierra Leone
                        </span>

                        <h1 className="mt-7 text-balance text-4xl font-extrabold tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-6xl">
                            Run your whole school on one system, not{' '}
                            <span className="whitespace-nowrap text-[#1f66f5]">six registers.</span>
                        </h1>

                        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-slate-600">
                            Syscend Campus unifies student records, attendance, fees, staff, and
                            national examinations — and keeps working when the network drops, then
                            syncs when you&apos;re back online.
                        </p>

                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/start-trial"
                                className="inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#1f66f5] px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(31,102,245,0.6)] transition-colors hover:bg-[#174ed7]"
                            >
                                Start free trial
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href="/request-demo"
                                className="inline-flex h-12 items-center justify-center rounded-[8px] border border-slate-300 bg-white px-7 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:text-slate-900"
                            >
                                Book a demo
                            </Link>
                        </div>

                        <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                            {CHIPS.map((chip) => (
                                <li key={chip} className="flex items-center gap-1.5 text-sm text-slate-500">
                                    <Check className="size-3.5 text-[#1f66f5]" aria-hidden="true" />
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Dashboard screenshot */}
                <div className="relative mx-auto mt-16 max-w-5xl">
                    <div
                        aria-hidden="true"
                        className="absolute -inset-x-8 -top-8 -bottom-8 rounded-[24px] bg-gradient-to-b from-[#1f66f5]/10 via-[#f4f7fb] to-[#ff5b3a]/10 blur-2xl"
                    />
                    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.35)]">
                        <img
                            src="/images/dashboard.jpeg"
                            alt="Syscend Campus dashboard showing school operations"
                            className="w-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}