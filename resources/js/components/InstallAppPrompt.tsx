import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { X, Download } from 'lucide-react';
import type { PageProps } from '@/Types';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const DISMISS_KEY = 'syscend_install_prompt_dismissed_v1';

export default function InstallAppPrompt() {
    const { schoolBranding } = usePage<PageProps>().props;
    const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
    const [dismissed, setDismissed] = useState(() => {
        try {
            return localStorage.getItem(DISMISS_KEY) === '1';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const onPrompt = (e: Event) => {
            e.preventDefault();
            setEvent(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setEvent(null);

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    if (!event || dismissed) return null;

    const install = async () => {
        await event.prompt();
        const choice = await event.userChoice;
        setEvent(null);
        if (choice.outcome === 'accepted') {
            try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
        }
    };

    const maybeLater = () => {
        setEvent(null);
        try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    };

    const appName = schoolBranding?.name || 'Syscend Campus';

    return (
        <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                    {schoolBranding?.logo_url ? (
                        <img src={schoolBranding.logo_url} alt="" className="h-full w-full object-contain p-1" />
                    ) : (
                        <Download className="h-5 w-5 text-slate-500" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">Install {appName}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Add {appName} to your home screen for a faster, app-like experience.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={maybeLater}
                    aria-label="Dismiss install prompt"
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
                    onClick={install}
                    className="flex-1 rounded-lg bg-[#1f66f5] px-3 py-2 text-sm font-semibold text-white hover:bg-[#174ed7]"
                >
                    Install
                </button>
            </div>
        </div>
    );
}