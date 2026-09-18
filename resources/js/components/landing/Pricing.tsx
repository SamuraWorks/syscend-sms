import { Link } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
    {
        name: 'Small school',
        price: 'Le 850',
        period: '/term',
        tagline: 'For a single small school getting organised.',
        features: ['Up to 20 staff accounts', 'Student information & attendance', 'Fees & payments', 'Report cards', 'NPSE, BECE & WASSCE exam tools', 'Email support'],
        highlighted: false,
    },
    {
        name: 'Large school',
        price: 'Le 1,400',
        period: '/term',
        tagline: 'For larger schools and multi-branch campuses.',
        features: ['Unlimited staff accounts', 'Everything in Small school', 'Multi-school management', 'Payroll & HR', 'Library, inventory & transport', 'Priority support'],
        highlighted: true,
    },
    {
        name: 'Setup & training',
        price: 'Talk to us',
        period: '',
        tagline: 'On-site setup and staff training at your school.',
        features: ['Full deployment on your equipment', 'Data migration & import', 'Hands-on staff training', 'School travels responsible for travel, lodging & feeding'],
        highlighted: false,
        ctaLabel: 'Book setup & training',
        ctaHref: '/contact',
    },
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
                        Plans that grow with your school.
                    </h2>
                    <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                        Simple per-term pricing. No hidden fees, no per-user surprises. Prices in new
                        Leones.
                    </p>
                </div>

                <div className="reveal-grid mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.name}
                            className={cn(
                                'relative flex flex-col rounded-2xl border bg-white p-6',
                                plan.highlighted
                                    ? 'border-[#1f66f5] shadow-[0_20px_50px_-24px_rgba(31,102,245,0.5)]'
                                    : 'border-slate-200',
                            )}
                        >
                            {plan.highlighted && (
                                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#1f66f5] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                                    Most popular
                                </span>
                            )}
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                                {plan.name}
                            </h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className={cn('text-3xl font-extrabold tracking-tight', plan.highlighted ? 'text-[#1f66f5]' : 'text-slate-900')}>
                                    {plan.price}
                                </span>
                                <span className="text-sm text-slate-500">{plan.period}</span>
                            </div>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500">{plan.tagline}</p>

                            <ul className="mt-6 flex-1 space-y-2.5">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                                        <Check className="mt-0.5 size-4 shrink-0 text-[#1f66f5]" aria-hidden="true" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href={plan.ctaHref ?? '/start-trial'}
                                className={cn(
                                    'mt-8 inline-flex h-11 w-full items-center justify-center rounded-[8px] text-sm font-semibold transition-colors',
                                    plan.highlighted
                                        ? 'bg-[#1f66f5] text-white hover:bg-[#174ed7]'
                                        : 'border border-slate-300 bg-white text-slate-700 hover:border-slate-400',
                                )}
                            >
                                {plan.ctaLabel ?? 'Start free trial'}
                            </Link>
                        </div>
                    ))}
                </div>

                <p className="mt-8 text-center text-sm text-slate-500">
                    Need a plan built around your school or school group?{' '}
                    <Link href="/contact" className="font-semibold text-[#1f66f5] hover:text-[#174ed7]">
                        Talk to sales
                    </Link>
                </p>
            </div>
        </section>
    );
}