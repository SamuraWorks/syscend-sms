import { useState } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Upload, Send, BookOpen, Award, GraduationCap, Filter } from 'lucide-react';
import type { PageProps, PaginatedResponse } from '@/Types';

interface Student { id: number; first_name: string; last_name: string; admission_no: string; }
interface AcademicYear { id: number; name: string; is_current: boolean; }

interface NationalExam {
    id: number; student_id: number; exam_type: string; index_number: string | null;
    exam_year: number; total_score: number | null; overall_grade: string | null;
    overall_result: string | null; subject_scores: Record<string, unknown>[] | null;
    status: string; notes: string | null; created_at: string;
    student?: Student; academic_year?: { id: number; name: string };
}

interface ExamTypeInfo { label: string; short_label: string; level: string; class: string; description: string; }
interface GradeItem { grade: string; gpa: number; min: number; max: number; remark: string; interpretation: string; }

interface ImportRow {
    student_id: string | number;
    total_score: string;
    subject_scores: Record<string, string | number | boolean | null>[] | null;
}

interface ImportFormData {
    results: ImportRow[];
    exam_type: string;
    exam_year: number;
}

interface Props extends PageProps {
    exams: PaginatedResponse<NationalExam>;
    examTypes: Record<string, ExamTypeInfo>;
    gradeScale: GradeItem[];
    academicYears: AcademicYear[];
    students: Student[];
    filters: { exam_type?: string; exam_year?: string; status?: string };
    stats: { total: number; npse: number; bece: number; wassce: number };
}

const STATUS_STYLE: Record<string, string> = {
    registered: 'bg-slate-100 text-slate-600',
    sat: 'bg-blue-100 text-blue-700',
    results_pending: 'bg-yellow-100 text-yellow-700',
    results_published: 'bg-green-100 text-green-700',
};

