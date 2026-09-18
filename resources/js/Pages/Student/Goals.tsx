import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Calendar, Flag, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface Props {
    linked: boolean;
    goals: {
        data: {
            id: number;
            category: string;
            title: string;
            description: string | null;
            target_value: string | null;
            start_date: string;
            target_date: string | null;
            status: string;
            progress: number;
        }[];
        current_page: number;
        last_page: number;
        total: number;
    };
}

const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    abandoned: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const statusLabels: Record<string, string> = {
    completed: 'Completed', in_progress: 'In Progress', not_started: 'Not Started', abandoned: 'Abandoned',
};

const categoryIcons: Record<string, React.ElementType> = {
    academic: TrendingUp, behavioral: Flag, attendance: Calendar, personal: Target,
};

const progressColor = (p: number) =>
    p >= 80 ? 'bg-green-500' :
    p >= 60 ? 'bg-blue-500' :
    p >= 40 ? 'bg-yellow-500' :
    p >= 20 ? 'bg-orange-500' : 'bg-red-500';

export default function Goals({ linked, goals }: Props) {
    if (!linked) {
        return (
            <AppLayout title="My Goals">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Target className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const { data: goalList, total } = goals;
    const completedCount = goalList.filter(g => g.status === 'completed').length;
    const inProgressCount = goalList.filter(g => g.status === 'in_progress').length;

    return (
        <AppLayout title="My Goals">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">My Goals</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Track your personal learning goals and achievements</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
                            <p className="text-xs text-slate-500 mt-1">Total Goals</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{inProgressCount}</p>
                            <p className="text-xs text-slate-500 mt-1">In Progress</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{completedCount}</p>
                            <p className="text-xs text-slate-500 mt-1">Completed</p>
                        </CardContent>
                    </Card>
                </div>

                {goalList.length === 0 ? (
                    <Card>
                        <CardContent className="py-16 text-center">
                            <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No goals set yet</p>
                            <p className="text-xs text-slate-400 mt-1">Start setting goals to track your progress!</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {goalList.map((goal) => {
                            const CatIcon = categoryIcons[goal.category] || Target;
                            const barColor = progressColor(goal.progress);

                            return (
                                <Card key={goal.id}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                                    <CatIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{goal.title}</p>
                                                    <Badge className="text-[10px] mt-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 capitalize">{goal.category}</Badge>
                                                </div>
                                            </div>
                                            <Badge className={`text-[10px] ${statusColors[goal.status] || 'bg-slate-100 text-slate-600'}`}>
                                                {statusLabels[goal.status] || goal.status}
                                            </Badge>
                                        </div>

                                        {goal.description && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2">{goal.description}</p>
                                        )}

                                        <div className="space-y-1.5 mb-3">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">Progress</span>
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{goal.progress}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(goal.progress, 100)}%` }} />
                                            </div>
                                        </div>

                                        {goal.target_value && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                                                <Flag className="w-3 h-3" /> Target: {goal.target_value}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {goal.start_date}
                                            </span>
                                            {goal.target_date && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Due: {goal.target_date}
                                                </span>
                                            )}
                                        </div>

                                        {goal.status === 'completed' && (
                                            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-3.5 h-3.5" /> Goal achieved!
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
