import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, ChevronRight, CalendarClock, CheckCircle2, Clock } from 'lucide-react';

interface Exam { id: number; name: string; type: string; start_date: string | null; end_date: string | null; status: string; }
interface ClassPerf { class: string; avg_marks: number; pass_rate: number; }
interface NationalExam { type: string; candidates: number; ready: number; }
interface Props { linked: boolean; exams: Exam[]; classPerformance: ClassPerf[]; nationalExamCandidates: NationalExam[]; }

export default function Exams({ linked, exams, classPerformance, nationalExamCandidates }: Props) {
    const [filter, setFilter] = useState('all');

    if (!linked) {
        return (
            <AppLayout title="Examinations">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <FileText className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const total = exams.length;
    const upcoming = exams.filter(e => e.status === 'upcoming').length;
    const ongoing = exams.filter(e => e.status === 'ongoing').length;
    const completed = exams.filter(e => e.status === 'completed').length;

    const filtered = filter === 'all' ? exams : exams.filter(e => e.status === filter);

    return (
        <AppLayout title="Examinations">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Examinations</span>
                </div>

                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-amber-500" /> Examinations
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage examinations and assessment schedules</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-slate-100 dark:bg-slate-800"><FileText className="w-4 h-4 text-slate-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Total Exams</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-blue-100 dark:bg-blue-900/30"><CalendarClock className="w-4 h-4 text-blue-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{upcoming}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Upcoming</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-amber-100 dark:bg-amber-900/30"><Clock className="w-4 h-4 text-amber-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{ongoing}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Ongoing</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-green-100 dark:bg-green-900/30"><CheckCircle2 className="w-4 h-4 text-green-600" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{completed}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Completed</p>
                        </CardContent>
                    </Card>
                </div>

                {nationalExamCandidates.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">National Examination Candidates</h2>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Exam Type</th>
                                        <th className="text-center py-3 px-4 font-medium">Total Candidates</th>
                                        <th className="text-center py-3 px-4 font-medium">Ready</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {nationalExamCandidates.map(n => (
                                        <tr key={n.type} className="border-b border-slate-50 dark:border-slate-800/50">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{n.type}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">{n.candidates}</td>
                                            <td className="py-3 px-4 text-center"><Badge variant="outline" className="text-[10px]">{n.ready}/{n.candidates}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {classPerformance.length > 0 && (
                    <Card>
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Class Performance</h2>
                        </div>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left py-3 px-4 font-medium">Class</th>
                                        <th className="text-center py-3 px-4 font-medium">Avg Marks</th>
                                        <th className="text-center py-3 px-4 font-medium">Pass Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classPerformance.map(c => (
                                        <tr key={c.class} className="border-b border-slate-50 dark:border-slate-800/50">
                                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{c.class}</td>
                                            <td className="py-3 px-4 text-center text-slate-500">{c.avg_marks}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className={cn('text-[10px]', c.pass_rate >= 80 ? 'text-green-600' : c.pass_rate >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                                    {c.pass_rate}%
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    {['all', 'upcoming', 'ongoing', 'completed'].map(s => (
                        <button key={s} onClick={() => setFilter(s)} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors', filter === s ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700')}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                    ))}
                </div>

                {exams.length === 0 ? (
                    <Card><CardContent className="py-16 text-center"><FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" /><p className="text-sm text-slate-400">No exams scheduled.</p></CardContent></Card>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs uppercase text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                    <th className="text-left py-3 px-4 font-medium">Exam</th>
                                    <th className="text-left py-3 px-4 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 font-medium">Start Date</th>
                                    <th className="text-left py-3 px-4 font-medium">End Date</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(ex => (
                                    <tr key={ex.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{ex.name}</td>
                                        <td className="py-3 px-4 text-slate-500 capitalize">{ex.type}</td>
                                        <td className="py-3 px-4 text-slate-500">{ex.start_date ?? '—'}</td>
                                        <td className="py-3 px-4 text-slate-500">{ex.end_date ?? '—'}</td>
                                        <td className="py-3 px-4">
                                            <Badge variant="secondary" className={cn('text-[10px] capitalize', ex.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : ex.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700')}>{ex.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
