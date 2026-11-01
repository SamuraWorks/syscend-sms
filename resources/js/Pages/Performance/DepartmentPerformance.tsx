import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Building2, Users, Trophy, AlertTriangle, BarChart3, Award,
} from 'lucide-react';

interface DeptData {
    average_score: number;
    student_count: number;
    excellent_count: number;
    critical_count: number;
}

interface Props {
    linked: boolean;
    performance: Record<string, DeptData>;
}

const deptAccents: { bg: string; icon: string; text: string }[] = [
    { bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-400' },
    { bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'text-blue-600 dark:text-blue-400', text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', text: 'text-purple-700 dark:text-purple-400' },
    { bg: 'bg-teal-100 dark:bg-teal-900/30', icon: 'text-teal-600 dark:text-teal-400', text: 'text-teal-700 dark:text-teal-400' },
    { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-400' },
    { bg: 'bg-rose-100 dark:bg-rose-900/30', icon: 'text-rose-600 dark:text-rose-400', text: 'text-rose-700 dark:text-rose-400' },
    { bg: 'bg-emerald-100 dark:bg-emerald-900/30', icon: 'text-emerald-600 dark:text-emerald-400', text: 'text-emerald-700 dark:text-emerald-400' },
    { bg: 'bg-cyan-100 dark:bg-cyan-900/30', icon: 'text-cyan-600 dark:text-cyan-400', text: 'text-cyan-700 dark:text-cyan-400' },
];

function getScoreBadge(score: number): string {
    if (score >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (score >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

function getScoreColor(score: number): string {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
}

export default function DepartmentPerformance({ linked, performance }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Department Performance">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Building2 className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view department performance data.</p>
                </div>
            </AppLayout>
        );
    }

    const departments = Object.entries(performance);
    const totalStudents = departments.reduce((sum, [, d]) => sum + d.student_count, 0);
    const totalExcellent = departments.reduce((sum, [, d]) => sum + d.excellent_count, 0);
    const totalCritical = departments.reduce((sum, [, d]) => sum + d.critical_count, 0);
    const overallAvg = departments.length > 0
        ? departments.reduce((sum, [, d]) => sum + d.average_score, 0) / departments.length
        : 0;

    return (
        <AppLayout title="Department Performance">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Department Performance</h1>
                        <p className="text-white/80 text-sm mt-1">
                            Performance analytics across {departments.length} department{departments.length !== 1 ? 's' : ''} · Overall average: {Number(overallAvg).toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{departments.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Departments</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{Number(overallAvg).toFixed(1)}%</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Overall Average</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                                <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{totalExcellent}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Excellent Students</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{totalCritical}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Critical Students</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Department Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {departments.map(([name, dept], i) => {
                        const accent = deptAccents[i % deptAccents.length];
                        return (
                            <Card key={name}>
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex items-center justify-center w-10 h-10 rounded-full ${accent.bg}`}>
                                            <Award className={`w-5 h-5 ${accent.icon}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {dept.student_count} student{dept.student_count !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                        <Badge className={`text-[10px] ${getScoreBadge(dept.average_score)}`}>
                                            {Number(dept.average_score).toFixed(1)}%
                                        </Badge>
                                    </div>

                                    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${getScoreColor(dept.average_score)}`}
                                            style={{ width: `${Math.min(dept.average_score, 100)}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-center">
                                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Students</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{dept.student_count}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/10">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Excellent</p>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{dept.excellent_count}</p>
                                        </div>
                                        <div className="p-2 rounded-lg bg-red-50 dark:bg-red-900/10">
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Critical</p>
                                            <p className="text-sm font-bold text-red-600 dark:text-red-400">{dept.critical_count}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {departments.length === 0 && (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto mb-3">
                                <Building2 className="w-7 h-7 text-slate-400 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No Department Data</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">No department performance data available yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
