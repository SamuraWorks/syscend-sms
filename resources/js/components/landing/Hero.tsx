import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import Logo from '@/components/landing/Logo';

export default function Hero() {
    return (
        <section id="top" className="relative flex min-h-[92svh] items-center overflow-hidden bg-[#0b1f33] lg:min-h-screen">
            {/* Full-bleed photography */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <img
                    src="/images/hero-bg.jpeg"
                    alt=""
                    className="h-full w-full object-cover object-center"
                />
                {/* Subtle cinematic gradient: lighter at the top, deeper where the text sits */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/65" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
            </div>

            <div className="relative z-10 mx-auto w-full max-w-5xl px-5 pb-20 pt-28 text-center sm:px-8 lg:pb-28 lg:pt-32">
                {/* Existing Syscend logo, directly over the photograph */}
                <div className="mb-8 flex justify-center">
                    <Logo tone="light" />
                </div>

                {/* Security badge — the only small container allowed */}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/95 backdrop-blur-sm">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Secure cloud school management for Sierra Leone
                </span>

                {/* Headline sits directly on the photograph — no background */}
                <h1 className="mt-7 text-balance text-[2.7rem] font-extrabold leading-[1.05] tracking-[-0.03em] text-white sm:text-6xl lg:mt-9 lg:text-7xl lg:leading-[1.02]">
                    YOUR SCHOOL DESERVES MORE THAN SIX REGISTERS.
                </h1>

                <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg lg:mt-8">
                    One platform for everything that keeps your school running. From admissions and academics to finance, staff, students, parents, and records — Syscend Campus brings it all together in one secure digital system.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row lg:mt-12">
                    <Link
                        href="/start-trial"
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-white px-7 text-sm font-semibold text-slate-900 shadow-xl shadow-black/10 transition-colors hover:bg-slate-100 sm:w-auto"
                    >
                        Start Free Trial
                        <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                    <a
                        href="#modules"
                        className="inline-flex h-12 w-full items-center justify-center rounded-[8px] border border-white/40 bg-white/10 px-7 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20 sm:w-auto"
                    >
                        Explore Platform
                    </a>
                </div>
            </div>
        </section>
    );
}