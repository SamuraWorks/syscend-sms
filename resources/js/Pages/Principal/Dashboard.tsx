import { useEffect } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, router } from '@inertiajs/react';
import {
    GraduationCap, Users, ClipboardCheck, BookOpen, BarChart3, Bell,
    Calendar, CheckCircle, FileText, Megaphone, TrendingUp, Wallet,
    AlertTriangle, Clock, ChevronRight, RefreshCw,
} from 'lucide-react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Staff {
    id: number; full_name: string; emp_id: string; photo_url: string | null;
    designation: string | null; department: string | null;
}
interface Stats {
    total_students: number; total_staff: number; total_classes: number;
    attendance_today_pct: number; fee_collection_rate: number; exam_results_ready: number;
}
interface DayAttendance { present: number; absent: number; late: number; }
interface Announcement { id: number; title: string; body: string; pinned: boolean; date: string | null; }
interface FeeOverview { collected: number; outstanding: number; }
interface Props {
    linked: boolean; staff: Staff | null;
    academicYear: string | null; academicTerm: string | null;
    stats: Stats; todayAttendance: DayAttendance;
    recentAnnouncements: Announcement[]; pendingLeaveCount: number;
    feeOverview: FeeOverview;
}

export default function PrincipalDashboard({
    linked, staff, academicYear, academicTerm, stats, todayAttendance,
    recentAnnouncements, pendingLeaveCount, feeOverview,
}: Props) {
    // Real-time polling — refresh dashboard data every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['stats', 'todayAttendance', 'recentAnnouncements', 'pendingLeaveCount', 'feeOverview'],
            });
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!linked || !staff) {
        return (
            <AppLayout title="Principal Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked to a staff record yet. Please contact the school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const totalToday = todayAttendance.present + todayAttendance.absent + todayAttendance.late;

    const statCards = [
        { label: 'Total Students', value: stats.total_students, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600', href: '/school/principal/students' },
        { label: 'Total Staff', value: stats.total_staff, icon: GraduationCap, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600', href: '/school/principal/staff' },
        { label: 'Total Classes', value: stats.total_classes, icon: BookOpen, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600', href: '/school/principal/academic' },
        { label: 'Attendance Today', value: `${stats.attendance_today_pct}%`, icon: ClipboardCheck, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600', href: '/school/principal/attendance' },
        { label: 'Fee Collection', value: `${stats.fee_collection_rate}%`, icon: Wallet, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600', href: '/school/principal/fees' },
        { label: 'Results Ready', value: stats.exam_results_ready, icon: BarChart3, color: 'bg-rose-100 dark:bg-rose-900/30', iconColor: 'text-rose-600', href: '/school/principal/results' },
    ];

    return (
        <AppLayout title="Principal Dashboard">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">Dashboard</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-green-600 dark:text-green-400">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Live
                    </span>
                </div>

                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar
                        src={staff.photo_url}
                        name={staff.full_name}
                        size="xl"
                        showRing
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">{staff.emp_id} · {staff.designation ?? 'Principal'} · {staff.department ?? '—'}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge className="text-[10px] border-0 bg-white/20 text-white">Principal</Badge>
                            {academicYear && <Badge variant="secondary" className="text-[10px] bg-white/20 text-white border-0">{academicYear}{academicTerm ? ` · ${academicTerm}` : ''}</Badge>}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {statCards.map(s => (
                        <Link key={s.label} href={s.href}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
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
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <ClipboardCheck className="w-4 h-4 text-green-500" /> Today&apos;s Attendance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {totalToday === 0 ? (
                                    <p className="text-sm text-slate-400 text-center py-4">No attendance recorded today.</p>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex gap-4 text-center">
                                            <div className="flex-1">
                                                <p className="text-2xl font-bold text-green-600">{todayAttendance.present}</p>
                                                <p className="text-xs text-slate-500">Present</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-2xl font-bold text-red-500">{todayAttendance.absent}</p>
                                                <p className="text-xs text-slate-500">Absent</p>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-2xl font-bold text-amber-500">{todayAttendance.late}</p>
                                                <p className="text-xs text-slate-500">Late</p>
                                            </div>
                                        </div>
                                        <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                                            <div className="h-full bg-green-500" style={{ width: `${(todayAttendance.present / totalToday) * 100}%` }} />
                                            <div className="h-full bg-amber-400" style={{ width: `${(todayAttendance.late / totalToday) * 100}%` }} />
                                            <div className="h-full bg-red-500" style={{ width: `${(todayAttendance.absent / totalToday) * 100}%` }} />
                                        </div>
                                        <p className="text-xs text-slate-400 text-center">{totalToday} total · {stats.attendance_today_pct}% attendance</p>
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
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.body}</p>
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
                                    <Wallet className="w-4 h-4 text-amber-500" /> Fee Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4 text-center">
                                    <div className="flex-1 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                                        <p className="text-lg font-bold text-green-600">Le {feeOverview.collected.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">Collected</p>
                                    </div>
                                    <div className="flex-1 p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                                        <p className="text-lg font-bold text-red-500">Le {feeOverview.outstanding.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500">Outstanding</p>
                                    </div>
                                </div>
                                {feeOverview.collected + feeOverview.outstanding > 0 && (
                                    <div>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-500">Collection Rate</span>
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                {Math.round((feeOverview.collected / (feeOverview.collected + feeOverview.outstanding)) * 100)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 rounded-full" style={{ width: `${(feeOverview.collected / (feeOverview.collected + feeOverview.outstanding)) * 100}%` }} />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {pendingLeaveCount > 0 && (
                            <Card className="border-amber-200 dark:border-amber-800/40">
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{pendingLeaveCount} Pending Leave Request{pendingLeaveCount !== 1 ? 's' : ''}</p>
                                            <p className="text-xs text-slate-500">Awaiting your approval</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Quick Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Students</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.total_students}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Staff Members</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.total_staff}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Active Classes</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.total_classes}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Exam Results Ready</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{stats.exam_results_ready}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
