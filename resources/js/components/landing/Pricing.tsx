import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';

const FEATURES = [
    'Unlimited students, staff & classes',
    'Attendance, marks & report cards',
    'Fees, payments & receipts',
    'Staff, payroll & HR',
    'NPSE, BECE & WASSCE exam tools',
    'Library, inventory & transport',
    'Multi-school management',
    'Works offline, syncs automatically',
    'Email & priority support',
];

export default function Pricing() {
    return (
        <section id="pricing" className="scroll-mt-20 bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        Pricing
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        One plan. Free.
                    </h2>
                    <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                        Syscend Campus is completely free for schools. Every module is included — no
                        card required, no time limit.
                    </p>
                </div>

                <div className="mx-auto mt-14 max-w-md">
                    <div className="relative flex flex-col rounded-2xl border border-[#1f66f5] bg-white p-8 shadow-[0_20px_50px_-24px_rgba(31,102,245,0.5)]">
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1f66f5] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                            Free forever
                        </span>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">Free plan</h3>
                        <div className="mt-4 flex items-baseline gap-2">
                            <span className="text-4xl font-extrabold tracking-tight text-[#1f66f5]">Le 0</span>
                            <span className="text-sm text-slate-500">/ forever</span>
                        </div>
                        <p className="mt-2 text-sm leading-relaxed text-slate-500">
                            Everything included. No hidden fees, no per-user charges, no time limit.
                        </p>

                        <ul className="mt-6 flex-1 space-y-2.5">
                            {FEATURES.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                                    <Check className="mt-0.5 size-4 shrink-0 text-[#1f66f5]" aria-hidden="true" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/start-trial"
                            className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-[8px] bg-[#1f66f5] text-sm font-semibold text-white transition-colors hover:bg-[#174ed7]"
                        >
                            Start for free
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Need help getting set up at your school?{' '}
                    <Link href="/contact" className="font-semibold text-[#1f66f5] hover:text-[#174ed7]">
                        Book setup & training
                    </Link>
                </p>
            </div>
        </section>
    );
}