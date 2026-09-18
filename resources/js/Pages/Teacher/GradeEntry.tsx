import { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import AppLayout from '@/Layouts/AppLayout';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Save, BookOpen } from 'lucide-react';

interface ExamInfo {
    id: number; name: string; type: string; class: string | null; class_id: number;
    ca_weight: number | null; exam_weight: number | null;
}
interface Student { id: number; first_name: string; last_name: string; admission_no: string; }
interface Subject { id: number; name: string; }
interface ExistingMark {
    student_id: number; subject_id: number; marks_obtained: number | null;
    grade: string | null; is_absent: boolean;
}
interface Props {
    linked: boolean;
    teacher: { full_name: string };
    exam: ExamInfo;
    students: Student[];
    subjects: Subject[];
    existingMarks: ExistingMark[];
    subjectId: number | null;
}

type MarksBuffer = Record<number, { marks_obtained: string; is_absent: boolean }>;

export default function GradeEntry({ linked, teacher, exam, students, subjects, existingMarks, subjectId }: Props) {
    if (!linked) {
        return (
            <AppLayout title="Enter Marks">
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <BookOpen className="w-14 h-14 text-slate-300 mb-4" />
                    <h2 className="text-lg font-semibold text-slate-600 dark:text-slate-400">Account not linked</h2>
                </div>
            </AppLayout>
        );
    }

    const [selectedSubject, setSelectedSubject] = useState<string>(subjectId ? String(subjectId) : '');
    const [buffer, setBuffer] = useState<MarksBuffer>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const init: MarksBuffer = {};
        const filtered = subjectId
            ? existingMarks.filter(m => m.subject_id === subjectId)
            : existingMarks;
        students.forEach(s => {
            const existing = filtered.find(m => m.student_id === s.id);
            init[s.id] = {
                marks_obtained: existing?.marks_obtained != null ? String(existing.marks_obtained) : '',
                is_absent: existing?.is_absent ?? false,
            };
        });
        setBuffer(init);
    }, [students.length, subjectId, existingMarks.length]);

    function setMark(studentId: number, field: string, value: string | boolean) {
        setBuffer(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], [field]: value },
        }));
    }

    function handleSubjectChange(value: string) {
        setSelectedSubject(value);
        router.get(`/school/teacher/exams/${exam.id}/grades`, { subject_id: value || undefined }, { preserveScroll: true });
    }

    function handleSave() {
        if (!selectedSubject) {
            toast.error('Please select a subject first');
            return;
        }
        setSaving(true);
        const marks = students.map(s => ({
            student_id: s.id,
            marks_obtained: buffer[s.id]?.is_absent ? null : (buffer[s.id]?.marks_obtained ? Number(buffer[s.id].marks_obtained) : null),
            is_absent: buffer[s.id]?.is_absent ?? false,
        }));
        router.post(`/school/teacher/exams/${exam.id}/grades`, {
            subject_id: Number(selectedSubject),
            marks,
        }, {
            preserveScroll: true,
            onSuccess: () => { toast.success('Marks saved successfully'); },
            onFinish: () => setSaving(false),
        });
    }

    return (
        <AppLayout title="Enter Marks">
            <div className="space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/school/teacher/exams" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Exams
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{exam.name}</h1>
                            <p className="text-sm text-slate-500">{exam.class} · Grades Entry</p>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={saving || !selectedSubject || students.length === 0} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                        <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Marks'}
                    </Button>
                </div>

                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">Exam</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Type</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{exam.type}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Class</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.class ?? '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">CA Weight</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.ca_weight != null ? `${exam.ca_weight}%` : '—'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">Exam Weight</p>
                                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{exam.exam_weight != null ? `${exam.exam_weight}%` : '—'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Subject</label>
                        <select
                            value={selectedSubject}
                            onChange={e => handleSubjectChange(e.target.value)}
                            className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                        >
                            <option value="">Select subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                {students.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex items-center justify-center py-20">
                        <p className="text-slate-400">No students found in this class.</p>
                    </div>
                ) : (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 dark:bg-slate-900">
                                    <TableHead className="w-8">#</TableHead>
                                    <TableHead className="min-w-[180px]">Student</TableHead>
                                    <TableHead className="min-w-[120px]">Admission No</TableHead>
                                    <TableHead className="text-center min-w-[120px]">Marks Obtained</TableHead>
                                    <TableHead className="text-center min-w-[100px]">Grade</TableHead>
                                    <TableHead className="text-center min-w-[80px]">Absent</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {students.map((student, idx) => {
                                    const rec = buffer[student.id];
                                    const isAbsent = rec?.is_absent ?? false;
                                    const existingMark = existingMarks.find(
                                        m => m.student_id === student.id && m.subject_id === Number(selectedSubject),
                                    );
                                    return (
                                        <TableRow key={student.id}>
                                            <TableCell className="text-slate-400 text-xs">{idx + 1}</TableCell>
                                            <TableCell>
                                                <p className="font-medium text-slate-900 dark:text-white text-sm">
                                                    {student.first_name} {student.last_name}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">{student.admission_no}</TableCell>
                                            <TableCell className="text-center p-1.5">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    className={cn(
                                                        'w-24 h-8 text-center text-sm',
                                                        isAbsent ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : '',
                                                    )}
                                                    value={isAbsent ? '' : (rec?.marks_obtained ?? '')}
                                                    disabled={isAbsent}
                                                    onChange={e => setMark(student.id, 'marks_obtained', e.target.value)}
                                                    placeholder="—"
                                                />
                                            </TableCell>
                                            <TableCell className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
                                                {existingMark?.grade ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center p-1.5">
                                                <label className="flex items-center justify-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAbsent}
                                                        onChange={e => setMark(student.id, 'is_absent', e.target.checked)}
                                                        className="w-3.5 h-3.5"
                                                    />
                                                    Absent
                                                </label>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {students.length > 0 && (
                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving || !selectedSubject} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 inline-flex items-center gap-2">
                            <Save className="w-4 h-4" /> {saving ? 'Saving...' : `Save Marks (${students.length} students)`}
                        </Button>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
