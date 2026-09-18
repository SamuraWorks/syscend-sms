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
    { icon: Crown, label: 'Super Admin' },
    { icon: Building, label: 'School Owner' },
    { icon: ShieldUser, label: 'Administrator' },
    { icon: School, label: 'Principal' },
    { icon: Presentation, label: 'Teacher' },
    { icon: UserCog, label: 'Form Master' },
    { icon: BookOpen, label: 'Subject Teacher' },
    { icon: User, label: 'Student' },
    { icon: Users, label: 'Parent / Guardian' },
    { icon: Calculator, label: 'Accountant' },
    { icon: Library, label: 'Librarian' },
    { icon: Bus, label: 'Transport Officer' },
    { icon: BedDouble, label: 'Hostel Manager' },
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
                            <span
                                key={role.label}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-[#1f66f5]/40 hover:text-[#1f66f5]"
                            >
                                <role.icon className="size-4 text-[#1f66f5]" aria-hidden="true" />
                                {role.label}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}