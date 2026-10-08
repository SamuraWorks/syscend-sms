import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { BellRing, Download, MonitorDown, Smartphone } from 'lucide-react';
import type { PageProps } from '@/Types';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const REMIND_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
const GATE_KEY_PREFIX = 'syscend_install_gate_';

function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia?.('(display-mode: standalone)').matches === true ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

function isSecureOrigin(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return window.location.protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIphoneLike = /iPhone|iPad|iPod/.test(ua);
    const isMacDesktopIpad = ua.includes('Macintosh') && 'ontouchend' in document && !isStandalone();
    return isIphoneLike || isMacDesktopIpad;
}

/**
 * Branded full-screen install gate shown right after login.
 * Blocks the app until the user installs the PWA or explicitly continues in
 * the browser (remembered per school for a week). Uses the school badge/logo
 * for school accounts and the platform logo for platform roles.
 */
export default function InstallGate() {
    const { auth, schoolBranding, platformLogoUrl } = usePage<PageProps>().props;
    const [visible, setVisible] = useState(false);
    const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

    const user = auth?.user;
    const slug = schoolBranding?.slug || (user ? (user.school_id ? `school-${user.school_id}` : 'platform') : '');
    const gateKey = `${GATE_KEY_PREFIX}${slug}`;
    const appName = schoolBranding?.name || 'Syscend Campus';
    const logo = user?.school_id
        ? (schoolBranding?.badge_url || schoolBranding?.logo_url)
        : platformLogoUrl;
    const ios = typeof window !== 'undefined' && isIOS();

    const markSeen = useCallback(() => {
        try {
            localStorage.setItem(gateKey, String(Date.now()));
        } catch {
            /* ignore */
        }
    }, [gateKey]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!user) return;
        if (isStandalone() || !isSecureOrigin()) return;

        let lastSeen = 0;
        try {
            lastSeen = Number(localStorage.getItem(gateKey)) || 0;
        } catch {
            /* ignore */
        }
        if (Date.now() - lastSeen < REMIND_EVERY_MS) return;

        setVisible(true);
    }, [user?.id, gateKey]);

    useEffect(() => {
        const onPrompt = (e: Event) => {
            e.preventDefault();
            setPromptEvent(e as BeforeInstallPromptEvent);
        };
        const onInstalled = () => setVisible(false);

        window.addEventListener('beforeinstallprompt', onPrompt);
        window.addEventListener('appinstalled', onInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', onPrompt);
            window.removeEventListener('appinstalled', onInstalled);
        };
    }, []);

    if (!visible) return null;

    const install = async () => {
        if (!promptEvent) return;
        try {
            await promptEvent.prompt();
            const choice = await promptEvent.userChoice;
            if (choice.outcome === 'accepted') {
                markSeen();
                setVisible(false);
            }
        } catch {
            /* ignore */
        }
    };

    const continueInBrowser = () => {
        markSeen();
        setVisible(false);
    };

    const features = [
        { icon: Smartphone, text: 'One-tap launch straight from your home screen' },
        { icon: BellRing, text: 'Instant push notifications, even when the app is closed' },
        { icon: MonitorDown, text: 'Faster, app-like experience with offline support' },
    ];

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-50 px-4 py-8"
            role="dialog"
            aria-modal="true"
            aria-label={`Install ${appName}`}
        >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                        <Download className="h-7 w-7 text-slate-500" />
                    )}
                </div>

                <h2 className="mt-4 text-center text-lg font-bold text-slate-900">Install {appName}</h2>
                <p className="mt-1 text-center text-sm text-slate-500">
                    Get the full {appName} experience with one tap from your home screen.
                </p>

                <ul className="mt-5 space-y-3">
                    {features.map(({ icon: Icon, text }) => (
                        <li key={text} className="flex items-center gap-3 text-sm text-slate-700">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                <Icon className="h-4 w-4" />
                            </span>
                            {text}
                        </li>
                    ))}
                </ul>

                <div className="mt-6">
                    {promptEvent ? (
                        <button
                            type="button"
                            onClick={install}
                            className="w-full rounded-lg bg-[#1f66f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174ed7]"
                        >
                            Install {appName}
                        </button>
                    ) : ios ? (
                        <div className="space-y-1.5 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Install from Safari:</p>
                            <p>1. Tap the Share icon</p>
                            <p>2. Choose &quot;Add to Home Screen&quot;</p>
                            <p>3. Tap &quot;Add&quot; to finish installing</p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Install from your browser:</p>
                            <p>1. Open the browser menu</p>
                            <p>2. Choose &quot;Install app&quot; or &quot;Add to Home Screen&quot;</p>
                            <p>3. Confirm to finish installing</p>
                        </div>
                    )}
                </div>

                <button
                    type="button"
                    onClick={continueInBrowser}
                    className="mt-4 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                    Continue in browser
                </button>
            </div>
        </div>
    );
}