import AppLayout from '@/Layouts/AppLayout';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Bell, BellOff, CheckCheck, RefreshCw, ChevronRight, AlertTriangle,
    AlertOctagon, Info, CalendarClock, CreditCard, School, Megaphone,
    RotateCcw, Trash2, Radio,
} from 'lucide-react';

type Severity = 'critical' | 'warning' | 'info';

interface NotificationItem {
    key: string;
    type: 'demo_request' | 'school' | 'subscription' | 'payment';
    severity: Severity;
    title: string;
    body: string;
    url: string;
    occurred_at: string;
    actor: string | null;
    is_read: boolean;
    is_dismissed: boolean;
    read_at: string | null;
}

interface Props {
    notifications: NotificationItem[];
    unread_count: number;
    type_counts: Record<string, number>;
    severity_counts: Record<string, number>;
    filters: { type: string; severity: string; status: string };
}

const POLL_MS = 10000;

const SEVERITY_META: Record<Severity, { icon: React.ElementType; chip: string; row: string; label: string }> = {
    critical: {
        icon: AlertOctagon,
        label: 'Critical',
        chip: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
        row: 'border-l-red-500',
    },
    warning: {
        icon: AlertTriangle,
        label: 'Warning',
        chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
        row: 'border-l-amber-500',
    },
    info: {
        icon: Info,
        label: 'Info',
        chip: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
        row: 'border-l-blue-500',
    },
};

const TYPE_META: Record<string, { icon: React.ElementType; label: string }> = {
    demo_request: { icon: Megaphone, label: 'Demo requests' },
    school:       { icon: School,    label: 'Schools' },
    subscription: { icon: CalendarClock, label: 'Subscriptions' },
    payment:      { icon: CreditCard, label: 'Payments' },
};

