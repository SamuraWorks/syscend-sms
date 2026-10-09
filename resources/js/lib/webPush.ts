/** Reject if a promise has not settled within `ms` — guards against a
 *  `navigator.serviceWorker.ready` that never resolves when no worker is active. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timed out waiting for service worker')), ms);
        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });
}

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

export function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
    const padding = '='.repeat((4 - (base64.length % 4)) % 4);
    const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(normalized);
    const output = new Uint8Array(new ArrayBuffer(raw.length));
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

/** Subscribe this browser to web push and register the endpoint with the backend. */
export async function ensureWebPushSubscription(vapidPublicKey: string | null | undefined): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    if (!vapidPublicKey) return false;
    if (Notification.permission !== 'granted') return false;

    try {
        const registration = await withTimeout(navigator.serviceWorker.ready, 8000);
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            });
        }

        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        if (!p256dh || !auth) return false;

        const { default: axios } = await import('axios');
        await axios.post('/notifications/web-push/subscribe', {
            endpoint: subscription.endpoint,
            p256dh: bufferToBase64(p256dh),
            auth: bufferToBase64(auth),
            user_agent: navigator.userAgent,
        });

        return true;
    } catch (error) {
        console.warn('Web push subscription failed:', error);
        return false;
    }
}