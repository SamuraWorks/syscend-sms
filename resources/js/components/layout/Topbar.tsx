import { Link, router, usePage } from '@inertiajs/react';
import { Moon, Sun, LogOut, User, KeyRound, Check, Bell, ExternalLink, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/Stores/useAuthStore';
import { useUIStore } from '@/Stores/useUIStore';
import { useEffect, useState } from 'react';
import type { PageProps } from '@/Types';
import ProfileAvatar from '@/components/ProfileAvatar';

/** Live unread badge for the platform notification centre. */
interface NotificationItem {
    id: string;
    title: string;
    body: string;
    created_at: string | null;
    read: boolean;
    url?: string | null;
}

function NotificationBell() {
    const [count, setCount] = useState(0);
    const [items, setItems] = useState<NotificationItem[]>([]);
    const [open, setOpen] = useState(false);

    async function load() {
        try {
            const res = await fetch('/notifications/summary', { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
            if (!res.ok) return;
            const data = await res.json();
            setCount(data.unread_count ?? 0);
            setItems(data.notifications ?? []);
        } catch { /* notification centre is best-effort */ }
    }

    useEffect(() => {
        load();
        const id = window.setInterval(load, 15000);
        return () => window.clearInterval(id);
    }, []);

    async function markRead(id: string) {
        await fetch(`/notifications/${id}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '', Accept: 'application/json' }, credentials: 'same-origin' });
        setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
        setCount((current) => Math.max(0, current - 1));
    }

    async function markAllRead() {
        await fetch('/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '', Accept: 'application/json' }, credentials: 'same-origin' });
        setItems((current) => current.map((item) => ({ ...item, read: true })));
        setCount(0);
    }

    return (
        <div className="relative">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground" title="Notifications" aria-label="Notifications" onClick={() => { setOpen((current) => !current); if (!open) load(); }}>
                <Bell className="w-4 h-4" />
                {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">{count > 99 ? '99+' : count}</span>}
            </Button>
            {open && (
                <div className="fixed inset-x-3 top-[4.25rem] z-[60] max-h-[calc(100vh-5.5rem)] overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-96">
                    <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><p className="text-sm font-semibold">Notifications</p><p className="text-xs text-muted-foreground">Relevant updates for your role</p></div>{count > 0 && <button type="button" className="text-xs text-primary" onClick={markAllRead}><CheckCheck className="mr-1 inline size-3" />Mark all read</button>}</div>
                    <div className="max-h-80 overflow-y-auto">{items.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p> : items.map((item) => <div key={item.id} className={`border-b border-border px-4 py-3 ${!item.read ? 'bg-primary/[0.04]' : ''}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.body}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.created_at ? new Date(item.created_at).toLocaleString() : ''}</p></div>{!item.read && <button type="button" className="shrink-0 text-xs text-primary" onClick={() => markRead(item.id)}>Read</button>}</div>{item.url && <a href={item.url} className="mt-2 inline-flex items-center text-xs text-primary">View details <ExternalLink className="ml-1 size-3" /></a>}</div>)}</div>
                    <a href="/communication/notifications" className="block border-t border-border px-4 py-3 text-center text-xs font-medium text-primary hover:bg-muted">View all notifications</a>
                </div>
            )}
        </div>
    );
}

const roleColors: Record<string, string> = {
    'super-admin':   'bg-primary/10 text-primary',
    'school-admin':  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
    'principal':     'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    'teacher':       'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
    'accountant':    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    'librarian':     'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
    'student':       'bg-accent text-accent-foreground',
    'parent':        'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
};

