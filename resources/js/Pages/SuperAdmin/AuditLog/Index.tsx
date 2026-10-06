import AppLayout from '@/Layouts/AppLayout';
import { Link, router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
    ShieldCheck, Download, RefreshCw, Radio, AlertOctagon, Users,
    Building2, Activity as ActivityIcon, Filter, X, CalendarRange,
} from 'lucide-react';

interface AuditRow {
    id: number;
    log_name: string | null;
    event: string | null;
    description: string | null;
    subject_type: string | null;
    subject_id: number | null;
    created_at: string;
    causer: { id: number; name: string; school_id: number | null } | null;
}

interface Props {
    logs: {
        data: AuditRow[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
            from: number | null;
            to: number | null;
        };
    };
    stats: {
        total: number; today: number; last_7_days: number;
        unique_actors: number; schools_touched: number; critical_count: number;
    };
    topEvents: { event: string; count: number }[];
    subjectTypes: string[];
    events: string[];
    actors: { id: number; name: string; school_id: number | null }[];
    filters: Record<string, string | null>;
}

const POLL_MS = 12000;
const CRITICAL_KEYWORDS = ['deleted', 'destroyed', 'suspended', 'failed', 'rejected', 'revoked', 'deactivated'];
const WARNING_KEYWORDS = ['updated', 'expired', 'reset', 'disabled'];

function severityOf(event: string | null): 'critical' | 'warning' | 'info' {
    const e = (event ?? '').toLowerCase();
    if (CRITICAL_KEYWORDS.some((k) => e.includes(k))) return 'critical';
    if (WARNING_KEYWORDS.some((k) => e.includes(k))) return 'warning';
    return 'info';
}

const SEVERITY_CHIP = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    info: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
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

function shortClass(fqn: string | null): string {
    if (!fqn) return '—';
    return fqn.split('\\').pop() ?? fqn;
}

