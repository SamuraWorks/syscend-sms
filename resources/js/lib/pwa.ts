export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function isStandalone(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        window.matchMedia?.('(display-mode: standalone)').matches === true ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

export function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    const isIphoneLike = /iPhone|iPad|iPod/.test(ua);
    const isMacDesktopIpad = ua.includes('Macintosh') && 'ontouchend' in document && !isStandalone();
    return isIphoneLike || isMacDesktopIpad;
}

export function isSecureOrigin(): boolean {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return window.location.protocol === 'https:' || hostname === 'localhost' || hostname === '127.0.0.1';
}

type Listener = (available: boolean) => void;

/**
 * Single, app-wide holder for the browser's `beforeinstallprompt` event.
 *
 * The event can only be `prompt()`-ed once, so sharing it avoids the "Download
 * App" button firing a stale, already-consumed prompt (which silently does
 * nothing). The listener is attached at module load so an early event is never
 * missed.
 */
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<Listener>();

function emit(): void {
    listeners.forEach((listener) => listener(deferred !== null));
}

if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        deferred = event as BeforeInstallPromptEvent;
        emit();
    });
    window.addEventListener('appinstalled', () => {
        deferred = null;
        emit();
    });
}

export function canInstall(): boolean {
    return deferred !== null;
}

export function subscribeInstall(listener: Listener): () => void {
    listeners.add(listener);
    listener(deferred !== null);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Trigger the native install prompt. Returns `unavailable` when the browser has
 * no pending install prompt (e.g. already installed, unsupported, or consumed).
 */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
    if (!deferred) return 'unavailable';

    const event = deferred;
    try {
        await event.prompt();
        const choice = await event.userChoice;
        deferred = null;
        emit();
        return choice.outcome;
    } catch {
        deferred = null;
        emit();
        return 'unavailable';
    }
}
