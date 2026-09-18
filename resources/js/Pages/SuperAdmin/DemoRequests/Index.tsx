import AppLayout from '@/Layouts/AppLayout';
import { useForm, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
    Search, CalendarClock, TrendingUp, Building2, Users, Filter,
    ChevronRight, Eye,
} from 'lucide-react';

interface DemoReq {
    id: number; request_id: string; status: string; school_name: string;
    contact_name: string; contact_phone: string; contact_email: string;
    district: string; school_type: string; school_level: string;
    number_of_students: number | null;
    created_at: string; assignee: { name: string } | null;
    modules_of_interest: string[];
}

interface Props {
    requests: { data: DemoReq[]; meta: { total: number; per_page: number; current_page: number; last_page: number } };
    filters: Record<string, string>;
    districts: string[];
    staff: { id: number; name: string }[];
    stats: Record<string, any>;
}

const STATUS_COLORS: Record<string, string> = {
    new: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    contacted: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    demo_scheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
    demo_completed: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
    follow_up_required: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    converted: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
    closed: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_LABELS: Record<string, string> = {
    new: 'New', contacted: 'Contacted', demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed', follow_up_required: 'Follow-up', converted: 'Converted', closed: 'Closed',
};

function StatCard({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) {
    return (
        <Card>
            <CardContent className="pt-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function RequestCard({ r }: { r: DemoReq }) {
    return (
        <Link href={`/super-admin/demo-requests/${r.id}`} className="block">
            <Card className="hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
                <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{r.school_name}</p>
                            <p className="text-xs text-muted-foreground">{r.school_type} · {r.school_level}</p>
                        </div>
                        <Badge className={cn('shrink-0 text-[10px]', STATUS_COLORS[r.status])}>{STATUS_LABELS[r.status]}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{r.contact_name} · {r.district}</span>
                        <span className="shrink-0 ml-2">{new Date(r.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Assigned: {r.assignee?.name ?? '—'}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

export default function DemoRequestsIndex({ requests, filters, districts, staff, stats }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const form = useForm({ status: filters.status ?? 'all', district: filters.district ?? '', assigned_to: filters.assigned_to ?? '' });

    function applyFilters() {
        router.get('/super-admin/demo-requests', {
            search, status: form.data.status, district: form.data.district, assigned_to: form.data.assigned_to,
        }, { preserveState: true, replace: true });
    }

    return (
        <AppLayout title="Demo Requests">
            <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <StatCard label="Total" value={stats.total} icon={CalendarClock} />
                    <StatCard label="Today" value={stats.today} icon={CalendarClock} />
                    <StatCard label="This Week" value={stats.this_week} icon={TrendingUp} />
                    <StatCard label="This Month" value={stats.this_month} icon={TrendingUp} />
                    <StatCard label="New" value={stats.new} icon={CalendarClock} />
                    <StatCard label="Converted" value={stats.converted} icon={TrendingUp} />
                </div>

                {/* Status Breakdown */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <button key={key} onClick={() => { form.setData('status', key); setTimeout(applyFilters, 50); }}
                            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                form.data.status === key ? 'ring-2 ring-primary' : 'hover:bg-accent')}>
                            <Badge variant="outline" className={STATUS_COLORS[key]}>{label}: {stats[key] ?? 0}</Badge>
                        </button>
                    ))}
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-5">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input className="pl-9" placeholder="Search by school, contact, ID..." value={search} onChange={e => setSearch(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()} />
                            </div>
                            <div className="flex gap-2">
                                <Select value={form.data.district} onValueChange={v => { form.setData('district', v); setTimeout(applyFilters, 50); }}>
                                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Districts" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Districts</SelectItem>
                                        {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <Select value={form.data.assigned_to} onValueChange={v => { form.setData('assigned_to', v); setTimeout(applyFilters, 50); }}>
                                    <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Staff" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Staff</SelectItem>
                                        {staff.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button variant="outline" onClick={applyFilters} className="sm:w-auto"><Filter className="w-4 h-4 mr-1" /> Filter</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Mobile: Card layout */}
                <div className="md:hidden space-y-3">
                    {requests.data.map(r => <RequestCard key={r.id} r={r} />)}
                    {requests.data.length === 0 && (
                        <Card><CardContent className="py-12 text-center text-muted-foreground">No demo requests found.</CardContent></Card>
                    )}
                </div>

                {/* Desktop: Table layout */}
                <Card className="hidden md:block">
                    <CardContent className="pt-5">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border text-left">
                                        <th className="pb-3 font-medium text-muted-foreground">Request ID</th>
                                        <th className="pb-3 font-medium text-muted-foreground">School</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Contact</th>
                                        <th className="pb-3 font-medium text-muted-foreground">District</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Status</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Assigned</th>
                                        <th className="pb-3 font-medium text-muted-foreground">Date</th>
                                        <th className="pb-3" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.data.map(r => (
                                        <tr key={r.id} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                                            <td className="py-3 font-mono text-xs">{r.request_id}</td>
                                            <td className="py-3">
                                                <p className="font-medium">{r.school_name}</p>
                                                <p className="text-xs text-muted-foreground">{r.school_type} · {r.school_level}</p>
                                            </td>
                                            <td className="py-3">
                                                <p>{r.contact_name}</p>
                                                <p className="text-xs text-muted-foreground">{r.contact_phone}</p>
                                            </td>
                                            <td className="py-3 text-muted-foreground">{r.district}</td>
                                            <td className="py-3"><Badge className={STATUS_COLORS[r.status]}>{STATUS_LABELS[r.status]}</Badge></td>
                                            <td className="py-3 text-muted-foreground">{r.assignee?.name ?? '—'}</td>
                                            <td className="py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                                            <td className="py-3">
                                                <Link href={`/super-admin/demo-requests/${r.id}`}
                                                    className="inline-flex items-center gap-1 text-primary hover:underline text-xs">
                                                    View <ChevronRight className="w-3 h-3" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                    {requests.data.length === 0 && (
                                        <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No demo requests found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
