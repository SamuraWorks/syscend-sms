import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    GraduationCap, Users, DollarSign, TrendingUp, Building2, Megaphone,
    Percent, User, BookOpen, ClipboardCheck, AlertCircle, ChevronRight,
} from 'lucide-react';

interface School { name: string; motto: string | null; address: string | null; phone: string | null; email: string | null; }
interface StaffSummary { total: number; }
interface Stats {
    total_students: number; total_staff: number; total_revenue: number;
    total_outstanding: number; monthly_revenue: number; staff_count: number;
}
interface RevenuePoint { month: string; amount: number; }
interface Announcement { id: number; title: string; body: string; pinned: boolean; date: string | null; }
interface Props {
    linked: boolean; school: School | null; staff: StaffSummary | null;
    stats: Stats; revenueTrend: RevenuePoint[];
    academicPassRate: number; feeCollectionRate: number;
    recentAnnouncements: Announcement[];
    academicYear: string | null; academicTerm: string | null;
}

export default function ProprietorDashboard({
    linked, school, staff, stats, revenueTrend,
    academicPassRate, feeCollectionRate, recentAnnouncements,
    academicYear, academicTerm,
}: Props) {
    if (!linked || !school) {
        return (
            <AppLayout title="Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked to a proprietor record yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const maxRevenue = Math.max(...revenueTrend.map(r => r.amount), 1);

    const statCards = [
        { label: 'Total Revenue', value: `Le ${stats.total_revenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Monthly Revenue', value: `Le ${stats.monthly_revenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Total Students', value: stats.total_students, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Total Staff', value: stats.staff_count, icon: BookOpen, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
        { label: 'Collection Rate', value: `${feeCollectionRate}%`, icon: Percent, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
        { label: 'Outstanding', value: `Le ${stats.total_outstanding.toLocaleString()}`, icon: AlertCircle, color: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600' },
    ];

    return (
        <AppLayout title="Dashboard">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Proprietor</span>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-8 h-8 text-white/90" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{school.name}</h1>
                        {school.motto && <p className="text-white/80 text-sm italic">&ldquo;{school.motto}&rdquo;</p>}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {school.address && <span className="text-xs text-white/70">{school.address}</span>}
                            {academicYear && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">{academicYear}{academicTerm ? ` · ${academicTerm}` : ''}</Badge>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.color)}>
                                        <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <TrendingUp className="w-4 h-4 text-emerald-500" /> Revenue Trend
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {revenueTrend.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No revenue data available.</p>
                                ) : (
                                    <div className="flex items-end gap-1.5 h-40">
                                        {revenueTrend.map((r, i) => (
                                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-[10px] text-slate-500 font-medium">Le {(r.amount / 1000).toFixed(0)}k</span>
                                                <div
                                                    className="w-full rounded-t bg-emerald-400 dark:bg-emerald-600 min-h-[4px]"
                                                    style={{ height: `${(r.amount / maxRevenue) * 100}%` }}
                                                />
                                                <span className="text-[10px] text-slate-400 truncate w-full text-center">{r.month}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Megaphone className="w-4 h-4 text-violet-500" /> Recent Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentAnnouncements.length === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No announcements.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {recentAnnouncements.map(a => (
                                            <li key={a.id} className={cn(
                                                'rounded-lg px-3 py-2.5',
                                                a.pinned
                                                    ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40'
                                                    : 'bg-slate-50 dark:bg-slate-800/40'
                                            )}>
                                                {a.pinned && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">Pinned</span>
                                                )}
                                                <p className={cn('text-sm font-semibold', a.pinned ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200')}>{a.title}</p>
                                                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{a.body}</p>
                                                {a.date && <p className="text-[11px] text-slate-400 mt-1">{a.date}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Percent className="w-4 h-4 text-amber-500" /> Academic Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Pass Rate</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{academicPassRate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${academicPassRate}%` }} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-600 dark:text-slate-400">Fee Collection Rate</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{feeCollectionRate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5">
                                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${feeCollectionRate}%` }} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Building2 className="w-4 h-4 text-teal-500" /> School Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500">School Name</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Phone</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.phone || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.email || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Address</p>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{school.address || '—'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
