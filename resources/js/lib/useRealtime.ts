import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';

/**
 * Keeps an Inertia page connected to live server data.
 * Re-fetches the page props on a fixed interval — without a full
 * page reload — so KPIs, tables and registries always reflect the
 * current state of the app. Polling pauses while the tab is hidden.
 */
export function useRealtime(intervalMs: number = 20000) {
    const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const refresh = () => {
            if (document.hidden || cancelled) return;
            router.reload({
                showProgress: false,
                onFinish: () => {
                    if (!cancelled) setLastUpdated(Date.now());
                },
            });
        };

        const id = window.setInterval(refresh, intervalMs);
        const onVisible = () => {
            if (!document.hidden) refresh();
        };
        document.addEventListener('visibilitychange', onVisible);

        return () => {
            cancelled = true;
            window.clearInterval(id);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, [intervalMs]);

    // 1-second ticker so "updated Ns ago" text stays fresh
    useEffect(() => {
        const id = window.setInterval(() => setTick((t) => t + 1), 1000);
        return () => window.clearInterval(id);
    }, []);

    const secondsAgo = Math.max(0, Math.round((Date.now() - lastUpdated) / 1000));
    return { secondsAgo, tick, lastUpdated };
}