interface TopbarProps {
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function Topbar({ title, breadcrumbs }: TopbarProps) {
    const { auth, schoolBranding, platformLogoUrl } = usePage<PageProps>().props;
    const { theme, setTheme } = useAuthStore();

    const user = auth.user;
    const brandName = schoolBranding?.short_name || schoolBranding?.name || 'Syscend Campus';
    const mobileLogo = schoolBranding?.logo_url || schoolBranding?.badge_url || platformLogoUrl || '/images/logo.png';
    const allRoles = user?.roles ?? [];
    const activeRole = user?.activeRole ?? user?.role ?? '';
    const roleLabel = activeRole.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const roleClass = roleColors[activeRole] ?? 'bg-secondary text-secondary-foreground';
    const primaryColor = schoolBranding?.primary_color;
    const hasMultipleRoles = allRoles.length > 1;

    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') root.classList.add('dark');
        else if (theme === 'light') root.classList.remove('dark');
        else {
            window.matchMedia('(prefers-color-scheme: dark)').matches
                ? root.classList.add('dark')
                : root.classList.remove('dark');
        }
    }, [theme]);

    function switchRole(role: string) {
        if (role === activeRole) return;
        router.post('/school/switch-role', { role }, { preserveScroll: true });
    }

    return (
        <header className="relative h-16 flex items-center justify-between px-4 border-b border-border bg-card shrink-0">
            {/* School branding accent line */}
            {primaryColor && (
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: primaryColor }} />
            )}
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
                {/* Mobile logo */}
                <Link href="/" className="flex md:hidden items-center gap-2 min-w-0">
                    <span className="flex size-8 items-center justify-center shrink-0 overflow-hidden rounded-full ring-1 ring-black/10">
                        <img src={mobileLogo} alt="" className="size-full rounded-full object-cover" />
                    </span>
                    <span className="font-bold text-sm text-foreground truncate">{brandName}</span>
                </Link>

                {/* Breadcrumbs / title — desktop */}
                <div className="hidden md:flex items-center min-w-0">
                    {breadcrumbs && breadcrumbs.length > 0 ? (
                        <nav className="flex items-center gap-1.5 text-sm overflow-x-auto whitespace-nowrap">
                            {breadcrumbs.map((crumb, i) => (
                                <span key={i} className="flex items-center gap-1.5">
                                    {i > 0 && <span className="text-border">/</span>}
                                    {crumb.href ? (
                                        <a href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                                            {crumb.label}
                                        </a>
                                    ) : (
                                        <span className="text-foreground font-medium">{crumb.label}</span>
                                    )}
                                </span>
                            ))}
                        </nav>
                    ) : title ? (
                        <h1 className="text-sm font-semibold text-foreground">{title}</h1>
                    ) : null}
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Role-scoped notification centre for every authenticated portal */}
                <NotificationBell />

                {/* Theme toggle */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="text-muted-foreground"
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </Button>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors">
                            <ProfileAvatar
                                src={user?.avatar_url}
                                name={user?.name ?? 'User'}
                                size="sm"
                            />
                            <div className="hidden sm:flex flex-col items-start">
                                <span className="text-xs font-medium text-foreground leading-none">{user?.name}</span>
                                <span className={`text-[10px] mt-0.5 px-1 rounded font-medium ${roleClass}`}>{roleLabel}</span>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuGroup>
                            <DropdownMenuLabel className="font-normal">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                            </DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />

                        {/* Role Switcher */}
                        {hasMultipleRoles && (
                            <>
                                <div className="px-2 py-1.5">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Switch Role</p>
                                    <div className="space-y-0.5">
                                        {allRoles.map((r) => {
                                            const isActive = r === activeRole;
                                            const colorClass = roleColors[r] ?? 'bg-secondary text-secondary-foreground';
                                            return (
                                                <button
                                                    key={r}
                                                    onClick={() => switchRole(r)}
                                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent"
                                                >
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                                                    <span className={`text-xs font-medium capitalize flex-1 text-left ${colorClass}`}>{r.replace(/-/g, ' ')}</span>
                                                    {isActive && <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                            </>
                        )}

                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={() => { window.location.href = '/profile'; }}>
                                <User className="w-4 h-4 mr-2" /> Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { window.location.href = '/password/change'; }}>
                                <KeyRound className="w-4 h-4 mr-2" /> Change Password
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 cursor-pointer"
                                onClick={() => router.post('/logout')}
                            >
                                <LogOut className="w-4 h-4 mr-2" /> Logout
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
