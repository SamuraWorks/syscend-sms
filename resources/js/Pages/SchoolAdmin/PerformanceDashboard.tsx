import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, TrendingUp, Users, AlertTriangle, UserX, ImageOff,
    GraduationCap, Award, CheckCircle,
} from 'lucide-react';

interface Summary {
    total_students: number;
    average_score: number;
    excellent_count: number;
    good_count: number;
    needs_monitoring_count: number;
    needs_support_count: number;
    critical_count: number;
}

interface Score {
    student_id: number;
    total_score: number;
    classification: string;
    student: { id: number; full_name: string; class_id: number; };
}

interface Dept {
    average_score: number;
    student_count: number;
    excellent_count: number;
    critical_count: number;
}

interface Props {
    linked: boolean;
    summary: Summary;
    topStudents: Score[];
    atRiskStudents: Score[];
    departmentPerformance: Record<string, Dept>;
    studentsWithoutGuardians: number;
    studentsWithoutClass: number;
    studentsWithoutPhoto: number;
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function PerformanceDashboard({
    linked, summary, topStudents, atRiskStudents, departmentPerformance,
    studentsWithoutGuardians, studentsWithoutClass, studentsWithoutPhoto,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Performance Dashboard">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <TrendingUp className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const deptEntries = Object.entries(departmentPerformance);
    const totalDataIssues = studentsWithoutGuardians + studentsWithoutClass + studentsWithoutPhoto;

    return (
        <AppLayout title="Performance Dashboard">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Performance Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">School performance overview with data quality monitoring</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-2">
                                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.total_students}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Students</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
                                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.average_score.toFixed(1)}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Average Score</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-2xl font-bold text-green-600">{summary.excellent_count}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Excellent</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                            <p className="text-2xl font-bold text-red-600">{summary.critical_count}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Critical</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <CheckCircle className="w-4 h-4 text-emerald-500" /> Top Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topStudents.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No data</p>
                            ) : (
                                <ul className="space-y-2">
                                    {topStudents.map((s, i) => (
                                        <li key={s.student_id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{s.student.full_name}</span>
                                            </div>
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{s.total_score.toFixed(1)}%</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <AlertTriangle className="w-4 h-4 text-red-500" /> At-Risk Students
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {atRiskStudents.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No at-risk students</p>
                            ) : (
                                <ul className="space-y-2">
                                    {atRiskStudents.map((s) => (
                                        <li key={s.student_id} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{s.student.full_name}</span>
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{s.total_score.toFixed(1)}%</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {deptEntries.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <GraduationCap className="w-4 h-4 text-indigo-500" /> Department Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-2 text-xs font-medium text-slate-500">Department</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Students</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Avg Score</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Excellent</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Critical</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deptEntries.map(([name, dept]) => (
                                            <tr key={name} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200 capitalize">{name}</td>
                                                <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{dept.student_count}</td>
                                                <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">{dept.average_score.toFixed(1)}%</td>
                                                <td className="py-2.5 text-right text-green-600">{dept.excellent_count}</td>
                                                <td className="py-2.5 text-right text-red-600">{dept.critical_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {totalDataIssues > 0 && (
                    <Card className="border-amber-200 dark:border-amber-900">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="w-4 h-4" /> Data Quality Alerts
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <UserX className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div>
                                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{studentsWithoutGuardians}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Missing Guardians</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div>
                                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{studentsWithoutClass}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Missing Class Assignment</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                    <ImageOff className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                                    <div>
                                        <p className="text-lg font-bold text-amber-700 dark:text-amber-300">{studentsWithoutPhoto}</p>
                                        <p className="text-xs text-amber-600 dark:text-amber-400">Missing Photos</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
