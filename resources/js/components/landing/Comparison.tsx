import { X, Check } from 'lucide-react';

const WITHOUT = [
    'Attendance in three class registers nobody can reconcile',
    'Fee receipts kept in a notebook, balances argued at reopening',
    'Results retyped for report cards, NPSE, BECE and WASSCE separately',
    'Ministry figures reconstructed by hand each reporting cycle',
];

const WITH = [
    'One shared database: attendance, marks and fees come from the same entry',
    'Fee balances and receipts tracked per student automatically',
    'Marks entered once, used for reports and national exams',
    'Ministry reports generated directly from daily records',
];

export default function Comparison() {
    return (
        <section id="comparison" className="bg-[#f4f7fb] py-20 lg:py-28">
            <div className="mx-auto max-w-6xl px-6 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        All-in-one platform
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Replace scattered tools with one system.
                    </h2>
                    <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                        The same books, the same exams, the same type of counting — entered once, everywhere.
                    </p>
                </div>

                <div className="reveal-grid mt-14 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8">
                        <p className="text-sm font-bold uppercase tracking-wider text-slate-900">
                            Without Syscend Campus
                        </p>
                        <ul className="mt-6 space-y-4">
                            {WITHOUT.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-slate-600">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-red-50 text-red-500">
                                        <X className="size-3" aria-hidden="true" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-[#1f66f5]/30 bg-white p-8 shadow-[0_16px_40px_-24px_rgba(31,102,245,0.4)]">
                        <p className="text-sm font-bold uppercase tracking-wider text-[#1f66f5]">
                            With Syscend Campus
                        </p>
                        <ul className="mt-6 space-y-4">
                            {WITH.map((item) => (
                                <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                                        <Check className="size-3" aria-hidden="true" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}