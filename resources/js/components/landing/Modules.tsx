import { Link } from '@inertiajs/react';
import {
    Users,
    ClipboardCheck,
    CalendarDays,
    GraduationCap,
    FileText,
    ArrowUpRight,
    Wallet,
    Banknote,
    BriefcaseBusiness,
    Library,
    Boxes,
    Bus,
    MessagesSquare,
    BarChart3,
    ArrowRight,
} from 'lucide-react';

const FEATURED = {
    icon: GraduationCap,
    title: 'Examinations',
    desc: 'The workflow teachers already follow, without the ledger.',
    href: '/school/exams',
    detail: 'Teachers record continuous assessment marks as they go. Syscend Campus then carries those marks into term reports, NPSE, BECE and WASSCE preparation — no re-entry, no transcription errors.',
};

const MODULES = [
    { icon: Users, title: 'Student Information', desc: 'Central records, admissions and enrollment for every pupil.', href: '/school/students' },
    { icon: ClipboardCheck, title: 'Attendance', desc: 'Daily class and subject attendance with instant summaries.', href: '/school/attendance' },
    { icon: CalendarDays, title: 'Timetable', desc: 'Build section timetables for teachers and students.', href: '/school/timetable' },
    { icon: FileText, title: 'Report Cards', desc: 'Generate professional term reports automatically.', href: '/school/reports/academic' },
    { icon: ArrowUpRight, title: 'Promotion', desc: 'Move students between classes and sections with ease.', href: '/school/students' },
    { icon: Wallet, title: 'Fee Management', desc: 'Invoices, payments, balances and fee reporting.', href: '/school/fees/payments' },
    { icon: Banknote, title: 'Payroll', desc: 'Manage staff salaries, deductions and payslips.', href: '/school/hr/payroll' },
    { icon: BriefcaseBusiness, title: 'HR', desc: 'Staff profiles, roles and permissions in one place.', href: '/school/staff' },
    { icon: Library, title: 'Library', desc: 'Catalogue books, track lending and returns.', href: '/school/library/books' },
    { icon: Boxes, title: 'Inventory', desc: 'Track school assets, supplies and stock levels.', href: '/school/inventory/items' },
    { icon: Bus, title: 'Transport', desc: 'Routes, vehicles and student transport logistics.', href: '/school/transport/vehicles' },
    { icon: MessagesSquare, title: 'Communication', desc: 'Notifications and messaging across the school community.', href: '/school/communication/announcements' },
    { icon: BarChart3, title: 'Analytics', desc: 'Dashboards and insights on every part of operations.', href: '/school/reports/dashboard' },
];

export default function Modules() {
    return (
        <section id="modules" className="scroll-mt-20 bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                        One platform, every operation
                    </p>
                    <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                        Twenty modules, no duplicate entries
                    </h2>
                    <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                        One enrollment feeds attendance, fees, examinations and reports. What you enter once
                        shows up everywhere it&apos;s needed — and nowhere it isn&apos;t.
                    </p>
                </div>

                {/* Featured module + screenshot */}
                <div className="mt-14 grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
                    <div className="order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 rounded-lg bg-[#1f66f5]/10 px-3 py-1.5">
                            <span className="grid size-7 place-items-center rounded-md bg-[#1f66f5] text-white">
                                <FEATURED.icon className="size-3.5" aria-hidden="true" />
                            </span>
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#1f66f5]">
                                Core Module
                            </span>
                        </div>

                        <h3 className="mt-5 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            {FEATURED.title}
                        </h3>
                        <p className="mt-3 text-pretty text-base leading-relaxed text-slate-600">
                            {FEATURED.detail}
                        </p>

                        <ul className="mt-6 space-y-3">
                            {['CA scores entered once, used everywhere', 'NPSE, BECE & WASSCE candidate tracking', 'Term reports generated from the same marks', 'Promotion lists straight from the results'].map((item) => (
                                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#1f66f5]/10 text-[#1f66f5]">
                                        <FEATURED.icon className="size-3" aria-hidden="true" />
                                    </span>
                                    {item}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href={FEATURED.href}
                            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[#1f66f5] transition-colors hover:text-[#174ed7]"
                        >
                            Explore examinations
                            <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="order-1 lg:order-2">
                        <Link href={FEATURED.href}>
                            <img
                                src="/images/dashboard.jpeg"
                                alt="Syscend Campus dashboard showing examination management"
                                className="w-full rounded-2xl border border-slate-200 object-cover shadow-sm transition-shadow hover:shadow-md"
                            />
                        </Link>
                    </div>
                </div>

                {/* Module grid — linked cards */}
                <div className="reveal-grid mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {MODULES.map((mod) => (
                        <Link
                            key={mod.title}
                            href={mod.href}
                            className="group rounded-xl border border-slate-200 bg-white p-5 transition-all duration-200 hover:border-[#1f66f5]/40 hover:shadow-md"
                        >
                            <span className="grid size-10 place-items-center rounded-lg bg-[#1f66f5]/10 text-[#1f66f5] transition-colors group-hover:bg-[#1f66f5] group-hover:text-white">
                                <mod.icon className="size-5" aria-hidden="true" />
                            </span>
                            <h3 className="mt-4 text-sm font-semibold text-slate-900">{mod.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-slate-500">{mod.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}