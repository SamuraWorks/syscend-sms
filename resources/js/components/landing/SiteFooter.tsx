import { Link } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import Logo from '@/components/landing/Logo';

const CONTACTS = [
    {
        label: 'Chat with us on WhatsApp',
        href: 'https://wa.me/23279630777',
        icon: (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
        ),
    },
    {
        label: 'Follow us on GitHub',
        href: 'https://github.com/SamuraWorks/syscend-sms',
        icon: (
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
                <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
        ),
    },
    {
        label: 'Email Syscend',
        href: 'mailto:syscend@gmail.com',
        icon: <Mail className="size-4" aria-hidden="true" />,
    },
];

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
                        <div className="mt-6 flex items-center gap-3">
                            {CONTACTS.map((c) => (
                                <a
                                    key={c.label}
                                    href={c.href}
                                    target={c.href.startsWith('http') ? '_blank' : undefined}
                                    rel={c.href.startsWith('http') ? 'noreferrer' : undefined}
                                    aria-label={c.label}
                                    className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/5 text-slate-300 transition-colors hover:border-white/40 hover:text-white"
                                >
                                    {c.icon}
                                </a>
                            ))}
                        </div>
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