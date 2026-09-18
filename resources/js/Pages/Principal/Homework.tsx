import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

interface HomeworkItem {
    id: number;
    title: string;
    description: string | null;
    subject: string | null;
    class: string | null;
    teacher: string | null;
    due_date: string | null;
    is_active: boolean;
    submissions: number;
    attachment: string | null;
}

interface RecentAssignment {
    id: number;
    title: string;
    class: string | null;
    subject: string | null;
    teacher: string | null;
    created_at: string;
}

interface Props {
    linked: boolean;
    principal: { full_name: string };
    homework: HomeworkItem[];
    recentAssignments: RecentAssignment[];
}

export default function Homework({ linked, principal, homework, recentAssignments }: Props) {
    const total = homework.length;
    const activeCount = homework.filter(hw => hw.is_active).length;
    const closedCount = total - activeCount;
    const totalSubmissions = homework.reduce((sum, hw) => sum + (hw.submissions ?? 0), 0);

    if (!linked) {
        return (
            <AppLayout title="Homework">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Homework">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Homework</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-violet-500" /> Homework
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Monitor homework assignments for {principal.full_name}'s school</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-slate-100 dark:bg-slate-800"><BookOpen className="w-4 h-4 text-slate-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Assigned</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{activeCount}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Active</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-red-100 dark:bg-red-900/30"><Clock className="w-4 h-4 text-red-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{closedCount}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Closed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 dark:bg-blue-900/30"><BookOpen className="w-4 h-4 text-blue-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalSubmissions}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Submissions</p>
                        </CardContent>
                    </Card>
                </div>

                {homework.length === 0 ? (
                    <Card><CardContent className="py-16 text-center"><BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No homework assignments found.</p></CardContent></Card>
                ) : (
                    <div className="space-y-3">
                        {homework.map(hw => (
                            <Card key={hw.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{hw.title}</h3>
                                                <Badge variant="secondary" className={cn('text-[10px] capitalize', hw.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>{hw.is_active ? 'active' : 'closed'}</Badge>
                                            </div>
                                            {hw.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{hw.description}</p>}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                                                <span>{hw.class ?? '—'}</span>
                                                <span>·</span>
                                                <span>{hw.subject ?? '—'}</span>
                                                <span>·</span>
                                                {hw.teacher && <><span>{hw.teacher}</span><span>·</span></>}
                                                <span>Due: {hw.due_date ?? '—'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{hw.submissions}</p>
                                            <p className="text-[10px] text-slate-400">Submitted</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {recentAssignments.length > 0 && (
                    <Card>
                        <CardContent className="p-4">
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Recently Added</h2>
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {recentAssignments.map(ra => (
                                    <div key={ra.id} className="flex items-center justify-between gap-4 py-2 first:pt-0 last:pb-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{ra.title}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{ra.class ?? '—'} · {ra.subject ?? '—'}{ra.teacher ? ` · ${ra.teacher}` : ''}</p>
                                        </div>
                                        <span className="text-[10px] text-slate-400 shrink-0">{ra.created_at}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
