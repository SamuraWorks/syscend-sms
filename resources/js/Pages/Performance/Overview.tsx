import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Brain, Trophy, AlertTriangle, TrendingUp, Users, BarChart3, Target, Bell, BookOpen, Award, CheckCircle,
} from 'lucide-react';

interface Student { id: number; first_name: string; last_name: string; full_name: string; class_id: number; section_id: number | null; photo: string | null; }
interface Score { id: number; student_id: number; total_score: number; classification: string; class_rank: number | null; school_rank: number | null; student: Student; }
interface Subject { subject_name: string; average_percentage: number; student_count: number; pass_count: number; }
interface Dept { average_score: number; student_count: number; excellent_count: number; critical_count: number; }
interface Alert { id: number; type: string; severity: string; title: string; message: string; student: Student; created_at: string; }
interface Summary {
    total_students: number; average_score: number;
    excellent_count: number; good_count: number; needs_monitoring_count: number; needs_support_count: number; critical_count: number;
    classification_distribution: Record<string, number>;
}

interface Props {
    linked: boolean; summary: Summary; topStudents: Score[]; atRiskStudents: Score[];
    improvedStudents: any[]; departmentPerformance: Record<string, Dept>;
    subjectPerformance: Subject[]; recentAlerts: Alert[];
    academicYearId: number | null; termId: number | null;
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const classificationLabels: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', needs_monitoring: 'Needs Monitoring', needs_support: 'Needs Support', critical: 'Critical',
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function PerformanceOverview({ linked, summary, topStudents, atRiskStudents, improvedStudents, departmentPerformance, subjectPerformance, recentAlerts }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Performance Overview">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Brain className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Performance Intelligence</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view performance analytics.</p>
                </div>
            </AppLayout>
        );
    }

    const dist = summary.classification_distribution || {};
    const distTotal = Object.values(dist).reduce((a: number, b: number) => a + b, 0) || 1;

    return (
        <AppLayout title="Performance Intelligence Overview">
            <div className="space-y-6">
                {/* Hero */}
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Brain className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Student Performance Intelligence</h1>
                        <p className="text-white/80 text-sm mt-1">Real-time analytics, early warnings, and intervention tracking</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[
                        { label: 'Total Students', value: summary.total_students, icon: Users, color: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
                        { label: 'Average Score', value: `${summary.average_score}%`, icon: BarChart3, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
                        { label: 'Excellent', value: summary.excellent_count, icon: Trophy, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600 dark:text-green-400' },
                        { label: 'Good', value: summary.good_count, icon: CheckCircle, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600 dark:text-blue-400' },
                        { label: 'Needs Support', value: summary.needs_support_count, icon: AlertTriangle, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600 dark:text-orange-400' },
                        { label: 'Critical', value: summary.critical_count, icon: Target, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600 dark:text-red-400' },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${s.color}`}>
                                        <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Distribution bar */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><BarChart3 className="w-4 h-4 text-indigo-500" /> Classification Distribution</CardTitle></CardHeader>
                    <CardContent>
                        <div className="flex h-8 rounded-full overflow-hidden">
                            {Object.entries(dist).map(([key, count]) => (
                                <div key={key} className={`${classificationColors[key]?.split(' ')[0] || 'bg-gray-100'}`}
                                    style={{ width: `${(count / distTotal) * 100}%` }}
                                    title={`${classificationLabels[key] || key}: ${count}`} />
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {Object.entries(dist).map(([key, count]) => (
                                <span key={key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <span className={`w-2.5 h-2.5 rounded-full ${classificationColors[key]?.split(' ')[0] || 'bg-gray-300'}`} />
                                    {classificationLabels[key] || key}: {count}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Top Students */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><Trophy className="w-4 h-4 text-yellow-500" /> Top Performing Students</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {topStudents.slice(0, 10).map((s, i) => (
                                        <div key={s.student_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">{i + 1}</span>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{s.student.full_name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Rank #{s.school_rank || i + 1}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{s.total_score}%</p>
                                                <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{classificationLabels[s.classification] || s.classification}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {topStudents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No performance data yet. Run recalculation.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Subject Performance */}
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><BookOpen className="w-4 h-4 text-blue-500" /> Subject Performance</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {subjectPerformance.map((s) => (
                                        <div key={s.subject_name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{s.subject_name}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(s.average_percentage, 100)}%` }} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white w-12 text-right">{s.average_percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                    {subjectPerformance.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No subject data yet.</p>}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* At Risk + Alerts */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-orange-200 dark:border-orange-800/40">
                            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400"><AlertTriangle className="w-4 h-4" /> Students Requiring Attention</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {atRiskStudents.slice(0, 8).map((s) => (
                                        <div key={s.student_id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.student.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Score: {s.total_score}%</p>
                                            </div>
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{classificationLabels[s.classification] || s.classification}</Badge>
                                        </div>
                                    ))}
                                    {atRiskStudents.length === 0 && <p className="text-sm text-green-600 text-center py-4">All students performing well!</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><Bell className="w-4 h-4 text-red-500" /> Recent Alerts</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {recentAlerts.map((a) => (
                                        <div key={a.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                                                <Badge className={`text-[10px] ${severityColors[a.severity] || ''}`}>{a.severity}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.student.full_name}</p>
                                        </div>
                                    ))}
                                    {recentAlerts.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No recent alerts</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Department Performance */}
                        {Object.keys(departmentPerformance).length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><Award className="w-4 h-4 text-purple-500" /> Department Performance</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(departmentPerformance).map(([key, dept]) => (
                                            <div key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">{key}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">{dept.average_score}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {improvedStudents.length > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"><TrendingUp className="w-4 h-4 text-green-500" /> Most Improved</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {improvedStudents.slice(0, 5).map((s: any) => (
                                            <div key={s.student_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">Student #{s.student_id}</span>
                                                <span className="text-sm font-bold text-green-600">+{Number(s.improvement).toFixed(1)}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
