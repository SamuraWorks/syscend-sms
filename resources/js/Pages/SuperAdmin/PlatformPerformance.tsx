import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from '@inertiajs/react';
import {
    School, Users, TrendingUp, Award, ArrowUp, ArrowDown,
    Trophy, AlertTriangle, Plus,
} from 'lucide-react';

interface SchoolStat {
    school_id: number;
    school_name: string;
    student_count: number;
    average_score: number;
    promotion_rate: number;
    at_risk_count: number;
    classification_distribution: Record<string, number>;
}

interface Props {
    hasSchools: boolean;
    schoolStats: SchoolStat[];
    bestPerforming: SchoolStat[];
    lowestPerforming: SchoolStat[];
    totalSchools: number;
    totalStudents: number;
    platformAverage: number;
}

const sortedByScore = (stats: SchoolStat[]) => [...stats].sort((a, b) => b.average_score - a.average_score);

export default function PlatformPerformance({
    hasSchools, schoolStats, bestPerforming, lowestPerforming,
    totalSchools, totalStudents, platformAverage,
}: Props) {
    if (!hasSchools) {
        return (
            <AppLayout title="Platform Performance">
                <div className="space-y-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Performance</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Executive analytics across all schools</p>
                    </div>
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
                                <TrendingUp className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No performance data yet</h2>
                            <p className="mt-2 text-sm text-slate-500 max-w-md">
                                Performance analytics will appear here once you add schools, enroll students, and record assessments.
                            </p>
                            <Link
                                href="/super-admin/schools/create"
                                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Your First School
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    const sorted = sortedByScore(schoolStats ?? []);

    return (
        <AppLayout title="Platform Performance">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Platform Performance</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Executive analytics across all schools</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                <School className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Schools</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalSchools}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
                                <Users className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Total Students</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{totalStudents.toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5 flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                                <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-wide">Platform Average</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white">{Number(platformAverage).toFixed(1)}%</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {bestPerforming.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-green-200 dark:border-green-900">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Best Performing</span>
                                </div>
                                {bestPerforming.map((s) => (
                                    <div key={s.school_id} className="flex items-center justify-between mb-3 last:mb-0">
                                        <div className="flex items-center gap-2">
                                            <ArrowUp className="w-4 h-4 text-green-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{s.school_name}</span>
                                        </div>
                                        <Badge className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{s.average_score.toFixed(1)}%</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="border-red-200 dark:border-red-900">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                    <span className="text-sm font-semibold text-red-700 dark:text-red-400">Lowest Performing</span>
                                </div>
                                {lowestPerforming.map((s) => (
                                    <div key={s.school_id} className="flex items-center justify-between mb-3 last:mb-0">
                                        <div className="flex items-center gap-2">
                                            <ArrowDown className="w-4 h-4 text-red-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{s.school_name}</span>
                                        </div>
                                        <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{s.average_score.toFixed(1)}%</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Award className="w-4 h-4 text-indigo-500" /> School Rankings by Average Score
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {sorted.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No performance data available yet</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-2 text-xs font-medium text-slate-500 w-12">#</th>
                                            <th className="text-left py-2 text-xs font-medium text-slate-500">School</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Students</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Avg Score</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Promotion Rate</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">At-Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.map((school, i) => (
                                            <tr key={school.school_id} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-3">
                                                    <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                                        {i + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium text-slate-800 dark:text-slate-200">{school.school_name}</td>
                                                <td className="py-3 text-right text-slate-600 dark:text-slate-400">{school.student_count}</td>
                                                <td className="py-3 text-right font-semibold text-slate-800 dark:text-slate-200">{school.average_score.toFixed(1)}%</td>
                                                <td className="py-3 text-right">
                                                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{school.promotion_rate.toFixed(1)}%</Badge>
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Badge className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{school.at_risk_count}</Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
