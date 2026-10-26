import { useEffect, useMemo, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navGroups, type NavItem } from './Sidebar';
import type { PageProps } from '@/Types';

const priorityLabels: Record<string, string[]> = {
    'super-admin': ['Executive Dashboard', 'Schools', 'All Users', 'Performance Analytics'],
    'ministry-admin': ['National Dashboard', 'National Registry', 'National Students', 'National Overview'],
    'district-officer': ['National Dashboard', 'National Registry', 'National Students', 'National Overview'],
    principal: ['Executive Dashboard', 'Students', 'Attendance', 'Results'],
    'school-admin': ['Dashboard', 'Students', 'Attendance', 'Fees'],
    teacher: ['Teacher Dashboard', 'My Classes', 'Attendance', 'My Students'],
    accountant: ['Accountant Dashboard', 'Fee Payments', 'Payroll', 'Finance Reports'],
    librarian: ['Librarian Dashboard', 'Books', 'Issue / Return', 'Library Reports'],
    driver: ['Driver Dashboard', 'My Route', 'Students', 'Attendance'],
    warden: ['Warden Dashboard', 'Hostel', 'Students', 'Allocations'],
    'store-manager': ['Store Dashboard', 'Inventory', 'Stock In', 'Stock Out'],
    student: ['My Dashboard', 'My Subjects', 'My Timetable', 'My Results'],
    parent: ['Parent Dashboard', 'My Children', 'Attendance', 'Fees'],
    receptionist: ['Reception Dashboard', 'Students', 'Admissions', 'Visitors'],
};

function isActive(item: NavItem, pathname: string) {
    return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export default function MobileBottomNav() {
    const { auth, url } = usePage<PageProps & { url?: string }>().props;
    const [moreOpen, setMoreOpen] = useState(false);
    const role = auth?.user?.activeRole ?? auth?.user?.role ?? '';
    const pathname = url ?? (typeof window === 'undefined' ? '' : window.location.pathname);

    const items = useMemo(() => navGroups
        .flatMap((group) => group.items)
        .filter((item, index, all) => item.roles?.includes(role) && all.findIndex((candidate) => candidate.href === item.href) === index), [role]);

    const primaryItems = useMemo(() => {
        const preferred = priorityLabels[role] ?? [];
        const selected = preferred.map((label) => items.find((item) => item.label === label)).filter(Boolean) as NavItem[];
        return [...selected, ...items.filter((item) => !selected.some((selectedItem) => selectedItem.href === item.href))].slice(0, 4);
    }, [items, role]);

    const moreItems = items.filter((item) => !primaryItems.some((primary) => primary.href === item.href));

    useEffect(() => {
        if (!moreOpen) return;
        const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && setMoreOpen(false);
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [moreOpen]);

    if (!auth?.user || items.length === 0) return null;

    return (
        <>
            {moreOpen && (
                <div className="fixed inset-0 z-[60] bg-black/35 md:hidden" onClick={() => setMoreOpen(false)} aria-hidden="true" />
            )}
            <section
                id="mobile-more-menu"
                className={cn(
                    'fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl border-t border-border bg-card shadow-[0_-12px_35px_rgba(15,23,42,0.16)] transition-transform duration-200 md:hidden',
                    moreOpen ? 'translate-y-0' : 'translate-y-full',
                )}
                aria-label="More navigation options"
                aria-hidden={!moreOpen}
            >
                <div className="mx-auto max-h-[min(70vh,520px)] max-w-lg overflow-y-auto px-4 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-3">
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-foreground">More options</p>
                            <p className="text-xs text-muted-foreground">All sections available to you</p>
                        </div>
                        <button type="button" onClick={() => setMoreOpen(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-muted" aria-label="Close more options">
                            <X className="size-5" />
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {moreItems.map((item) => {
                            const Icon = item.icon;
                            return <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)} className={cn('flex min-h-16 items-center gap-3 rounded-xl border border-border px-3 text-sm font-medium transition-colors hover:bg-accent', isActive(item, pathname) && 'border-primary/30 bg-primary/10 text-primary')}>
                                <Icon className="size-5 shrink-0" aria-hidden="true" />
                                <span>{item.label}</span>
                            </Link>;
                        })}
                    </div>
                </div>
            </section>
            <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E4E7EC] bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_18px_rgba(15,23,42,0.08)] md:hidden" aria-label="Mobile navigation">
                <div className="mx-auto grid min-h-16 max-w-lg grid-cols-5 px-1">
                    {primaryItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item, pathname);
                        return <Link key={item.href} href={item.href} className={cn('flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors', active && 'text-primary')} aria-current={active ? 'page' : undefined}>
                            <span className={cn('flex size-7 items-center justify-center rounded-lg', active && 'bg-primary/10')}><Icon className="size-[18px]" aria-hidden="true" /></span>
                            <span className="max-w-full truncate">{item.label.replace(' Dashboard', '')}</span>
                        </Link>;
                    })}
                    <button type="button" onClick={() => setMoreOpen(true)} className={cn('flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-muted-foreground transition-colors', moreOpen && 'text-primary')} aria-expanded={moreOpen} aria-controls="mobile-more-menu">
                        <span className={cn('flex size-7 items-center justify-center rounded-lg', moreOpen && 'bg-primary/10')}><MoreHorizontal className="size-[18px]" aria-hidden="true" /></span>
                        <span>More</span>
                    </button>
                </div>
            </nav>
        </>
    );
}
