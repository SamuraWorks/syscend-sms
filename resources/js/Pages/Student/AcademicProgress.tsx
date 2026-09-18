import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/Types';

interface ReportCardSummary {
    id: number; academic_year: string | null; term: string | null;
    percentage: number | null; grade: string | null; gpa: number | null;
    rank: number | null; total_marks: number | null; obtained_marks: number | null;
    attendance: { total: number | null; present: number | null; absent: number | null; late: number | null; };
}
interface TermMarks { subject: string | null; marks: number | null; total: number | null; grade: string | null; }
interface Props {
    linked: boolean; student: { full_name: string; class: string | null } | null;
    reportCards: ReportCardSummary[]; marksByTerm: TermMarks[][];
}

import { gradeColor } from '@/lib/gradeColor';

function ProgressBar({ pct }: { pct: number }) {
    return (
        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
                className={cn('h-full rounded-full', pct >= 75 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500')}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}

export default function AcademicProgress({ linked, student, reportCards, marksByTerm }: Props) {
    const { schoolConfig } = usePage<PageProps>().props;

    function ordinal(n: number): string {
        const s = ['th','st','nd','rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    if (!linked) {
        return (
            <AppLayout title="Academic Progress">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <TrendingUp className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const totalTerms = reportCards.length;
    const avgPercentage = totalTerms > 0
        ? reportCards.reduce((sum, rc) => sum + (rc.percentage ?? 0), 0) / totalTerms
        : 0;
    const bestGrade = reportCards.reduce<string | null>((best, rc) => {
        if (!rc.grade) return best;
        if (!best) return rc.grade;
        return rc.grade < best ? rc.grade : best;
    }, null);

    return (
        <AppLayout title="Academic Progress">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Progress</h1>
                    <p className="text-sm text-slate-500">{student?.class}</p>
                </div>

                {reportCards.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No academic progress data available yet.</CardContent></Card>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">Total Terms</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{totalTerms}</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">Average %</p>
                                    <p className={cn('text-xl font-bold', avgPercentage >= 75 ? 'text-green-600' : avgPercentage >= 50 ? 'text-amber-600' : 'text-red-600')}>
                                        {Number(avgPercentage).toFixed(1)}%
                                    </p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4 text-center">
                                    <p className="text-xs text-slate-500 mb-1">Best Grade</p>
                                    <p className={cn('text-xl font-bold', gradeColor(bestGrade))}>{bestGrade ?? '—'}</p>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-4">
                            {reportCards.map((rc, idx) => (
                                <Card key={rc.id}>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                            <span>{rc.academic_year} — {rc.term ?? '—'}</span>
                                            <div className="flex items-center gap-3">
                                                {schoolConfig?.result_show_position !== 'none' && rc.rank != null && (
                                                    <span className="text-xs text-slate-500">
                                                        {schoolConfig?.result_position_type === 'position' ? ordinal(rc.rank) : `Rank #${rc.rank}`}
                                                    </span>
                                                )}
                                                <span className={cn('text-sm font-bold', gradeColor(rc.grade))}>{rc.grade ?? '—'}</span>
                                            </div>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2 md:col-span-1">
                                                <p className="text-xs text-slate-500 mb-1">Percentage</p>
                                                <p className="text-lg font-bold text-slate-800 dark:text-white">{rc.percentage != null ? `${rc.percentage}%` : '—'}</p>
                                                {rc.percentage != null && <ProgressBar pct={rc.percentage} />}
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Marks</p>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                                    {rc.obtained_marks != null && rc.total_marks != null
                                                        ? `${rc.obtained_marks}/${rc.total_marks}`
                                                        : '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">GPA</p>
                                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{rc.gpa != null ? Number(rc.gpa).toFixed(2) : '—'}</p>
                                            </div>
                                            <div className="flex items-center gap-3 pt-4">
                                                <span className="flex items-center gap-1 text-xs text-green-600">
                                                    <CheckCircle className="w-3 h-3" /> {rc.attendance.present ?? 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-red-500">
                                                    <XCircle className="w-3 h-3" /> {rc.attendance.absent ?? 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                                    <Clock className="w-3 h-3" /> {rc.attendance.late ?? 0}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {marksByTerm.length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Subject Marks by Term</h2>
                                {marksByTerm.map((termMarks, idx) => (
                                    <TermMarksSection key={idx} termLabel={reportCards[idx]?.term ?? `Term ${idx + 1}`} marks={termMarks} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}

function TermMarksSection({ termLabel, marks }: { termLabel: string; marks: TermMarks[] }) {
    const [open, setOpen] = useState(false);

    return (
        <Card>
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-5 py-3 text-left"
            >
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{termLabel}</span>
                {open
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
            </button>
            {open && (
                <CardContent className="pt-0 pb-4">
                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 border-b dark:border-slate-700">
                                <th className="pb-2 font-medium">Subject</th>
                                <th className="pb-2 font-medium text-right">Marks</th>
                                <th className="pb-2 font-medium text-right">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {marks.map((m, i) => (
                                <tr key={i}>
                                    <td className="py-2 text-slate-700 dark:text-slate-300">{m.subject ?? '—'}</td>
                                    <td className="py-2 text-right text-slate-600 dark:text-slate-400">
                                        {m.marks != null ? <>{m.marks}{m.total ? <span className="text-slate-400">/{m.total}</span> : ''}</> : '—'}
                                    </td>
                                    <td className={cn('py-2 text-right font-bold', gradeColor(m.grade))}>{m.grade ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
