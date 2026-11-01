import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign, TrendingUp, Users, GraduationCap, CreditCard,
    Megaphone, User, Calendar, ArrowUpRight, ArrowDownRight,
    Wallet, BarChart3, Receipt,
} from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Staff {
    id: number;
    full_name: string;
    emp_id: string;
    designation: string | null;
    department: string | null;
    photo_url: string | null;
}

interface Stats {
    total_collected: number;
    total_outstanding: number;
    monthly_collections: number;
    staff_count: number;
    total_students: number;
}

interface RecentPayment {
    student_name: string;
    class: string;
    amount: number;
    date: string;
    category: string;
}

interface FeeByCategory {
    name: string;
    total: number;
    count: number;
}

interface Announcement {
    id: number;
    title: string;
    body: string;
    pinned: boolean;
    date: string | null;
}

interface Props {
    linked: boolean;
    staff: Staff | null;
    stats: Stats;
    recentPayments: RecentPayment[];
    feeByCategory: FeeByCategory[];
    recentAnnouncements: Announcement[];
    academicYear: string | null;
    academicTerm: string | null;
}

const QUICK_ACTIONS = [
    { label: 'Fee Collection', href: '/school/accountant/fees', icon: CreditCard, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Outstanding', href: '/school/accountant/outstanding', icon: TrendingUp, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Payroll', href: '/school/accountant/payroll', icon: Users, color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { label: 'Expenses', href: '/school/accountant/expenses', icon: Receipt, color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' },
    { label: 'Reports', href: '/school/accountant/reports', icon: BarChart3, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    { label: 'Collections', href: '/school/accountant/fee-collections', icon: Wallet, color: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400' },
];

const STATUS_COLOR: Record<string, string> = {
    paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AccountantDashboard({
    linked,
    staff,
    stats,
    recentPayments,
    feeByCategory,
    recentAnnouncements,
    academicYear,
    academicTerm,
}: Props) {
    if (!linked || !staff) {
        return (
            <AppLayout title="Accountant Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">
                        Your user account has not been linked to a staff record yet. Please contact your school administrator.
                    </p>
                </div>
            </AppLayout>
        );
    }

    const statCards = [
        {
            label: 'Total Collected',
            value: `Le ${stats.total_collected.toLocaleString()}`,
            icon: DollarSign,
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
        },
        {
            label: 'Total Outstanding',
            value: `Le ${stats.total_outstanding.toLocaleString()}`,
            icon: TrendingUp,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconColor: 'text-amber-600 dark:text-amber-400',
        },
        {
            label: 'Monthly Collections',
            value: `Le ${stats.monthly_collections.toLocaleString()}`,
            icon: CreditCard,
            iconBg: 'bg-blue-100 dark:bg-blue-900/30',
            iconColor: 'text-blue-600 dark:text-blue-400',
        },
        {
            label: 'Total Students',
            value: stats.total_students.toLocaleString(),
            icon: Users,
            iconBg: 'bg-violet-100 dark:bg-violet-900/30',
            iconColor: 'text-violet-600 dark:text-violet-400',
        },
    ];

    return (
        <AppLayout title="Accountant Dashboard">
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                        <span>Dashboard</span>
                        {academicYear && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span>{academicYear}</span>
                                {academicTerm && (
                                    <>
                                        <span className="text-slate-300 dark:text-slate-600">/</span>
                                        <span>{academicTerm}</span>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Command Center</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Welcome back, {staff.full_name}
                    </p>
                </div>

                {/* Profile Banner */}
                <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center overflow-hidden shrink-0">
                            {staff.photo_url
                                ? <img src={staff.photo_url} alt={staff.full_name} className="w-full h-full object-cover" />
                                : <User className="w-7 h-7 text-white/80" />
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-lg font-bold">{staff.full_name}</p>
                            <p className="text-white/80 text-sm">{staff.emp_id} &middot; {staff.designation ?? '—'} &middot; {staff.department ?? '—'}</p>
                        </div>
                        <Badge className="bg-white/20 text-white border-0 text-xs">Accountant</Badge>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
                                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', s.iconBg)}>
                                        <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {QUICK_ACTIONS.map((a) => (
                            <Link key={a.label} href={a.href} className="block">
                                <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-md transition-shadow text-center">
                                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', a.color)}>
                                        <a.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{a.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Recent Payments */}
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <CreditCard className="w-4 h-4 text-emerald-500" /> Recent Payments
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentPayments.length === 0 ? (
                                    <div className="text-center py-8">
                                        <DollarSign className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No recent payments.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {recentPayments.map((p, i) => (
                                            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                                        {p.student_name.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                                                        {p.student_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{p.class} &middot; {p.category}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        Le {p.amount.toLocaleString()}
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">{p.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Fee by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <DollarSign className="w-4 h-4 text-amber-500" /> Fee by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {feeByCategory.length === 0 ? (
                                    <div className="text-center py-8">
                                        <DollarSign className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No fee data.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-3">
                                        {feeByCategory.map((c, i) => (
                                            <li key={i}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                                        Le {c.total.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full"
                                                        style={{
                                                            width: `${feeByCategory.length > 0 ? Math.min((c.total / Math.max(...feeByCategory.map((x) => x.total), 1)) * 100, 100) : 0}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{c.count} payment{c.count !== 1 ? 's' : ''}</p>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Announcements */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Megaphone className="w-4 h-4 text-violet-500" /> Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {recentAnnouncements.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Megaphone className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">No announcements.</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {recentAnnouncements.map((a) => (
                                            <li
                                                key={a.id}
                                                className={cn(
                                                    'rounded-lg px-3 py-2.5',
                                                    a.pinned
                                                        ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40'
                                                        : 'bg-slate-50 dark:bg-slate-800/40',
                                                )}
                                            >
                                                {a.pinned && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                                                        Pinned
                                                    </span>
                                                )}
                                                <p className={cn(
                                                    'text-sm font-semibold',
                                                    a.pinned ? 'text-amber-900 dark:text-amber-200' : 'text-slate-800 dark:text-slate-200',
                                                )}>
                                                    {a.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{a.body}</p>
                                                {a.date && <p className="text-[11px] text-slate-400 mt-1">{a.date}</p>}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
