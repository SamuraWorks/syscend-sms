import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp, BookOpen, AlertCircle } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { PageProps } from '@/Types';

interface SubjectOffering {
    id: number;
    subject_name: string;
    subject_code: string;
    subject_type: 'compulsory' | 'elective' | 'selective';
    selection_group: string | null;
    is_required: boolean;
    min_selection: number;
    max_selection: number;
    sort_order: number;
    enrollments_count: number;
    department: { id: number; name: string } | null;
}

interface ClassData {
    id: number;
    name: string;
    school_level: string;
    sections: { id: number; name: string }[];
}

interface AcademicYear {
    id: number;
    name: string;
}

interface Props extends PageProps {
    classData: ClassData;
    offerings: SubjectOffering[];
    grouped: Record<string, Record<string, SubjectOffering[]>>;
    academicYears: AcademicYear[];
    currentYear: AcademicYear;
}

const TYPE_BADGE: Record<string, string> = {
    compulsory: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    elective: 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    selective: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400',
};

type FormState = {
    subject_code: string;
    subject_name: string;
    subject_type: SubjectOffering['subject_type'];
    is_required: boolean;
    min_selection: number;
    max_selection: number;
    sort_order: number;
    department_id: string;
    selection_group: string;
};

const emptyForm: FormState = {
    subject_code: '',
    subject_name: '',
    subject_type: 'compulsory',
    is_required: true,
    min_selection: 0,
    max_selection: 0,
    sort_order: 0,
    department_id: '',
    selection_group: '',
};

