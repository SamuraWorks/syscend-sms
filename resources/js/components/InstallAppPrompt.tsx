import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { X, Download, Info } from 'lucide-react';
import { isIOS, isStandalone, promptInstall, subscribeInstall } from '@/lib/pwa';
import type { PageProps } from '@/Types';

const DISMISS_KEY = 'syscend_install_prompt_dismissed_v1';
const MANUAL_EVENT = 'syscend:install-app';

export default function InstallAppPrompt() {
    const { schoolBranding, platformLogoUrl } = usePage<PageProps>().props;
    const [canInstall, setCanInstall] = useState(false);
    const [visible, setVisible] = useState(false);
    const [installed, setInstalled] = useState<boolean | null>(null);

    const alreadyInstalled = installed === true;
    const ios = typeof window !== 'undefined' && isIOS();

    const appName = schoolBranding?.name || 'Syscend Campus';
    const logo = schoolBranding?.logo_url || schoolBranding?.badge_url || platformLogoUrl;

    const dismiss = useCallback(() => {
        setVisible(false);
        try {
            localStorage.setItem(DISMISS_KEY, '1');
        } catch {
            /* ignore */
        }
    }, []);

    // Reflect the browser's install availability (shared, single-use event).
    useEffect(() => {
        let wasAvailable = false;
        return subscribeInstall((available) => {
            setCanInstall(available);
            if (available && !wasAvailable) {
                let dismissed = false;
                try {
                    dismissed = localStorage.getItem(DISMISS_KEY) === '1';
                } catch {
                    /* ignore */
                }
                if (!dismissed && !isStandalone()) setVisible(true);
            }
            wasAvailable = available;
        });
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        setInstalled(isStandalone());

        const onInstalled = () => {
            setInstalled(true);
            setVisible(false);
        };
        const onManual = () => setVisible(true);

        window.addEventListener('appinstalled', onInstalled);
        window.addEventListener(MANUAL_EVENT, onManual);

        return () => {
            window.removeEventListener('appinstalled', onInstalled);
            window.removeEventListener(MANUAL_EVENT, onManual);
        };
    }, []);

    if (!visible || alreadyInstalled) return null;

    const install = async () => {
        const outcome = await promptInstall();
        if (outcome === 'accepted') {
            try {
                localStorage.setItem(DISMISS_KEY, '1');
            } catch {
                /* ignore */
            }
            setInstalled(true);
        }
        setVisible(false);
    };

    const steps = ios
        ? ['Tap the Share icon in Safari', 'Choose "Add to Home Screen"', 'Tap "Add" to finish installing']
        : canInstall
          ? 'Tap Install and follow the browser prompt.'
          : ['Open your browser menu', 'Choose "Install app" or "Add to Home Screen"', 'Confirm to finish installing'];

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-[80] rounded-t-2xl border border-b-0 border-slate-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-12px_40px_-12px_rgba(15,23,42,0.35)] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-[26rem] sm:rounded-2xl sm:border-b sm:pb-5"
            role="dialog"
            aria-label={`Install ${appName}`}
        >
            <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                        <Download className="h-5 w-5 text-slate-500" />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">Download {appName}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {canInstall
                            ? `Install ${appName} for a faster, app-like experience with one tap from your home screen.`
                            : 'The web app works on all devices. To install it on your phone, add it to your home screen.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss install prompt"
                    className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {!canInstall && (
                <ul className="mt-3 space-y-1.5">
                    {Array.isArray(steps) ? steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                            {s}
                        </li>
                    )) : (
                        <li className="flex items-start gap-2 text-xs text-slate-600">
                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-500" />
                            {steps}
                        </li>
                    )}
                </ul>
            )}

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:gap-2">
                <button
                    type="button"
                    onClick={dismiss}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                    Maybe later
                </button>
                {canInstall ? (
                    <button
                        type="button"
                        onClick={install}
                        className="flex-1 rounded-lg bg-[#1f66f5] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#174ed7]"
                    >
                        Install
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={dismiss}
                        className="flex-1 rounded-lg bg-[#1f66f5] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#174ed7]"
                    >
                        Got it
                    </button>
                )}
            </div>
        </div>
    );
}

export function requestInstallPrompt() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new Event(MANUAL_EVENT));
}
