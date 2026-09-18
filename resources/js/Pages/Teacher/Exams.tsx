import { useState } from 'react';
import { Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { GraduationCap, ArrowRight } from 'lucide-react';

interface ExamRow {
    id: number; name: string; type: string; start_date: string | null;
    end_date: string | null; status: string; class: string | null;
    academic_year: string | null; term: string | null; marks_count: number;
}
interface Subject { id: number; name: string; class_id: number; }
interface ClassRow { id: number; name: string; }
interface Props {
    linked: boolean;
    teacher: { full_name: string };
    exams: ExamRow[];
    subjects: Subject[];
    classes: ClassRow[];
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    published: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    active: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
};

const TYPE_LABELS: Record<string, string> = {
    unit_test: 'Unit Test', mid_term: 'Mid Term', final: 'Final', custom: 'Custom',
};

export default function Exams({ linked, teacher, exams, subjects, classes }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Examinations">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [classFilter, setClassFilter] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    const filtered = exams.filter(e => {
        if (classFilter && e.class !== classes.find(c => c.id === Number(classFilter))?.name) return false;
        if (statusFilter && e.status !== statusFilter) return false;
        return true;
    });

    return (
        <AppLayout title="Examinations">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Examinations</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{exams.length} exams</p>
                    </div>
                </div>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Class</label>
                                <select
                                    value={classFilter}
                                    onChange={e => setClassFilter(e.target.value)}
                                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                >
                                    <option value="">All Classes</option>
                                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                                <select
                                    value={statusFilter}
                                    onChange={e => setStatusFilter(e.target.value)}
                                    className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                                >
                                    <option value="">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                    <option value="completed">Completed</option>
                                    <option value="active">Active</option>
                                </select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Dates</TableHead>
                                <TableHead>Term</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-center">Marks</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                        No exams found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map(exam => (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white text-sm">
                                        {exam.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">
                                            {TYPE_LABELS[exam.type] ?? exam.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">{exam.class ?? '—'}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {exam.start_date ? new Date(exam.start_date).toLocaleDateString() : '—'}
                                        {exam.end_date ? ` – ${new Date(exam.end_date).toLocaleDateString()}` : ''}
                                    </TableCell>
                                    <TableCell className="text-slate-500 text-sm">
                                        {exam.term ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn('border-0 text-xs capitalize', STATUS_STYLE[exam.status] ?? 'bg-slate-100 text-slate-600')}>
                                            {exam.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-slate-500">
                                        {exam.marks_count}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/school/teacher/exams/${exam.id}/grades`}>
                                            <Button variant="outline" size="sm" className="text-xs inline-flex items-center gap-1">
                                                Enter Marks <ArrowRight className="w-3 h-3" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}