export default function CurriculumShow() {
    const { classData, offerings = [], grouped = {}, academicYears = [], currentYear, flash } = usePage<Props>().props;

    const [form, setForm] = useState<FormState>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>(() => {
        const keys = Object.keys(grouped);
        return keys.length > 0 ? keys[0] : '__all__';
    });
    const [expandedStreams, setExpandedStreams] = useState<Record<string, boolean>>({});

    function toggleStream(key: string) {
        setExpandedStreams((prev) => ({ ...prev, [key]: !prev[key] }));
    }

    function handleAdd() {
        if (!currentYear) return;
        setFormError(null);
        router.post('/school-admin/curriculum', {
            ...form,
            class_id: classData.id,
            academic_year_id: currentYear.id,
        }, {
            onSuccess: () => {
                setShowAddForm(false);
                setForm(emptyForm);
                setFormError(null);
            },
            onError: (errors) => {
                const first = Object.values(errors)[0];
                setFormError(typeof first === 'string' ? first : 'Failed to add subject. Please check all fields.');
            },
        });
    }

    function handleUpdate() {
        if (!editingId) return;
        router.put(`/school-admin/curriculum/${editingId}`, form, {
            onSuccess: () => {
                setEditingId(null);
                setForm(emptyForm);
            },
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        router.delete(`/school-admin/curriculum/${deleteId}`, {
            onSuccess: () => setDeleteId(null),
        });
    }

    function startEdit(offering: SubjectOffering) {
        setEditingId(offering.id);
        setForm({
            subject_code: offering.subject_code,
            subject_name: offering.subject_name,
            subject_type: offering.subject_type,
            is_required: offering.is_required,
            min_selection: offering.min_selection,
            max_selection: offering.max_selection,
            sort_order: offering.sort_order,
            department_id: offering.department ? String(offering.department.id) : '',
            selection_group: offering.selection_group ?? '',
        });
    }

    function cancelEdit() {
        setEditingId(null);
        setForm(emptyForm);
    }

    const selectionGroups = Object.keys(grouped);
    const hasGroups = selectionGroups.length > 0;

    function renderSubjectForm(isEdit: boolean) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                <div className="space-y-1">
                    <Label className="text-xs">Code</Label>
                    <Input
                        value={form.subject_code}
                        onChange={(e) => setForm({ ...form, subject_code: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. MATH101"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Name</Label>
                    <Input
                        value={form.subject_name}
                        onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="e.g. Mathematics"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select value={form.subject_type} onValueChange={(val) => setForm({ ...form, subject_type: val as SubjectOffering['subject_type'] })}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="compulsory">Compulsory</SelectItem>
                            <SelectItem value="elective">Elective</SelectItem>
                            <SelectItem value="selective">Selective</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Sort Order</Label>
                    <Input
                        type="number"
                        value={form.sort_order}
                        onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                        className="h-8 text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Min Selection</Label>
                    <Input
                        type="number"
                        value={form.min_selection}
                        onChange={(e) => setForm({ ...form, min_selection: Number(e.target.value) })}
                        className="h-8 text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Max Selection</Label>
                    <Input
                        type="number"
                        value={form.max_selection}
                        onChange={(e) => setForm({ ...form, max_selection: Number(e.target.value) })}
                        className="h-8 text-xs"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Selection Group</Label>
                    <Input
                        value={form.selection_group}
                        onChange={(e) => setForm({ ...form, selection_group: e.target.value })}
                        className="h-8 text-xs"
                        placeholder="Optional"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs">Required</Label>
                    <Select value={form.is_required ? '1' : '0'} onValueChange={(val) => setForm({ ...form, is_required: val === '1' })}>
                        <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Yes</SelectItem>
                            <SelectItem value="0">No</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2 sm:col-span-4 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={isEdit ? cancelEdit : () => setShowAddForm(false)}>
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={isEdit ? handleUpdate : handleAdd}
                        disabled={!form.subject_code.trim() || !form.subject_name.trim()}
                    >
                        {isEdit ? 'Update' : 'Add Subject'}
                    </Button>
                </div>
            </div>
        );
    }

    function renderSubjectTable(subjects: SubjectOffering[] = []) {
        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-900">
                            <TableHead className="text-xs w-20">Code</TableHead>
                            <TableHead className="text-xs">Name</TableHead>
                            <TableHead className="text-xs w-24">Type</TableHead>
                            <TableHead className="text-xs w-20">Required</TableHead>
                            <TableHead className="text-xs w-28">Min/Max</TableHead>
                            <TableHead className="text-xs w-20 text-right">Enrolled</TableHead>
                            <TableHead className="text-xs w-24 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.map((s) => (
                            editingId === s.id ? (
                                <TableRow key={s.id}>
                                    <TableCell colSpan={7} className="p-0">
                                        {renderSubjectForm(true)}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                <TableRow key={s.id}>
                                    <TableCell className="text-xs font-mono font-medium text-slate-700 dark:text-slate-300">
                                        {s.subject_code}
                                    </TableCell>
                                    <TableCell className="text-xs font-medium text-slate-900 dark:text-white">
                                        {s.subject_name}
                                    </TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${TYPE_BADGE[s.subject_type]}`}>
                                            {s.subject_type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                        {s.is_required ? 'Yes' : 'No'}
                                    </TableCell>
                                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                                        {s.min_selection} / {s.max_selection}
                                    </TableCell>
                                    <TableCell className="text-xs text-right text-slate-500 dark:text-slate-400">
                                        {s.enrollments_count}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="inline-flex gap-1">
                                            <Button variant="ghost" size="icon-sm" onClick={() => startEdit(s)}>
                                                <Pencil className="w-3 h-3" />
                                            </Button>
                                            <Button variant="ghost" size="icon-sm" onClick={() => setDeleteId(s.id)}>
                                                <Trash2 className="w-3 h-3 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    }

    function renderGroupContent(groupName: string) {
        const streams = grouped[groupName];
        if (!streams) return null;

        const streamKeys = Object.keys(streams);
        if (streamKeys.length === 0 || (streamKeys.length === 1 && streamKeys[0] === '')) {
            const subjects = streams[''] ?? streams[streamKeys[0]] ?? [];
            return renderSubjectTable(subjects);
        }

        return (
            <div className="space-y-2">
                {streamKeys.map((stream) => {
                    const expanded = expandedStreams[`${groupName}:${stream}`] !== false;
                    return (
                        <Card key={stream} className="border-slate-200 dark:border-slate-800">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
                                onClick={() => toggleStream(`${groupName}:${stream}`)}
                            >
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    {stream || 'General'}
                                    <span className="text-xs text-slate-400 ml-2">({streams[stream].length} subjects)</span>
                                </span>
                                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expanded && (
                                <div className="border-t border-slate-100 dark:border-slate-800">
                                    {renderSubjectTable(streams[stream])}
                                </div>
                            )}
                        </Card>
                    );
                })}
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={[
            { label: 'Curriculum', href: '/school-admin/curriculum' },
            { label: classData.name },
        ]}>
            <Head title={`Curriculum - ${classData.name}`} />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Link href="/school-admin/curriculum" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Curriculum
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{classData.name}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {classData.sections.length} section{classData.sections.length !== 1 ? 's' : ''} &middot; {classData.school_level}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-xs text-slate-400">
                            {currentYear?.name ?? 'No year selected'}
                        </span>
                        <Select value={String(currentYear?.id ?? '')} onValueChange={(val) => router.get(`/school-admin/curriculum/class/${classData.id}?academic_year_id=${val}`)}>
                            <SelectTrigger className="h-8 text-xs w-40">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYears.map((y) => (
                                    <SelectItem key={y.id} value={String(y.id)}>
                                        {y.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {flash?.success && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-700 dark:text-green-300">{flash.success}</p>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-700 dark:text-red-300">{flash.error}</p>
                    </div>
                )}

                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <BookOpen className="w-4 h-4 inline mr-1" />
                        Subjects ({offerings.length})
                    </h2>
                    {!showAddForm && (
                        <Button size="sm" className="inline-flex items-center gap-1.5 h-7 text-xs" onClick={() => setShowAddForm(true)}>
                            <Plus className="w-3 h-3" /> Add Subject
                        </Button>
                    )}
                </div>

                {showAddForm && (
                    <>
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                <p className="text-sm text-red-700 dark:text-red-300">{formError}</p>
                            </div>
                        )}
                        {renderSubjectForm(false)}
                    </>
                )}

                {!hasGroups ? (
                    offerings.length > 0 ? (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="p-0">
                                {renderSubjectTable(offerings)}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-slate-200 dark:border-slate-800">
                            <CardContent className="py-16 text-center">
                                <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                                <p className="text-sm text-slate-500">No subjects added yet. Click "Add Subject" to get started.</p>
                            </CardContent>
                        </Card>
                    )
                ) : (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList variant="line" className="mb-4">
                            {selectionGroups.map((group) => (
                                <TabsTrigger key={group} value={group} className="text-xs">
                                    {group || 'General'}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        {selectionGroups.map((group) => (
                            <TabsContent key={group} value={group}>
                                {renderGroupContent(group)}
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Subject</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to delete this subject offering? This will also remove it from all sections. This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>
                            Cancel
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
