import { cn } from '@/lib/utils';

export default function LiveBadge({ secondsAgo, intervalMs = 20000 }: { secondsAgo: number; intervalMs?: number }) {
    const stale = secondsAgo * 1000 > intervalMs * 1.5;
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
            title="This page refreshes automatically with live app data"
        >
            <span className={cn('relative flex h-2 w-2')}>
                {!stale && (
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-60" />
                )}
                <span className={cn('relative inline-flex h-2 w-2 rounded-full', stale ? 'bg-muted-foreground/40' : 'bg-green-500')} />
            </span>
            Live · updated {secondsAgo}s ago
        </span>
    );
}
