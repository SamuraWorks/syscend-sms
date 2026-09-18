import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { GraduationCap, BookOpen, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Search, Filter, X, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { PageProps, SchoolClass, Department, Subject, AcademicYear, PaginatedResponse } from '@/Types';

interface Staff { id: number; name: string; }

interface Props extends PageProps {
    classes: (SchoolClass & { students_count: number; sections_count: number; subjects_count: number; department?: { id: number; name: string } | null })[];
    departments: (Department & { staff_count: number; classes_count: number })[];
    subjects: (Subject & { school_class?: { id: number; name: string }; department?: { id: number; name: string } | null })[];
    staff: Staff[];
    enabledLevels: string[];
    academicDepts: Department[];
}

const levelLabels: Record<string, string> = {
    early_childhood: 'ECE',
    primary: 'Primary',
    junior_secondary: 'JSS',
    senior_secondary: 'SSS',
};

// ─────────────────────────────────────────────
// CLASSES TAB
// ─────────────────────────────────────────────
function ClassesTab({ classes, staff, departments, enabledLevels }: {
    classes: Props['classes'];
    staff: Staff[];
    departments: Department[];
    enabledLevels: string[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('_all');
    const [statusFilter, setStatusFilter] = useState('_all');
    const [deleteDialog, setDeleteDialog] = useState<SchoolClass | null>(null);

    const classSchema = z.object({
        name: z.string().min(1, 'Name is required'),
        short_name: z.string().max(20).nullable().optional(),
        numeric_name: z.coerce.number().int().positive().nullable().optional(),
        capacity: z.coerce.number().int().min(0).optional(),
        school_level: z.string().nullable().optional(),
        level_order: z.coerce.number().int().min(0).nullable().optional(),
        department_id: z.coerce.number().int().positive().nullable().optional(),
        class_teacher_id: z.coerce.number().int().positive().nullable().optional(),
        description: z.string().max(500).nullable().optional(),
        is_active: z.boolean().optional(),
    });
    type ClassFormData = z.infer<typeof classSchema>;

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<ClassFormData>({ resolver: zodResolver(classSchema) as unknown as Resolver<ClassFormData>, defaultValues: { is_active: true } });

    const watchLevel = watch('school_level');
    const watchActive = watch('is_active');
    const watchTeacher = watch('class_teacher_id');
    const watchDeptId = watch('department_id');
    const watchNumeric = watch('numeric_name');

    const suggestedDept = departments.find(d => d.id === watchDeptId);
    const levelPrefix = levelLabels[watchLevel ?? ''] ?? '';
    const suggestedClassName = watchLevel && suggestedDept
        ? [levelPrefix, watchNumeric, suggestedDept.name].filter(Boolean).join(' ')
        : null;
    const suggestedShortName = watchLevel && suggestedDept
        ? [`${levelPrefix}${watchNumeric ?? ''}`, suggestedDept.code].filter(Boolean).join('-')
        : null;

    const filtered = classes.filter((c) => {
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !(c.short_name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
        if (levelFilter !== '_all' && c.school_level !== levelFilter) return false;
        if (statusFilter === 'active' && !c.is_active) return false;
        if (statusFilter === 'inactive' && c.is_active) return false;
        return true;
    });

    const openCreate = () => {
        reset({ name: '', short_name: '', numeric_name: undefined, capacity: 0, school_level: '', level_order: undefined, department_id: undefined, class_teacher_id: undefined, description: '', is_active: true });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (c: SchoolClass) => {
        reset({
            name: c.name, short_name: c.short_name ?? '', numeric_name: c.numeric_name ?? undefined,
            capacity: c.capacity, school_level: c.school_level ?? '', level_order: c.level_order ?? undefined,
            department_id: c.department_id ?? undefined, class_teacher_id: c.class_teacher_id ?? undefined,
            description: c.description ?? '', is_active: c.is_active,
        });
        setEditing(c);
        setOpen(true);
    };

    const onSubmit = (data: ClassFormData) => {
        const payload = { ...data, school_level: data.school_level || null, class_teacher_id: data.class_teacher_id || null, department_id: data.department_id || null };
        if (editing) {
            router.put(`/school/classes/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/classes', payload, { onSuccess: () => setOpen(false) });
        }
    };

    const toggleStatus = (c: SchoolClass) => {
        router.post(`/school/classes/${c.id}/toggle-status`);
    };

    const confirmDelete = () => {
        if (!deleteDialog) return;
        router.delete(`/school/classes/${deleteDialog.id}`, {
            onError: () => setDeleteDialog(null),
            onSuccess: () => setDeleteDialog(null),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{classes.length} total &middot; {classes.filter(c => c.is_active).length} active</p>
                <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Class
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select defaultValue="_all" onValueChange={(v) => setLevelFilter(v)}>
                    <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Levels</SelectItem>
                        {enabledLevels.includes('early_childhood') && <SelectItem value="early_childhood">ECE</SelectItem>}
                        {enabledLevels.includes('primary') && <SelectItem value="primary">Primary</SelectItem>}
                        {enabledLevels.includes('junior_secondary') && <SelectItem value="junior_secondary">JSS</SelectItem>}
                        {enabledLevels.includes('senior_secondary') && <SelectItem value="senior_secondary">SSS</SelectItem>}
                    </SelectContent>
                </Select>
                <Select defaultValue="_all" onValueChange={(v) => setStatusFilter(v)}>
                    <SelectTrigger className="w-full sm:w-36 h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>#</TableHead>
                                <TableHead>Class Name</TableHead>
                                <TableHead className="hidden md:table-cell">Level</TableHead>
                                <TableHead className="hidden md:table-cell">Department</TableHead>
                                <TableHead className="hidden sm:table-cell">Students</TableHead>
                                <TableHead className="hidden sm:table-cell">Sections</TableHead>
                                <TableHead className="hidden lg:table-cell">Status</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                                        <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No classes found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="text-slate-400 text-sm">{c.numeric_name ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                                        {c.short_name && <div className="text-xs text-slate-400">{c.short_name}</div>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {c.school_level ? <Badge variant="secondary" className="text-[10px]">{levelLabels[c.school_level] ?? c.school_level}</Badge> : '—'}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-slate-500">
                                        {c.department?.name ?? '—'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">{c.students_count ?? 0}</TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">{c.sections_count ?? 0}</TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Badge variant={c.is_active ? 'default' : 'secondary'} className={c.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(c)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(c)}>
                                                {c.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteDialog(c)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Class' : 'Add Class'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Class Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="e.g. JSS 1, Class 5, SSS 1 Science" {...register('name')} />
                                {suggestedClassName && (
                                    <button
                                        type="button"
                                        onClick={() => { setValue('name', suggestedClassName); if (suggestedShortName) setValue('short_name', suggestedShortName); }}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                    >
                                        Suggested: &ldquo;{suggestedClassName}&rdquo; &mdash; click to use
                                    </button>
                                )}
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Short Name / Code</Label>
                                <Input placeholder="e.g. JSS1" {...register('short_name')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Academic Level</Label>
                                <Select defaultValue={watchLevel ?? ''} onValueChange={(v) => setValue('school_level', v === '_none' ? '' : v)}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select level" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {enabledLevels.includes('early_childhood') && <SelectItem value="early_childhood">Early Childhood (ECE)</SelectItem>}
                                        {enabledLevels.includes('primary') && <SelectItem value="primary">Primary</SelectItem>}
                                        {enabledLevels.includes('junior_secondary') && <SelectItem value="junior_secondary">Junior Secondary (JSS)</SelectItem>}
                                        {enabledLevels.includes('senior_secondary') && <SelectItem value="senior_secondary">Senior Secondary (SSS)</SelectItem>}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Display Order</Label>
                                <Input type="number" placeholder="1" {...register('numeric_name')} />
                            </div>
                        </div>

                        {watchLevel === 'senior_secondary' && (
                            <div className="space-y-1.5">
                                <Label>Department (SSS only)</Label>
                                <Select defaultValue={watchDeptId ? String(watchDeptId) : ''} onValueChange={(v) => setValue('department_id', v === '_none' ? undefined : Number(v))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {departments.filter(d => d.type === 'academic').map((d) => (
                                            <SelectItem key={d.id} value={String(d.id)}>{d.name} ({d.code ?? '—'})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Capacity</Label>
                                <Input type="number" placeholder="40" {...register('capacity')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Form Teacher</Label>
                                <Select defaultValue={watchTeacher ? String(watchTeacher) : ''} onValueChange={(v) => setValue('class_teacher_id', v === '_none' ? undefined : Number(v))}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_none">None</SelectItem>
                                        {staff.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea placeholder="Optional notes..." rows={2} {...register('description')} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="cls_active" className="rounded border-slate-300" checked={watchActive ?? true} onChange={(e) => setValue('is_active', e.target.checked)} />
                            <Label htmlFor="cls_active" className="cursor-pointer">Active</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {editing ? 'Save Changes' : 'Create Class'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialog !== null} onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Class</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to delete <strong>{deleteDialog?.name}</strong>?
                        {(deleteDialog?.students_count ?? 0) > 0 || (deleteDialog?.subjects_count ?? 0) > 0
                            ? ' This class has dependencies and cannot be deleted. Try deactivating it instead.'
                            : ' This action cannot be undone.'}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={confirmDelete}
                            disabled={(deleteDialog?.students_count ?? 0) > 0 || (deleteDialog?.subjects_count ?? 0) > 0}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─────────────────────────────────────────────
// SUBJECTS TAB
// ─────────────────────────────────────────────
function SubjectsTab({ subjects, classes, departments }: {
    subjects: Props['subjects'];
    classes: SchoolClass[];
    departments: Department[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Subject | null>(null);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('_all');
    const [deleteDialog, setDeleteDialog] = useState<Subject | null>(null);

    const subjectSchema = z.object({
        class_id: z.coerce.number().int().positive('Select a class'),
        name: z.string().min(1, 'Subject name is required'),
        code: z.string().optional(),
        type: z.enum(['theory', 'practical']),
        full_marks: z.coerce.number().int().min(1).optional(),
        pass_marks: z.coerce.number().int().min(1).optional(),
        school_level: z.string().nullable().optional(),
        department_id: z.coerce.number().int().positive().nullable().optional(),
        is_core: z.boolean().optional(),
    });
    type SubjectFormData = z.infer<typeof subjectSchema>;

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<SubjectFormData>({ resolver: zodResolver(subjectSchema) as unknown as Resolver<SubjectFormData>, defaultValues: { type: 'theory', full_marks: 100, pass_marks: 33, is_core: true } });

    const watchClassId = watch('class_id');

    const filteredSubjects = subjects.filter((s) => {
        if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !(s.code ?? '').toLowerCase().includes(search.toLowerCase())) return false;
        if (levelFilter !== '_all' && s.school_level !== levelFilter) return false;
        return true;
    });

    const filteredClasses = levelFilter !== '_all'
        ? classes.filter(c => c.school_level === levelFilter)
        : classes;

    const selectedClass = classes.find(c => c.id === watchClassId);
    const showDept = selectedClass?.school_level === 'senior_secondary';
    const academicDepts = departments.filter(d => d.type === 'academic' && d.is_active);

    const openCreate = () => {
        reset({ type: 'theory', full_marks: 100, pass_marks: 33, is_core: true, class_id: undefined, name: '', code: '', school_level: '', department_id: undefined });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (s: Subject) => {
        reset({
            class_id: s.class_id, name: s.name, code: s.code ?? '', type: s.type,
            full_marks: s.full_marks, pass_marks: s.pass_marks,
            school_level: s.school_level ?? '', department_id: s.department_id ?? undefined,
            is_core: s.is_core ?? true,
        });
        setEditing(s);
        setOpen(true);
    };

    const onSubmit = (data: SubjectFormData) => {
        const payload = { ...data, school_level: data.school_level || null, department_id: data.department_id || null };
        if (editing) {
            router.put(`/school/subjects/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/subjects', payload, { onSuccess: () => setOpen(false) });
        }
    };

    const confirmDelete = () => {
        if (!deleteDialog) return;
        router.delete(`/school/subjects/${deleteDialog.id}`, {
            onError: () => setDeleteDialog(null),
            onSuccess: () => setDeleteDialog(null),
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-sm text-slate-500">{subjects.length} total subjects</p>
                <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Subject
                </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
                <Select defaultValue="_all" onValueChange={(v) => setLevelFilter(v)}>
                    <SelectTrigger className="w-full sm:w-40 h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Levels</SelectItem>
                        <SelectItem value="early_childhood">ECE</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="junior_secondary">JSS</SelectItem>
                        <SelectItem value="senior_secondary">SSS</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Subject</TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead className="hidden md:table-cell">Class</TableHead>
                                <TableHead className="hidden md:table-cell">Level</TableHead>
                                <TableHead className="hidden lg:table-cell">Type</TableHead>
                                <TableHead className="hidden lg:table-cell">Core</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSubjects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No subjects found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredSubjects.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">{s.name}</TableCell>
                                    <TableCell className="text-sm text-slate-500">{s.code ?? '—'}</TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-slate-500">{s.school_class?.name ?? '—'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {s.school_level ? <Badge variant="secondary" className="text-[10px]">{levelLabels[s.school_level] ?? s.school_level}</Badge> : '—'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.type === 'theory' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                                            {s.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                                        {s.is_core ? 'Yes' : 'No'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteDialog(s)}>
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label>Subject Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="Mathematics" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Code</Label>
                                <Input placeholder="MATH101" {...register('code')} />
                                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Type <span className="text-red-500">*</span></Label>
                                <Select defaultValue={editing?.type ?? 'theory'} onValueChange={(v) => setValue('type', v as 'theory' | 'practical')}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="theory">Theory</SelectItem>
                                        <SelectItem value="practical">Practical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <Label>Class <span className="text-red-500">*</span></Label>
                                <Select defaultValue={editing ? String(editing.class_id) : undefined} onValueChange={(v) => {
                                    const cls = classes.find(c => c.id === Number(v));
                                    setValue('class_id', Number(v));
                                    if (cls?.school_level) setValue('school_level', cls.school_level);
                                    if (cls?.school_level !== 'senior_secondary') setValue('department_id', undefined);
                                }}>
                                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                    <SelectContent>
                                        {filteredClasses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                {errors.class_id && <p className="text-xs text-red-500">{errors.class_id.message}</p>}
                            </div>
                            {showDept && (
                                <div className="space-y-1.5 col-span-2">
                                    <Label>Department (SSS only)</Label>
                                    <Select defaultValue={watch('department_id') ? String(watch('department_id')) : ''} onValueChange={(v) => setValue('department_id', v === '_none' ? undefined : Number(v))}>
                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">None</SelectItem>
                                            {academicDepts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && <p className="text-xs text-red-500">{errors.department_id.message}</p>}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label>Full Marks</Label>
                                <Input type="number" {...register('full_marks')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Pass Marks</Label>
                                <Input type="number" {...register('pass_marks')} />
                            </div>
                            <div className="space-y-1.5 col-span-2">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="is_core" className="rounded border-slate-300" checked={watch('is_core') ?? true} onChange={(e) => setValue('is_core', e.target.checked)} />
                                    <Label htmlFor="is_core" className="cursor-pointer">Core subject (shown by default to students)</Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {editing ? 'Save Changes' : 'Create Subject'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialog !== null} onOpenChange={(open) => { if (!open) setDeleteDialog(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Subject</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default function AcademicStructureIndex() {
    const { classes, subjects, staff, enabledLevels, academicDepts, departments } = usePage<Props>().props;
    const [activeTab, setActiveTab] = useState('classes');

    return (
        <AppLayout breadcrumbs={[{ label: 'Academics' }, { label: 'Academic Structure' }]}>
            <Head title="Academic Structure" />

            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Academic Structure</h1>
                <p className="text-sm text-slate-500 mt-0.5">Manage classes and subjects for your school</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList variant="line" className="mb-6">
                    <TabsTrigger value="classes" className="text-sm gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        Classes
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{classes.length}</Badge>
                    </TabsTrigger>
                    <TabsTrigger value="subjects" className="text-sm gap-1.5">
                        <BookOpen className="w-4 h-4" />
                        Subjects
                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{subjects.length}</Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="classes">
                    <ClassesTab classes={classes} staff={staff} departments={academicDepts} enabledLevels={enabledLevels} />
                </TabsContent>

                <TabsContent value="subjects">
                    <SubjectsTab subjects={subjects} classes={classes} departments={departments} />
                </TabsContent>
            </Tabs>
        </AppLayout>
    );
}
