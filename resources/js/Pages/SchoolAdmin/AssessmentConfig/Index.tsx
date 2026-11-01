import { useState } from 'react';
import { router, usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Star, StarOff, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import type { AcademicYear, PageProps } from '@/Types';

interface AssessmentComponent {
    id: number; name: string; slug: string; category: string; description: string | null;
    max_marks: number; weight_percentage: number; sort_order: number; is_active: boolean;
    include_in_final_result: boolean; include_in_promotion: boolean; require_approval: boolean;
    academic_year_id?: number;
}

interface AssessmentConfig {
    id: number; name: string; description: string | null; is_default: boolean; is_active: boolean;
    academic_year_id: number; total_coursework_weight: number; total_examination_weight: number;
    require_approval_before_publishing: boolean;
}

interface Props {
    configs: AssessmentConfig[];
    components: AssessmentComponent[];
    years: AcademicYear[];
    filters: { academic_year_id?: number };
}

export default function AssessmentConfigIndex({ configs, components, years, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [configOpen, setConfigOpen] = useState(false);
    const [componentOpen, setComponentOpen] = useState(false);
    const [editing, setEditing] = useState<AssessmentComponent | null>(null);

    const configForm = useForm({ name: '', description: '', academic_year_id: String(filters.academic_year_id ?? '') });
    const componentForm = useForm({
        name: '', slug: '', category: 'coursework', description: '', academic_year_id: String(filters.academic_year_id ?? ''),
        max_marks: '100', weight_percentage: '0', sort_order: '0', is_active: true,
        include_in_final_result: true, include_in_promotion: true, require_approval: false,
    });

    const coursework = components.filter(c => c.category === 'coursework');
    const examinations = components.filter(c => c.category === 'examination');
    const totalWeight = components.reduce((sum, c) => sum + (c.is_active ? c.weight_percentage : 0), 0);
    const isValid = Math.abs(totalWeight - 100) < 0.01;

    function applyFilter(yearId: string) {
        router.get('/school/assessment-config', { academic_year_id: yearId || undefined }, { preserveScroll: true });
    }

    function handleConfigSubmit(e: React.FormEvent) {
        e.preventDefault();
        configForm.post('/school/assessment-config', { onSuccess: () => { setConfigOpen(false); configForm.reset(); } });
    }

    function openEditComponent(c: AssessmentComponent) {
        componentForm.setData({
            name: c.name, slug: c.slug, category: c.category, description: c.description ?? '',
            academic_year_id: String(c.academic_year_id), max_marks: String(c.max_marks),
            weight_percentage: String(c.weight_percentage), sort_order: String(c.sort_order),
            is_active: c.is_active, include_in_final_result: c.include_in_final_result,
            include_in_promotion: c.include_in_promotion, require_approval: c.require_approval,
        });
        setEditing(c);
        setComponentOpen(true);
    }

    function handleComponentSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            componentForm.put(`/school/assessment-components/${editing.id}`, { onSuccess: () => { setComponentOpen(false); setEditing(null); componentForm.reset(); } });
        } else {
            componentForm.post('/school/assessment-components', { onSuccess: () => { setComponentOpen(false); componentForm.reset(); } });
        }
    }

    return (
        <AppLayout title="Assessment Configuration">
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assessment Configuration</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Define how your school assesses students</p>
                    </div>
                    <div className="flex gap-2">
                        <Select value={String(filters.academic_year_id ?? '')} onValueChange={applyFilter}>
                            <SelectTrigger className="w-48"><SelectValue placeholder="Select Year" /></SelectTrigger>
                            <SelectContent>
                                {years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => setConfigOpen(true)} variant="outline" className="inline-flex items-center gap-2"><Plus className="w-4 h-4" /> New Config</Button>
                        <Button onClick={() => { setEditing(null); componentForm.reset(); setComponentOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Component</Button>
                    </div>
                </div>

                {flash?.success && <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>}

                {/* Weight Summary */}
                <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-6">
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Coursework Total</p>
                                    <p className="text-xl font-bold text-blue-600">{coursework.filter(c => c.is_active).reduce((s, c) => s + c.weight_percentage, 0)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Examination Total</p>
                                    <p className="text-xl font-bold text-amber-600">{examinations.filter(c => c.is_active).reduce((s, c) => s + c.weight_percentage, 0)}%</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 uppercase tracking-wide">Combined Weight</p>
                                    <p className={`text-xl font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>{totalWeight.toFixed(1)}%</p>
                                </div>
                            </div>
                            {isValid ? (
                                <Badge className="bg-green-100 text-green-700 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Weights valid</Badge>
                            ) : (
                                <Badge className="bg-red-100 text-red-700 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Weights must sum to 100%</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Components by Category */}
                {['coursework', 'examination'].map(cat => (
                    <div key={cat}>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 capitalize">{cat === 'coursework' ? 'Coursework Components' : 'Examination Components'}</h2>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50 dark:bg-slate-900">
                                        <TableHead>Order</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead className="hidden md:table-cell">Description</TableHead>
                                        <TableHead>Max Marks</TableHead>
                                        <TableHead>Weight %</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Flags</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(cat === 'coursework' ? coursework : examinations).length === 0 ? (
                                        <TableRow><TableCell colSpan={8} className="text-center py-10 text-slate-400">No {cat} components yet.</TableCell></TableRow>
                                    ) : (cat === 'coursework' ? coursework : examinations).map(c => (
                                        <TableRow key={c.id}>
                                            <TableCell className="text-slate-400 text-sm">{c.sort_order}</TableCell>
                                            <TableCell className="font-medium text-slate-900 dark:text-white">{c.name}</TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-slate-500 max-w-[200px] truncate">{c.description ?? '—'}</TableCell>
                                            <TableCell className="text-sm">{c.max_marks}</TableCell>
                                            <TableCell className="text-sm font-medium">{c.weight_percentage}%</TableCell>
                                            <TableCell>
                                                <Badge className={`border-0 text-xs ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {c.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1 flex-wrap">
                                                    {c.include_in_final_result && <Badge variant="outline" className="text-[10px]">Result</Badge>}
                                                    {c.include_in_promotion && <Badge variant="outline" className="text-[10px]">Promotion</Badge>}
                                                    {c.require_approval && <Badge variant="outline" className="text-[10px] text-amber-600">Approval</Badge>}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditComponent(c)}><Pencil className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500" onClick={() => { if (confirm('Delete this component?')) router.delete(`/school/assessment-components/${c.id}`); }}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))}

                {/* Configs */}
                {configs.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Saved Configurations</h2>
                        <div className="grid gap-3">
                            {configs.map(c => (
                                <Card key={c.id} className="border-slate-200 dark:border-slate-800">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{c.name}</p>
                                            <p className="text-sm text-slate-500">{c.description ?? 'No description'}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {c.is_default && <Badge className="bg-indigo-100 text-indigo-700">Default</Badge>}
                                            {!c.is_default && <Button variant="outline" size="sm" onClick={() => router.post(`/school/assessment-config/${c.id}/default`)}>Set Default</Button>}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Config Dialog */}
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>New Assessment Configuration</DialogTitle></DialogHeader>
                    <form onSubmit={handleConfigSubmit} className="space-y-4 mt-2">
                        <div className="space-y-1.5">
                            <Label>Configuration Name <span className="text-red-500">*</span></Label>
                            <Input value={configForm.data.name} onChange={e => configForm.setData('name', e.target.value)} placeholder="e.g. Standard Assessment 2026" />
                            {configForm.errors.name && <p className="text-xs text-red-500">{configForm.errors.name}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea value={configForm.data.description ?? ''} onChange={e => configForm.setData('description', e.target.value)} rows={2} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setConfigOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={configForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Component Dialog */}
            <Dialog open={componentOpen} onOpenChange={setComponentOpen}>
                <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editing ? 'Edit Component' : 'Add Assessment Component'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleComponentSubmit} className="space-y-4 mt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Name <span className="text-red-500">*</span></Label>
                                <Input value={componentForm.data.name} onChange={e => componentForm.setData('name', e.target.value)} placeholder="e.g. Assignment" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Slug <span className="text-red-500">*</span></Label>
                                <Input value={componentForm.data.slug} onChange={e => componentForm.setData('slug', e.target.value)} placeholder="e.g. assignment" disabled={!!editing} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Category <span className="text-red-500">*</span></Label>
                                <Select value={componentForm.data.category} onValueChange={v => componentForm.setData('category', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="coursework">Coursework</SelectItem>
                                        <SelectItem value="examination">Examination</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Academic Year <span className="text-red-500">*</span></Label>
                                <Select value={componentForm.data.academic_year_id} onValueChange={v => componentForm.setData('academic_year_id', v)} disabled={!!editing}>
                                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <Label>Max Marks</Label>
                                <Input type="number" value={componentForm.data.max_marks} onChange={e => componentForm.setData('max_marks', e.target.value)} min="1" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Weight %</Label>
                                <Input type="number" value={componentForm.data.weight_percentage} onChange={e => componentForm.setData('weight_percentage', e.target.value)} min="0" max="100" step="0.5" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Sort Order</Label>
                                <Input type="number" value={componentForm.data.sort_order} onChange={e => componentForm.setData('sort_order', e.target.value)} min="0" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Description</Label>
                            <Textarea value={componentForm.data.description ?? ''} onChange={e => componentForm.setData('description', e.target.value)} rows={2} />
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={componentForm.data.is_active as boolean} onChange={e => componentForm.setData('is_active', e.target.checked)} className="rounded" /> Active</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={componentForm.data.include_in_final_result as boolean} onChange={e => componentForm.setData('include_in_final_result', e.target.checked)} className="rounded" /> Include in Final Result</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={componentForm.data.include_in_promotion as boolean} onChange={e => componentForm.setData('include_in_promotion', e.target.checked)} className="rounded" /> Include in Promotion</label>
                            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={componentForm.data.require_approval as boolean} onChange={e => componentForm.setData('require_approval', e.target.checked)} className="rounded" /> Require Approval</label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => { setComponentOpen(false); setEditing(null); }}>Cancel</Button>
                            <Button type="submit" disabled={componentForm.processing} className="bg-indigo-600 hover:bg-indigo-700 text-white">{editing ? 'Update' : 'Add'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
