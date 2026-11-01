import { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Layers, Search, Filter } from 'lucide-react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PageProps, SchoolClass, Section, Staff } from '@/Types';

interface StaffOption { id: number; name: string; }

interface Props extends PageProps {
    classes: (SchoolClass & { sections: (Section & { students_count?: number; form_master?: Staff | null })[] })[];
    staff: StaffOption[];
}

const schema = z.object({
    class_id:       z.coerce.number().int().positive('Select a class'),
    name:           z.string().min(1, 'Section name is required'),
    section_code:   z.string().max(20).nullable().optional(),
    capacity:       z.coerce.number().int().min(0).optional(),
    form_master_id: z.coerce.number().int().positive().nullable().optional(),
    classroom:      z.string().max(50).nullable().optional(),
    is_active:      z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function SectionsIndex() {
    const { classes, staff } = usePage<Props>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<(Section & { students_count?: number }) | null>(null);
    const [search, setSearch] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<FormData>({ resolver: zodResolver(schema) as unknown as Resolver<FormData>, defaultValues: { is_active: true } });

    const watchClassId = watch('class_id');

    const filteredClasses = classes.filter((c) => {
        const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
        const matchLevel = !levelFilter || c.school_level === levelFilter;
        return matchSearch && matchLevel;
    });

    const openCreate = () => {
        reset({ class_id: 0, name: '', section_code: '', capacity: 0, form_master_id: undefined, classroom: '', is_active: true });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (s: Section) => {
        reset({
            class_id: s.class_id, name: s.name, section_code: s.section_code ?? '',
            capacity: s.capacity, form_master_id: s.form_master_id ?? undefined,
            classroom: s.classroom ?? '', is_active: s.is_active,
        });
        setEditing(s);
        setOpen(true);
    };

    const onSubmit = (data: FormData) => {
        const payload = { ...data, form_master_id: data.form_master_id || null };
        if (editing) {
            router.put(`/school/sections/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/sections', payload, { onSuccess: () => setOpen(false) });
        }
    };

    const destroy = (s: Section) => {
        if (confirm(`Delete section "${s.name}"? This cannot be undone.`)) router.delete(`/school/sections/${s.id}`);
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'School Setup' }, { label: 'Sections' }]}>
            <Head title="Sections" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sections</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Manage class sections and form teachers</p>
                </div>
                <Button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Section
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select defaultValue={levelFilter} onValueChange={(v) => setLevelFilter(v === '_all' ? '' : v)}>
                    <SelectTrigger className="w-full sm:w-44">
                        <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="_all">All Levels</SelectItem>
                        <SelectItem value="early_childhood">ECE</SelectItem>
                        <SelectItem value="primary">Primary</SelectItem>
                        <SelectItem value="junior_secondary">JSS</SelectItem>
                        <SelectItem value="senior_secondary">SSS</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-4">
                {filteredClasses.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                        <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No classes found. Add classes first.</p>
                    </div>
                ) : filteredClasses.map((cls) => (
                    <Card key={cls.id} className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-2 pt-4 px-4">
                            <CardTitle className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span>{cls.name}</span>
                                    {cls.short_name && <span className="text-xs text-slate-400">({cls.short_name})</span>}
                                    {!cls.is_active && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                                </div>
                                <span className="text-xs font-normal text-slate-400">{cls.sections.length} section{cls.sections.length !== 1 ? 's' : ''}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                            {cls.sections.length === 0 ? (
                                <p className="text-xs text-slate-400">No sections — click Add Section above.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {cls.sections.map((s) => (
                                        <div key={s.id} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 ${s.is_active !== false ? 'bg-slate-100 dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-900 opacity-60'}`}>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {s.name}
                                                    {s.section_code && <span className="text-xs text-slate-400 ml-1">({s.section_code})</span>}
                                                </span>
                                                <span className="text-[10px] text-slate-400">
                                                    {s.students_count ?? 0}/{s.capacity || '∞'} students
                                                    {s.classroom && ` · ${s.classroom}`}
                                                </span>
                                            </div>
                                            {s.form_master && (
                                                <Badge variant="outline" className="text-[9px] ml-1">{s.form_master.full_name}</Badge>
                                            )}
                                            <button onClick={() => openEdit(s)} className="ml-1 text-slate-400 hover:text-indigo-600"><Pencil className="w-3 h-3" /></button>
                                            <button onClick={() => destroy(s)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Section' : 'Add Section'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
                        <div className="space-y-1.5">
                            <Label>Class <span className="text-red-500">*</span></Label>
                            <Select defaultValue={editing ? String(editing.class_id) : ''} onValueChange={(v) => setValue('class_id', Number(v))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Select class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}{c.short_name ? ` (${c.short_name})` : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.class_id && <p className="text-xs text-red-500">{errors.class_id.message}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Section Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="A, B, Science..." {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Section Code</Label>
                                <Input placeholder="e.g. SEC-A" {...register('section_code')} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Capacity</Label>
                                <Input type="number" placeholder="40" {...register('capacity')} />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Classroom</Label>
                                <Input placeholder="e.g. Room 12" {...register('classroom')} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Form/Class Teacher</Label>
                            <Select defaultValue={editing?.form_master_id ? String(editing.form_master_id) : ''} onValueChange={(v) => setValue('form_master_id', v === '_none' ? undefined : Number(v))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">None</SelectItem>
                                    {staff.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.form_master_id && <p className="text-xs text-red-500">{errors.form_master_id.message}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="s_is_active" className="rounded border-slate-300" checked={watch('is_active') ?? true} onChange={(e) => setValue('is_active', e.target.checked)} />
                            <Label htmlFor="s_is_active" className="cursor-pointer">Active</Label>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {editing ? 'Save Changes' : 'Create Section'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