export default function NationalExamsIndex({ exams, examTypes, gradeScale, academicYears, students, filters, stats }: Props) {
    const [open, setOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '', academic_year_id: '', exam_type: 'wassce', index_number: '', exam_year: new Date().getFullYear(), notes: '',
    });

    const { data: importData, setData: setImportData, post: postImport, processing: importProcessing, errors: importErrors, reset: resetImport } = useForm<ImportFormData>({
        results: [{ student_id: '', total_score: '', subject_scores: null }],
        exam_type: 'wassce',
        exam_year: new Date().getFullYear(),
    });

    function applyFilter(key: string, value: string) {
        router.get('/school/national-exams', { ...filters, [key]: value || undefined }, { preserveScroll: true });
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setShowConfirm(true);
    }

    function doSubmit() {
        post('/school/national-exams', { onSuccess: () => { reset(); setOpen(false); setShowConfirm(false); } });
    }

    function handleImport(e: React.FormEvent) {
        e.preventDefault();
        postImport('/school/national-exams/import-results', { onSuccess: () => { resetImport(); setImportOpen(false); } });
    }

    function handlePublish(examType: string, examYear: number) {
        router.post('/school/national-exams/publish-results', { exam_type: examType, exam_year: examYear });
    }

    const statCards = [
        { label: 'Total', value: stats.total, color: 'text-indigo-600', icon: BookOpen },
        { label: 'NPSE', value: stats.npse, color: 'text-emerald-600', icon: Award },
        { label: 'BECE', value: stats.bece, color: 'text-blue-600', icon: GraduationCap },
        { label: 'WASSCE', value: stats.wassce, color: 'text-purple-600', icon: GraduationCap },
    ];

    return (
        <AppLayout breadcrumbs={[{ label: 'National Examinations' }]}>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">National Examinations</h1>
                        <p className="text-sm text-slate-500">NPSE, BECE & WASSCE — registration, results & publishing</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}><Upload className="w-4 h-4 mr-1" /> Import Results</Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" /> Register Student</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((s) => (
                        <Card key={s.label} className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                            <CardContent className="flex items-center gap-3 p-4">
                                <s.icon className={`w-8 h-8 ${s.color}`} />
                                <div>
                                    <p className="text-2xl font-bold">{s.value}</p>
                                    <p className="text-xs text-slate-500">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="flex gap-3">
                    <Select value={filters.exam_type ?? 'all'} onValueChange={(v) => applyFilter('exam_type', v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(examTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v.short_label}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status ?? 'all'} onValueChange={(v) => applyFilter('status', v === 'all' ? '' : v)}>
                        <SelectTrigger className="w-40 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            {['registered', 'sat', 'results_pending', 'results_published'].map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Exam Type</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Index No.</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Grade</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {exams.data.length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-400">No records found</TableCell></TableRow>
                            ) : exams.data.map((exam) => (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium">{exam.student?.first_name} {exam.student?.last_name}</TableCell>
                                    <TableCell><Badge variant="outline">{examTypes[exam.exam_type]?.short_label ?? exam.exam_type}</Badge></TableCell>
                                    <TableCell>{exam.exam_year}</TableCell>
                                    <TableCell className="font-mono text-sm">{exam.index_number ?? '—'}</TableCell>
                                    <TableCell>{exam.total_score ?? '—'}</TableCell>
                                    <TableCell><Badge>{exam.overall_grade ?? '—'}</Badge></TableCell>
                                    <TableCell><Badge className={STATUS_STYLE[exam.status] ?? ''}>{exam.status.replace(/_/g, ' ')}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {exams.meta && exams.meta.last_page > 1 && (
                        <div className="flex justify-between items-center px-4 py-3 border-t">
                            <span className="text-sm text-slate-500">Page {exams.meta.current_page} of {exams.meta.last_page} ({exams.meta.total} total)</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" disabled={!exams.links.prev} onClick={() => exams.links.prev && router.visit(exams.links.prev)}>Previous</Button>
                                <Button variant="outline" size="sm" disabled={!exams.links.next} onClick={() => exams.links.next && router.visit(exams.links.next)}>Next</Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Grade Scale Reference */}
                <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <h3 className="text-sm font-semibold mb-3">WASSCE Grade Scale</h3>
                        <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            {gradeScale.map((g) => (
                                <div key={g.grade} className={`px-3 py-2 rounded text-sm ${g.grade === 'F9' ? 'bg-red-50 text-red-700' : g.grade.startsWith('A') ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'}`}>
                                    <span className="font-bold">{g.grade}</span> — {g.remark} ({g.min}–{g.max})
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Register Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Register for National Exam</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Student *</Label>
                            <Select value={data.student_id} onValueChange={(v) => setData('student_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                                <SelectContent>
                                    {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Exam Type *</Label>
                                <Select value={data.exam_type} onValueChange={(v) => setData('exam_type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(examTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v.short_label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exam Year *</Label>
                                <Input type="number" value={data.exam_year} onChange={(e) => setData('exam_year', Number(e.target.value))} />
                            </div>
                        </div>
                        <div>
                            <Label>Academic Year *</Label>
                            <Select value={data.academic_year_id} onValueChange={(v) => setData('academic_year_id', v)}>
                                <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
                                <SelectContent>
                                    {academicYears.map((y) => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Index Number</Label>
                            <Input value={data.index_number} onChange={(e) => setData('index_number', e.target.value)} placeholder="Board index number" />
                        </div>
                        <div>
                            <Label>Notes</Label>
                            <Textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} rows={2} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing}>{processing ? 'Registering...' : 'Register'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Confirm Registration"
                description={`Register this student for ${examTypes[data.exam_type]?.label ?? data.exam_type}?`}
                confirmText="Register"
                onConfirm={doSubmit}
            />

            {/* Import Dialog */}
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader><DialogTitle>Import Exam Results</DialogTitle></DialogHeader>
                    <form onSubmit={handleImport} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Exam Type *</Label>
                                <Select value={importData.exam_type} onValueChange={(v) => setImportData('exam_type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(examTypes).map(([k, v]) => <SelectItem key={k} value={k}>{v.short_label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exam Year *</Label>
                                <Input type="number" value={importData.exam_year} onChange={(e) => setImportData('exam_year', Number(e.target.value))} />
                            </div>
                        </div>
                        {importData.results.map((row, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-3 border rounded p-3">
                                <div>
                                    <Label>Student *</Label>
                                    <Select value={String(row.student_id)} onValueChange={(v) => {
                                        const newResults = [...importData.results];
                                        newResults[idx].student_id = Number(v);
                                        setImportData('results', newResults);
                                    }}>
                                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                        <SelectContent>
                                            {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Total Score *</Label>
                                    <Input type="number" step="0.01" value={row.total_score} onChange={(e) => {
                                        const newResults = [...importData.results];
                                        newResults[idx].total_score = e.target.value;
                                        setImportData('results', newResults);
                                    }} />
                                </div>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => setImportData('results', [...importData.results, { student_id: '', total_score: '', subject_scores: null }])}>
                            + Add Row
                        </Button>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={importProcessing}>{importProcessing ? 'Importing...' : 'Import Results'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
