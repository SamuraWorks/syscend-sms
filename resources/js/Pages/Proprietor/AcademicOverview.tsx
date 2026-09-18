import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, GraduationCap, Award, TrendingUp, Users,
    AlertTriangle, CheckCircle, School,
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

interface Subject {
    subject_name: string;
    average_percentage: number;
    student_count: number;
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
    subjectPerformance: Subject[];
    totalStudents: number;
    totalStaff: number;
    promotionData: { total: number; promoted: number; at_risk: number; promotion_rate: number; };
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AcademicOverview({
    linked, summary, topStudents, atRiskStudents, departmentPerformance,
    subjectPerformance, totalStudents, totalStaff, promotionData,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Academic Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const deptEntries = Object.entries(departmentPerformance);

    return (
        <AppLayout title="Academic Overview">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Overview</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Executive-level performance metrics across the school</p>
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
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(summary.average_score).toFixed(1)}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Average Score</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-2">
                                <School className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{Number(promotionData.promotion_rate).toFixed(1)}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Promotion Rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-2">
                                <Award className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalStaff}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Staff</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-green-200 dark:border-green-900">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-green-600">{summary.excellent_count}</p>
                            <p className="text-xs text-slate-500">Excellent</p>
                        </CardContent>
                    </Card>
                    <Card className="border-blue-200 dark:border-blue-900">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-blue-600">{summary.good_count}</p>
                            <p className="text-xs text-slate-500">Good</p>
                        </CardContent>
                    </Card>
                    <Card className="border-yellow-200 dark:border-yellow-900">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-yellow-600">{summary.needs_monitoring_count}</p>
                            <p className="text-xs text-slate-500">Needs Monitoring</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 dark:border-red-900">
                        <CardContent className="p-4 text-center">
                            <p className="text-2xl font-bold text-red-600">{summary.critical_count}</p>
                            <p className="text-xs text-slate-500">Critical</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <TrendingUp className="w-4 h-4 text-emerald-500" /> Top Students
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
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{Number(s.total_score).toFixed(1)}%</Badge>
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
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{Number(s.total_score).toFixed(1)}%</Badge>
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
                                                <td className="py-2.5 text-right font-semibold text-slate-700 dark:text-slate-300">{Number(dept.average_score).toFixed(1)}%</td>
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

                {subjectPerformance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BookOpen className="w-4 h-4 text-blue-500" /> Subject Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-700">
                                            <th className="text-left py-2 text-xs font-medium text-slate-500">Subject</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Students</th>
                                            <th className="text-right py-2 text-xs font-medium text-slate-500">Average %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subjectPerformance.map((sub, i) => (
                                            <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                                <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{sub.subject_name}</td>
                                                <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">{sub.student_count}</td>
                                                <td className="py-2.5 text-right">
                                                    <span className={`font-semibold ${
                                                        sub.average_percentage >= 70 ? 'text-green-600' :
                                                        sub.average_percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                                    }`}>{Number(sub.average_percentage).toFixed(1)}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
