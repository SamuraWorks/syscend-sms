import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, BarChart3, Users, CheckCircle } from 'lucide-react';

interface SubjectData {
    subject_name: string;
    average_marks: number;
    full_marks: number;
    average_percentage: number;
    student_count: number;
    pass_count: number;
}

interface Props {
    linked: boolean;
    performance: SubjectData[];
}

function getPerformanceColor(pct: number): string {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-blue-500';
    if (pct >= 40) return 'bg-yellow-500';
    if (pct >= 20) return 'bg-orange-500';
    return 'bg-red-500';
}

function getPerformanceBadge(pct: number): string {
    if (pct >= 80) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (pct >= 60) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (pct >= 40) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (pct >= 20) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
}

function getPerformanceLabel(pct: number): string {
    if (pct >= 80) return 'Excellent';
    if (pct >= 60) return 'Good';
    if (pct >= 40) return 'Average';
    if (pct >= 20) return 'Below Avg';
    return 'Poor';
}

export default function SubjectPerformance({ linked, performance }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Subject Performance">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view subject performance data.</p>
                </div>
            </AppLayout>
        );
    }

    const overallAvg = performance.length > 0
        ? performance.reduce((sum, s) => sum + s.average_percentage, 0) / performance.length
        : 0;

    return (
        <AppLayout title="Subject Performance">
            <div className="space-y-6">
                {/* Header */}
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Subject Performance</h1>
                        <p className="text-white/80 text-sm mt-1">
                            Average performance across {performance.length} subject{performance.length !== 1 ? 's' : ''} · Overall average: {Number(overallAvg).toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{performance.length}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Subjects</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">
                                    {performance.reduce((sum, s) => sum + s.student_count, 0)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Total Students</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subject Table */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BarChart3 className="w-4 h-4 text-blue-500" /> Subject Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-2 font-medium">Subject</th>
                                        <th className="text-center py-2 font-medium">Avg Score</th>
                                        <th className="text-center py-2 font-medium">Percentage</th>
                                        <th className="text-left py-2 font-medium w-40">Performance</th>
                                        <th className="text-center py-2 font-medium">Pass Rate</th>
                                        <th className="text-center py-2 font-medium">Students</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {performance.map((s) => {
                                        const passRate = s.student_count > 0 ? (s.pass_count / s.student_count) * 100 : 0;
                                        return (
                                            <tr key={s.subject_name} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 text-slate-700 dark:text-slate-300 font-medium">{s.subject_name}</td>
                                                <td className="py-3 text-center text-slate-600 dark:text-slate-400">
                                                    {Number(s.average_marks).toFixed(1)} / {s.full_marks}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <Badge className={`text-[10px] ${getPerformanceBadge(s.average_percentage)}`}>
                                                        {Number(s.average_percentage).toFixed(1)}%
                                                    </Badge>
                                                </td>
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all ${getPerformanceColor(s.average_percentage)}`}
                                                                style={{ width: `${Math.min(s.average_percentage, 100)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 w-14 text-right">
                                                            {getPerformanceLabel(s.average_percentage)}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className={`text-sm font-semibold ${
                                                        passRate >= 80 ? 'text-green-600 dark:text-green-400'
                                                        : passRate >= 50 ? 'text-yellow-600 dark:text-yellow-400'
                                                        : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                        {Number(passRate).toFixed(0)}%
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">({s.pass_count}/{s.student_count})</span>
                                                </td>
                                                <td className="py-3 text-center text-slate-600 dark:text-slate-400">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Users className="w-3.5 h-3.5" /> {s.student_count}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {performance.map((s) => {
                                const passRate = s.student_count > 0 ? (s.pass_count / s.student_count) * 100 : 0;
                                return (
                                    <div key={s.subject_name} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.subject_name}</p>
                                            <Badge className={`text-[10px] ${getPerformanceBadge(s.average_percentage)}`}>
                                                {Number(s.average_percentage).toFixed(1)}%
                                            </Badge>
                                        </div>
                                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${getPerformanceColor(s.average_percentage)}`}
                                                style={{ width: `${Math.min(s.average_percentage, 100)}%` }} />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                            <span>Avg: {Number(s.average_marks).toFixed(1)} / {s.full_marks}</span>
                                            <span>Pass: {Number(passRate).toFixed(0)}% ({s.pass_count}/{s.student_count})</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {performance.length === 0 && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No subject performance data available yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
