import { useState } from 'react';
import { Link, router, usePage, useForm } from '@inertiajs/react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, MoreHorizontal, Pencil, Trash2, ClipboardList, BarChart3, BookOpen, FileText, Settings, Send, CheckCircle2 } from 'lucide-react';
import type { SchoolClass, PageProps, PaginatedResponse } from '@/Types';

interface Exam {
    id: number; name: string; type: string; class_id: number;
    start_date: string | null; end_date: string | null;
    status: 'draft' | 'published' | 'completed';
    description: string | null; created_at: string;
    ca_weight: number; exam_weight: number; max_score: number;
    assessment_model: string | null;
    submitted_at: string | null; approved_at: string | null;
    publication_date: string | null;
    school_class?: SchoolClass;
    assessment_links?: { assessment_type_id: number; max_marks: number; weight: number }[];
    sections?: { id: number; name: string }[];
    subjects?: { id: number; name: string }[];
}

interface AssessmentType { id: number; name: string; slug: string; category: string; }

interface Section { id: number; name: string; class_id: number; }
interface Subject { id: number; name: string; class_id: number; }

interface Props {
    exams: PaginatedResponse<Exam>;
    classes: SchoolClass[];
    allSections: Section[];
    allSubjects: Subject[];
    filters: { class_id?: string; status?: string };
    stats: { total: number; draft: number; published: number; completed: number; submitted: number };
    assessmentTypes: AssessmentType[];
}

const STATUS_STYLE: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-600',
    published: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
};
const TYPE_LABELS: Record<string, string> = {
    unit_test: 'Unit Test', mid_term: 'Mid Term', final: 'Final', custom: 'Custom',
};
const ASSESSMENT_MODEL_LABELS: Record<string, string> = {
    ca_test_final: 'CA + Test + Final',
    ca_final: 'CA + Final',
    test_final: 'Test + Final',
    final_only: 'Final Only',
    custom: 'Custom',
};

const ASSESSMENT_MODELS = [
    { value: 'ca_test_final', label: 'CA + Test + Final Exam' },
    { value: 'ca_final', label: 'CA + Final Exam' },
    { value: 'test_final', label: 'Test + Final Exam' },
    { value: 'final_only', label: 'Final Exam Only' },
    { value: 'custom', label: 'Custom' },
];

const emptyForm = {
    name: '', type: 'mid_term', class_id: '', start_date: '', end_date: '',
    status: 'draft', description: '', ca_weight: '40', exam_weight: '60',
    max_score: '100', assessment_model: 'ca_final',
    assessment_links: [] as { assessment_type_id: number; max_marks: number; weight: number }[],
    publication_date: '',
    eligible_section_ids: [] as number[],
    eligible_subject_ids: [] as number[],
};

