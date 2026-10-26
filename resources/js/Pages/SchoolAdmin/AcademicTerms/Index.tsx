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
import { Calendar } from 'lucide-react';

interface AcademicYear { id: number; name: string; is_current: boolean; }
interface Term { id: number; name: string; start_date: string; end_date: string; mid_term_start?: string; mid_term_end?: string; is_current: boolean; academic_year?: AcademicYear; }
interface PageProps { terms: { data: Term[]; meta: { total: number; per_page: number; current_page: number; last_page: number } }; academicYears: AcademicYear[]; filters: { academic_year_id?: string } }

export default function AcademicTermsIndex({ terms, academicYears, filters }: PageProps) {
    const [yearFilter, setYearFilter] = useState(filters.academic_year_id || '');
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
                <Card>
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
                                        <TableCell>{term.is_current ? <Badge className="bg-green-100 text-green-800">Current</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