function StatCard({ label, value, icon: Icon, tone }: {
    label: string; value: number; icon: React.ElementType; tone?: string;
}) {
    return (
        <Card>
            <CardContent className="pt-5 flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', tone ?? 'bg-primary/10')}>
                    <Icon className={cn('w-5 h-5', tone ? 'text-foreground' : 'text-primary')} />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function relativeTime(iso: string | null): string {
    if (!iso) return '—';
    const then = new Date(iso).getTime();
    const diff = Date.now() - then;
    const mins = Math.round(diff / 60000);

    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export default function NotificationsIndex({
    notifications, unread_count, type_counts, severity_counts, filters,
}: Props) {
    const [items, setItems] = useState<NotificationItem[]>(notifications);
    const [unread, setUnread] = useState(unread_count);
    const [refreshing, setRefreshing] = useState(false);
    const [lastSync, setLastSync] = useState(new Date());
    const [showDismissed, setShowDismissed] = useState(false);
    const cursorRef = useRef<string | null>(
        notifications.length ? notifications[0].occurred_at : null,
    );

    // Keep local state in sync when Inertia replaces the props (filters, reload).
    useEffect(() => { setItems(notifications); setUnread(unread_count); }, [notifications, unread_count]);

    const reload = useCallback((silent = false) => {
        if (!silent) setRefreshing(true);
        // Inertia v3 reload() takes a single options object and always
        // preserves state + scroll, so filtered views are not disturbed.
        router.reload({
            only: ['notifications', 'unread_count', 'type_counts', 'severity_counts'],
            onFinish: () => {
                setRefreshing(false);
                setLastSync(new Date());
            },
        });
    }, []);

    // Real-time: poll a tiny JSON endpoint and refresh only when something changed.
    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const params = new URLSearchParams();
                if (cursorRef.current) params.set('cursor', cursorRef.current);

                const res = await fetch(`/super-admin/notifications/stream?${params}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok) return;

                const data = await res.json();
                if (cancelled || !data.cursor) return;

                if (data.cursor !== cursorRef.current) {
                    cursorRef.current = data.cursor;
                    reload(true);
                    toast.info('Notifications updated', {
                        description: `${data.total} active on the platform right now.`,
                    });
                }
                setLastSync(new Date());
            } catch {
                /* network hiccup — the next tick retries */
            }
        }

        const id = setInterval(poll, POLL_MS);
        poll();

        return () => { cancelled = true; clearInterval(id); };
    }, [reload]);

    function applyFilters(next: Partial<Props['filters']>) {
        router.get('/super-admin/notifications', {
            type: next.type ?? filters.type,
            severity: next.severity ?? filters.severity,
            status: next.status ?? filters.status,
        }, { preserveState: true, preserveScroll: true, replace: true });
    }

    async function post(url: string, onDone?: (data: any) => void) {
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            onDone?.(data);
        } catch (e) {
            toast.error('Action failed', { description: 'Please try again.' });
        }
    }

    function markRead(n: NotificationItem) {
        post(`/super-admin/notifications/${encodeURIComponent(n.key)}/read`, (data) => {
            setItems((prev) => prev.map((i) => (i.key === n.key ? { ...i, is_read: true, read_at: new Date().toISOString() } : i)));
            setUnread(data.unread_count);
        });
    }

    function dismiss(n: NotificationItem) {
        post(`/super-admin/notifications/${encodeURIComponent(n.key)}/dismiss`, (data) => {
            setItems((prev) => prev.map((i) => (i.key === n.key ? { ...i, is_dismissed: true, is_read: true } : i)));
            setUnread(data.unread_count);
            toast.success('Notification dismissed');
        });
    }

    function restore(n: NotificationItem) {
        post(`/super-admin/notifications/${encodeURIComponent(n.key)}/restore`, (data) => {
            setItems((prev) => prev.map((i) => (i.key === n.key ? { ...i, is_dismissed: false } : i)));
            setUnread(data.unread_count);
        });
    }

    function markAllRead() {
        post('/super-admin/notifications/read-all', (data) => {
            setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
            setUnread(data.unread_count ?? 0);
            toast.success('All notifications marked as read');
        });
    }

    const visible = items.filter((i) => showDismissed || !i.is_dismissed);

    return (
        <AppLayout title="Platform Notifications">
            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard label="Active" value={items.filter((i) => !i.is_dismissed).length} icon={Bell} />
                    <StatCard label="Unread" value={unread} icon={BellOff} />
                    <StatCard label="Critical" value={severity_counts.critical ?? 0} icon={AlertOctagon} tone="bg-red-100 dark:bg-red-950" />
                    <StatCard label="Warnings" value={severity_counts.warning ?? 0} icon={AlertTriangle} tone="bg-amber-100 dark:bg-amber-950" />
                </div>

                {/* Toolbar */}
                <Card>
                    <CardContent className="pt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
                            {(['active', 'unread', 'all'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => applyFilters({ status: s })}
                                    className={cn(
                                        'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                                        filters.status === s
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-accent',
                                    )}
                                >
                                    {s === 'active' ? 'Active' : s === 'unread' ? 'Unread' : 'Including dismissed'}
                                </button>
                            ))}

                            <span className="mx-2 h-5 w-px bg-border" />

                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Severity</span>
                            {(['all', 'critical', 'warning', 'info'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => applyFilters({ severity: s })}
                                    className={cn(
                                        'px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors',
                                        filters.severity === s
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground hover:bg-accent',
                                    )}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                                Live · synced {relativeTime(lastSync.toISOString())}
                            </span>
                            <Button variant="outline" size="sm" onClick={() => reload()} disabled={refreshing}>
                                <RefreshCw className={cn('w-4 h-4 mr-1.5', refreshing && 'animate-spin')} /> Refresh
                            </Button>
                            <Button size="sm" onClick={markAllRead} disabled={unread === 0}>
                                <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Type chips */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => applyFilters({ type: 'all' })}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                            filters.type === 'all'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:bg-accent',
                        )}
                    >
                        All types · {items.filter((i) => !i.is_dismissed).length}
                    </button>
                    {Object.entries(TYPE_META).map(([key, meta]) => (
                        <button
                            key={key}
                            onClick={() => applyFilters({ type: key })}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                                filters.type === key
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-accent',
                            )}
                        >
                            <meta.icon className="w-3.5 h-3.5" />
                            {meta.label} · {type_counts[key] ?? 0}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowDismissed((v) => !v)}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showDismissed ? 'Hide dismissed' : 'Show dismissed'}
                    </button>
                </div>

                {/* Feed */}
                {visible.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 flex flex-col items-center text-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                                <CheckCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-semibold">Nothing needs attention</p>
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    No demo requests, approvals, subscription issues or payment failures right now.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {visible.map((n) => {
                            const meta = SEVERITY_META[n.severity];
                            const Icon = meta.icon;

                            return (
                                <div
                                    key={n.key}
                                    className={cn(
                                        'flex items-start gap-3 rounded-lg border border-border border-l-4 bg-card p-3.5 transition-colors',
                                        meta.row,
                                        !n.is_read && 'bg-accent/40',
                                        n.is_dismissed && 'opacity-50',
                                    )}
                                >
                                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5', meta.chip)}>
                                        <Icon className="w-4 h-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className={cn('text-sm', n.is_read ? 'text-muted-foreground' : 'font-semibold')}>
                                                {n.title}
                                            </p>
                                            {!n.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" title="Unread" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-[11px] text-muted-foreground">{relativeTime(n.occurred_at)}</span>
                                            {n.actor && <span className="text-[11px] text-muted-foreground">· {n.actor}</span>}
                                            <Badge className={cn('text-[10px]', meta.chip)}>{meta.label}</Badge>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                        {!n.is_read && (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Mark read" onClick={() => markRead(n)}>
                                                <CheckCheck className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {n.is_dismissed ? (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Restore" onClick={() => restore(n)}>
                                                <RotateCcw className="w-4 h-4" />
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Dismiss" onClick={() => dismiss(n)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            variant="ghost" size="icon" className="h-8 w-8"
                                            title="Open"
                                            onClick={() => router.visit(n.url)}
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}