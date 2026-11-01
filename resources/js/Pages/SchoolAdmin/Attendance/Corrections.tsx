import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import type { PageProps, PaginatedResponse, AttendanceCorrection, User } from '@/Types';

interface CorrectionWithRelations extends Omit<AttendanceCorrection, 'requester' | 'reviewer' | 'attendance'> {
    attendance?: { id: number; date: string; attendable_id: number; status: string | null; status_draft: string | null };
    requester?: { id: number; name: string };
    reviewer?: { id: number; name: string };
}

interface Props {
    corrections: Omit<PaginatedResponse<CorrectionWithRelations>, 'links'> & { links?: PaginatedResponse<CorrectionWithRelations>['links'] };
    filters: { status?: string };
}

const STATUS_STYLE: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

export default function CorrectionsIndex({ corrections, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selected, setSelected] = useState<CorrectionWithRelations | null>(null);
    const [reviewNotes, setReviewNotes] = useState('');

    function applyFilter(key: string, value: string) {
        router.get('/school/attendance/corrections', { ...filters, [key]: value || undefined }, { preserveScroll: true });
    }

    function openReview(correction: CorrectionWithRelations) {
        setSelected(correction);
        setReviewNotes('');
        setReviewOpen(true);
    }

    function handleReview(action: 'approve' | 'reject') {
        if (!selected) return;
        router.put(`/school/attendance/corrections/${selected.id}`, {
            action,
            reviewer_notes: reviewNotes,
        }, { onSuccess: () => { setReviewOpen(false); setSelected(null); } });
    }

    return (
        <AppLayout title="Attendance Corrections">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/school/attendance" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Attendance
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Attendance Corrections</h1>
                            <p className="text-sm text-slate-500">{corrections.meta.total} correction requests</p>
                        </div>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{flash.success}</div>
                )}

                {/* Filters */}
                <div className="flex gap-3">
                    <Select value={filters.status ?? ''} onValueChange={v => applyFilter('status', v)}>
                        <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 dark:bg-slate-900">
                                <TableHead>Date</TableHead>
                                <TableHead>Requested By</TableHead>
                                <TableHead>Original</TableHead>
                                <TableHead>Requested</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Reviewed By</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {corrections.data.length === 0 ? (
                                <TableRow><TableCell colSpan={8} className="text-center py-16 text-slate-400">No correction requests found.</TableCell></TableRow>
                            ) : corrections.data.map((c) => (
                                <TableRow key={c.id}>
                                    <TableCell className="text-sm">{c.attendance?.date ? new Date(c.attendance.date).toLocaleDateString() : '—'}</TableCell>
                                    <TableCell className="text-sm">{c.requester?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        <Badge className="border-0 text-xs bg-slate-100 text-slate-600">{c.original_status}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className="border-0 text-xs bg-blue-100 text-blue-700">{c.new_status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{c.reason}</TableCell>
                                    <TableCell>
                                        <Badge className={`border-0 text-xs ${STATUS_STYLE[c.status]}`}>{c.status.charAt(0).toUpperCase() + c.status.slice(1)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-slate-500">{c.reviewer?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        {c.status === 'pending' && (
                                            <Button variant="outline" size="sm" className="text-xs" onClick={() => openReview(c)}>
                                                Review
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {corrections.meta.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Showing {corrections.meta.from}–{corrections.meta.to} of {corrections.meta.total}
                        </p>
                        <div className="flex gap-2">
                            {corrections.links?.prev && (
                                <Link href={corrections.links.prev}><Button variant="outline" size="sm">Prev</Button></Link>
                            )}
                            {corrections.links?.next && (
                                <Link href={corrections.links.next}><Button variant="outline" size="sm">Next</Button></Link>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Review Dialog */}
            <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Review Correction Request</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-slate-500">Original Status</span>
                                    <p className="font-medium">{selected.original_status}</p>
                                </div>
                                <div>
                                    <span className="text-slate-500">Requested Status</span>
                                    <p className="font-medium text-blue-600">{selected.new_status}</p>
                                </div>
                            </div>
                            <div className="text-sm">
                                <span className="text-slate-500">Reason</span>
                                <p className="mt-1 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-700 dark:text-slate-300">{selected.reason}</p>
                            </div>
                            <div className="space-y-1.5">
                                <Label>Reviewer Notes (optional)</Label>
                                <Textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={2} placeholder="Add notes..." />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReview('reject')}>
                            <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleReview('approve')}>
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Approve
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
