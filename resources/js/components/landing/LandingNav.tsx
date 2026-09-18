import { Link } from '@inertiajs/react';

const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Solutions', href: '#solutions' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'About', href: '#about' },
    { label: 'Contact', href: '#contact' },
];

export default function LandingNav() {
    return (
        <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/95">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                    <div className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">Syscend Campus</div>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">School ERP</span>
                </div>

                <nav className="hidden items-center gap-8 lg:flex">
                    {navItems.map((item) => (
                        <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950 dark:text-slate-300 dark:hover:text-white">
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 sm:flex">
                    <Link
                        href="/login"
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-500 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                    >
                        Login
                    </Link>
                    <Link
                        href="/login"
                        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700"
                    >
                        Get Started
                    </Link>
                </div>
            </div>
        </header>
    );
}
