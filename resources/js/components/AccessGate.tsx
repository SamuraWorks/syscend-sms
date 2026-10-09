import { useCallback, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { AlertTriangle, BellRing, Download, MonitorDown, Smartphone } from 'lucide-react';
import { ensureWebPushSubscription } from '@/lib/webPush';
import { isIOS, isSecureOrigin, isStandalone, promptInstall, subscribeInstall } from '@/lib/pwa';
import type { PageProps } from '@/Types';

/** How long to wait for the browser's install prompt before offering the
 *  manual fallback (some browsers never fire `beforeinstallprompt`). */
const PROMPT_GRACE_MS = 2500;

type Phase = 'install' | 'notifications' | 'done';

/**
 * Mandatory post-login gate: every signed-in user must install the app and
 * enable notifications before reaching the app. There is no "skip for a week"
 * snooze — the gate reappears until both are satisfied.
 *
 * School users are exempt until they finish setup, so they can complete the
 * wizard before being asked to install.
 *
 * Browser-aware safety net: if a device genuinely cannot install (no
 * `beforeinstallprompt`, non-installable browser) or notifications are blocked
 * by the browser (permission already denied, unsupported), a clear note with a
 * way forward is shown instead of a silent lockout.
 */
export default function AccessGate() {
    const { auth, schoolBranding, platformLogoUrl, webPush, schoolSetupComplete } = usePage<PageProps>().props;
    const user = auth?.user;

    const [mounted, setMounted] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const [promptSettled, setPromptSettled] = useState(false);
    const [installed, setInstalled] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [notifAcknowledged, setNotifAcknowledged] = useState(false);

    const appName = user?.school_id
        ? (schoolBranding?.name || 'Syscend Campus')
        : (user?.roles?.includes('super-admin') ? 'Syscend Admin' : 'Syscend Campus');
    const logo = user?.school_id
        ? (schoolBranding?.badge_url || schoolBranding?.logo_url || platformLogoUrl || '/images/logo.png')
        : (platformLogoUrl || '/images/logo.png');

    useEffect(() => {
        setMounted(true);
        setInstalled(isStandalone());
        if (typeof Notification !== 'undefined') {
            setPermission(Notification.permission);
        }
    }, []);

    useEffect(() => subscribeInstall(setCanInstall), []);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const onInstalled = () => setInstalled(true);
        window.addEventListener('appinstalled', onInstalled);
        const grace = window.setTimeout(() => setPromptSettled(true), PROMPT_GRACE_MS);

        return () => {
            window.removeEventListener('appinstalled', onInstalled);
            window.clearTimeout(grace);
        };
    }, []);

    const secure = typeof window !== 'undefined' && isSecureOrigin();
    const ios = mounted && isIOS();

    const setupReady = !user?.school_id || schoolSetupComplete !== false;

    const notificationsSupported = mounted && typeof Notification !== 'undefined';
    const notificationsEnforceable =
        notificationsSupported && !!webPush?.enabled && !!webPush?.vapidPublicKey;
    const notificationsSatisfied =
        !notificationsEnforceable ||
        permission === 'granted' ||
        (permission === 'denied' && notifAcknowledged);

    const gateActive = mounted && !!user && secure && setupReady;
    const installRequired = gateActive && !installed;
    const notificationsRequired =
        gateActive && !installRequired && notificationsEnforceable && !notificationsSatisfied;

    const phase: Phase = installRequired ? 'install' : notificationsRequired ? 'notifications' : 'done';

    const install = useCallback(async () => {
        const outcome = await promptInstall();
        if (outcome === 'accepted') {
            setInstalled(true);
        }
    }, []);

    const enableNotifications = useCallback(async () => {
        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result === 'granted' && webPush?.vapidPublicKey) {
                void ensureWebPushSubscription(webPush.vapidPublicKey);
            }
        } catch {
            /* ignore */
        }
    }, [webPush?.vapidPublicKey]);

    const recheckNotifications = useCallback(() => {
        if (typeof Notification !== 'undefined') setPermission(Notification.permission);
    }, []);

    if (phase === 'done') return null;

    const totalSteps = notificationsEnforceable ? 2 : 1;
    const stepNumber = phase === 'install' ? 1 : 2;

    const features = [
        { icon: Smartphone, text: 'One-tap launch straight from your home screen' },
        { icon: BellRing, text: 'Instant push notifications, even when the app is closed' },
        { icon: MonitorDown, text: 'Faster, app-like experience with offline support' },
    ];

    const installInstructions = ios
        ? ['Tap the Share icon in Safari', 'Choose "Add to Home Screen"', 'Tap "Add" to finish installing']
        : ['Open your browser menu', 'Choose "Install app" or "Add to Home Screen"', 'Confirm to finish installing'];

    const heading = phase === 'install' ? `Install ${appName}` : 'Enable notifications';
    const subheading =
        phase === 'install'
            ? `Install ${appName} to continue. It only takes a moment.`
            : `Allow ${appName} to send you important updates — announcements, results, homework, fees, and more.`;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-slate-50 px-4 py-8"
            role="dialog"
            aria-modal="true"
            aria-label={heading}
        >
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
                <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                    {logo ? (
                        <img src={logo} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : phase === 'install' ? (
                        <Download className="h-7 w-7 text-slate-500" />
                    ) : (
                        <BellRing className="h-7 w-7 text-slate-500" />
                    )}
                </div>

                {totalSteps > 1 && (
                    <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Step {stepNumber} of {totalSteps}
                    </p>
                )}

                <h2 className="mt-2 text-center text-lg font-bold text-slate-900">{heading}</h2>
                <p className="mt-1 text-center text-sm text-slate-500">{subheading}</p>

                {phase === 'install' && (
                    <>
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

                        <div className="mt-6 space-y-3">
                            {canInstall ? (
                                <button
                                    type="button"
                                    onClick={install}
                                    className="w-full rounded-lg bg-[#1f66f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174ed7]"
                                >
                                    Install {appName}
                                </button>
                            ) : ios || promptSettled ? (
                                <>
                                    <div className="space-y-1.5 rounded-lg bg-slate-100 p-4 text-xs text-slate-600">
                                        <p className="font-semibold text-slate-800">
                                            {ios ? 'Install from Safari:' : 'Install from your browser:'}
                                        </p>
                                        {installInstructions.map((line, i) => (
                                            <p key={line}>
                                                {i + 1}. {line}
                                            </p>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setInstalled(true)}
                                        className="w-full rounded-lg bg-[#1f66f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174ed7]"
                                    >
                                        {ios ? "I've added it to my Home Screen" : "I've installed the app"}
                                    </button>
                                </>
                            ) : (
                                <div className="rounded-lg bg-slate-100 p-4 text-center text-xs text-slate-500">
                                    Checking whether {appName} can be installed on this device…
                                </div>
                            )}
                        </div>
                    </>
                )}

                {phase === 'notifications' && (
                    <div className="mt-6 space-y-3">
                        {permission === 'denied' ? (
                            <>
                                <div className="space-y-1.5 rounded-lg bg-amber-50 p-4 text-xs text-amber-800">
                                    <p className="flex items-center gap-2 font-semibold">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        Notifications are blocked
                                    </p>
                                    <p>
                                        They were turned off for {appName}. Open your browser's site settings, set
                                        Notifications to &quot;Allow&quot;, then tap the button below.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={recheckNotifications}
                                    className="w-full rounded-lg bg-[#1f66f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174ed7]"
                                >
                                    I've enabled notifications
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setNotifAcknowledged(true)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    Continue without notifications
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={enableNotifications}
                                className="w-full rounded-lg bg-[#1f66f5] px-4 py-3 text-sm font-semibold text-white hover:bg-[#174ed7]"
                            >
                                Enable Notifications
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
