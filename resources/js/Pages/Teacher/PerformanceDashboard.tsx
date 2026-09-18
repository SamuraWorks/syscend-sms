import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Brain, Users, BookOpen, BarChart3, AlertTriangle, Trophy, TrendingUp,
    Target, Bell, CheckCircle, ClipboardCheck, Shield, HandHeart, School,
} from 'lucide-react';

interface StudentEntry {
    student: { id: number; full_name: string; class_id: number; schoolClass?: { name: string }; photo: string | null; photo_url: string | null; };
    score: number;
    classification: string;
}

interface FormMasterEntry {
    student: { id: number; full_name: string; class_id: number; schoolClass?: { name: string }; section?: { name: string }; };
    score: {
        total_score: number; classification: string;
        academic_score: number; attendance_score: number; homework_score: number; behavior_score: number;
        subject_scores: Record<string, any>;
    };
}

interface Alert {
    id: number; title: string; severity: string;
    student: { id: number; full_name: string; };
}

interface Summary {
    total_students: number; average_score: number;
    excellent_count: number; good_count: number;
    needs_monitoring_count: number; needs_support_count: number; critical_count: number;
}

interface Props {
    linked: boolean;
    summary: Summary;
    subjectStudents: StudentEntry[];
    formMasterStudents: FormMasterEntry[] | null;
    isFormMaster: boolean;
    recentAlerts: Alert[];
}

