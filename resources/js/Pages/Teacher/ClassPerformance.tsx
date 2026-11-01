import { useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    School, Users, BarChart3, BookOpen, ClipboardCheck, Shield, HandHeart,
    TrendingUp, AlertTriangle, Trophy, Star,
} from 'lucide-react';

interface StudentScore {
    student_id: number;
    total_score: number;
    classification: string;
    academic_score: number;
    attendance_score: number;
    homework_score: number;
    behavior_score: number;
    metadata: Record<string, any>;
}

interface StudentModel {
    id: number;
    full_name: string;
    schoolClass?: { name: string };
    section?: { name: string };
}

interface Behaviour {
    id: number;
    category: string;
    type: string;
    severity: string;
    occurred_at: string;
    student: { id: number; full_name: string; };
}

interface Props {
    linked: boolean;
    students: StudentScore[];
    studentModels: StudentModel[];
    behaviours: Behaviour[];
    classId: number;
    sectionId: number | null;
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

const behaviourSeverityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    major: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    minor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function ClassPerformance({ linked, students, studentModels, behaviours, classId, sectionId }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Class Performance">
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <School className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
                    <h2 className="text-xl font-bold text-slate-700 dark:text-slate-300">Account Not Linked</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">Link your account to a school to view class performance.</p>
                </div>
            </AppLayout>
        );
    }

    const studentMap = useMemo(() => {
        const map = new Map<number, StudentModel>();
        for (const s of studentModels) map.set(s.id, s);
        return map;
    }, [studentModels]);

    const rankedStudents = useMemo(() => {
        return [...students]
            .sort((a, b) => b.total_score - a.total_score)
            .map((s, i) => ({ ...s, rank: i + 1, model: studentMap.get(s.student_id) }));
    }, [students, studentMap]);

    const averages = useMemo(() => {
        if (students.length === 0) return { total: 0, academic: 0, attendance: 0, homework: 0, behavior: 0 };
        const n = students.length;
        return {
            total: students.reduce((s, e) => s + e.total_score, 0) / n,
            academic: students.reduce((s, e) => s + e.academic_score, 0) / n,
            attendance: students.reduce((s, e) => s + e.attendance_score, 0) / n,
            homework: students.reduce((s, e) => s + e.homework_score, 0) / n,
            behavior: students.reduce((s, e) => s + e.behavior_score, 0) / n,
        };
    }, [students]);

    const behaviourCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const b of behaviours) {
            const key = b.severity;
            counts[key] = (counts[key] || 0) + 1;
        }
        return counts;
    }, [behaviours]);

    const avgItems = [
        { label: 'Average Score', value: averages.total, icon: BarChart3 },
        { label: 'Academic', value: averages.academic, icon: BookOpen },
        { label: 'Attendance', value: averages.attendance, icon: HandHeart },
        { label: 'Homework', value: averages.homework, icon: ClipboardCheck },
        { label: 'Behavior', value: averages.behavior, icon: Shield },
    ];

    const className = rankedStudents[0]?.model?.schoolClass?.name || `Class ${classId}`;
    const sectionName = rankedStudents[0]?.model?.section?.name || '';

    return (
        <AppLayout title="Class Performance">
            <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white flex items-center gap-5">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/20">
                        <School className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Class Performance</h1>
                        <p className="text-white/80 text-sm mt-1">
                            {className}{sectionName ? ` — ${sectionName}` : ''} · {students.length} students
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {avgItems.map((item) => (
                        <Card key={item.label}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                                        <item.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{Number(item.value).toFixed(1)}%</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Trophy className="w-4 h-4 text-yellow-500" /> Ranked Student List
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                                <th className="text-left py-2 font-medium w-12">Rank</th>
                                                <th className="text-left py-2 font-medium">Student</th>
                                                <th className="text-center py-2 font-medium">Academic</th>
                                                <th className="text-center py-2 font-medium">Attendance</th>
                                                <th className="text-center py-2 font-medium">Homework</th>
                                                <th className="text-center py-2 font-medium">Behavior</th>
                                                <th className="text-center py-2 font-medium">Total</th>
                                                <th className="text-center py-2 font-medium">Class</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rankedStudents.map((entry) => (
                                                <tr key={entry.student_id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-2.5">
                                                        <span className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold ${
                                                            entry.rank <= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                            {entry.rank}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5">
                                                        <p className="font-medium text-slate-900 dark:text-white">{entry.model?.full_name || `Student #${entry.student_id}`}</p>
                                                    </td>
<td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{Number(entry.academic_score).toFixed(1)}</td>
                                                     <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{Number(entry.attendance_score).toFixed(1)}</td>
                                                     <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{Number(entry.homework_score).toFixed(1)}</td>
                                                     <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">{Number(entry.behavior_score).toFixed(1)}</td>
                                                     <td className="py-2.5 text-center font-semibold text-indigo-600 dark:text-indigo-400">{Number(entry.total_score).toFixed(1)}%</td>
                                                    <td className="py-2.5 text-center">
                                                        <Badge className={`text-[10px] ${classificationColors[entry.classification] || ''}`}>
                                                            {classificationLabels[entry.classification] || entry.classification}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {rankedStudents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No student data for this class.</p>}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Star className="w-4 h-4 text-yellow-500" /> Top 3 Performers
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {rankedStudents.slice(0, 3).map((entry) => (
                                        <div key={entry.student_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <div className="flex items-center gap-3">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                                                    entry.rank === 1 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : entry.rank === 2 ? 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                                                }`}>
                                                    #{entry.rank}
                                                </span>
                                                <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.model?.full_name || `Student #${entry.student_id}`}</p>
                                            </div>
                                            <p className="text-sm font-bold text-green-600 dark:text-green-400">{Number(entry.total_score).toFixed(1)}%</p>
                                        </div>
                                    ))}
                                    {rankedStudents.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No data.</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <TrendingUp className="w-4 h-4 text-green-500" /> Classification Distribution
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(classificationLabels).map(([key, label]) => {
                                        const count = students.filter((s) => s.classification === key).length;
                                        const pct = students.length > 0 ? (count / students.length) * 100 : 0;
                                        return (
                                            <div key={key}>
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-slate-600 dark:text-slate-400">{label}</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200">{count}</span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${classificationColors[key]?.split(' ')[0] || 'bg-slate-400'}`}
                                                        style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {behaviours.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                        <AlertTriangle className="w-4 h-4 text-orange-500" /> Behaviour Trends
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 mb-4">
                                        {Object.entries(behaviourCounts).map(([severity, count]) => (
                                            <div key={severity} className="flex items-center justify-between text-sm">
                                                <Badge className={`text-[10px] ${behaviourSeverityColors[severity] || ''}`}>{severity}</Badge>
                                                <span className="font-semibold text-slate-800 dark:text-slate-200">{count}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {behaviours.slice(0, 10).map((b) => (
                                            <div key={b.id} className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <p className="font-medium text-slate-900 dark:text-white">{b.student.full_name}</p>
                                                    <Badge className={`text-[10px] ${behaviourSeverityColors[b.severity] || ''}`}>{b.severity}</Badge>
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 mt-0.5">{b.type} · {b.category}</p>
                                                <p className="text-slate-400 dark:text-slate-500 mt-0.5">{b.occurred_at}</p>
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
