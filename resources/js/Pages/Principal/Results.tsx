import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, ChevronRight, TrendingUp, TrendingDown, Users, Award } from 'lucide-react';

interface ExamResult { exam: string; class: string; pass_rate: number; total: number; passed: number; }
interface TopPerformer { id: number; name: string; class: string; marks: number; percentage: number; }
interface SubjectComp { subject: string; avg_marks: number; highest: number; lowest: number; pass_rate: number; }
interface Props {
    linked: boolean;
    results: ExamResult[];
    topPerformers: TopPerformer[];
    subjectComparison: SubjectComp[];
    reportCardStatus: { generated: number; pending: number; total: number };
}

export default function Results({ linked, results, topPerformers, subjectComparison, reportCardStatus }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Results">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BarChart3 className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalExams = results.length;
    const avgPassRate = totalExams > 0 ? Math.round(results.reduce((sum, r) => sum + r.pass_rate, 0) / totalExams) : 0;

    return (
        <AppLayout title="Results">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Results</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-cyan-500" /> Results & Analytics
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Exam results and performance analytics</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-cyan-100 dark:bg-cyan-900/30"><BarChart3 className="w-4 h-4 text-cyan-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalExams}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Completed Exams</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-green-100 dark:bg-green-900/30"><TrendingUp className="w-4 h-4 text-green-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgPassRate}%</p>
                            <p className="text-xs text-slate-500 mt-0.5">Average Pass Rate</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100 dark:bg-amber-900/30"><Award className="w-4 h-4 text-amber-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{reportCardStatus.generated}/{reportCardStatus.total}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Report Cards Generated</p>
                        </CardContent>
                    </Card>
                </div>

                {topPerformers.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-amber-500" /> Top Performing Students
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {topPerformers.map((s, i) => (
                                    <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold', i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-200 text-slate-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500')}>
                                            #{i + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                                            <p className="text-xs text-slate-400">{s.class}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{s.marks}</p>
                                            <p className="text-xs text-slate-400">{s.percentage}%</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {results.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Users className="w-4 h-4 text-indigo-500" /> Exam Results by Class
                            </h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {results.map((r, i) => (
                                    <div key={i} className="px-4 py-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.exam}</p>
                                            <Badge variant="outline" className="text-[10px]">{r.pass_rate}% pass</Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>Class: {r.class}</span>
                                            <span>Passed: {r.passed}/{r.total}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {subjectComparison.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Subject Performance</h2>
                        </div>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Subject</th>
                                        <th className="text-center py-3 px-4 font-medium">Avg Marks</th>
                                        <th className="text-center py-3 px-4 font-medium">Highest</th>
                                        <th className="text-center py-3 px-4 font-medium">Lowest</th>
                                        <th className="text-center py-3 px-4 font-medium">Pass Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subjectComparison.map(s => (
                                        <tr key={s.subject} className="border-b border-slate-50 dark:border-slate-800/50">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{s.subject}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">{s.avg_marks}</td>
                                            <td className="py-3 px-4 text-center text-green-600">{s.highest}</td>
                                            <td className="py-3 px-4 text-center text-red-500">{s.lowest}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className={cn('text-[10px]', s.pass_rate >= 80 ? 'text-green-600' : s.pass_rate >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                                    {s.pass_rate}%
                                                </Badge>
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
