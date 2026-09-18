import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, AlertTriangle, Users, Clock, BookMarked, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Link } from '@inertiajs/react';
import ProfileAvatar from '@/components/ProfileAvatar';

interface Staff {
    id: number; full_name: string; emp_id: string; photo_url: string | null;
}
interface Stats {
    total_books: number; active_issues: number; overdue_count: number; students_with_books: number;
}
interface RecentIssue {
    id: number; book_title: string; member_name: string;
    issued_date: string | null; due_date: string | null; status: string;
}
interface Props {
    linked: boolean; staff: Staff | null;
    stats: Stats; recentIssues: RecentIssue[];
}

const QUICK_ACTIONS = [
    { label: 'Books', href: '/school/librarian/books', icon: BookOpen, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Issues', href: '/school/librarian/issues', icon: BookMarked, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Overdue', href: '/school/librarian/overdue', icon: AlertTriangle, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
    { label: 'Announcements', href: '/school/librarian/announcements', icon: Users, color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
];

export default function LibrarianDashboard({
    linked, staff, stats, recentIssues,
}: Props) {
    if (!linked || !staff) {
        return (
            <AppLayout title="Librarian Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked to a staff record yet. Please contact your school administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const statCards = [
        { label: 'Total Books', value: stats.total_books, icon: BookOpen, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Active Issues', value: stats.active_issues, icon: BookMarked, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Overdue', value: stats.overdue_count, icon: AlertTriangle, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600' },
        { label: 'Students with Books', value: stats.students_with_books, icon: Users, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
    ];

    const statusColor: Record<string, string> = {
        issued: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        returned: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        overdue: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <AppLayout title="Librarian Dashboard">
            <div className="space-y-6">

                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <ProfileAvatar
                        src={staff.photo_url}
                        name={staff.full_name}
                        size="xl"
                        showRing
                    />
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold">{staff.full_name}</h1>
                        <p className="text-white/80 text-sm">{staff.emp_id}</p>
                        <Badge className="mt-1 text-[10px] border-0 bg-white/20 text-white">Librarian</Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {QUICK_ACTIONS.map(a => (
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BookMarked className="w-4 h-4 text-blue-500" /> Recent Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {recentIssues.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No recent issues.</p>
                        ) : (
                            <div className="space-y-2">
                                {recentIssues.map((issue) => (
                                    <div key={issue.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                                            <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{issue.book_title}</p>
                                            <p className="text-xs text-slate-400">{issue.member_name}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <Badge className={cn('text-[10px]', statusColor[issue.status] ?? 'bg-slate-100 text-slate-600')}>{issue.status}</Badge>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Due: {issue.due_date}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </AppLayout>
    );
}