export default function ExamsIndex({ exams, classes, allSections, allSubjects, filters, stats, assessmentTypes }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Exam | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    function applyFilter(key: string, value: string) {
        router.get('/school/exams', { ...filters, [key]: value || undefined }, { preserveScroll: true });
    }

    function openCreate() { reset(); setEditing(null); setOpen(true); }
    function openEdit(e: Exam) {
        setData({
            name: e.name, type: e.type, class_id: String(e.class_id),
            start_date: e.start_date ?? '', end_date: e.end_date ?? '',
            status: e.status, description: e.description ?? '',
            ca_weight: String(e.ca_weight), exam_weight: String(e.exam_weight),
            max_score: String(e.max_score), assessment_model: e.assessment_model ?? 'ca_final',
            assessment_links: e.assessment_links ?? [],
            publication_date: e.publication_date ?? '',
            eligible_section_ids: e.sections?.map(s => s.id) ?? [],
            eligible_subject_ids: e.subjects?.map(s => s.id) ?? [],
        });
        setEditing(e); setOpen(true);
    }

    function handleSubmit(ev: React.FormEvent) {
        ev.preventDefault();
        if (editing) {
            put(`/school/exams/${editing.id}`, { onSuccess: () => { setOpen(false); setEditing(null); reset(); } });
        } else {
            setShowConfirm(true);
        }
    }

    function handleDelete(e: Exam) {
        if (!confirm(`Delete exam "${e.name}"?`)) return;
        router.delete(`/school/exams/${e.id}`);
    }

    function submitExam(exam: Exam) {
        router.post(`/school/exams/${exam.id}/submit`);
    }
    function approveExam(exam: Exam) {
        router.post(`/school/exams/${exam.id}/approve`);
    }

    const statCards = [
        { label: 'Total', value: stats.total, color: 'text-indigo-600', icon: BookOpen },
        { label: 'Draft', value: stats.draft, color: 'text-slate-500', icon: FileText },
        { label: 'Submitted', value: stats.submitted, color: 'text-amber-600', icon: Send },
        { label: 'Completed', value: stats.completed, color: 'text-green-600', icon: CheckCircle2 },
    ];

    const showExamConfig = data.assessment_model !== 'final_only';

    return (
        <AppLayout title="Examinations">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Examinations</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{stats.total} exams configured</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/school/grade-scales">
                            <Button variant="outline" className="inline-flex items-center gap-2"><Settings className="w-4 h-4" /> Grade Scale</Button>
                        </Link>
                        <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Add Exam
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {statCards.map(({ label, value, color, icon: Icon }) => (
                        <Card key={label} className="border-slate-200 dark:border-slate-800">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}><Icon className="w-5 h-5" /></div>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-slate-500">{label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 flex-wrap">
                    <Select value={filters.class_id ?? ''} onValueChange={v => applyFilter('class_id', v)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="All Classes" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Classes</SelectItem>
                            {(classes ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Exam Name</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="hidden lg:table-cell">Type</TableHead>
                                <TableHead className="hidden lg:table-cell">Model</TableHead>
                                <TableHead className="hidden lg:table-cell">CA/Exam</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(exams?.data ?? []).length === 0 ? (
                                <TableRow><TableCell colSpan={7} className="text-center py-16 text-slate-400">No exams yet. Create one to get started.</TableCell></TableRow>
                            ) : (exams?.data ?? []).map((exam) => (
                                <TableRow key={exam.id}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">{exam.name}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">{exam.school_class?.name ?? '—'}</TableCell>
                                    <TableCell className="hidden lg:table-cell"><Badge variant="outline" className="text-xs">{TYPE_LABELS[exam.type] ?? exam.type}</Badge></TableCell>
                                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">{ASSESSMENT_MODEL_LABELS[exam.assessment_model ?? ''] ?? '—'}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-xs text-slate-500">{exam.ca_weight}/{exam.exam_weight}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            <Badge className={`border-0 text-xs ${STATUS_STYLE[exam.status]}`}>{exam.status.charAt(0).toUpperCase() + exam.status.slice(1)}</Badge>
                                            {exam.submitted_at && !exam.approved_at && <Badge className="border-0 bg-amber-100 text-amber-700 text-[10px]">Submitted</Badge>}
                                            {exam.approved_at && <Badge className="border-0 bg-emerald-100 text-emerald-700 text-[10px]">Approved</Badge>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Link href={`/school/exams/${exam.id}/marks`}>
                                                <Button variant="outline" size="sm" className="text-xs">Marks</Button>
                                            </Link>
                                            <Link href={`/school/exams/${exam.id}/results`}>
                                                <Button variant="outline" size="sm" className="text-xs">Results</Button>
                                            </Link>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openEdit(exam)} className="flex items-center gap-2 text-sm">
                                                        <Pencil className="w-4 h-4" /> Edit
                                                    </DropdownMenuItem>
                                                    {exam.status === 'published' && !exam.submitted_at && (
                                                        <DropdownMenuItem onClick={() => submitExam(exam)} className="flex items-center gap-2 text-sm text-amber-600">
                                                            <Send className="w-4 h-4" /> Submit for Approval
                                                        </DropdownMenuItem>
                                                    )}
                                                    {exam.submitted_at && !exam.approved_at && (
                                                        <DropdownMenuItem onClick={() => approveExam(exam)} className="flex items-center gap-2 text-sm text-emerald-600">
                                                            <CheckCircle2 className="w-4 h-4" /> Approve Exam
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem onClick={() => handleDelete(exam)} className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600">
                                                        <Trash2 className="w-4 h-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create / Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Exam' : 'Create Exam'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-5 mt-2">
                        <div className="space-y-1.5">
                            <Label>Exam Name <span className="text-red-500">*</span></Label>
                            <Input value={data.name} onChange={e => setData('name', e.target.value)} placeholder="e.g. Mid Term Exam 2026" />
                            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Type <span className="text-red-500">*</span></Label>
                                <Select value={data.type} onValueChange={v => setData('type', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unit_test">Unit Test</SelectItem>
                                        <SelectItem value="mid_term">Mid Term</SelectItem>
                                        <SelectItem value="final">Final</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Class <span className="text-red-500">*</span></Label>
                                <Select value={data.class_id} onValueChange={v => setData('class_id', v)}>
                                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                    <SelectContent>
                            {(classes ?? []).map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.class_id && <p className="text-xs text-red-500">{errors.class_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Start Date</Label>
                                <Input type="date" value={data.start_date} onChange={e => setData('start_date', e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>End Date</Label>
                                <Input type="date" value={data.end_date} onChange={e => setData('end_date', e.target.value)} />
                            </div>
                        </div>

                        {/* Assessment Model & Weights */}
                        <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-4">
                            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Assessment Configuration</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Assessment Model</Label>
                                    <Select value={data.assessment_model} onValueChange={v => setData('assessment_model', v)}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {ASSESSMENT_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Max Score</Label>
                                    <Input type="number" value={data.max_score} onChange={e => setData('max_score', e.target.value)} min="1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>CA Weight (%)</Label>
                                    <Input type="number" value={data.ca_weight} onChange={e => setData('ca_weight', e.target.value)} min="0" max="100" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Exam Weight (%)</Label>
                                    <Input type="number" value={data.exam_weight} onChange={e => setData('exam_weight', e.target.value)} min="0" max="100" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Publication Date</Label>
                                <Input type="date" value={data.publication_date} onChange={e => setData('publication_date', e.target.value)} />
                            </div>
                        </div>

                        {/* Eligible Sections & Subjects */}
                        {data.class_id && (
                            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Eligible (leave empty for all)</h4>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-500">Sections</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(allSections ?? []).filter(s => String(s.class_id) === data.class_id).map(s => {
                                            const checked = data.eligible_section_ids.includes(s.id);
                                            return (
                                                <label key={s.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}>
                                                    <input type="checkbox" className="rounded" checked={checked} onChange={() => {
                                                        setData('eligible_section_ids', checked ? data.eligible_section_ids.filter(id => id !== s.id) : [...data.eligible_section_ids, s.id]);
                                                    }} />
                                                    {s.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-slate-500">Subjects</Label>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(allSubjects ?? []).filter(s => String(s.class_id) === data.class_id).map(s => {
                                            const checked = data.eligible_subject_ids.includes(s.id);
                                            return (
                                                <label key={s.id} className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${checked ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700' : 'border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50'}`}>
                                                    <input type="checkbox" className="rounded" checked={checked} onChange={() => {
                                                        setData('eligible_subject_ids', checked ? data.eligible_subject_ids.filter(id => id !== s.id) : [...data.eligible_subject_ids, s.id]);
                                                    }} />
                                                    {s.name}
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <Select value={data.status} onValueChange={v => setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea value={data.description} onChange={e => setData('description', e.target.value)} rows={2} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {processing ? 'Saving...' : editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={showConfirm}
                onOpenChange={setShowConfirm}
                title="Confirm Exam Creation"
                description={`Create exam "${data.name || 'Untitled'}"? This will be saved as a ${data.status} exam.`}
                confirmText="Create Exam"
                onConfirm={() => {
                    post('/school/exams', { onSuccess: () => { setOpen(false); reset(); setShowConfirm(false); } });
                }}
            />
        </AppLayout>
    );
}
