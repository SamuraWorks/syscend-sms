import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/landing/Logo';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
    { label: 'Overview', href: '#top' },
    { label: 'Modules', href: '#modules' },
    { label: 'Exams', href: '#exams' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
];

export default function SiteHeader() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-colors',
                scrolled
                    ? 'bg-white shadow-[0_1px_0_0_rgba(15,23,42,0.08),0_8px_24px_-12px_rgba(15,23,42,0.18)]'
                    : 'bg-white/80 backdrop-blur-md',
            )}
        >
            <div
                className="flex h-[72px] items-center justify-between px-8 lg:px-16"
            >
                <Link href="/" aria-label="Syscend Campus home" className="inline-flex">
                    <Logo tone="dark" />
                </Link>

                <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-4 lg:flex">
                    <Link
                        href="/register"
                        className="inline-flex items-center px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                    >
                        Find your school
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-slate-900"
                    >
                        Sign in
                    </Link>
                    <Link
                        href="/start-trial"
                        className="inline-flex h-10 items-center rounded-[8px] bg-[#1f66f5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#174ed7]"
                    >
                        Get started
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="inline-flex size-9 items-center justify-center rounded-md text-slate-700 lg:hidden"
                    aria-label={open ? 'Close menu' : 'Open menu'}
                    aria-expanded={open}
                >
                    {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
            </div>

            {open && (
                <div className="border-t border-slate-200 bg-white lg:hidden">
                    <nav className="mx-auto flex max-w-7xl flex-col px-6 py-4" aria-label="Mobile">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setOpen(false)}
                                className="py-2.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
                            >
                                {link.label}
                            </a>
                        ))}
                        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
                            <Link
                                href="/register"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                            >
                                Find your school
                            </Link>
                            <Link
                                href="/login"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center rounded-[8px] border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                            >
                                Sign in
                            </Link>
                            <Link
                                href="/start-trial"
                                onClick={() => setOpen(false)}
                                className="inline-flex items-center justify-center rounded-[8px] bg-[#1f66f5] px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Get started
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}