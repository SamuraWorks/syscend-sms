import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flag, Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PageProps } from '@/Types';

interface HouseItem {
    id: number;
    name: string;
    color: string | null;
    is_active: boolean;
    students_count: number;
    house_master: { id: number; name: string } | null;
}

interface Props extends PageProps {
    houses: HouseItem[];
    staff: { id: number; name: string }[];
}

const houseSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100),
    color: z.string().max(20).nullable().optional(),
    house_master_id: z.coerce.number().int().positive().nullable().optional(),
});
type HouseFormData = z.infer<typeof houseSchema>;

export default function HousesIndex({ houses, staff, flash }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<HouseItem | null>(null);
    const [search, setSearch] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<HouseItem | null>(null);

    const safeHouses = Array.isArray(houses) ? houses.filter(Boolean) : [];

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } =
        useForm<HouseFormData>({ resolver: zodResolver(houseSchema) as unknown as Resolver<HouseFormData>, defaultValues: { name: '', color: '', house_master_id: undefined } });

    const watchMasterId = watch('house_master_id');

    const filtered = safeHouses.filter((h) => !search || h.name.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => {
        reset({ name: '', color: '', house_master_id: undefined });
        setEditing(null);
        setOpen(true);
    };

    const openEdit = (house: HouseItem) => {
        reset({ name: house.name, color: house.color ?? '', house_master_id: house.house_master?.id });
        setEditing(house);
        setOpen(true);
    };

    const onSubmit = (data: HouseFormData) => {
        const payload = { ...data, color: data.color || null, house_master_id: data.house_master_id || null };
        if (editing) {
            router.put(`/school/houses/${editing.id}`, payload, { onSuccess: () => setOpen(false) });
        } else {
            router.post('/school/houses', payload, { onSuccess: () => setOpen(false) });
        }
    };

    return (
        <AppLayout breadcrumbs={[{ label: 'Academics' }, { label: 'Houses' }]}>
            <Head title="Houses" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Houses</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{safeHouses.length} total &middot; {safeHouses.filter(h => h.is_active).length} active</p>
                </div>
                <Button onClick={openCreate} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add House
                </Button>
            </div>

            {flash?.success && (
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 mb-4">
                    <p className="text-sm text-green-700 dark:text-green-300">{flash.success}</p>
                </div>
            )}
            {flash?.error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 mb-4">
                    <p className="text-sm text-red-700 dark:text-red-300">{flash.error}</p>
                </div>
            )}

            <div className="mb-4">
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Search houses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
                </div>
            </div>

            <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead>Name</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead className="hidden md:table-cell">House Master</TableHead>
                                <TableHead className="hidden sm:table-cell">Students</TableHead>
                                <TableHead className="hidden lg:table-cell">Status</TableHead>
                                <TableHead className="w-24" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
                                        <Flag className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                        No houses found.
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((house) => (
                                <TableRow key={house.id}>
                                    <TableCell className="font-medium text-slate-900 dark:text-white">{house.name}</TableCell>
                                    <TableCell>
                                        {house.color ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                                                <span className="w-3 h-3 rounded-full inline-block border border-slate-300" style={{ backgroundColor: house.color }} />
                                                {house.color}
                                            </span>
                                        ) : <span className="text-slate-400">&mdash;</span>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-slate-600 dark:text-slate-300">
                                        {house.house_master?.name ?? <span className="text-slate-400">Unassigned</span>}
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell">
                                        <span className="inline-flex items-center gap-1 text-sm text-slate-500">
                                            <Users className="w-3.5 h-3.5" /> {house.students_count}
                                        </span>
                                    </TableCell>
                                    <TableCell className="hidden lg:table-cell">
                                        <Badge variant={house.is_active ? 'default' : 'secondary'} className={house.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''}>
                                            {house.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-0.5">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(house)}>
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
                                                onClick={() => setDeleteDialog(house)}
                                                disabled={house.students_count > 0}>
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
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit House' : 'Add House'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input placeholder="e.g. Green, Red, Blue" {...register('name')} />
                                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label>Color</Label>
                                <Input placeholder="e.g. Green / #22c55e" {...register('color')} />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>House Master</Label>
                            <Select key={editing ? `edit-${editing.id}` : 'create'} defaultValue={watchMasterId ? String(watchMasterId) : '_none'} onValueChange={(v) => setValue('house_master_id', v === '_none' ? undefined : Number(v))}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">None</SelectItem>
                                    {staff.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialog !== null} onOpenChange={(o) => { if (!o) setDeleteDialog(null); }}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete House</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Are you sure you want to delete <strong>{deleteDialog?.name}</strong>? This action cannot be undone.
                    </p>
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setDeleteDialog(null)}>Cancel</Button>
                        <Button size="sm" variant="destructive" onClick={() => {
                            if (deleteDialog) router.delete(`/school/houses/${deleteDialog.id}`, { onSuccess: () => setDeleteDialog(null), onError: () => setDeleteDialog(null) });
                        }}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
