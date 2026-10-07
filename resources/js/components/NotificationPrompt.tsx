import { useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { X, BellRing } from 'lucide-react';
import type { PageProps } from '@/Types';

export default function NotificationPrompt() {
    const { schoolBranding } = usePage<PageProps>().props;
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<number | null>(null);

    const appName = schoolBranding?.name || 'Syscend Campus';
    const slug = schoolBranding?.slug || 'platform';
    const dismissKey = `syscend_notify_prompt_${slug}_v1`;

    useEffect(() => {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'granted' || Notification.permission === 'denied') return;

        let dismissed = false;
        try {
            dismissed = localStorage.getItem(dismissKey) === '1';
        } catch {
            /* ignore */
        }
        if (dismissed) return;

        // Give the page a moment to settle, then surface the prompt once.
        timerRef.current = window.setTimeout(() => setVisible(true), 1500);

        return () => {
            if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        };
    }, [dismissKey]);

    const enable = async () => {
        try {
            await Notification.requestPermission();
        } catch {
            /* ignore */
        }
        setVisible(false);
    };

    const maybeLater = () => {
        setVisible(false);
        try {
            localStorage.setItem(dismissKey, '1');
        } catch {
            /* ignore */
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-4 left-4 z-40 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {schoolBranding?.logo_url ? (
                        <img src={schoolBranding.logo_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                        <BellRing className="h-5 w-5 text-slate-500" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Stay connected</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Enable notifications to receive important updates from {appName} — announcements,
                        results, homework, fees, and more.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={maybeLater}
                    aria-label="Dismiss notification prompt"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="mt-3 flex gap-2">
                <button
                    type="button"
                    onClick={maybeLater}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Maybe later
                </button>
                <button
                    type="button"
                    onClick={enable}
                    className="flex-1 rounded-lg bg-[#1f66f5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#174ed7]"
                >
                    Enable Notifications
                </button>
            </div>
        </div>
    );
}