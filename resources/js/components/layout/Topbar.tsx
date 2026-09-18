import { router, usePage } from '@inertiajs/react';
import { Moon, Sun, LogOut, User, Menu, KeyRound, Check, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
    DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/Stores/useAuthStore';
import { useUIStore } from '@/Stores/useUIStore';
import { useEffect } from 'react';
import type { PageProps } from '@/Types';
import ProfileAvatar from '@/components/ProfileAvatar';

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
    const { auth, schoolBranding } = usePage<PageProps>().props;
    const { theme, setTheme } = useAuthStore();
    const { toggleSidebar } = useUIStore();

    const user = auth.user;
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
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleSidebar}>
                    <Menu className="w-5 h-5" />
                </Button>
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

            {/* Right */}
            <div className="flex items-center gap-2">
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
