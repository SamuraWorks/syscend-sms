import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

export default function CTA() {
    return (
        <section id="cta" className="scroll-mt-20 bg-white pb-20 pt-4 lg:pb-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="relative overflow-hidden rounded-2xl bg-[#0f172a] px-6 py-16 text-center text-white sm:px-12 sm:py-20">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-32 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-[#1f66f5]/30 blur-[120px]"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-24 right-0 size-[320px] rounded-full bg-[#ff5b3a]/25 blur-[110px]"
                    />

                    <div className="relative mx-auto max-w-2xl">
                        <h2 className="text-balance text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                            Start with Syscend Campus today
                        </h2>
                        <p className="mt-5 text-pretty text-base leading-relaxed text-slate-300 sm:text-lg">
                            Register your school, start a free trial, and run attendance, fees and exams
                            from day one.
                        </p>
                        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link
                                href="/start-trial"
                                className="inline-flex h-12 items-center gap-2.5 rounded-[8px] bg-[#1f66f5] px-7 text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(31,102,245,0.8)] transition-colors hover:bg-[#3d7bf7]"
                            >
                                Start free trial
                                <ArrowRight className="size-4" aria-hidden="true" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex h-12 items-center rounded-[8px] border border-white/20 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                            >
                                Sign in
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}