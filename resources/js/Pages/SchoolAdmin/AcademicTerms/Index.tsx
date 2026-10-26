import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2, History, Layers3, ArrowRight, Search, UsersRound } from 'lucide-react';

interface AcademicYear { id: number; name: string; is_current: boolean; }
interface Term { id: number; name: string; start_date: string; end_date: string; mid_term_start?: string; mid_term_end?: string; is_current: boolean; academic_year?: AcademicYear; }
interface PageProps { terms: { data: Term[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }; academicYears: AcademicYear[]; filters: { academic_year_id?: string } }

export default function AcademicTermsIndex({ terms, academicYears, filters }: PageProps) {
    const [yearFilter, setYearFilter] = useState(filters.academic_year_id || '');
    const [activeTab, setActiveTab] = useState<'sessions' | 'promotions'>('sessions');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [pendingTerm, setPendingTerm] = useState<Term | null>(null);
    const { data, setData, post, processing, reset } = useForm({ academic_year_id: academicYears.find(y => y.is_current)?.id?.toString() ?? '', name: 'Term 1', start_date: '', end_date: '', is_current: false });

    const handleFilter = (value: string) => {
        setYearFilter(value);
        router.get('/school/academic-terms', value && value !== 'all' ? { academic_year_id: value } : {}, { preserveState: true });
    };

    return (
        <AppLayout title="Academic Terms">
            <Head title="Academic Terms" />
            <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Academic lifecycle</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight">Transitions</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Manage academic sessions, current terms, and student movement without losing history.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                    <Card className="border-emerald-200/70 bg-emerald-50/40"><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Current session</p><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div><p className="mt-2 text-lg font-semibold">{academicYears.find(y => y.is_current)?.name ?? 'Not set'}</p><p className="text-xs text-muted-foreground">Active academic context</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Terms configured</p><Layers3 className="h-4 w-4 text-primary" /></div><p className="mt-2 text-lg font-semibold">{terms.meta.total}</p><p className="text-xs text-muted-foreground">Across available sessions</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Previous sessions</p><History className="h-4 w-4 text-slate-500" /></div><p className="mt-2 text-lg font-semibold">{Math.max(academicYears.length - 1, 0)}</p><p className="text-xs text-muted-foreground">History is preserved</p></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Promotion workspace</p><UsersRound className="h-4 w-4 text-amber-600" /></div><p className="mt-2 text-lg font-semibold">Ready</p><p className="text-xs text-muted-foreground">Review before applying</p></CardContent></Card>
                </div>
                <div className="inline-flex rounded-lg border border-border bg-muted/40 p-1" role="tablist" aria-label="Transitions sections">
                    <button type="button" role="tab" aria-selected={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'sessions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Sessions</button>
                    <button type="button" role="tab" aria-selected={activeTab === 'promotions'} onClick={() => setActiveTab('promotions')} className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'promotions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Promotions</button>
                </div>
                {activeTab === 'promotions' ? (
                    <Card>
                        <CardHeader><CardTitle>Student promotions</CardTitle></CardHeader>
                        <CardContent className="space-y-5">
                            <p className="text-sm text-muted-foreground">Select a source and destination session, review eligible students, then confirm placements. Creating or activating a session never moves students automatically.</p>
                            <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-end">
                                <div><Label>Source academic session</Label><Select><SelectTrigger className="mt-1"><SelectValue placeholder="Choose source" /></SelectTrigger><SelectContent>{academicYears.map(year => <SelectItem key={year.id} value={String(year.id)}>{year.name}</SelectItem>)}</SelectContent></Select></div>
                                <ArrowRight className="hidden h-5 w-5 text-muted-foreground md:block" aria-hidden="true" />
                                <div><Label>Destination academic session</Label><Select><SelectTrigger className="mt-1"><SelectValue placeholder="Choose destination" /></SelectTrigger><SelectContent>{academicYears.map(year => <SelectItem key={year.id} value={String(year.id)}>{year.name}</SelectItem>)}</SelectContent></Select></div>
                            </div>
                            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search students by name or ID" /></div><span className="text-sm text-muted-foreground">0 students selected</span></div>
                            <div className="rounded-lg border border-dashed p-8 text-center"><UsersRound className="mx-auto h-8 w-8 text-muted-foreground/50" /><p className="mt-3 font-medium">Choose both sessions to load students</p><p className="mt-1 text-sm text-muted-foreground">Students will be grouped by class and stream for safe individual or bulk placement.</p></div>
                            <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setActiveTab('sessions')}>Return to sessions</Button><Button disabled>Review selected students</Button></div>
                        </CardContent>
                    </Card>
                ) : <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" /> Terms & Sessions</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => setDialogOpen(true)}>New term</Button>
                            <Select value={yearFilter} onValueChange={handleFilter}>
                                <SelectTrigger className="w-48"><SelectValue placeholder="All Academic Years" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Academic Years</SelectItem>
                                    {academicYears.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}{y.is_current ? ' (Current)' : ''}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Term</TableHead>
                                    <TableHead>Academic Year</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>End Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {terms.data.length === 0 ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No terms found.</TableCell></TableRow>
                                ) : terms.data.map(term => (
                                    <TableRow key={term.id}>
                                        <TableCell className="font-medium">{term.name}</TableCell>
                                        <TableCell>{term.academic_year?.name ?? '—'}</TableCell>
                                        <TableCell>{term.start_date}</TableCell>
                                        <TableCell>{term.end_date}</TableCell>
                                        <TableCell className="space-x-2">{term.is_current ? <Badge className="bg-green-100 text-green-800">Current</Badge> : <><Badge variant="secondary">Inactive</Badge><Button type="button" variant="ghost" size="sm" onClick={() => setPendingTerm(term)}>Start</Button></>}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>}
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Create academic term</DialogTitle></DialogHeader>
                    <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); post('/school/academic-terms', { onSuccess: () => { setDialogOpen(false); reset(); } }); }}>
                        <div><Label>Academic year</Label><Select value={data.academic_year_id} onValueChange={value => setData('academic_year_id', value)}><SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger><SelectContent>{academicYears.map(year => <SelectItem key={year.id} value={String(year.id)}>{year.name}</SelectItem>)}</SelectContent></Select></div>
                        <div><Label>Name</Label><Input value={data.name} onChange={event => setData('name', event.target.value)} /></div>
                        <div className="grid grid-cols-2 gap-3"><div><Label>Start date</Label><Input type="date" value={data.start_date} onChange={event => setData('start_date', event.target.value)} /></div><div><Label>End date</Label><Input type="date" value={data.end_date} onChange={event => setData('end_date', event.target.value)} /></div></div>
                        <DialogFooter><Button type="submit" disabled={processing}>Create term</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {pendingTerm && <Dialog open onOpenChange={() => setPendingTerm(null)}><DialogContent><DialogHeader><DialogTitle>Activate term?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This will switch the school&apos;s current term without deleting historical records.</p><DialogFooter><Button variant="outline" onClick={() => setPendingTerm(null)}>Cancel</Button><Button onClick={() => { router.put(`/school/academic-terms/${pendingTerm.id}`, { name: pendingTerm.name, start_date: pendingTerm.start_date, end_date: pendingTerm.end_date, is_current: true }, { onFinish: () => setPendingTerm(null) }); }}>Activate term</Button></DialogFooter></DialogContent></Dialog>}
        </AppLayout>
    );
}
