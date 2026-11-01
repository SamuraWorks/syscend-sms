import { Link } from '@inertiajs/react';
import {
    Crown,
    Building,
    ShieldUser,
    School,
    Presentation,
    UserCog,
    BookOpen,
    User,
    Users,
    Calculator,
    Library,
    Bus,
    BedDouble,
} from 'lucide-react';

const ROLES = [
    { icon: Crown, label: 'Super Admin', href: '/super-admin/dashboard' },
    { icon: Building, label: 'School Owner', href: '/school/proprietor/dashboard' },
    { icon: ShieldUser, label: 'Administrator', href: '/school/reports/dashboard' },
    { icon: School, label: 'Principal', href: '/school/principal/dashboard' },
    { icon: Presentation, label: 'Teacher', href: '/school/teacher/dashboard' },
    { icon: UserCog, label: 'Form Master', href: '/school/teacher/dashboard' },
    { icon: BookOpen, label: 'Subject Teacher', href: '/school/teacher/dashboard' },
    { icon: User, label: 'Student', href: '/school/student/dashboard' },
    { icon: Users, label: 'Parent / Guardian', href: '/school/parent/dashboard' },
    { icon: Calculator, label: 'Accountant', href: '/school/accountant/dashboard' },
    { icon: Library, label: 'Librarian', href: '/school/librarian/dashboard' },
    { icon: Bus, label: 'Transport Officer', href: '/school/driver/dashboard' },
    { icon: BedDouble, label: 'Hostel Manager', href: '/school/warden/dashboard' },
];

export default function Roles() {
    return (
        <section id="roles" className="scroll-mt-20 bg-white py-20 lg:py-28">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1f66f5]">
                            Everyone logs in somewhere sensible
                        </p>
                        <h2 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                            Thirteen roles, one directory
                        </h2>
                        <p className="mt-5 text-pretty text-lg leading-relaxed text-slate-600">
                            A parent sees results and invoices. A teacher sees their classes. The accountant
                            sees money. The principal sees everything — and the Ministry portal sees what the
                            Ministry is supposed to see.
                        </p>
                    </div>

                    <div className="flex flex-wrap content-center justify-center gap-3 self-center">
                        {ROLES.map((role) => (
                            <Link
                                key={role.label}
                                href={role.href}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-[#1f66f5]/40 hover:text-[#1f66f5]"
                            >
                                <role.icon className="size-4 text-[#1f66f5]" aria-hidden="true" />
                                {role.label}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