export default function AuditLogIndex({
    logs, stats, topEvents, subjectTypes, events, actors, filters,
}: Props) {
    const [refreshing, setRefreshing] = useState(false);
    const [newCount, setNewCount] = useState(0);
    const [lastSync, setLastSync] = useState(new Date());
    const [showFilters, setShowFilters] = useState(
        Object.values(filters).some((v) => v && v !== 'all'),
    );
    const cursorRef = useRef<number>(
        logs.data.length ? Math.max(...logs.data.map((l) => l.id)) : 0,
    );

    const reload = useCallback((silent = false) => {
        if (!silent) setRefreshing(true);
        // Inertia v3 reload() preserves state + scroll implicitly.
        router.reload({
            onFinish: () => {
                setRefreshing(false);
                setNewCount(0);
                setLastSync(new Date());
            },
        });
    }, []);

    // Real-time: watch for activity rows created since the newest one rendered.
    useEffect(() => {
        let cancelled = false;

        async function poll() {
            try {
                const res = await fetch(`/super-admin/audit-log/stream?cursor=${cursorRef.current}`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });
                if (!res.ok) return;

                const data = await res.json();
                if (cancelled) return;

                if (data.has_new) {
                    cursorRef.current = data.latest_id;
                    setNewCount((c) => c + (data.new_count ?? 0));
                }
                setLastSync(new Date());
            } catch {
                /* ignore transient failures; retried next tick */
            }
        }

        const id = setInterval(poll, POLL_MS);
        poll();

        return () => { cancelled = true; clearInterval(id); };
    }, []);

    function applyFilters(next: Record<string, string | null>) {
        const merged: Record<string, string | null> = { ...filters, ...next };

        Object.keys(merged).forEach((k) => {
            if (!merged[k] || merged[k] === 'all') delete merged[k];
        });

        router.get('/super-admin/audit-log', merged, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    function exportCsv() {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v); });
        const qs = params.toString();
        window.location.href = `/super-admin/audit-log/export${qs ? `?${qs}` : ''}`;
        toast.success('Export started', { description: 'Your CSV download will begin shortly.' });
    }

    const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'all').length;

    return (
        <AppLayout title="Reports & Audit">
            <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatCard label="Total entries" value={stats.total} icon={ActivityIcon} />
                    <StatCard label="Today" value={stats.today} icon={CalendarRange} />
                    <StatCard label="Last 7 days" value={stats.last_7_days} icon={ActivityIcon} />
                    <StatCard label="Unique actors" value={stats.unique_actors} icon={Users} />
                    <StatCard label="Critical" value={stats.critical_count} icon={AlertOctagon} tone="bg-red-100 dark:bg-red-950" />
                </div>

                {/* Toolbar */}
                <Card>
                    <CardContent className="pt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
                                <Filter className="w-4 h-4 mr-1.5" />
                                Filters
                                {activeFilterCount > 0 && (
                                    <Badge className="ml-2 text-[10px] bg-primary text-primary-foreground">{activeFilterCount}</Badge>
                                )}
                            </Button>
                            {activeFilterCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={() => applyFilters(
                                    Object.fromEntries(Object.keys(filters).map((k) => [k, null])),
                                )}>
                                    <X className="w-4 h-4 mr-1" /> Clear
                                </Button>
                            )}
                            <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-muted-foreground ml-2">
                                <Radio className="w-3 h-3 text-green-500 animate-pulse" />
                                Live · {stats.schools_touched} schools represented
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => reload()} disabled={refreshing}>
                                <RefreshCw className={cn('w-4 h-4 mr-1.5', refreshing && 'animate-spin')} /> Refresh
                            </Button>
                            <Button size="sm" onClick={exportCsv}>
                                <Download className="w-4 h-4 mr-1.5" /> Export CSV
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* New activity banner */}
                {newCount > 0 && (
                    <button
                        onClick={() => reload(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15"
                    >
                        <ActivityIcon className="w-4 h-4" />
                        {newCount} new {newCount === 1 ? 'entry' : 'entries'} — click to load
                    </button>
                )}

                {/* Filters */}
                {showFilters && (
                    <Card>
                        <CardContent className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label>Actor</Label>
                                <Select value={filters.causer_id ?? 'all'} onValueChange={(v) => applyFilters({ causer_id: v === 'all' ? null : v })}>
                                    <SelectTrigger><SelectValue placeholder="Anyone" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Anyone</SelectItem>
                                        {actors.map((a) => (
                                            <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Severity</Label>
                                <Select value={filters.severity ?? 'all'} onValueChange={(v) => applyFilters({ severity: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All severities</SelectItem>
                                        <SelectItem value="critical">Critical only</SelectItem>
                                        <SelectItem value="warning">Warnings</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Event contains</Label>
                                <Select value={filters.event ?? 'all'} onValueChange={(v) => applyFilters({ event: v === 'all' ? null : v })}>
                                    <SelectTrigger><SelectValue placeholder="Any event" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any event</SelectItem>
                                        {events.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Subject type</Label>
                                <Select value={filters.subject_type ?? 'all'} onValueChange={(v) => applyFilters({ subject_type: v === 'all' ? null : v })}>
                                    <SelectTrigger><SelectValue placeholder="Any record" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Any record</SelectItem>
                                        {subjectTypes.map((s) => <SelectItem key={s} value={s}>{shortClass(s)}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="from_date">From</Label>
                                <Input
                                    id="from_date" type="date"
                                    value={filters.from_date ?? ''}
                                    onChange={(e) => applyFilters({ from_date: e.target.value || null })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="to_date">To</Label>
                                <Input
                                    id="to_date" type="date"
                                    value={filters.to_date ?? ''}
                                    onChange={(e) => applyFilters({ to_date: e.target.value || null })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Top events */}
                {topEvents.length > 0 && (
                    <Card>
                        <CardContent className="pt-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                                Most frequent events
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {topEvents.map((t) => (
                                    <button
                                        key={t.event}
                                        onClick={() => applyFilters({ event: t.event })}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-xs hover:bg-accent transition-colors"
                                    >
                                        <span className={cn('w-2 h-2 rounded-full', SEVERITY_CHIP[severityOf(t.event)])} />
                                        <span className="font-medium">{t.event}</span>
                                        <span className="text-muted-foreground">{t.count}</span>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Table */}
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-44">When</TableHead>
                                    <TableHead className="w-32">Severity</TableHead>
                                    <TableHead className="w-40">Event</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-44">Actor</TableHead>
                                    <TableHead className="w-36">Subject</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="py-16 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <ShieldCheck className="w-8 h-8 text-muted-foreground/40" />
                                                <p className="text-sm font-medium">No audit entries match these filters</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Activity is recorded automatically whenever a record is created, updated or deleted.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    logs.data.map((log) => {
                                        const sev = severityOf(log.event);

                                        return (
                                            <TableRow key={log.id} className={cn(sev === 'critical' && 'bg-red-50/50 dark:bg-red-950/20')}>
                                                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn('text-[10px]', SEVERITY_CHIP[sev])}>{sev}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-xs font-medium">{log.event ?? '—'}</span>
                                                    {log.log_name && (
                                                        <p className="text-[10px] text-muted-foreground">{log.log_name}</p>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm">{log.description ?? '—'}</TableCell>
                                                <TableCell>
                                                    {log.causer ? (
                                                        <div>
                                                            <p className="text-xs font-medium">{log.causer.name}</p>
                                                            {log.causer.school_id && (
                                                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                                    <Building2 className="w-2.5 h-2.5" /> School #{log.causer.school_id}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground italic">System</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {log.subject_type ? shortClass(log.subject_type) : '—'}
                                                    {log.subject_id ? ` #${log.subject_id}` : ''}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Pagination */}
                {logs.meta.last_page > 1 && (
                    <div className="flex items-center justify-between text-sm">
                        <p className="text-muted-foreground">
                            Page {logs.meta.current_page} of {logs.meta.last_page} · {logs.meta.total} entries
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline" size="sm"
                                disabled={logs.meta.current_page <= 1}
                                onClick={() => router.get(`/super-admin/audit-log?page=${logs.meta.current_page - 1}`)}
                            >
                                Previous
                            </Button>
                            <Button
                                variant="outline" size="sm"
                                disabled={logs.meta.current_page >= logs.meta.last_page}
                                onClick={() => router.get(`/super-admin/audit-log?page=${logs.meta.current_page + 1}`)}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}