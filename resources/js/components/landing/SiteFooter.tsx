import { Link } from '@inertiajs/react';
import Logo from '@/components/landing/Logo';

const COLUMNS = [
    {
        title: 'Platform',
        links: [
            { label: 'Student Information', href: '/platform/students' },
            { label: 'Fee Management', href: '/platform/fees' },
            { label: 'Examinations', href: '/platform/exams' },
            { label: 'Analytics', href: '/platform/analytics' },
            { label: 'Communication', href: '/platform/communication' },
        ],
    },
    {
        title: 'Solutions',
        links: [
            { label: 'Nursery Schools', href: '/solutions/nursery' },
            { label: 'Primary Schools', href: '/solutions/primary' },
            { label: 'Secondary Schools', href: '/solutions/secondary' },
            { label: 'Combined Schools', href: '/solutions/combined' },
            { label: 'Multi-School Groups', href: '/solutions/multi-school' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Syscend', href: '/about' },
            { label: 'Vision & Mission', href: '/vision-mission' },
            { label: 'Support', href: '/support' },
            { label: 'Training', href: '/training' },
            { label: 'Contact', href: '/contact' },
        ],
    },
    {
        title: 'Legal',
        links: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Security', href: '/security' },
        ],
    },
];

export default function SiteFooter() {
    return (
        <footer className="bg-[#0f172a] text-slate-300">
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
                <div className="grid gap-10 lg:grid-cols-6">
                    <div className="lg:col-span-2">
                        <Link href="/">
                            <Logo tone="light" />
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
                            Syscend Campus is the modern school management platform for Sierra Leone:
                            student records, fees, payroll, exams and Ministry reporting in one system.
                        </p>
                    </div>

                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                                {col.title}
                            </p>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-400 transition-colors hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
                    <p className="text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} Syscend. Syscend Campus. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <Link href="/login" className="text-sm text-slate-400 transition-colors hover:text-white">
                            Sign in
                        </Link>
                        <Link href="/start-trial" className="text-sm text-slate-400 transition-colors hover:text-white">
                            Get started
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}