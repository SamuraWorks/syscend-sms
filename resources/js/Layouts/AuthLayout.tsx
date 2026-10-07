import { useEffect } from 'react';
import { useAuthStore } from '@/Stores/useAuthStore';
import { usePage } from '@inertiajs/react';
import type { PageProps } from '@/Types';

function hexToRgb(hex: string, alpha = 1): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return alpha < 1 ? `rgba(${r},${g},${b},${alpha})` : `rgb(${r},${g},${b})`;
}

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    const { schoolBranding } = usePage<PageProps>().props;
    const theme = useAuthStore((s) => s.theme);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('dark');
    }, [theme]);

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

    return (
        <div className="landing relative min-h-screen bg-gradient-to-br from-background via-secondary/50 to-background flex items-center justify-center p-4">
            <img
                aria-hidden="true"
                src="/images/hero-bg.jpeg"
                alt=""
                className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.12]"
            />
            {children}
        </div>
    );
}