const classificationColors: Record<string, string> = {
    excellent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    good: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    needs_monitoring: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    needs_support: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

const classificationLabels: Record<string, string> = {
    excellent: 'Excellent', good: 'Good', needs_monitoring: 'Needs Monitoring',
    needs_support: 'Needs Support', critical: 'Critical',
};

const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function PerformanceDashboard({ linked, summary, subjectStudents, formMasterStudents, isFormMaster, recentAlerts }: Props) {
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
        { label: 'Total Students', value: summary.total_students, icon: Users, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
        { label: 'Average Score', value: `${summary.average_score}%`, icon: BarChart3, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Excellent', value: summary.excellent_count, icon: Trophy, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
        { label: 'Needs Monitoring', value: summary.needs_monitoring_count, icon: Target, color: 'bg-yellow-100 dark:bg-yellow-900/30', iconColor: 'text-yellow-600' },
        { label: 'Needs Support', value: summary.needs_support_count, icon: Shield, color: 'bg-orange-100 dark:bg-orange-900/30', iconColor: 'text-orange-600' },
        { label: 'Critical', value: summary.critical_count, icon: AlertTriangle, color: 'bg-red-100 dark:bg-red-900/30', iconColor: 'text-red-600' },
    ];

    const sortedSubjectStudents = [...subjectStudents].sort((a, b) => b.score - a.score);

    return (
        <AppLayout title="Teacher Performance Dashboard">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <Brain className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Teacher Performance Dashboard</h1>
                        <p className="text-white/80 text-sm mt-1">Monitor student performance across your subjects{isFormMaster ? ' and form class' : ''}</p>
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
                                    <BookOpen className="w-4 h-4 text-blue-500" /> Subject Students
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {sortedSubjectStudents.map((entry, i) => (
                                        <div key={entry.student.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                                            onClick={() => { window.location.href = `/school/teacher/students/${entry.student.id}`; }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                                                    {i + 1}
                                                </span>
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/40 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {entry.student.photo_url
                                                        ? <img src={entry.student.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                        : <span className="text-xs font-bold text-indigo-600">{entry.student.full_name[0]}</span>
                                                    }
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.student.full_name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{entry.student.schoolClass?.name || `Class ${entry.student.class_id}`}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.score}%</p>
                                                <Badge className={`text-[10px] ${classificationColors[entry.classification] || ''}`}>
                                                    {classificationLabels[entry.classification] || entry.classification}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {sortedSubjectStudents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No subject student data yet.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        {isFormMaster && formMasterStudents && formMasterStudents.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <School className="w-4 h-4 text-violet-500" /> Form Master Class
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {formMasterStudents
                                            .sort((a, b) => b.score.total_score - a.score.total_score)
                                            .map((entry, i) => (
                                                <div key={entry.student.id}
                                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-bold">
                                                            {i + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.student.full_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {entry.student.schoolClass?.name || ''}{entry.student.section?.name ? ` — ${entry.student.section.name}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{entry.score.total_score}%</p>
                                                        <Badge className={`text-[10px] ${classificationColors[entry.score.classification] || ''}`}>
                                                            {classificationLabels[entry.score.classification] || entry.score.classification}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {isFormMaster && formMasterStudents && formMasterStudents.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <ClipboardCheck className="w-4 h-4 text-amber-500" /> Form Master — Score Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                    <th className="text-left py-2 font-medium">Student</th>
                                                    <th className="text-center py-2 font-medium">Academic</th>
                                                    <th className="text-center py-2 font-medium">Attendance</th>
                                                    <th className="text-center py-2 font-medium">Homework</th>
                                                    <th className="text-center py-2 font-medium">Behavior</th>
                                                    <th className="text-center py-2 font-medium">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formMasterStudents
                                                    .sort((a, b) => b.score.total_score - a.score.total_score)
                                                    .map((entry) => (
                                                        <tr key={entry.student.id} className="border-b border-slate-50 dark:border-slate-800/50">
                                                            <td className="py-2 text-slate-700 dark:text-slate-300 font-medium">{entry.student.full_name}</td>
<td className="py-2 text-center text-slate-600 dark:text-slate-400">{Number(entry.score.academic_score).toFixed(1)}</td>
                                                             <td className="py-2 text-center text-slate-600 dark:text-slate-400">{Number(entry.score.attendance_score).toFixed(1)}</td>
                                                             <td className="py-2 text-center text-slate-600 dark:text-slate-400">{Number(entry.score.homework_score).toFixed(1)}</td>
                                                             <td className="py-2 text-center text-slate-600 dark:text-slate-400">{Number(entry.score.behavior_score).toFixed(1)}</td>
                                                             <td className="py-2 text-center font-semibold text-indigo-600 dark:text-indigo-400">{Number(entry.score.total_score).toFixed(1)}%</td>
                                                        </tr>
                                                    ))
                                                }
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-orange-200 dark:border-orange-800/40">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-700 dark:text-orange-400">
                                    <HandHeart className="w-4 h-4" /> Students Needing Attention
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sortedSubjectStudents
                                        .filter((e) => ['needs_support', 'critical', 'needs_monitoring'].includes(e.classification))
                                        .map((entry) => (
                                            <div key={entry.student.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 dark:bg-orange-900/10">
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.student.full_name}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">Score: {entry.score}%</p>
                                                </div>
                                                <Badge className={`text-[10px] ${classificationColors[entry.classification] || ''}`}>
                                                    {classificationLabels[entry.classification] || entry.classification}
                                                </Badge>
                                            </div>
                                        ))
                                    }
                                    {sortedSubjectStudents.filter((e) => ['needs_support', 'critical', 'needs_monitoring'].includes(e.classification)).length === 0 && (
                                        <p className="text-sm text-green-600 text-center py-4">All students performing well!</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Top Performers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {sortedSubjectStudents.slice(0, 5).map((entry, i) => (
                                        <div key={entry.student.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">{i + 1}</span>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.student.full_name}</p>
                                            </div>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{entry.score}%</p>
                                        </div>
                                    ))}
                                    {sortedSubjectStudents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data yet.</p>}
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

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <CheckCircle className="w-4 h-4 text-green-500" /> Quick Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Total Students</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.total_students}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Average Score</span>
                                        <span className="font-semibold text-slate-800 dark:text-slate-200">{summary.average_score}%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Excellent Students</span>
                                        <span className="font-semibold text-green-600 dark:text-green-400">{summary.excellent_count}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 dark:text-slate-400">Critical Students</span>
                                        <span className="font-semibold text-red-500 dark:text-red-400">{summary.critical_count}</span>
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
