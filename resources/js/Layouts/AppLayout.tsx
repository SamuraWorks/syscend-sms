import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import Sidebar from '@/components/layout/Sidebar';
import Topbar from '@/components/layout/Topbar';
import LicenseBanner from '@/components/layout/LicenseBanner';
import PageProgress from '@/components/layout/PageProgress';
import { useAuthStore } from '@/Stores/useAuthStore';
import { useUIStore } from '@/Stores/useUIStore';
import { cn } from '@/lib/utils';
import type { PageProps } from '@/Types';

interface AppLayoutProps {
    children: React.ReactNode;
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
}

export default function AppLayout({ children, title, breadcrumbs }: AppLayoutProps) {
    const { flash, faviconUrl, schoolBranding } = usePage<PageProps>().props;
    const theme = useAuthStore((s) => s.theme);
    const { sidebarOpen } = useUIStore();

    // Favicon sync
    useEffect(() => {
        const link = document.getElementById('app-favicon') as HTMLLinkElement | null
            ?? document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
        if (link) {
            link.href = faviconUrl ?? '/favicon.ico';
        }
    }, [faviconUrl]);

    // Dark mode sync
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

    // School colour propagation — inject CSS custom properties
    useEffect(() => {
        const root = document.documentElement;
        const primary = schoolBranding?.primary_color;
        const secondary = schoolBranding?.secondary_color;

        if (primary) {
            root.style.setProperty('--school-primary', primary);
            root.style.setProperty('--school-primary-light', hexToRgb(primary, 0.1));
            root.style.setProperty('--school-primary-medium', hexToRgb(primary, 0.2));
        }
        if (secondary) {
            root.style.setProperty('--school-secondary', secondary);
            root.style.setProperty('--school-secondary-light', hexToRgb(secondary, 0.1));
        }
    }, [schoolBranding]);

    // Flash messages
    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <PageProgress />

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => useUIStore.getState().setSidebarOpen(false)}
                />
            )}

            {/* Sidebar — Desktop */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Sidebar — Mobile (slide-out drawer) */}
            {sidebarOpen && (
                <div className="fixed inset-y-0 left-0 z-50 md:hidden">
                    <Sidebar />
                </div>
            )}

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <LicenseBanner />
                <Topbar title={title} breadcrumbs={breadcrumbs} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}

function hexToRgb(hex: string, alpha: number): string {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
