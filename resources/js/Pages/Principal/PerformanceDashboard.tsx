import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    GraduationCap, Users, BookOpen, BarChart3, AlertTriangle, Brain, Trophy, TrendingUp,
    Target, Bell, Award, CheckCircle, Shield, Briefcase,
} from 'lucide-react';

interface Student { id: number; full_name: string; class_id: number; section_id: number | null; photo: string | null; }
interface Score { student_id: number; total_score: number; classification: string; class_rank: number | null; school_rank: number | null; student: Student; }
interface Subject { subject_name: string; average_percentage: number; student_count: number; pass_count: number; }
interface Dept { average_score: number; student_count: number; excellent_count: number; critical_count: number; }
interface Alert { id: number; title: string; severity: string; student: Student; created_at: string; }
interface Summary {
    total_students: number; average_score: number;
    excellent_count: number; good_count: number; needs_monitoring_count: number; needs_support_count: number; critical_count: number;
}
interface Props {
    linked: boolean; summary: Summary; topStudents: Score[]; atRiskStudents: Score[];
    improvedStudents: any[]; departmentPerformance: Record<string, Dept>;
    subjectPerformance: Subject[]; recentAlerts: Alert[];
    totalStudents: number; totalStaff: number; totalClasses: number;
    activeInterventions: number; academicYearId: number | null; termId: number | null;
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

export default function PerformanceDashboard({
    linked, summary, topStudents, atRiskStudents, improvedStudents, departmentPerformance,
    subjectPerformance, recentAlerts, totalStudents, totalStaff, totalClasses,
    activeInterventions,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Performance Dashboard">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Brain className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view the performance dashboard.</p>
                </div>
            </AppLayout>
        );
    }

    const distTotal = summary.excellent_count + summary.good_count + summary.needs_monitoring_count + summary.needs_support_count + summary.critical_count || 1;

    const distSegments = [
        { key: 'excellent', count: summary.excellent_count, color: 'bg-green-500' },
        { key: 'good', count: summary.good_count, color: 'bg-blue-500' },
        { key: 'needs_monitoring', count: summary.needs_monitoring_count, color: 'bg-yellow-500' },
        { key: 'needs_support', count: summary.needs_support_count, color: 'bg-orange-500' },
        { key: 'critical', count: summary.critical_count, color: 'bg-red-500' },
    ];

    const statCards = [
        { label: 'Total Students', value: totalStudents, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Total Staff', value: totalStaff, icon: Briefcase, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Total Classes', value: totalClasses, icon: BookOpen, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
        { label: 'Average Score', value: `${summary.average_score}%`, icon: BarChart3, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Active Interventions', value: activeInterventions, icon: Shield, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
        { label: 'At-Risk Students', value: (atRiskStudents ?? []).length, icon: AlertTriangle, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600' },
    ];

    return (
        <AppLayout title="Principal Performance Dashboard">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Brain className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Principal Performance Dashboard</h1>
                        <p className="text-white/80 text-sm mt-1">School-wide academic performance overview and intervention tracking</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    {statCards.map((s) => (
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

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BarChart3 className="w-4 h-4 text-indigo-500" /> Classification Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex h-8 rounded-full overflow-hidden">
                            {distSegments.map((seg) => (
                                seg.count > 0 && (
                                    <div key={seg.key} className={`${seg.color}`}
                                        style={{ width: `${(seg.count / distTotal) * 100}%` }}
                                        title={`${classificationLabels[seg.key]}: ${seg.count}`} />
                                )
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-3">
                            {distSegments.map((seg) => (
                                <span key={seg.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                    <span className={`w-2.5 h-2.5 rounded-full ${seg.color}`} />
                                    {classificationLabels[seg.key]}: {seg.count}
                                </span>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Top Performing Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(topStudents ?? []).slice(0, 10).map((s, i) => (
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
                                    {(topStudents ?? []).length === 0 && <p className="text-sm text-slate-500 text-center py-4">No performance data yet.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <BookOpen className="w-4 h-4 text-blue-500" /> Subject Performance
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {(subjectPerformance ?? []).map((s) => (
                                        <div key={s.subject_name} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <span className="text-sm text-slate-700 dark:text-slate-300">{s.subject_name}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">{s.student_count} students</span>
                                                <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${Math.min(s.average_percentage, 100)}%` }} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-900 dark:text-white w-12 text-right">{s.average_percentage}%</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(subjectPerformance ?? []).length === 0 && <p className="text-sm text-slate-500 text-center py-4">No subject data yet.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {Object.keys(departmentPerformance ?? {}).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <Award className="w-4 h-4 text-purple-500" /> Department Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {Object.entries(departmentPerformance ?? {}).map(([key, dept]) => (
                                            <div key={key} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                                                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{key}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-slate-500 dark:text-slate-400">{dept.student_count} students</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{dept.average_score}%</span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] text-green-600 dark:text-green-400">{dept.excellent_count} excellent</span>
                                                    <span className="text-[10px] text-red-500 dark:text-red-400">{dept.critical_count} critical</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {(improvedStudents ?? []).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <TrendingUp className="w-4 h-4 text-green-500" /> Most Improved
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {(improvedStudents ?? []).slice(0, 5).map((s: any) => (
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

                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-orange-200 dark:border-orange-800/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                    <AlertTriangle className="w-4 h-4" /> Students Requiring Attention
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(atRiskStudents ?? []).slice(0, 8).map((s) => (
                                        <div key={s.student_id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{s.student.full_name}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Score: {s.total_score}%</p>
                                            </div>
                                            <Badge className={`text-[10px] ${classificationColors[s.classification] || ''}`}>{classificationLabels[s.classification] || s.classification}</Badge>
                                        </div>
                                    ))}
                                    {(atRiskStudents ?? []).length === 0 && <p className="text-sm text-green-600 text-center py-4">All students performing well!</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Bell className="w-4 h-4 text-red-500" /> Recent Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {(recentAlerts ?? []).map((a) => (
                                        <div key={a.id} className="p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{a.title}</p>
                                                <Badge className={`text-[10px] ${severityColors[a.severity] || ''}`}>{a.severity}</Badge>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{a.student.full_name}</p>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{a.created_at}</p>
                                        </div>
                                    ))}
                                    {(recentAlerts ?? []).length === 0 && <p className="text-sm text-slate-500 text-center py-4">No recent alerts</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Quick Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Total Students</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{totalStudents}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Average Score</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.average_score}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Excellent Students</span>
                                        <span className="font-semibold text-green-600">{summary.excellent_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Critical Students</span>
                                        <span className="font-semibold text-red-500">{summary.critical_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500">Active Interventions</span>
                                        <span className="font-semibold text-amber-600">{activeInterventions}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
