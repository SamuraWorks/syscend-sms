import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import { BookOpen, Users, GraduationCap, BarChart3, Award, ChevronRight } from 'lucide-react';

interface ClassItem { id: number; name: string; section: string | null; student_count: number; }
interface Subject { id: number; name: string; code: string | null; teacher_name: string | null; class_count: number; }
interface ClassPerformance { class: string; avg_marks: number; highest: number; lowest: number; pass_rate: number; }
interface ExamSummary { total_exams: number; completed: number; upcoming: number; active: number; }
interface Props {
    linked: boolean;
    classes: ClassItem[]; subjects: Subject[];
    performance: ClassPerformance[]; examSummary: ExamSummary;
    academicYear: string | null; academicTerm: string | null;
}

export default function Academic({
    linked, classes, subjects, performance, examSummary, academicYear, academicTerm,
}: Props) {
    if (!linked) {
        return (
            <AppLayout title="Academic Overview">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const maxStudents = classes.length > 0 ? Math.max(...classes.map(c => c.student_count)) : 1;

    return (
        <AppLayout title="Academic Overview">
            <div className="space-y-6">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Link href="/school/principal/dashboard" className="hover:text-slate-700 dark:hover:text-slate-300">Principal</Link>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Academic</span>
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-500" /> Academic Overview
                        </h1>
                        <p className="text-sm text-slate-500 mt-0.5">School-wide academic overview</p>
                    </div>
                    {(academicYear || academicTerm) && (
                        <Badge variant="secondary" className="text-xs">{academicYear}{academicTerm ? ` · ${academicTerm}` : ''}</Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Exams', value: examSummary.total_exams, icon: BarChart3, color: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600' },
                        { label: 'Completed', value: examSummary.completed, icon: Award, color: 'bg-green-100 dark:bg-green-900/30', iconColor: 'text-green-600' },
                        { label: 'Active', value: examSummary.active, icon: BookOpen, color: 'bg-amber-100 dark:bg-amber-900/30', iconColor: 'text-amber-600' },
                        { label: 'Upcoming', value: examSummary.upcoming, icon: Users, color: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600' },
                    ].map(s => (
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

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <Users className="w-4 h-4 text-indigo-500" /> Classes &amp; Student Count
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {classes.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No class data available.</p>
                        ) : (
                            <div className="space-y-3">
                                {classes.map(c => (
                                    <div key={c.id}>
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-slate-600 dark:text-slate-400 font-medium">
                                                {c.name}{c.section ? ` — ${c.section}` : ''}
                                            </span>
                                            <span className="text-slate-500 font-semibold">{c.student_count} students</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-indigo-500 transition-all"
                                                style={{ width: `${maxStudents > 0 ? (c.student_count / maxStudents) * 100 : 0}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                            <BookOpen className="w-4 h-4 text-violet-500" /> Subjects
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {subjects.length === 0 ? (
                            <p className="text-sm text-slate-400 text-center py-4">No subjects found.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {subjects.map(s => (
                                    <div key={s.id} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Badge variant="secondary" className="text-[10px]">{s.code ?? '—'}</Badge>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                                        </div>
                                        <p className="text-xs text-slate-500">{s.teacher_name ?? 'No teacher assigned'}</p>
                                        <p className="text-xs text-slate-400">{s.class_count} class{s.class_count !== 1 ? 'es' : ''}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {performance.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <BarChart3 className="w-4 h-4 text-emerald-500" /> Class Performance
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead>Class</TableHead>
                                        <TableHead className="text-center">Avg Marks</TableHead>
                                        <TableHead className="text-center">Highest</TableHead>
                                        <TableHead className="text-center">Lowest</TableHead>
                                        <TableHead>Pass Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {performance.map((p, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium text-slate-900 dark:text-white text-sm">{p.class}</TableCell>
                                            <TableCell className="text-center text-sm">{p.avg_marks}%</TableCell>
                                            <TableCell className="text-center text-sm text-green-600 dark:text-green-400">{p.highest}%</TableCell>
                                            <TableCell className="text-center text-sm text-red-500">{p.lowest}%</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.pass_rate}%` }} />
                                                    </div>
                                                    <span className="text-sm">{p.pass_rate}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
