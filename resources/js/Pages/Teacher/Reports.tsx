import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

interface ExamPerf { exam: string; average: number; highest: number; lowest: number; pass_rate: number; count: number; }
interface HWStat { title: string; submissions: number; students_in_class: number; }
interface Props {
    linked: boolean; teacher: { full_name: string };
    attendanceSummary: Record<string, number>;
    examPerformance: ExamPerf[];
    homeworkStats: HWStat[];
}

const attendanceMeta: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    present: { icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
    absent: { icon: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
    late: { icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
};

export default function TeacherReports({ linked, attendanceSummary, examPerformance, homeworkStats }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Reports">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BarChart3 className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const attendanceEntries = Object.entries(attendanceSummary);

    return (
        <AppLayout title="Reports">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reports</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Teaching performance overview</p>
                </div>

                {attendanceEntries.length > 0 && (
                    <div>
                        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-3">Attendance Summary</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {attendanceEntries.map(([key, value]) => {
                                const meta = attendanceMeta[key.toLowerCase()] ?? { icon: <BarChart3 className="w-5 h-5 text-slate-600" />, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-800' };
                                return (
                                    <Card key={key}>
                                        <CardContent className="p-5">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center shrink-0`}>
                                                    {meta.icon}
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                                                    <p className="text-xs text-slate-500 capitalize">{key}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {examPerformance.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BarChart3 className="w-4 h-4 text-indigo-500" /> Exam Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Exam</TableHead>
                                        <TableHead>Students</TableHead>
                                        <TableHead>Average</TableHead>
                                        <TableHead>Highest</TableHead>
                                        <TableHead>Lowest</TableHead>
                                        <TableHead>Pass Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {examPerformance.map((e, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{e.exam}</TableCell>
                                            <TableCell>{e.count}</TableCell>
                                            <TableCell>{e.average}%</TableCell>
                                            <TableCell className="text-green-600 dark:text-green-400">{e.highest}%</TableCell>
                                            <TableCell className="text-red-500">{e.lowest}%</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-green-500 rounded-full" style={{ width: `${e.pass_rate}%` }} />
                                                    </div>
                                                    <span className="text-sm">{e.pass_rate}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {homeworkStats.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BarChart3 className="w-4 h-4 text-violet-500" /> Homework Completion
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Assignment</TableHead>
                                        <TableHead>Submissions</TableHead>
                                        <TableHead>Total Students</TableHead>
                                        <TableHead>Completion</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {homeworkStats.map((h, i) => {
                                        const pct = h.students_in_class > 0 ? Math.round((h.submissions / h.students_in_class) * 100) : 0;
                                        return (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{h.title}</TableCell>
                                                <TableCell>{h.submissions}</TableCell>
                                                <TableCell>{h.students_in_class}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-sm">{pct}%</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}

                {attendanceEntries.length === 0 && examPerformance.length === 0 && homeworkStats.length === 0 && (
                    <Card><CardContent className="py-16 text-center text-slate-400">No report data available.</CardContent></Card>
                )}
            </div>
        </AppLayout>
    );
}
