import { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, GraduationCap, Search, Filter, ChevronLeft, ChevronRight, ToggleLeft, ToggleRight } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
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
import type { PageProps, SchoolClass, FlatPaginatedResponse } from '@/Types';

interface Staff { id: number; name: string; }

interface Props extends PageProps {
    classes: FlatPaginatedResponse<SchoolClass & { students_count: number; sections_count: number; sections: { id: number; name: string; students_count: number }[] }>;
    staff: Staff[];
    enabledLevels: string[];
}

const levelLabels: Record<string, string> = {
    early_childhood: 'ECE',
    primary: 'Primary',
    junior_secondary: 'JSS',
    senior_secondary: 'SSS',
};

const schema = z.object({
    name:             z.string().min(1, 'Name is required'),
    short_name:       z.string().max(20).nullable().optional(),
    numeric_name:     z.coerce.number().int().positive().nullable().optional(),
    capacity:         z.coerce.number().int().min(0).optional(),
    school_level:     z.string().nullable().optional(),
    level_order:      z.coerce.number().int().min(0).nullable().optional(),
    class_teacher_id: z.coerce.number().int().positive().nullable().optional(),
    description:      z.string().max(500).nullable().optional(),
    is_active:        z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function ClassesIndex() {
    const { classes, staff, enabledLevels } = usePage<Props>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<SchoolClass | null>(null);
    const [search, setSearch] = useState(new URLSearchParams(window.location.search).get('search') ?? '');
    const [levelFilter, setLevelFilter] = useState(new URLSearchParams(window.location.search).get('level') ?? '');
    const [statusFilter, setStatusFilter] = useState(new URLSearchParams(window.location.search).get('status') ?? '');
    const [deleteDialog, setDeleteDialog] = useState<SchoolClass | null>(null);

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) as unknown as Resolver<FormData>, defaultValues: { is_active: true } });

    const watchLevel = watch('school_level');
    const watchActive = watch('is_active');
    const watchTeacher = watch('class_teacher_id');

    const applyFilters = () => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        if (levelFilter) params.level = levelFilter;
        if (statusFilter) params.status = statusFilter;
        router.get('/school/classes', params, { preserveState: true, replace: true });
    };

    const openCreate = () => {
        reset({ name: '', short_name: '', numeric_name: undefined, capacity: 0, school_level: '', level_order: undefined, class_teacher_id: undefined, description: '', is_active: true });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (c: SchoolClass) => {
        reset({
            name: c.name, short_name: c.short_name ?? '', numeric_name: c.numeric_name ?? undefined,
            capacity: c.capacity, school_level: c.school_level ?? '', level_order: c.level_order ?? undefined,
            class_teacher_id: c.class_teacher_id ?? undefined, description: c.description ?? '', is_active: c.is_active,
        });
        setEditing(c);
        setOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const payload = { ...data, school_level: data.school_level || null, class_teacher_id: data.class_teacher_id || null };
        if (editing) {
            router.put(`/school/classes/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/classes', payload, { onSuccess: () => setOpen(false) });
        }
    };

    const destroy = (c: SchoolClass) => {
        setDeleteDialog(c);
    };

    const confirmDelete = () => {
        if (!deleteDialog) return;
        router.delete(`/school/classes/${deleteDialog.id}`, {
            onError: () => setDeleteDialog(null),
            onSuccess: () => setDeleteDialog(null),
        });
    };

    const toggleStatus = (c: SchoolClass) => {
        router.post(`/school/classes/${c.id}/toggle-status`);
    };

    const totalStudents = useMemo(() => classes.data.reduce((sum, c) => sum + (c.students_count ?? 0), 0), [classes]);

    return (
        <AppLayout breadcrumbs={[{ label: 'School Setup' }, { label: 'Classes' }]}>
            <Head title="Classes" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Classes</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{classes.total} class{classes.total !== 1 ? 'es' : ''} &middot; {totalStudents} student{totalStudents !== 1 ? 's' : ''}</p>
                </div>
                <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Class
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyFilters()} className="pl-9" />
                </div>
                <Select defaultValue={levelFilter} onValueChange={(v) => { setLevelFilter(v === '_all' ? '' : v); }}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Levels</SelectItem>
                        {enabledLevels.includes('early_childhood') && <SelectItem value="early_childhood">ECE</SelectItem>}
                        {enabledLevels.includes('primary') && <SelectItem value="primary">Primary</SelectItem>}
                        {enabledLevels.includes('junior_secondary') && <SelectItem value="junior_secondary">JSS</SelectItem>}
                        {enabledLevels.includes('senior_secondary') && <SelectItem value="senior_secondary">SSS</SelectItem>}
                    </SelectContent>
                </Select>
                <Select defaultValue={statusFilter} onValueChange={(v) => { setStatusFilter(v === '_all' ? '' : v); }}>
                    <SelectTrigger className="w-full sm:w-36">
                        <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                </Select>
                <Button variant="outline" onClick={applyFilters} className="inline-flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5" /> Filter
                </Button>
            </div>

            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>#</TableHead>
                                <TableHead>Class Name</TableHead>
                                <TableHead className="hidden md:table-cell">Level</TableHead>
                                <TableHead className="hidden sm:table-cell">Students</TableHead>
                                <TableHead className="hidden sm:table-cell">Sections</TableHead>
                                <TableHead className="hidden lg:table-cell">Capacity</TableHead>
                                <TableHead className="hidden lg:table-cell">Status</TableHead>
                                <TableHead className="w-20" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {classes.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                        <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        <p className="text-sm">No classes found.</p>
                                    </TableCell>
                                </TableRow>
                            ) : classes.data.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="text-slate-400 text-sm">{c.numeric_name ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="font-medium text-slate-900 dark:text-white">{c.name}</div>
                                        {c.short_name && <div className="text-xs text-slate-400">{c.short_name}</div>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        {c.school_level ? <Badge variant="secondary" className="text-[10px]">{levelLabels[c.school_level] ?? c.school_level}</Badge> : '—'}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">{c.students_count ?? 0}</TableCell>
                                    <TableCell className="hidden sm:table-cell text-sm text-slate-500">{c.sections_count ?? 0}</TableCell>
                                    <TableCell className="hidden lg:table-cell text-sm text-slate-500">
                                        {c.capacity > 0 ? (
                                            <span className={c.students_count && c.students_count >= c.capacity ? 'text-red-500 font-medium' : ''}>
                                                {c.students_count ?? 0}/{c.capacity}
                                            </span>
                                        ) : '—'}
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Badge variant={c.is_active ? 'default' : 'secondary'} className={c.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}>
                                            {c.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(c)}>
                                                {c.is_active ? <ToggleRight className="w-4 h-4 text-emerald-500" /> : <ToggleLeft className="w-4 h-4 text-slate-400" />}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => destroy(c)}>
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

            {/* Pagination */}
            {classes.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-slate-500">
                        Showing {classes.from} to {classes.to} of {classes.total} classes
                    </p>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" disabled={!classes.prev_page_url} onClick={() => router.get(classes.prev_page_url!)}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-slate-500">Page {classes.current_page} of {classes.last_page}</span>
                        <Button variant="outline" size="sm" disabled={!classes.next_page_url} onClick={() => router.get(classes.next_page_url!)}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Class' : 'Add Class'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Class Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="e.g. JSS 1, Class 5" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Short Name</Label>
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
                            <Textarea placeholder="Optional notes about this class..." rows={2} {...register('description')} />
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" className="rounded border-slate-300" checked={watchActive ?? true} onChange={(e) => setValue('is_active', e.target.checked)} />
                            <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
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
                        {(deleteDialog?.students_count ?? 0) > 0 || (deleteDialog?.sections_count ?? 0) > 0
                            ? ' This class has dependencies and cannot be deleted. Try deactivating it instead.'
                            : ' This action cannot be undone.'}
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={confirmDelete}
                            disabled={(deleteDialog?.students_count ?? 0) > 0 || (deleteDialog?.sections_count ?? 0) > 0}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
