import { useEffect, useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, BookOpen, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps, SchoolClass, Subject, Department, PaginatedResponse } from '@/Types';

interface Props extends PageProps {
    subjects: PaginatedResponse<Subject & { school_class?: { id: number; name: string }; department?: { id: number; name: string } | null }>;
    classes: (Pick<SchoolClass, 'id' | 'name'> & { school_level: string | null })[];
    departments: Department[];
}

const levelLabels: Record<string, string> = {
    early_childhood: 'ECE',
    primary: 'Primary',
    junior_secondary: 'JSS',
    senior_secondary: 'SSS',
};

const optionalMarks = z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.coerce.number().int('Whole numbers only').min(1, 'Must be at least 1').optional(),
);

const schema = z.object({
    class_id:      z.number({ error: 'Select a class' }).int().positive('Select a class'),
    name:          z.string().min(1, 'Subject name is required'),
    code:          z.string().max(30, 'Code must be 30 characters or fewer').optional(),
    type:          z.enum(['theory', 'practical']),
    full_marks:    optionalMarks,
    pass_marks:    optionalMarks,
    school_level:  z.string().nullable().optional(),
    department_id: z.number({ error: 'Select a department' }).int().positive().nullable().optional(),
    is_core:       z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

const FORM_FIELDS = ['class_id', 'name', 'code', 'type', 'full_marks', 'pass_marks', 'school_level', 'department_id'] as const;

export default function SubjectsIndex() {
    const { subjects, classes, departments, flash, errors: serverErrors } = usePage<Props>().props;

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Subject | null>(null);
    const [deleteDialog, setDeleteDialog] = useState<Subject | null>(null);
    const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') ?? '');
    const [levelFilter, setLevelFilter] = useState(new URLSearchParams(window.location.search).get('school_level') ?? '');

    const { register, handleSubmit, reset, setValue, watch, setError, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) as unknown as Resolver<FormData>, defaultValues: { type: 'theory', full_marks: 100, pass_marks: 33, is_core: true } });

    const watchClassId = watch('class_id');
    const watchType = watch('type');
    const watchDeptId = watch('department_id');
    const watchIsCore = watch('is_core');

    const selectedClass = classes.find((c) => c.id === watchClassId);
    const isSssClass = selectedClass?.school_level === 'senior_secondary';
    const academicDepts = departments.filter((d) => d.type === 'academic');

    useEffect(() => {
        if (!serverErrors) return;
        FORM_FIELDS.forEach((field) => {
            const message = serverErrors[field];
            if (message) setError(field, { type: 'server', message });
        });
    }, [serverErrors, setError]);

    const applyFilters = (nextSearch = search, nextLevel = levelFilter) => {
        const params: Record<string, string> = {};
        if (nextSearch) params.search = nextSearch;
        if (nextLevel) params.school_level = nextLevel;
        router.get('/school/subjects', params, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        reset({ class_id: undefined, name: '', code: '', type: 'theory', full_marks: 100, pass_marks: 33, school_level: '', department_id: undefined, is_core: true });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (s: Subject) => {
        reset({
            class_id: s.class_id,
            name: s.name,
            code: s.code ?? '',
            type: s.type,
            full_marks: s.full_marks || undefined,
            pass_marks: s.pass_marks || undefined,
            school_level: s.school_level ?? '',
            department_id: s.department_id ?? undefined,
            is_core: s.is_core,
        });
        setEditing(s);
        setOpen(true);
    };

    const handleClassChange = (value: string) => {
        const classId = Number(value);
        setValue('class_id', classId, { shouldValidate: true });
        const cls = classes.find((c) => c.id === classId);
        setValue('school_level', cls?.school_level ?? '', { shouldDirty: true });
        if (cls?.school_level !== 'senior_secondary') {
            setValue('department_id', undefined);
        }
    };

    const onSubmit = (data: FormData) => {
        const payload = {
            class_id: data.class_id,
            name: data.name.trim(),
            code: data.code?.trim() || null,
            type: data.type,
            full_marks: data.full_marks ?? null,
            pass_marks: data.pass_marks ?? null,
            school_level: data.school_level || null,
            department_id: data.department_id ?? null,
            is_core: data.is_core ?? false,
        };
        if (editing) {
            router.put(`/school/subjects/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/subjects', payload, { onSuccess: () => setOpen(false) });
        }
    };

    const toggleStatus = (s: Subject) => {
        router.post(`/school/subjects/${s.id}/toggle-status`);
    };

    const confirmDelete = () => {
        if (!deleteDialog) return;
        router.delete(`/school/subjects/${deleteDialog.id}`, {
            onSuccess: () => setDeleteDialog(null),
        });
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Academics' }, { label: 'Subjects' }]}>
            <Head title="Subjects" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Subjects</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{subjects.meta.total} subject{subjects.meta.total !== 1 ? 's' : ''} configured</p>
                </div>
                <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Subject
                </Button>
            </div>

            {flash?.success && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300">{flash.success}</p>
                </div>
            )}
            {flash?.error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{flash.error}</p>
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <form onSubmit={(e) => { e.preventDefault(); applyFilters(); }} className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search subjects by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </form>
                <Select value={levelFilter || '_all'} onValueChange={(v) => { const level = v === '_all' ? '' : v; setLevelFilter(level); applyFilters(search, level); }}>
                    <SelectTrigger className="w-full sm:w-44 h-9"><SelectValue placeholder="All Levels" /></SelectTrigger>
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
                                <TableHead className="hidden sm:table-cell">Code</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead className="hidden md:table-cell">Level</TableHead>
                                <TableHead className="hidden md:table-cell">Type</TableHead>
                                <TableHead className="hidden lg:table-cell">Core</TableHead>
                                <TableHead className="hidden lg:table-cell">Status</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {subjects.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No subjects found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : subjects.data.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell>
                                        <div className="font-medium text-slate-900 dark:text-white">{s.name}</div>
                                        <div className="text-xs text-slate-400 dark:text-slate-500">
                                            {s.full_marks ?? '—'} / {s.pass_marks ?? '—'} marks
                                            {s.department ? ` · ${s.department.name}` : ''}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        {s.code ? <Badge variant="outline">{s.code}</Badge> : <span className="text-slate-400">—</span>}
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 dark:text-slate-400">{s.school_class?.name ?? '—'}</TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {s.school_level ? <Badge variant="secondary" className="text-[10px]">{levelLabels[s.school_level] ?? s.school_level}</Badge> : <span className="text-slate-400">—</span>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.type === 'theory' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                                            {s.type}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        {s.is_core
                                            ? <Badge variant="secondary" className="text-[10px] bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">Core</Badge>
                                            : <span className="text-xs text-slate-400">Elective</span>}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Badge variant={s.is_active ? 'default' : 'secondary'} className={s.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}>
                                            {s.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleStatus(s)}>
                                                {s.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
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

            {subjects.meta.last_page > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
                    <p className="text-xs text-slate-500">
                        Showing {subjects.meta.from}&ndash;{subjects.meta.to} of {subjects.meta.total} subjects
                    </p>
                    <div className="flex items-center gap-2">
                        {subjects.links.prev && (
                            <Button variant="outline" size="sm" onClick={() => router.get(subjects.links.prev!)}>
                                Previous
                            </Button>
                        )}
                        <span className="text-xs text-slate-500">Page {subjects.meta.current_page} of {subjects.meta.last_page}</span>
                        {subjects.links.next && (
                            <Button variant="outline" size="sm" onClick={() => router.get(subjects.links.next!)}>
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Subject' : 'Add Subject'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5 col-span-2">
                                <Label>Class <span className="text-red-500">*</span></Label>
                                <Select defaultValue={watchClassId ? String(watchClassId) : undefined} onValueChange={handleClassChange}>
                                    <SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name}{c.school_level ? ` (${levelLabels[c.school_level] ?? c.school_level})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedClass?.school_level && (
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Level: {levelLabels[selectedClass.school_level] ?? selectedClass.school_level}
                                    </p>
                                )}
                                {errors.class_id && <p className="text-xs text-red-500">{errors.class_id.message}</p>}
                            </div>

                            <div className="space-y-1.5 col-span-2">
                                <Label>Subject Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="e.g. Mathematics" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Code</Label>
                                <Input placeholder="e.g. MATH" {...register('code')} />
                                {errors.code && <p className="text-xs text-red-500">{errors.code.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Type <span className="text-red-500">*</span></Label>
                                <Select value={watchType ?? 'theory'} onValueChange={(v) => setValue('type', v as 'theory' | 'practical')}>
                                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="theory">Theory</SelectItem>
                                        <SelectItem value="practical">Practical</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Full Marks</Label>
                                <Input type="number" placeholder="100" {...register('full_marks')} />
                                {errors.full_marks && <p className="text-xs text-red-500">{errors.full_marks.message}</p>}
                            </div>

                            <div className="space-y-1.5">
                                <Label>Pass Marks</Label>
                                <Input type="number" placeholder="33" {...register('pass_marks')} />
                                {errors.pass_marks && <p className="text-xs text-red-500">{errors.pass_marks.message}</p>}
                            </div>

                            {isSssClass && (
                                <div className="space-y-1.5 col-span-2">
                                    <Label>Department</Label>
                                    <Select
                                        defaultValue={watchDeptId ? String(watchDeptId) : '_none'}
                                        onValueChange={(v) => setValue('department_id', v === '_none' ? undefined : Number(v))}
                                    >
                                        <SelectTrigger className="w-full"><SelectValue placeholder="No department" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="_none">No department</SelectItem>
                                            {academicDepts.map((d) => <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && <p className="text-xs text-red-500">{errors.department_id.message}</p>}
                                    <p className="text-xs text-slate-400 dark:text-slate-500">
                                        Only academic departments can be assigned to SSS subjects.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="subject_is_core"
                                className="rounded border-slate-300"
                                checked={watchIsCore ?? false}
                                onChange={(e) => setValue('is_core', e.target.checked)}
                            />
                            <Label htmlFor="subject_is_core" className="cursor-pointer">Core subject</Label>
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

            <Dialog open={deleteDialog !== null} onOpenChange={(o) => { if (!o) setDeleteDialog(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete Subject</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
                        If the subject is used in curriculum offerings it cannot be deleted &mdash; consider deactivating it instead.
                    </p>
                    {serverErrors?.delete && <p className="text-xs text-red-500">{serverErrors.delete}</p>}
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
