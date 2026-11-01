import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, FileText, Award } from 'lucide-react';

interface ExamRegistration {
    id: number; exam_type: string; exam_type_label: string; index_number: string | null;
    exam_year: number; total_score: number | null; overall_grade: string | null;
    overall_result: string | null; subject_scores: Record<string, unknown> | null;
    status: string; academic_year: string | null; term: string | null;
}
interface Props {
    linked: boolean;
    student: { full_name: string; class: string | null; npse_index_number: string | null; bece_index_number: string | null; wassce_index_number: string | null; };
    exams: ExamRegistration[];
}

const statusColor: Record<string, string> = {
    registered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

import { gradeColor } from '@/lib/gradeColor';

export default function ExaminationCentre({ linked, student, exams }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Examination Centre">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const indexNumbers = [
        { label: 'NPSE', value: student.npse_index_number },
        { label: 'BECE', value: student.bece_index_number },
        { label: 'WASSCE', value: student.wassce_index_number },
    ].filter(i => i.value);

    return (
        <AppLayout title="Examination Centre">
            <div className="space-y-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Examination Centre</h1>
                    <p className="text-sm text-slate-500">{student.class}</p>
                </div>

                {indexNumbers.length > 0 && (
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                                <FileText className="w-4 h-4 text-indigo-500" /> Registered Index Numbers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {indexNumbers.map(idx => (
                                    <div key={idx.label} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                                        <p className="text-xs text-slate-500 mb-0.5">{idx.label}</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{idx.value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {exams.length === 0 ? (
                    <Card><CardContent className="py-16 text-center text-slate-400">No examination records found.</CardContent></Card>
                ) : (
                    <div className="space-y-4">
                        {exams.map(exam => (
                            <Card key={exam.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="flex items-center justify-between text-sm font-semibold">
                                        <span className="flex items-center gap-2">
                                            <Award className="w-4 h-4 text-indigo-500" />
                                            {exam.exam_type_label}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-slate-400">{exam.exam_year}</span>
                                            <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', statusColor[exam.status] ?? 'bg-slate-100 text-slate-600')}>{exam.status}</span>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Index Number</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.index_number ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Score</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.total_score != null ? exam.total_score : '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Grade</p>
                                            <p className={cn('text-sm font-bold', gradeColor(exam.overall_grade))}>{exam.overall_grade ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Result</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.overall_result ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Term</p>
                                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.term ?? '—'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
