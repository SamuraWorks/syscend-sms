import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    BookOpen, GraduationCap, Award, FileText, TrendingUp, Users, ChevronRight,
} from 'lucide-react';

interface ClassPerformance { class_name: string; avg_marks: number; pass_rate: number; }
interface ExamPassRate { exam_name: string; pass_rate: number; total_students: number; }
interface TopEntry { name: string; value: number; }
interface NationalExamReadiness { npse: number; bece: number; wassce: number; }
interface ReportCardStatus { generated: number; total: number; }
interface Props {
    linked: boolean;
    classPerformance: ClassPerformance[];
    examPassRates: ExamPassRate[];
    topClasses: TopEntry[];
    topSubjects: TopEntry[];
    nationalExamReadiness: NationalExamReadiness;
    reportCardStatus: ReportCardStatus;
}

export default function ProprietorAcademic({
    linked, classPerformance, examPassRates, topClasses, topSubjects,
    nationalExamReadiness, reportCardStatus,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Academic Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-16 h-16 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300">Account not linked</h2>
                    <p className="text-slate-500 mt-2 max-w-sm">Your user account hasn&apos;t been linked yet. Please contact the system administrator.</p>
                </div>
            </AppLayout>
        );
    }

    const avgPassRate = classPerformance.length > 0
        ? Math.round(classPerformance.reduce((sum, c) => sum + c.pass_rate, 0) / classPerformance.length)
        : 0;

    const summaryCards = [
        { label: 'Avg Pass Rate', value: `${avgPassRate}%`, icon: TrendingUp, color: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600' },
        { label: 'Report Cards', value: `${reportCardStatus.generated}/${reportCardStatus.total}`, icon: FileText, color: 'bg-blue-100 dark:bg-blue-900/30', iconColor: 'text-blue-600' },
        { label: 'Top Class', value: topClasses.length > 0 ? topClasses[0].name : '—', icon: Award, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
        { label: 'Total Exams', value: examPassRates.length, icon: GraduationCap, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
    ];

    return (
        <AppLayout title="Academic Overview">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/proprietor/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Proprietor</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Academic</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-500" /> Academic Overview
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Performance metrics and academic insights</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {summaryCards.map(s => (
                        <Card key={s.label}>
                            <CardContent className="p-4">
                                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-2', s.color)}>
                                    <s.icon className={cn('w-4 h-4', s.iconColor)} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BookOpen className="w-4 h-4 text-indigo-500" /> Class Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {classPerformance.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No performance data available.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700">
                                                <th className="text-left py-2 text-xs font-medium text-slate-500">Class</th>
                                                <th className="text-right py-2 text-xs font-medium text-slate-500">Avg Marks</th>
                                                <th className="text-right py-2 text-xs font-medium text-slate-500">Pass Rate</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classPerformance.map((cp, i) => (
                                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                                    <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">{cp.class_name}</td>
                                                    <td className="py-2.5 text-right text-slate-700 dark:text-slate-300">{Number(cp.avg_marks).toFixed(1)}%</td>
                                                    <td className="py-2.5 text-right">
                                                        <Badge className={cn(
                                                            'text-[10px]',
                                                            cp.pass_rate >= 70 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                                : cp.pass_rate >= 50 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        )}>{cp.pass_rate}%</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <GraduationCap className="w-4 h-4 text-violet-500" /> Exam Pass Rates
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {examPassRates.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No exam data available.</p>
                            ) : (
                                <div className="space-y-3">
                                    {examPassRates.map((e, i) => (
                                        <div key={i}>
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{e.exam_name}</span>
                                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{e.pass_rate}%</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                                                <div className={cn(
                                                    'h-2 rounded-full',
                                                    e.pass_rate >= 70 ? 'bg-emerald-500' : e.pass_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                                )} style={{ width: `${e.pass_rate}%` }} />
                                            </div>
                                            <span className="text-[10px] text-slate-400">{e.total_students} students</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Award className="w-4 h-4 text-amber-500" /> Top Classes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topClasses.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No data.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {topClasses.map((t, i) => (
                                        <li key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{t.name}</span>
                                            </div>
                                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{t.value}%</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BookOpen className="w-4 h-4 text-blue-500" /> Top Subjects
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {topSubjects.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-4">No data.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {topSubjects.map((t, i) => (
                                        <li key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{t.name}</span>
                                            </div>
                                            <Badge className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t.value}%</Badge>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Users className="w-4 h-4 text-emerald-500" /> National Exam Readiness
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">NPSE</p>
                                    <p className="text-[10px] text-slate-400">National Primary School Exam</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{nationalExamReadiness.npse}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">BECE</p>
                                    <p className="text-[10px] text-slate-400">Basic Education Certificate Exam</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{nationalExamReadiness.bece}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">WASSCE</p>
                                    <p className="text-[10px] text-slate-400">West African Senior School Exam</p>
                                </div>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{nationalExamReadiness.wassce}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
