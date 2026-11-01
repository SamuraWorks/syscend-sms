import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    Target, Plus, User, Calendar, Filter, Clock, TrendingUp, Flag,
} from 'lucide-react';

interface Goal {
    id: number;
    category: string;
    title: string;
    description: string | null;
    target_value: string | null;
    start_date: string;
    target_date: string | null;
    status: string;
    progress: number;
    notes: string | null;
    student: { id: number; full_name: string };
}

interface Props {
    linked: boolean;
    goals: {
        data: Goal[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const categoryColors: Record<string, string> = {
    academic: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    attendance: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    behaviour: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
    fitness: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    social: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    personal: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
    other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
};

const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    cancelled: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

function getProgressColor(progress: number): string {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Goals({ linked, goals }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Performance Goals">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Target className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view performance goals.</p>
                </div>
            </AppLayout>
        );
    }

    const activeCount = goals.data.filter((g) => g.status === 'active').length;
    const completedCount = goals.data.filter((g) => g.status === 'completed').length;
    const avgProgress = goals.data.length > 0
        ? Math.round(goals.data.reduce((sum, g) => sum + g.progress, 0) / goals.data.length)
        : 0;

    return (
        <AppLayout title="Performance Goals">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                            <Target className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Performance Goals</h1>
                            <p className="text-white/80 text-sm mt-1">
                                {goals.total} goal{goals.total !== 1 ? 's' : ''} · {activeCount} active · {completedCount} completed
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/performance/goals/create"
                        className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors"
                    >
                        <Plus className="w-4 h-4" /> New Goal
                    </Link>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{goals.total}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Goals</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Flag className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">{activeCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Active</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{completedCount}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{avgProgress}%</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Avg Progress</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Goal Cards */}
                <div className="space-y-3">
                    {goals.data.map((goal) => (
                        <Card key={goal.id} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 shrink-0">
                                            <Target className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap mb-1">
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                                    {goal.title}
                                                </p>
                                                <Badge className={`text-[10px] ${categoryColors[goal.category] || ''} capitalize`}>
                                                    {goal.category}
                                                </Badge>
                                                <Badge className={`text-[10px] ${statusColors[goal.status] || ''} capitalize`}>
                                                    {goal.status}
                                                </Badge>
                                            </div>
                                            {goal.description && (
                                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
                                                    {goal.description}
                                                </p>
                                            )}
                                            {goal.target_value && (
                                                <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 mb-2">
                                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-0.5">Target Value</p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{goal.target_value}</p>
                                                </div>
                                            )}
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Progress</span>
                                                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{goal.progress}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${getProgressColor(goal.progress)}`}
                                                        style={{ width: `${Math.min(goal.progress, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            {goal.notes && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">Notes: {goal.notes}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <User className="w-3 h-3" /> {goal.student.full_name}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                    <Calendar className="w-3 h-3" /> {formatDate(goal.start_date)}
                                                </span>
                                                {goal.target_date && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                        <Clock className="w-3 h-3" /> Target: {formatDate(goal.target_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {goals.data.length === 0 && (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3">
                                    <Target className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Goals</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No performance goals have been created yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Pagination */}
                {goals.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {Array.from({ length: goals.last_page }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                    page === goals.current_page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
