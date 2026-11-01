import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
    {
        q: 'Does Syscend Campus work offline?',
        a: 'Yes. Attendance, marks and other daily entries are saved locally and synced automatically when the network returns. We built Syscend for schools that face connection drops.',
    },
    {
        q: 'Which examinations are supported?',
        a: 'NPSE, BECE and WASSCE. Continuous assessment is recorded as your teachers already do it, and the same marks flow into term reports and exam preparation.',
    },
    {
        q: 'Can one installation run multiple schools?',
        a: 'Yes. A school group or diocese can manage many schools in a single installation, each with its own students, fees, terms and reports — fully isolated from one another.',
    },
    {
        q: 'Is my school data secure?',
        a: 'Data is isolated per school, access is role-based, and the platform ships with audit logging, approvals and multi-factor authentication options.',
    },
    {
        q: 'How does Ministry reporting work?',
        a: 'Enrollment figures, exam data and regulatory submissions are generated from records your school already entered — no re-typing for district or national reporting.',
    },
    {
        q: 'What does it cost?',
        a: 'Nothing. Syscend Campus is free for schools — every module is included, with no card required and no time limit. See the pricing section above.',
    },
];

export default function FAQ() {
    const [open, setOpen] = useState<number | null>(0);

    return (
        <section id="faq" className="scroll-mt-20 bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-3xl px-6 lg:px-10">
                <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        FAQ
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Questions we hear often
                    </h2>
                </div>

                <div className="reveal-grid mt-12 space-y-3">
                    {FAQS.map((faq, i) => {
                        const isOpen = open === i;
                        return (
                            <div
                                key={faq.q}
                                className={cn(
                                    'overflow-hidden rounded-xl border bg-white transition-colors',
                                    isOpen ? 'border-[#1f66f5]/40' : 'border-slate-200',
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpen(isOpen ? null : i)}
                                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-sm font-semibold text-slate-900">{faq.q}</span>
                                    <ChevronDown
                                        className={cn('size-5 shrink-0 text-slate-400 transition-transform', isOpen && 'rotate-180')}
                                        aria-hidden="true"
                                    />
                                </button>
                                {isOpen && (
                                    <p className="border-t border-slate-100 px-6 py-5 text-sm leading-relaxed text-slate-600">
                                        {faq.a}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}